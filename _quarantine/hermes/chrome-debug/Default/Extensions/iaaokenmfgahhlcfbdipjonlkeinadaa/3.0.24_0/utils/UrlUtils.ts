/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.

/**
 * Creates a URL object and throws a detailed exception if construction fails
 * @param url - The URL string or relative URL
 * @param base - Optional base URL for relative URLs
 * @param context - Context information for debugging (e.g., function name)
 * @throws Error with detailed information about the failed URL construction
 */
export function createUrlWithDetails(url: any, base?: any, context?: string): URL {
    try {
        if (base) {
            return new URL(url, base);
        } else {
            return new URL(url);
        }
    } catch (originalError) {
        const detailedMessage = `Failed to construct URL in ${context || 'unknown context'}:\n` +
            `  URL: "${String(url)}" (type: ${typeof url})\n` +
            `  Base: "${base ? String(base) : 'undefined'}" (type: ${typeof base})\n` +
            `  Original error: ${originalError instanceof Error ? originalError.message : String(originalError)}`;

        // Throw a new error with detailed information
        const detailedError = new Error(detailedMessage);
        detailedError.name = 'URLConstructionError';
        throw detailedError;
    }
}

/**
 * Checks if a string is a valid URL that can be parsed by the URL constructor.
 * This is useful for filtering out malformed URLs before processing.
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Cleans a URL by removing query parameters and hash, keeping only origin and pathname
 */
export function cleanUrl(url: string): string {
    try {
        const urlObj = createUrlWithDetails(url, undefined, 'cleanUrl');
        return `${urlObj.origin}${urlObj.pathname}`;
    } catch (e) {
        return url;
    }
}

/**
 * Gets the root domain (protocol + host) from a URL
 */
export function getRootDomain(url: any): string | null {
    try {
        // Use the URL object to parse the URL
        const parsedUrl = createUrlWithDetails(url, undefined, 'getRootDomain');
        return `${parsedUrl.protocol}//${parsedUrl.host}`; // Combine protocol and host
    } catch (e) {
        console.error("Invalid URL:", url); // Handle invalid URLs
        return null;
    }
}

/**
 * Gets the host from a URL
 */
export function getHost(url: any): string | null {
    try {
        // Use the URL object to parse the URL
        const parsedUrl = createUrlWithDetails(url, undefined, 'getHost');
        return `${parsedUrl.host}`; // Combine protocol and host
    } catch (e) {
        console.error("Invalid URL:", url); // Handle invalid URLs
        return null;
    }
}

/**
 * Sanitizes a filename to contain only allowed characters across platforms.
 * Allowed: A-Z, a-z, 0-9, dot, underscore, hyphen.
 * All other characters are replaced with an underscore. Collapses repeats and trims.
 */
export function sanitizeFilename(input: string): string {
    if (!input) return "website";
    // Remove control characters
    let sanitized = input.replace(/[\u0000-\u001F\u007F]/g, "");
    // Replace any disallowed character with underscore
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Collapse multiple underscores
    sanitized = sanitized.replace(/_+/g, "_");
    // Trim leading/trailing dots and underscores and whitespace
    sanitized = sanitized.replace(/^[._\s]+|[._\s]+$/g, "");
    return sanitized || "website";
}

/**
 * Cleans a string for use as a filename, preserving .html extension if present
 */
export function cleanString(str: string): string {
    // If the string ends with .html, handle it separately
    if (str.endsWith('.html')) {
        // Clean everything except the .html extension
        const nameWithoutExt = str.slice(0, -5);
        const cleanedName = nameWithoutExt.replace(/[\r\n]/g, "").replace(/[\\/:*?"<>|~.]/g, "_").trim();
        return cleanedName + '.html';
    }
    // Otherwise clean the entire string as before
    return str.replace(/[\r\n]/g, "").replace(/[\\/:*?"<>|~.]/g, "_").trim();
}

/**
 * Replaces the '.app' extension in a folder path with '_app' to avoid macOS treating
 * the folder as an application bundle. This prevents issues where folders ending in '.app'
 * are interpreted as applications on macOS systems.
 *
 * @param str - The folder path string to process
 * @returns The processed string with '.app' replaced with '_app' if present
 */
export function replaceLastAppExtension(str: string): string {
    if (str.endsWith('.app')) {
        return str.slice(0, -4) + '_app';
    }
    return str;
}

/**
 * Safely decodes a single URL path segment. If decoding fails, returns the original segment.
 */
export function safeDecodePathSegment(segment: string): string {
    // Fast path: try standard UTF-8 decoding first
    try {
        return decodeURIComponent(segment);
    } catch (_) {}

    // Build byte array from percent-encoded input; include raw ASCII bytes for non-encoded chars
    const bytes: number[] = [];
    for (let i = 0; i < segment.length; i++) {
        const ch = segment.charAt(i);
        if (ch === '%' && i + 2 < segment.length) {
            const h = segment.slice(i + 1, i + 3);
            if (/^[0-9a-fA-F]{2}$/.test(h)) {
                bytes.push(parseInt(h, 16));
                i += 2;
                continue;
            }
        }
        // Fallback: take byte value of the char (ASCII-safe)
        const code = segment.charCodeAt(i);
        bytes.push(code & 0xFF);
    }

    const buffer = new Uint8Array(bytes);
    const tryDecoders = ['shift_jis', 'euc-jp', 'windows-1252'] as const;
    for (const label of tryDecoders) {
        try {
            const td = new TextDecoder(label as unknown as string);
            const decoded = td.decode(buffer);
            if (decoded && decoded.indexOf('\uFFFD') === -1) {
                return decoded;
            }
        } catch (_) {
            // Unsupported encoding label or decode failure; continue
        }
    }

    // Last resort: return original segment if nothing worked
    return segment;
}

/**
 * Extracts folder path from URL (everything except the filename)
 */
export function urlToFolderPath(url: string): string {
    try {
        const urlObj = createUrlWithDetails(url, undefined, 'urlToFolderPath');
        const segments = urlObj.pathname
            .split('/')
            .filter(Boolean)
            .map(safeDecodePathSegment);

        // If URL ends with /, the last segment is also a folder
        if (urlObj.pathname.endsWith('/')) {
            return segments.map(replaceLastAppExtension).join('/');
        }

        // Otherwise remove the last segment (page name)
        segments.pop();
        return segments.map(replaceLastAppExtension).join('/');
    } catch (e) {
        return '';
    }
}

/**
 * Extracts filename from URL, adding .html extension if needed
 */
export function urlToFilename(url: string): string {
    try {
        const parsedUrl = createUrlWithDetails(url, undefined, 'urlToFilename');
        const path = parsedUrl.pathname;

        // If path ends with / or is empty, return index.html
        if (path.endsWith('/') || !path || path === "/") {
            return "index.html";
        }

        // Get the last segment of the path
        const lastSegmentEncoded = path.split("/").pop() || "";
        const lastSegment = safeDecodePathSegment(lastSegmentEncoded);

        // If it already ends with .html, return it cleaned but preserve the .html
        if (lastSegment.endsWith('.html')) {
            return cleanString(lastSegment);
        }

        // Otherwise add .html extension
        return `${cleanString(lastSegment)}.html`;
    } catch (error) {
        console.error("Invalid URL:", error);
        return "index.html";
    }
}

/**
 * Builds the full file path in the zip archive from a URL and root folder name.
 * The path structure is: rootFolder/folderPath/filename
 * @param url - The URL to extract the folder path and filename from
 * @param rootFolderName - The root folder name in the zip (e.g., sanitized host)
 * @returns The full path string for the file in the zip archive
 */
export function getFileFullPath(url: string, rootFolderName: string): string {
    // Get folder path and filename from URL
    const folderPath = urlToFolderPath(url);
    const filename = urlToFilename(url);

    // Build the full path in the zip: rootFolder/folderPath/filename
    let fullPath = replaceLastAppExtension(rootFolderName);
    if (folderPath.length > 0) {
        fullPath += '/' + folderPath;
    }
    fullPath += '/' + filename;

    return fullPath;
}
