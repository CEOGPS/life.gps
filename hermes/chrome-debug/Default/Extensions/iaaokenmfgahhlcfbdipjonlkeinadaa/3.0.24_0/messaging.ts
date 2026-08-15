/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.
import {defineExtensionMessaging} from '@webext-core/messaging';
import DownloadOptions = chrome.downloads.DownloadOptions;

interface ProtocolMap {
    collectHtml(info: DownloadRequestInfo): void;

    dataPrepared(message: { downloadableInfo: DownloadableInfo | undefined, url: string }): void;

    cancel(taskId: string): void;

    reloadCurrentTab(): void;

    infoMessage(message: ProgressInfo): void;

    cancelLoadingLink(taskId: string): void;

    fetchUrl(request: FetchUrlRequest): FetchUrlResponse;

    cancelFetch(taskId: string): void;

    logPerformanceStats(stats: string): void;

    startProcessing(request: ProcessingRequest): void;

    htmlCaptured(data: CapturedHtmlData): void;

    cancelProcessing(taskId: string): void;

    triggerAction(): void;
}

export type CapturedHtmlData = {
    taskId: string;
    tabId: number;
    html: string;
    url: string;
    title: string;
    isMultiPage: boolean;
}

export type ProcessingRequest = {
    taskId: string;
    tabId: number;
    html: string;
    url: string;
    title: string;
    isMultiPage: boolean;
    maxDepth: number;
}

export type FetchUrlRequest = {
    taskId: string;
    url: string;
    isText: boolean;
    timeoutMs: number;
    sizeLimits?: SizeLimits;
}

export type SizeLimits = {
    image_max: number;
    font_max: number;
    js_max: number;
    css_max: number;
    others_max: number;
}

export type FetchUrlResponse = {
    success: boolean;
    data?: string;
    errorMessage?: string;
    sizeBytes?: number;
    // Timing breakdown for performance analysis
    timing?: {
        networkMs: number;   // Time for fetch + reading response body
        encodeMs: number;    // Time for base64 encoding (binary only)
    };
}

export type DownloadRequestInfo = {
    tabId: number,
    taskId: string,
    isMultiPage: boolean,
}

export const {sendMessage, onMessage} = defineExtensionMessaging<ProtocolMap>();

export type DownloadHtmlData = {
    url: string,
    filename: string,
    doc: Document | string, // Document or string with html
}

export type DownloadableInfo = {
    options: DownloadOptions,
    isMultiPage: boolean,
    maxDepth: number,
    someLinksNotDownloaded: boolean,
    quotaExceeded: boolean,
}

export type ProgressInfo = {
    loadedPages: number;
    discoveredPages: number;
    allPagesDiscovered: boolean;
}
