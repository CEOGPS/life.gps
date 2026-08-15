/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.

/**
 * Converts a Document or string to an HTML string
 * @param doc - Document object or HTML string
 * @param downloadDate - Date to embed in the HTML metadata
 * @returns HTML string
 */
export function getHtml(doc: Document | string, downloadDate: Date): string {
    if (doc instanceof Document) {
        return getHtmlFromDoc(doc, downloadDate);
    } else {
        return doc;
    }
}

/**
 * Converts a Document to an HTML string with proper doctype and metadata
 * @param doc - Document object to convert
 * @param downloadDate - Date to embed in the HTML metadata
 * @returns HTML string with doctype and download date meta tag
 */
export function getHtmlFromDoc(doc: Document, downloadDate: Date): string {
    let dhtml = "<!DOCTYPE html><html><head>" +
        "<meta charset=\"utf-8\">" +
        "<meta name=\"download_date\" content=\"" + downloadDate.toISOString() + "\"/>";

    dhtml += doc.documentElement.innerHTML.substring(doc.documentElement.innerHTML.indexOf(">") + 1);
    return dhtml;
}

/**
 * Attempts to sniff the declared charset from the first bytes of the HTML.
 * - Parses <meta charset> and <meta http-equiv="content-type" content="...; charset=...">
 * @param htmlUtf8 - HTML string (assumed to be decoded as UTF-8 initially)
 * @returns The charset string if found, or null
 */
export function extractCharsetFromMetaHtml(htmlUtf8: string): string | null {
    if (!htmlUtf8) return null;
    // Only trust meta tags in the HTML text
    const metaCharset = /<meta[^>]*charset\s*=\s*["']?\s*([a-zA-Z0-9._:\-]+)\s*["']?/i.exec(htmlUtf8);
    if (metaCharset && metaCharset[1]) {
        return metaCharset[1];
    }
    const metaHttpEquiv = /<meta[^>]*http-equiv\s*=\s*["']content-type["'][^>]*content\s*=\s*["'][^"']*charset\s*=\s*([a-zA-Z0-9._:\-]+)[^"']*["']/i.exec(htmlUtf8);
    if (metaHttpEquiv && metaHttpEquiv[1]) {
        return metaHttpEquiv[1];
    }
    return null;
}

/**
 * Normalizes various encoding labels to ones supported by TextDecoder.
 * Maps common aliases to their canonical form.
 * @param label - The encoding label to normalize
 * @returns The normalized encoding label supported by TextDecoder
 */
export function normalizeEncodingLabel(label: string): string {
    let enc = (label || '').trim().toLowerCase().replace(/^["']|["']$/g, '');
    const map: Record<string, string> = {
        'utf8': 'utf-8',
        'us-ascii': 'utf-8', // per WHATWG treat as utf-8
        'ascii': 'utf-8',
        'latin1': 'windows-1252',
        'iso-8859-1': 'windows-1252',
        'iso8859-1': 'windows-1252',
        'x-user-defined': 'windows-1252',
        'gb2312': 'gbk',
        'x-gbk': 'gbk',
        'ansi_x3.4-1968': 'utf-8',
        'sjis': 'shift_jis',
    };
    if (map[enc]) return map[enc];
    // Allow common encodings as-is
    const allowed = [
        'utf-8','utf-16le','utf-16be','windows-1250','windows-1251','windows-1252','windows-1253','windows-1254','windows-1255','windows-1256','windows-1257','windows-1258',
        'iso-8859-2','iso-8859-3','iso-8859-4','iso-8859-5','iso-8859-6','iso-8859-7','iso-8859-8','iso-8859-10','iso-8859-13','iso-8859-14','iso-8859-15','iso-8859-16',
        'koi8-r','koi8-u','gbk','gb18030','big5','euc-kr','euc-jp','shift_jis'
    ];
    if (allowed.indexOf(enc) !== -1) return enc;
    // Fallback
    return 'utf-8';
}
