/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.
import {DownloadableInfo, DownloadHtmlData, onMessage, sendMessage} from "@/public/messaging";
import { configure } from "@zip.js/zip.js";
import {
    createUrlWithDetails,
    cleanUrl,
    getRootDomain,
    getHost,
    sanitizeFilename,
    cleanString,
    replaceLastAppExtension,
    safeDecodePathSegment,
    urlToFolderPath,
    urlToFilename,
    getFileFullPath,
    isValidUrl,
} from "@/public/utils/UrlUtils";
import {
    getHtml,
    getHtmlFromDoc,
    extractCharsetFromMetaHtml,
    normalizeEncodingLabel,
} from "@/public/utils/HtmlUtils";
import { OPFSStorage, DownloadMetadata } from "@/public/utils/OPFSStorage";
import { PerformanceStats, OperationType } from "@/public/utils/PerformanceStats";

// Configure zip.js to not use web workers (they violate CSP in extensions)
configure({ useWebWorkers: false });

type DownloadContentSuccess = {
    success: true;
    data: string;
    index: number;
}

type DownloadContentFailure = {
    success: false;
    errmsg: string;
    index: number;
}

type DownloadContentResult = DownloadContentSuccess | DownloadContentFailure;

// TODO:
//  - The page with links was not properly downloaded

// Maximum number of parallel fetch requests allowed at the same time
const MAX_PARALLEL_FETCHES = 10;

// Maximum number of concurrent asset downloads within a single page
const MAX_CONCURRENT_ASSETS = 30;

/**
 * Runs promises with limited concurrency.
 * @param tasks Array of functions that return promises
 * @param limit Maximum concurrent executions
 */
async function runWithConcurrencyLimit<T>(
    tasks: (() => Promise<T>)[],
    limit: number
): Promise<T[]> {
    const results: T[] = [];
    let index = 0;

    async function runNext(): Promise<void> {
        while (index < tasks.length) {
            const currentIndex = index++;
            results[currentIndex] = await tasks[currentIndex]();
        }
    }

    // Start `limit` workers
    const workers = Array(Math.min(limit, tasks.length))
        .fill(null)
        .map(() => runNext());

    await Promise.all(workers);
    return results;
}

type UrlWrapper = { url: string }

/**
 * Parses a srcset attribute string into an array of {url, descriptor} objects
 * srcset format: "url1.jpg 1x, url2.jpg 2x" or "url1.jpg 480w, url2.jpg 800w"
 */
function parseSrcset(srcset: string): Array<{url: string, descriptor: string}> {
    if (!srcset || srcset.trim() === '') return [];

    const results: Array<{url: string, descriptor: string}> = [];
    // Split by comma, but be careful with URLs that might contain commas in query strings
    const entries = srcset.split(/,(?=\s*https?:|[^,]*\s+\d)/);

    for (const entry of entries) {
        const trimmed = entry.trim();
        if (!trimmed) continue;

        // Match URL and optional descriptor (e.g., "1x", "2x", "480w", "800w")
        const match = trimmed.match(/^(.+?)(\s+[\d.]+[xw])?$/);
        if (match) {
            const url = match[1].trim();
            const descriptor = match[2] ? match[2].trim() : '';
            if (url) {
                results.push({ url, descriptor });
            }
        }
    }

    return results;
}

/**
 * Builds a srcset string from an array of {url, descriptor} objects
 */
function buildSrcset(entries: Array<{url: string, descriptor: string}>): string {
    return entries
        .map(e => e.descriptor ? `${e.url} ${e.descriptor}` : e.url)
        .join(', ');
}

/**
 * Selects the best (highest resolution) srcset entry.
 * For 'w' descriptors (480w, 800w, 1200w) → picks largest width
 * For 'x' descriptors (1x, 2x, 3x) → picks highest density
 */
function selectBestSrcsetEntry(entries: Array<{url: string, descriptor: string}>): {url: string, descriptor: string} | null {
    if (entries.length === 0) return null;
    if (entries.length === 1) return entries[0];

    let best = entries[0];
    let bestValue = 0;

    for (const entry of entries) {
        const desc = entry.descriptor.trim();
        if (!desc) continue;

        const match = desc.match(/^([\d.]+)([xw])$/);
        if (match) {
            const value = parseFloat(match[1]);
            if (value > bestValue) {
                bestValue = value;
                best = entry;
            }
        }
    }
    return best;
}

function getDefaultMaxValue(type: any) {
    let pos = type.indexOf("_max");
    if (pos != -1) type = type.substring(0, pos);

    switch (type) {
        case "image":
            return 10000;
        case "font":
            return 1000;
        case "js":
            return 260;
        case "css":
            return 260;
        default:
            return 0;
    }
}

const extTypes = [
    "image", "font", "js", "css", "others"
];
const mimeTypes = [
    "image", "font", "script", "css", "stream"
];

function getDefaultSettings() {
    let ds: any = {};
    for (let i = 0, l = extTypes.length; i < l; i++) {
        ds[extTypes[i] + "_max"] = getDefaultMaxValue(extTypes[i]);
    }
    ds.emdate = false;
    ds.emsrc = false;
    ds.showsave = false;
    ds.dltype = DlType.All;
    ds.timeout = 60;
    ds.noscript = false;
    ds.loadlazy = true;
    return ds;
}

const DlType = {
    All: 0,
    KeepStyle: 1,
    Minimal: 2
};

let settings = getDefaultSettings();

let currentTasks: Map<string, DownloadTask> = new Map();

type DownloadTaskParam = {
    taskId: string;
    tabId: number;
    url: string;
    dltype: number;
    html: string | UrlWrapper;
    currentDepth: number;
    isMultiPage: boolean;
    maxDepth: number;
    params?: {
        title?: string;
    }
}

type SharedData = {
    chain: DownloadTask[];
    processedLinks: Set<string>;
    abortController: AbortController;
    linksCollected: Set<string>;
    linksDownloadedCount: number;
    someLinksNotDownloaded: boolean;
    quotaExceeded: boolean;
    perfStats: PerformanceStats;
    // Cache of downloaded URLs to avoid re-fetching the same resource
    downloadedUrls: Map<string, string>;
}

export class DownloadTask {
    taskId: string;
    tabId: number;
    url: string;
    dltype: number;
    html: string | UrlWrapper;
    elemcount: number;
    now: Date;
    currentDepth: number;
    isMultiPage: boolean;
    maxDepth: number;
    params?: { title?: string };

    // Shared chain of tasks. Child tasks may add new tasks here
    sharedData!: SharedData;

    static disposeExistingAndCreate(param: DownloadTaskParam) {
        DownloadTask.disposeByTabId(param.tabId);
        return new DownloadTask(param);
    }

    static create(param: DownloadTaskParam) {
        return new DownloadTask(param);
    }

    /**
     * Disposes any existing task running on the given tab.
     * This ensures only one download runs per tab at a time.
     */
    static disposeByTabId(tabId: number) {
        for (const [taskId, task] of currentTasks) {
            if (task.tabId === tabId) {
                DownloadTask.dispose(taskId);
                break; // Only one task per tab should exist
            }
        }
    }

    /**
     * Checks if a link has already been processed, considering URL variations with trailing slashes and index.html
     * @param url - The URL to check
     * @param processedLinks - The set of processed links
     * @returns true if the link has been processed
     */
    private static isLinkProcessed(url: string, processedLinks: Set<string>): boolean {
        if (url.endsWith('/')) {
            // Check both the URL with trailing slash and with index.html appended
            return processedLinks.has(url) || processedLinks.has(url + 'index.html');
        } else if (url.endsWith('index.html')) {
            // Check both the URL with index.html and without it (with trailing slash)
            const urlWithoutIndex = url.slice(0, -10); // Remove 'index.html'
            return processedLinks.has(url) || processedLinks.has(urlWithoutIndex);
        } else {
            // For other URLs, just check if it exists
            return processedLinks.has(url);
        }
    }

    static async runChain(task: DownloadTask): Promise<{ downloadableInfo: DownloadableInfo | undefined, url: string } | undefined> {
        const perfStats = new PerformanceStats();
        perfStats.start();

        task.sharedData = {
            chain: [task],
            processedLinks: new Set(),
            abortController: new AbortController(),
            linksCollected: new Set(),
            linksDownloadedCount: 0,
            someLinksNotDownloaded: false,
            quotaExceeded: false,
            perfStats,
            downloadedUrls: new Map(),
        };

        // Send stats to background if download is aborted (cancelled or quota exceeded)
        task.sharedData.abortController.signal.addEventListener('abort', () => {
            sendMessage('logPerformanceStats', task.sharedData.perfStats.getFormattedStats());
        }, { once: true });

        // Seed linksCollected with the initial page URL (normalized)
        try {
            const normalized = cleanUrl(task.url);
            task.sharedData.linksCollected.add(normalized);
        } catch (_) {}

        // For multipage downloads, set up OPFS folder storage
        let rootFolderName: string | undefined;
        let opfsFilesHandle: FileSystemDirectoryHandle | undefined;
        let opfsSavedFiles: Set<string> | undefined;

        if (task.isMultiPage) {
            // Check storage availability before starting
            const storageEstimate = await OPFSStorage.estimateStorage();
            if (storageEstimate) {
                const availableMB = storageEstimate.available / (1024 * 1024);
                console.log(`Storage available: ${availableMB.toFixed(2)}MB`);
                if (availableMB < 50) {
                    console.warn(`Low storage available (${availableMB.toFixed(2)}MB) - download may be incomplete`);
                }
            }

            // Calculate root folder name (same logic as createDownloadableObject)
            const rawHost = getHost(task.url) || "website";
            rootFolderName = sanitizeFilename(rawHost);

            // Create OPFS folder for saving files, then zip at the end
            const folderResult = await OPFSStorage.createDownloadFolder(task.taskId);
            opfsFilesHandle = folderResult.filesHandle;
            opfsSavedFiles = new Set<string>();
            console.log("Created OPFS download folder for multipage download");
        }

        console.log("Start chain")
        const data: DownloadHtmlData[] = [];
        
        while (task.sharedData.chain.length > 0) {
            if (task.sharedData.abortController.signal.aborted) {
                break;
            }
            
            // Group tasks by current depth
            const currentDepth = task.sharedData.chain[0]?.currentDepth;
            const tasksAtDepth: DownloadTask[] = [];
            
            // Extract tasks at the same depth, limited by MAX_PARALLEL_FETCHES
            let extractedCount = 0;
            while (task.sharedData.chain.length > 0 && 
                   task.sharedData.chain[0].currentDepth === currentDepth &&
                   extractedCount < MAX_PARALLEL_FETCHES) {
                const currentTask = task.sharedData.chain.shift();

                if (currentTask) {
                    if (DownloadTask.isLinkProcessed(currentTask.url, currentTask.sharedData.processedLinks)){
                        continue;
                    }

                    currentTask.sharedData.processedLinks.add(currentTask.url);

                    if (currentTask.currentDepth <= currentTask.maxDepth) {
                        tasksAtDepth.push(currentTask);
                        extractedCount++;
                    }
                }
            }
            
            // Process this batch of tasks at this depth in parallel
            const promises = tasksAtDepth.map(async (currentTask) => {
                if (task.sharedData.abortController.signal.aborted) {
                    return undefined;
                }
                
                currentTasks.set(currentTask.taskId, currentTask);
                
                // Check if file already exists before downloading
                if (task.isMultiPage && rootFolderName && opfsSavedFiles) {
                    const fullPath = getFileFullPath(currentTask.url, rootFolderName);
                    if (opfsSavedFiles.has(fullPath)) {
                        console.log(`Skipping download - file already exists: ${fullPath}`);
                        currentTask.sharedData.linksDownloadedCount += 1;
                        currentTask.sharedData.perfStats.incrementPageCount();
                        await sendInfoNoUrl(currentTask.sharedData.linksCollected.size, currentTask.sharedData.linksDownloadedCount, currentTask.maxDepth === currentTask.currentDepth, currentTask.sharedData.abortController.signal);
                        return undefined;
                    }
                }

                const downloadableInfo: DownloadHtmlData | undefined = await currentTask.convert()
                currentTask.sharedData.linksDownloadedCount += 1;
                currentTask.sharedData.perfStats.incrementPageCount();
                if (task.isMultiPage && rootFolderName && opfsFilesHandle && opfsSavedFiles && downloadableInfo) {
                    // Save HTML file to OPFS folder
                    const html = getHtml(downloadableInfo.doc, task.now);
                    const fullPath = getFileFullPath(downloadableInfo.url, rootFolderName);

                    // Measure OPFS write
                    const opfsWriteStart = performance.now();
                    const writeResult = await OPFSStorage.writeHtmlFile(opfsFilesHandle, fullPath, html, opfsSavedFiles);
                    task.sharedData.perfStats.recordOperation('opfsWrite', performance.now() - opfsWriteStart, html.length);

                    // Check if storage quota was exceeded
                    if (writeResult.quotaExceeded) {
                        console.log('Storage quota exceeded - stopping download and saving partial result');
                        task.sharedData.quotaExceeded = true;
                        task.sharedData.abortController.abort();
                    }
                }

                await sendInfoNoUrl(currentTask.sharedData.linksCollected.size, currentTask.sharedData.linksDownloadedCount, currentTask.maxDepth === currentTask.currentDepth, currentTask.sharedData.abortController.signal);
                return downloadableInfo;
            });
            
            // Wait for all tasks at this depth to complete
            const results = await Promise.all(promises);
            
            // Add successful results to data array (only for single-page downloads)
            for (const result of results) {
                if (result && !task.isMultiPage) {
                    data.push(result);
                }
            }
        }
        
        currentTasks.delete(task.taskId);
        // Finalize if not aborted, OR if aborted due to quota exceeded (to save partial download)
        if (!task.sharedData.abortController.signal.aborted || task.sharedData.quotaExceeded) {
            let downloadableInfo: DownloadableInfo | undefined;
            
            // For multipage downloads, finalize and create downloadable object
            if (task.isMultiPage && rootFolderName && opfsFilesHandle && opfsSavedFiles) {
                // Generate README content
                const rootFolderPath = urlToFolderPath(task.url);
                const rootFileName = urlToFilename(task.url);
                const rootPagePathInZip = replaceLastAppExtension(rootFolderName) + "/" +
                    (rootFolderPath ? (rootFolderPath + "/") : "") + rootFileName;
                const readmeContent =
                    "Root page saved at: " + rootPagePathInZip + "\n\n" +
                    "This site was downloaded using the Website Downloader Chrome Extension (https://chromewebstore.google.com/detail/website-downloader/iaaokenmfgahhlcfbdipjonlkeinadaa)\n";

                const zipFilename = `download-${task.taskId}-${Date.now()}.zip`;

                try {
                    // Add README.txt to the folder
                    const readmePath = rootFolderName + "/README.txt";
                    if (!opfsSavedFiles.has(readmePath)) {
                        await OPFSStorage.writeHtmlFile(opfsFilesHandle, readmePath, readmeContent, opfsSavedFiles);
                        console.log("Added README.txt to folder");
                    }

                    // Write metadata
                    const metadata: DownloadMetadata = {
                        version: 1,
                        taskId: task.taskId,
                        originalUrl: task.url,
                        title: task.params?.title || "Website",
                        downloadDate: task.now.toISOString(),
                        rootFolderName: rootFolderName,
                        pageCount: opfsSavedFiles.size,
                        status: 'completed',
                        maxDepth: task.maxDepth,
                    };
                    await OPFSStorage.writeMetadata(task.taskId, metadata);
                    console.log("Wrote download metadata");

                    // Zip the folder
                    const zipStart = performance.now();
                    const zipFileHandle = await OPFSStorage.zipDownloadFolder(task.taskId, zipFilename);
                    const zipFile = await zipFileHandle.getFile();
                    task.sharedData.perfStats.recordOperation('zipCreation', performance.now() - zipStart, zipFile.size);
                    const url = URL.createObjectURL(zipFile);
                    console.log("Created zip from folder");

                    downloadableInfo = {
                        options: {
                            filename: `${rootFolderName}.zip`,
                            url,
                            saveAs: false
                        },
                        isMultiPage: task.isMultiPage,
                        maxDepth: task.maxDepth,
                        someLinksNotDownloaded: task.sharedData.someLinksNotDownloaded,
                        quotaExceeded: task.sharedData.quotaExceeded,
                    };

                    // Cleanup OPFS folder (keep zip file - it's referenced by blob URL)
                    await OPFSStorage.deleteDownload(task.taskId);
                    console.log("Cleaned up OPFS download folder");

                } catch (error) {
                    console.error("Failed in folder-based finalization:", error);
                    // Cleanup on error
                    await OPFSStorage.deleteDownload(task.taskId);
                }
            } else {
                // Single page or fallback to JSZip
                downloadableInfo = await createDownloadableObject(data, task.now, task.sharedData.someLinksNotDownloaded);
            }
            
            sendMessage('logPerformanceStats', task.sharedData.perfStats.getFormattedStats());
            DownloadTask.dispose(task.taskId);
            return {downloadableInfo, url: task.url};
        }
        DownloadTask.dispose(task.taskId);
        return undefined;
    }

    static dispose(taskId: string) {
        const currentTask = currentTasks.get(taskId);
        if (currentTask) {
            currentTask.sharedData.chain = [];
            currentTask.sharedData.abortController.abort();
            // Cancel any in-flight fetches in the background script
            sendMessage('cancelFetch', taskId);
            currentTasks.delete(taskId);
        }
    }

    putNewTask(task: DownloadTask) {
        this.sharedData.chain.push(task);
        task.sharedData = this.sharedData;
    }

    constructor(param: DownloadTaskParam) {
        this.taskId = param.taskId;
        this.tabId = param.tabId;
        this.url = param.url;
        this.dltype = param.dltype;

        this.elemcount = 0;

        this.now = new Date();
        this.currentDepth = param.currentDepth;
        this.isMultiPage = param.isMultiPage;
        this.maxDepth = param.maxDepth;
        this.params = param.params;

        this.html = param.html;
    }

    /**
     * Sets up the base tag for the document. If a base tag already exists:
     * - If it has a full URL, keeps it as is
     * - If it has a relative path, resolves it against the root domain
     * - If it has no href, sets it to the current URL
     * If no base tag exists, creates a new one with the current URL.
     */
    private setupBaseTag(doc: Document, currentUrl: string): void {
        if (this.sharedData.abortController.signal.aborted) return;
        // Check if there's already a base tag
        const existingBase = doc.querySelector("base");
        if (existingBase) {
            const existingHref = existingBase.getAttribute("href");
            if (existingHref) {
                try {
                    // Try to create URL from existing href to see if it's absolute
                    new URL(existingHref);
                    // If we get here, it's already a full URL, so keep it as is
                } catch (e) {
                    // It's a relative URL, resolve it against the root domain
                    const rootDomain = getRootDomain(currentUrl);
                    if (rootDomain) {
                        const resolvedUrl = createUrlWithDetails(existingHref, rootDomain, 'setupBaseTag-resolveRelative').href;
                        existingBase.href = resolvedUrl;
                    } else {
                        // Fallback to current URL if getRootDomain fails
                        existingBase.href = currentUrl;
                    }
                }
            } else {
                // Base tag exists but has no href, set it to our URL
                existingBase.href = currentUrl;
            }
        } else {
            // No existing base tag, create new one (original logic)
            const base = doc.createElement("base");
            base.href = currentUrl;
            doc.head.appendChild(base);
        }
    }

    removeMeta(doc: Document) {
        if (this.sharedData.abortController.signal.aborted) return;
        let metas = doc.getElementsByTagName("meta");
        for (let i = 0, l = metas.length; i < l; i++) {
            let me = metas[i];
            let csattr = me.getAttribute("charset");
            if (csattr) {
                me.parentNode?.removeChild(me);
                break;
            } else {
                csattr = me.getAttribute("content");
                if (csattr) {
                    if (csattr.toLowerCase().indexOf("charset") != -1) {
                        me.parentNode?.removeChild(me);
                        break;
                    }
                }
            }
        }
    }

    removeTags(doc: Document) {
        if (this.sharedData.abortController.signal.aborted) return;
        if (this.dltype == DlType.All) return;

        let tagnames, tags, tag;
        if (settings.noscript == true) {
            tags = doc.getElementsByTagName("noscript");

            while (tags.length > 0) {
                var t = tags[0], p = t.parentNode;
                let ih = t.innerHTML.replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
                t.insertAdjacentHTML("afterend", ih);
                p?.removeChild(t);
            }
        }

        tagnames = ["meta", "script", "iframe", "link", "style"];
        for (var i = 0, il = tagnames.length; i < il; i++) {
            if (i == 4 && this.dltype == DlType.KeepStyle) continue;
            let ks = (i == 3 && this.dltype == DlType.KeepStyle) ? true : false;

            tags = doc.getElementsByTagName(tagnames[i]);
            for (j = tags.length - 1; j >= 0; j--) {
                tag = tags[j];
                if (ks == true && tag.getAttribute("rel") == "stylesheet") continue;
                tag.parentNode?.removeChild(tag);
            }
        }

        tags = doc.getElementsByTagName("a");
        for (var i = tags.length - 1; i >= 0; i--) {
            tag = tags[i];
            let cns = tag.children;
            if (cns.length == 1) {
                let cn = cns[0];
                let tagname = cn.tagName;
                if (!tagname || tagname.toLowerCase() != "img") continue;
                var p = tag.parentNode;
                cn.removeAttribute("width");
                cn.removeAttribute("height");
                p?.insertBefore(cn, tag);
                p?.removeChild(tag);
            }
        }

        let found;
        tagnames = ["div", "span", "p"];
        do {
            found = false;
            for (let n = 0, nl = tagnames.length; n < nl; n++) {
                tags = doc.getElementsByTagName(tagnames[n]);
                for (var i = tags.length - 1; i >= 0; i--) {
                    tag = tags[i];
                    if (!tag.innerHTML) {
                        tag.parentNode?.removeChild(tag);
                        found = true;
                    }
                }
            }
        } while (found == true);

        let removeComments = function (elem: any) {
            for (let i = elem.childNodes.length - 1; i >= 0; i--) {
                tag = elem.childNodes[i];
                if (tag.nodeType === Node.COMMENT_NODE) {
                    tag.parentNode.removeChild(tag);
                } else {
                    removeComments(tag);
                }
            }
        };
        removeComments(doc);

        tags = doc.getElementsByTagName("*");
        for (var i = 0, l = tags.length; i < l; i++) {
            tag = tags[i];
            for (var j = tag.attributes.length - 1; j >= 0; j--) {
                let attr = tag.attributes[j].name.toLowerCase();
                if ((this.dltype != DlType.KeepStyle && (attr == "class" || attr == "style"))
                    || (this.dltype == DlType.Minimal && attr == "id") || attr.slice(0, 2) == "on") {
                    tag.removeAttribute(attr);
                }
            }
        }
    }

    convertPre(doc: Document) {
        if (this.sharedData.abortController.signal.aborted) return;
        let tags, tag;
        tags = doc.getElementsByTagName("pre");
        for (let i = 0, l = tags.length; i < l; i++) {
            tag = tags[i];

            let brs = tag.getElementsByTagName("br");
            for (let j = brs.length - 1; j >= 0; j--) {
                let tn = doc.createTextNode("\x0A");
                brs[j].parentNode?.replaceChild(tn, brs[j]);
            }
        }
    }

    appendProp(doc: Document) {
        if (this.sharedData.abortController.signal.aborted) return;
        if (!settings.emsrc && !settings.emdate) return;

        let div = doc.createElement("div");
        div.setAttribute("style",
            "position:fixed;z-index:999999;text-align:center;width:100%;bottom:0;");
        let idv = doc.createElement("div");
        idv.setAttribute("style",
            "display:inline;padding:0.5em;background-color:rgba(255,255,255,0.9);color:black;");
        if (settings.emdate) {
            let ddv = doc.createElement("span");
            ddv.textContent = this.now.toLocaleString();
            idv.appendChild(ddv);
        }
        if (settings.emsrc) {
            let ema = doc.createElement("a");
            ema.href = this.url;
            ema.textContent = localize("showsrc");
            if (settings.emdate) {
                ema.setAttribute("style", "margin-left:1em;");
            }
            idv.appendChild(ema);
        }
        div.appendChild(idv);
        doc.body.appendChild(doc.createComment("Single HTML Downloader info"));
        doc.body.appendChild(div);
    }

    checkFinish(title: string, doc: Document): DownloadHtmlData | undefined {
        const t = this;
        if (this.sharedData.abortController.signal.aborted) return;

        return createDownloadableFile(title, t.url, doc);
    }

    getScheme(url: any) {
        let sp = url.indexOf("://");
        if (sp != -1) {
            return url.substring(0, sp);
        } else {
            return "";
        }
    }

    getExactlyUrl(target: any, baseurl?: any) {
        const t = this;
        if (!baseurl) baseurl = t.url;
        let url = createUrlWithDetails(target, baseurl, 'getExactlyUrl');
        return url.href;
    }

    checkDownloadSize(xhr: any, size: any) {
        let ctype = xhr.getResponseHeader("content-type");
        if (typeof ctype == "string") {
            let cltype = ctype.toLowerCase();
            for (let i = 0, l = mimeTypes.length; i < l; i++) {
                if (cltype.indexOf(mimeTypes[i]) != -1) {
                    let name = extTypes[i] + "_max";
                    if (size <= settings[name] * 1024) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }

        if (size <= settings["others_max"] * 1024) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Fetches content via background script to bypass CORS restrictions.
     * Sends a message to the service worker which performs the actual fetch.
     * Uses cache to avoid re-downloading the same URL.
     */
    private async downloadContentFetch(is_text: boolean, src: string, index: number, opType: OperationType): Promise<DownloadContentResult> {
        // Check cache for binary content (images, fonts) to avoid duplicate downloads
        if (!is_text) {
            const cached = this.sharedData.downloadedUrls.get(src);
            if (cached) {
                return {
                    success: true,
                    data: cached,
                    index: index,
                };
            }
        }

        const startTime = performance.now();
        try {
            const timeoutMs = (settings["timeout"] > 0) ? settings["timeout"] * 1000 : 60000;

            const response = await sendMessage('fetchUrl', {
                taskId: this.taskId,
                url: src,
                isText: is_text,
                timeoutMs: timeoutMs,
                sizeLimits: {
                    image_max: settings["image_max"],
                    font_max: settings["font_max"],
                    js_max: settings["js_max"],
                    css_max: settings["css_max"],
                    others_max: settings["others_max"],
                },
            });

            if (response.success) {
                const elapsed = performance.now() - startTime;
                this.sharedData.perfStats.recordOperation(opType, elapsed, response.sizeBytes || 0, response.timing);

                // Cache binary content for deduplication
                if (!is_text) {
                    this.sharedData.downloadedUrls.set(src, response.data!);
                }

                return {
                    success: true,
                    data: response.data!,
                    index: index,
                };
            } else {
                return {
                    success: false,
                    index: index,
                    errmsg: response.errorMessage || "Failed to fetch"
                };
            }
        } catch (e: any) {
            return {
                success: false,
                index: index,
                errmsg: e?.message || "Failed to fetch"
            };
        }
    }

	async downloadText(url: string, index: number, opType: OperationType): Promise<DownloadContentResult> {
		return await this.downloadContentFetch(true, url, index, opType)
	}

	async downloadImage(url: string, index: number, opType: OperationType): Promise<DownloadContentResult> {
		return await this.downloadContentFetch(false, url, index, opType);
	}

    async convertCssUrl(cssurl: any, css: any): Promise<string[]> {
        let res: any[] = [], regres;
        let regex = /url\((['"]?)(.+?)\1\)/ig;
        while ((regres = regex.exec(css)) !== null) {
            res.push({start: regres.index, fulllen: regres[0].length, url: regres[regres.length - 1], data: ""});
        }

        let rest = res.length;
        let checkFinish = async function () {
            rest--;
            if (rest <= 0) {
                let str = "", pos = 0;
                for (let i = 0, l = res.length; i < l; i++) {
                    str += css.substring(pos, res[i].start);
                    str += "url(\"" + res[i].data + "\")";
                    pos = res[i].start + res[i].fulllen;
                }
                str += css.slice(pos);
                return str
            }
        };

        if (rest == 0) {
            const css = await checkFinish();
            if (css) {
                return [css];
            } else {
                return [];
            }
        }

        const result: Promise<string | undefined>[] = []
        for (let i = 0, l = res.length; i < l; i++) {
            let target = res[i].url;
            if (target.slice(0, 4) == "data") {
                res[i].data = target;
                const r = checkFinish();
                result.push(r);
            } else {
                target = this.getExactlyUrl(target, cssurl);

                const r = await this.downloadImage(target, i, 'cssUrlProcessing');
                if (r.success) {
                    res[r.index].data = r.data;
                }
                const re= checkFinish();
                result.push(re);
            }
        }
        let resultList: Awaited<string | undefined>[] = await Promise.all(result);
        return resultList.filter(r => r !== undefined);
    }

    async getSubFiles(doc: Document, title: string) {
        const t = this;

        let tagnames, tags, tag;
        var elems: any[] = [], add, src
        tagnames = ["img", "script", "link"];
        for (var i = 0, il = tagnames.length; i < il; i++) {
            tags = doc.getElementsByTagName(tagnames[i]);
            for (let j = 0, jl = tags.length; j < jl; j++) {
                tag = tags[j];
                add = false;
                switch (i) {
                    case 0:
                        const imageTag = tag as HTMLImageElement;
                        src = (imageTag.currentSrc != "") ? imageTag.currentSrc : imageTag.src;
                        add = (src.substring(0, 4) == "http");
                        break;
                    case 1:
                        const scriptTag = tag as HTMLScriptElement;
                        add = (scriptTag.src !== undefined && scriptTag.src != "");
                        break;
                    case 2:
                        const linkTag = tag as HTMLLinkElement;
                        if (linkTag.href) {
                            let rel = linkTag.rel.toLowerCase();
                            add = (rel.includes("stylesheet") || rel == "shortcut icon" || rel == "preload");
                        }
                        break;
                }
                if (add == true) elems.push(tag);
            }
        }

        // Collect <source> elements inside <picture> tags for srcset processing
        const pictureSourceElems: HTMLSourceElement[] = [];
        const pictures = doc.getElementsByTagName("picture");
        for (let p = 0; p < pictures.length; p++) {
            const sources = pictures[p].getElementsByTagName("source");
            for (let s = 0; s < sources.length; s++) {
                const source = sources[s] as HTMLSourceElement;
                // Check if it has srcset or data-srcset (relative URLs will be resolved later)
                const srcset = source.getAttribute("srcset") || source.getAttribute("data-srcset");
                if (srcset && srcset.trim() !== "") {
                    pictureSourceElems.push(source);
                }
            }
        }

        t.elemcount = elems.length;

        // Collect task functions for throttled execution
        const tasks: (() => Promise<void>)[] = [];
        for (var i = 0, el = t.elemcount; i < el; i++) {
            if (t.sharedData.abortController.signal.aborted) break;
            let tagName = elems[i].tagName.toLowerCase();
            if (tagName == "img" || (tagName == "link" && !elems[i].rel.toLowerCase().includes("stylesheet"))) {
                var src;
                // TODO: There also might be srcset & data-srcset
                if (settings.loadlazy == true && tagName == "img" && elems[i].hasAttribute("data-src")) {
                    src = elems[i].getAttribute("data-src");
                } else {
                    src = (tagName == "img") ? elems[i].src : elems[i].href;
                }
                const opType = tagName == "img" ? 'imageTag' : 'imageLink';
                const elemIndex = i; // Capture index for closure
                const capturedSrc = src;
                tasks.push(() => t.downloadImage(capturedSrc, elemIndex, opType).then(res => {
                    if (res.success) {
                        let index = res.index;
                        if (elems[index].src) { // XXX: Does this logic properly loads data-src?
                            elems[index].src = res.data;
                        } else {
                            elems[index].href = res.data;
                        }
                        // We remove all remaining tags because they refer to the online resource.
                        elems[index].removeAttribute("srcset");
                        elems[index].removeAttribute("data-srcset");
                        elems[index].removeAttribute("data-src");
                    }
                }));
            } else if (tagName == "script") {
                const elemIndex = i;
                const capturedSrc = elems[i].src;
                tasks.push(() => t.downloadText(capturedSrc, elemIndex, 'scriptDownload').then(res => {
                    if (res.success == true) {
                        let index = res.index;
                        let em = elems[index];
                        em.removeAttribute("src");
                        // Escaping script tags in the string
                        em.textContent = res.data.replace(/<(\/*)script>/gi, "\\x3c$1script\\x3e");
                    }
                }));
            } else {	// style
                const elemIndex = i;
                const capturedHref = elems[i].href;
                tasks.push(async () => {
                    const res = await t.downloadText(capturedHref, elemIndex, 'cssDownload');
                    if (res.success) {
                        let index = res.index;
                        let em = elems[index];
                        let p = em.parentNode;

                        const strArray = await t.convertCssUrl(em.href, res.data);
                        strArray.forEach((str: any) => {
                            if (str !== null) {
                                let css = doc.createElement("style");
                                let media = em.getAttribute("media");
                                if (media) css.setAttribute("media", media);
                                css.textContent = str;
                                p.insertBefore(css, em);
                                p.removeChild(em);
                            }
                        })
                    }
                });
            }
        }

        // Process <source> elements inside <picture> tags
        for (const sourceElem of pictureSourceElems) {
            if (t.sharedData.abortController.signal.aborted) break;

            // Get srcset (prefer data-srcset for lazy loading if enabled)
            let srcset = sourceElem.getAttribute("srcset");
            if (settings.loadlazy && sourceElem.hasAttribute("data-srcset")) {
                srcset = sourceElem.getAttribute("data-srcset");
            }

            if (!srcset) continue;

            const entries = parseSrcset(srcset);
            if (entries.length === 0) continue;

            // Download only the best (highest resolution) srcset variant
            const capturedSourceElem = sourceElem;
            const bestEntry = selectBestSrcsetEntry(entries);
            if (!bestEntry) continue;

            const capturedBestEntry = bestEntry;
            tasks.push(async () => {
                // Resolve relative URLs to absolute using the page URL as base
                let absoluteUrl = capturedBestEntry.url;
                if (!capturedBestEntry.url.startsWith('http://') && !capturedBestEntry.url.startsWith('https://') && !capturedBestEntry.url.startsWith('data:')) {
                    try {
                        absoluteUrl = new URL(capturedBestEntry.url, t.url).href;
                    } catch (e) {
                        console.warn(`Failed to resolve srcset URL: ${capturedBestEntry.url}`, e);
                        return;
                    }
                }

                const result = await t.downloadImage(absoluteUrl, 0, 'imageSrcset');
                if (result.success) {
                    // Update srcset with single high-res data URL
                    capturedSourceElem.setAttribute("srcset", result.data);
                    capturedSourceElem.removeAttribute("data-srcset");
                }
            });
        }

        // Execute all tasks with concurrency limit
        await runWithConcurrencyLimit(tasks, MAX_CONCURRENT_ASSETS);
    }

    // On Images:
    //  Currently, we only process src tag. However, there are also data-src, srcset, and data-srcset.
    //  If the same image has both src & srcset, the srcset is processed first, and the removed <base> tag will break it
    async processLinks(doc: Document) {
        const t = this;
        if (t.currentDepth >= t.maxDepth) return;
        if (t.sharedData.abortController.signal.aborted) return;

        const currentRootDomain = getRootDomain(t.url)
        let links: HTMLCollectionOf<HTMLAnchorElement> = doc.getElementsByTagName("a");
        const aLinkSet = new Set(
            Array.from(links)
                .map(a => a.href)
				.filter(a => a !== null && a !== '')
                .filter(a => isValidUrl(a))
                .filter(a => getRootDomain(a) === currentRootDomain)
                .map(a => cleanUrl(a))
                .filter(a => !this.sharedData.processedLinks.has(a))
        )

        for (const href of aLinkSet) {
            this.sharedData.linksCollected.add(href);
            if (this.sharedData.abortController.signal.aborted) return;
            await this.fetchNewTask(href);
        }
    }

    async fetchNewTask(url: string) {
        const task = DownloadTask.create({
            dltype: 0,
            html: { url },
            url: url,
            taskId: this.taskId,
            tabId: this.tabId,
            currentDepth: this.currentDepth + 1,
            isMultiPage: this.isMultiPage,
            maxDepth: this.maxDepth,
            params: this.params,
        })
        this.putNewTask(task)
    }

    async convert(): Promise<DownloadHtmlData | undefined> {
        const t = this;
        let parser = new DOMParser();
        let htmlText = typeof this.html === 'string' ? this.html : await urlToText(this.html, this.sharedData.abortController.signal);
        if (htmlText == null) {
            this.sharedData.someLinksNotDownloaded = true;
            return;
        }

        // Measure HTML parsing
        const parseStart = performance.now();
        const doc = parser.parseFromString(htmlText, "text/html");
        this.sharedData.perfStats.recordOperation('htmlParsing', performance.now() - parseStart);

        const computedTitle = (this.params?.title) || doc.title || "PAGE";
        if (t.url === "https://extensiontechnologies-332ae.web.app/website_downloader") {
            console.log("Download welcome page")
            const myUrl = chrome.runtime.getURL("data/Extension-Technologies.html")
            // Fetch the file
            const data = await fetch(myUrl, { signal: t.sharedData.abortController.signal });
            const text = await data.text()
            return {
                url: t.url,
                filename: "Extension-Technologies.html",
                doc: text
            }
        } else {
            t.setupBaseTag(doc, t.url);

            // Measure DOM cleanup
            const cleanupStart = performance.now();
            t.removeMeta(doc);
            t.removeTags(doc);
            this.sharedData.perfStats.recordOperation('domCleanup', performance.now() - cleanupStart);

            t.convertPre(doc);
            t.appendProp(doc);
            if (this.isMultiPage) {
                // Measure link discovery
                const linkDiscoveryStart = performance.now();
                await t.processLinks(doc);
                this.sharedData.perfStats.recordOperation('linkDiscovery', performance.now() - linkDiscoveryStart);
            }
            await t.getSubFiles(doc, computedTitle);

            // Measure link inlining
            const inliningStart = performance.now();
            inlineRelativeLinks(doc, t.sharedData.linksCollected, t.sharedData.abortController.signal, t.url);
            this.sharedData.perfStats.recordOperation('linkInlining', performance.now() - inliningStart);

            return t.checkFinish(computedTitle, doc);
        }
    }
}

function localize(name: any){
    let str = chrome.i18n.getMessage(name);
    if(!str) return "(\"" + name + "\" is not defined)";
    return str;
}

function createDownloadableFile(title: any, url: string, doc: Document): DownloadHtmlData {
    let ttl = title.replace(/[\r\n]/g, "").replace(/[\\/:*?"<>|~.]/g, "_").trim();
    if (ttl.length > 45) ttl = ttl.substring(0, 50);
    if (!ttl) ttl = "webpage";
    const filename = ttl + ".html";

    return { url, filename, doc }
}


async function createDownloadableObject(data: DownloadHtmlData[], downloadDate: Date, someLinksNotDownloaded: boolean): Promise<DownloadableInfo> {
    console.log("Amount of data received: " + data.length + "")
    let singleData = data[0];
    const html = getHtml(singleData.doc, downloadDate);
    const blob = new Blob([html], {type: "text/html"});
    const url = URL.createObjectURL(blob);

    return {
        options: {filename: singleData.filename, url, saveAs: false},
        isMultiPage: false,
        maxDepth: 0,
        someLinksNotDownloaded,
        quotaExceeded: false, // Single-page downloads don't use OPFS quota
    }
}

function inlineRelativeLinks(doc: Document, urlExclusions: Set<string>, signal: AbortSignal, pageUrl: string): void {
    if (signal.aborted) return;
    const baseTags = doc.querySelectorAll("base");
    if (baseTags.length === 0) return;

    // Find the first base tag with an href attribute to use as the base URL
    let baseUrl: string | null = null;
    for (const baseTag of baseTags) {
        const href = baseTag.getAttribute("href");
        if (href) {
            baseUrl = href;
            break;
        }
    }

    if (!baseUrl) return;

    // Remove all <base> tags
    baseTags.forEach(baseTag => baseTag.remove());

    // When computing relative paths, treat a base URL ending with '/' as if the current
    // document is 'index.html' in that directory. This ensures that links pointing to
    // parent directories correctly become '../index.html' instead of 'index.html'.
    const baseUrlForRelative = baseUrl.endsWith('/') ? (baseUrl + 'index.html') : baseUrl;

    // Use the actual page URL for relative path calculation (where the file is saved),
    // not the base tag URL (which is only used for resolving relative URLs to absolute).
    const pageUrlForRelative = pageUrl.endsWith('/') ? (pageUrl + 'index.html') : pageUrl;

    const resolveUrl = (relativeUrl: string | null): string | null => {
        if (!relativeUrl) return null;
        if (relativeUrl.startsWith("data:")) return relativeUrl;

        try {
            // Convert to absolute URL regardless of input format
            let absoluteUrl = relativeUrl.startsWith("http") 
                ? relativeUrl 
                : createUrlWithDetails(relativeUrl, baseUrl, 'inlineRelativeLinks-resolveUrl').href;

            // Clean the URL by removing query parameters and hash
            absoluteUrl = cleanUrl(absoluteUrl);

            // Check if this is a link to the current page
            if (absoluteUrl === cleanUrl(pageUrl)) {
                // If pageUrl ends with '/', the page is saved as index.html
                // so self-references should point to index.html instead of "."
                return pageUrl.endsWith('/') ? "index.html" : ".";
            }

            // Check for both slash and /index.html variants
            const hasUrl = urlExclusions.has(absoluteUrl) ||
                (absoluteUrl.endsWith('/') && urlExclusions.has(absoluteUrl + 'index.html')) ||
                (absoluteUrl.endsWith('/index.html') && urlExclusions.has(absoluteUrl.slice(0, -10)));

            if (hasUrl) {
                // Convert excluded URLs to relative paths, handling directory targets correctly
                const targetIsDir = absoluteUrl.endsWith('/') || absoluteUrl.endsWith('/index.html');

                if (targetIsDir) {
                    // Normalize to explicit index.html for relative path computation
                    const normalizedTarget = absoluteUrl.endsWith('/index.html') ? absoluteUrl : (absoluteUrl + 'index.html');
                    const dirRelative = makeRelativePath(normalizedTarget, pageUrlForRelative);
                    // If relative path is empty, we are at the same directory; point to index.html
                    if (!dirRelative) return 'index.html';
                    return dirRelative;
                }

                // Regular file targets
                const relativePath = makeRelativePath(absoluteUrl, pageUrlForRelative);
                if (relativePath === '') {
                    // Safety: empty means directory-level; point to index.html
                    return 'index.html';
                }
                return relativePath.endsWith('.html') ? relativePath : relativePath + '.html';
            }

            return absoluteUrl; // Keep other URLs as absolute
        } catch(e) {
            // Expected for malformed HTML attributes - not a bug in our code
            console.debug("Skipping unresolvable URL:", relativeUrl);
            return null;
        }
    };

    const makeRelativePath = (absoluteUrl: string, baseUrl: string): string => {
        const absolutePath = createUrlWithDetails(absoluteUrl, undefined, 'makeRelativePath-absolute').pathname;
        const basePath = createUrlWithDetails(baseUrl, undefined, 'makeRelativePath-base').pathname;

        const absoluteParts = absolutePath.split("/").filter(part => part !== "").map(safeDecodePathSegment);
        let baseParts = basePath.split("/").filter(part => part !== "").map(safeDecodePathSegment);

        // If baseUrl ends with 'index.html', it represents a directory (original URL ended with '/')
        // Otherwise, treat the last segment as a file (not a directory), so remove it from baseParts
        // because the file is saved in the parent directory
        const isDirectory = basePath.endsWith('/') || (baseParts.length > 0 && baseParts[baseParts.length - 1] === 'index.html');
        if (!isDirectory && baseParts.length > 0) {
            baseParts = baseParts.slice(0, -1);
        }

        let commonIndex = 0;
        while (commonIndex < absoluteParts.length && commonIndex < baseParts.length && absoluteParts[commonIndex] === baseParts[commonIndex]) {
            commonIndex++;
        }

        // If baseUrl represents a directory, we need -1 to account for going up from the directory
        // If baseUrl represents a file, we already removed the file segment, so no -1 needed
        const upLevels = isDirectory ? (baseParts.length - commonIndex - 1) : (baseParts.length - commonIndex);
        const relativeParts = absoluteParts.slice(commonIndex);
        
        // Clean all parts except the last one if it ends with .html
        const cleanedParts = relativeParts.map((part, index) => {
            if (index === relativeParts.length - 1 && part.endsWith('.html')) {
                return cleanString(part);
            }
            return cleanString(part);
        });

        return ((upLevels > 0) ? "../".repeat(upLevels) : "") + cleanedParts.join("/");
    };

    const updateAttribute = (element: Element, attr: string) => {
        const url = element.getAttribute(attr);
        const newUrl = resolveUrl(url);
        if (newUrl) {
            element.setAttribute(attr, newUrl);
        }
    };

    // List of elements and attributes to update
    const selectors: [string, string][] = [
        ["a", "href"],
        ["link", "href"],
        ["script", "src"],
        ["img", "src"],
        ["iframe", "src"],
        ["source", "src"],
        ["video", "src"],
        ["audio", "src"],
        ["form", "action"]
    ];

    for (const [tag, attr] of selectors) {
        doc.querySelectorAll(tag).forEach(el => {
            updateAttribute(el, attr);
        });
    }
}

async function urlToText(input: UrlWrapper, signal: AbortSignal): Promise<string | null> {
    try {
        const response = await fetch(input.url, { signal });
        if (!response.ok) {
            return null;
        }
        // Decode minimally per existing rule: meta charset if present, else UTF-8
        const buffer = await response.arrayBuffer();
        let utf8Text = '';
        try {
            utf8Text = new TextDecoder('utf-8').decode(buffer);
        } catch (e) {
            utf8Text = '';
        }
        let charset = extractCharsetFromMetaHtml(utf8Text);
        charset = charset ? normalizeEncodingLabel(charset) : 'utf-8';
        let text: string;
        if (charset === 'utf-8') {
            text = utf8Text || await response.text();
        } else {
            try {
                text = new TextDecoder(charset).decode(buffer);
            } catch (e) {
                text = utf8Text || await response.text();
            }
        }
        return text;
    } catch (e: any) {
        if (e instanceof TypeError && e.message === 'Failed to fetch') {
            return null;
        }
        if (e?.name === 'AbortError') {
            return null;
        }
        throw e;
    }
}

function strip(str: string): string {
    return str.length > 30
        ? `${str.slice(0, 10)}...${str.slice(-20)}`
        : str;
}

async function sendInfoNoUrl(linksCollected: number, index: number, allPagesAreDiscovered: boolean, signal: AbortSignal) {
    if (signal.aborted) return;
    await sendMessage('infoMessage', {
        loadedPages: index,
        discoveredPages: linksCollected,
        allPagesDiscovered: allPagesAreDiscovered,
    });
}