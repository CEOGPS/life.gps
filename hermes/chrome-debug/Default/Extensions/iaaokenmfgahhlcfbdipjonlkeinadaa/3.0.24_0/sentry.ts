/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.
import {BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope} from "@sentry/browser";
import {getVersion} from "./tools";

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const CAPTURED_ERRORS_KEY = 'capturedErrors';
const MAX_STORED_ERRORS = 20;

export interface CapturedError {
    message: string;
    location: string;
    timestamp: string;
    stack?: string;
    url?: string;
}

async function storeErrorInLocalStorage(error: CapturedError): Promise<void> {
    try {
        if (typeof chrome === 'undefined' || !chrome.storage?.local) {
            return;
        }
        const result = await chrome.storage.local.get([CAPTURED_ERRORS_KEY]);
        const errors: CapturedError[] = result[CAPTURED_ERRORS_KEY] || [];
        errors.push(error);
        const trimmedErrors = errors.slice(-MAX_STORED_ERRORS);
        await chrome.storage.local.set({ [CAPTURED_ERRORS_KEY]: trimmedErrors });
    } catch (e) {
        console.error('Failed to store error in local storage:', e);
    }
}

export default function new_sentry_scope(): Scope {
    const integrations = getDefaultIntegrations({}).filter(
        (defaultIntegration) => {
            return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
                defaultIntegration.name,
            );
        },
    );

    let client = new BrowserClient({
        dsn: "https://c8ca62d354c7cc59706b05ad112030aa@o4508493399916544.ingest.de.sentry.io/4508493406732368",
        transport: makeFetchTransport,
        stackParser: defaultStackParser,
        integrations: integrations,
        beforeSend: (event, hint) => {
            if (hint.data) {
                console.log("hint.data", hint.data);
                // Add the hint data to the event as tags
                event.tags = {...event.tags, ...hint.data};
                // Or add it as extra data
                event.extra = {...event.extra, hintData: hint.data};
            }
            return event;
        },
    })

    const scope = new Scope();
    scope.setClient(client);

    client.init(); // initializing has to be done after setting the client on the scope

    return scope
}

export async function capturing<T>(scope: Scope, location: string, url: string | undefined, action: () => Promise<T>, mode?: string, depth?: number): Promise<Result<T, unknown>> {
    try {
        const value = await action();
        return { ok: true, value };
    } catch (e) {
        console.error(e);

        // Store error for test detection
        const errorMessage = e instanceof Error ? e.message : String(e);
        const errorStack = e instanceof Error ? e.stack : undefined;
        storeErrorInLocalStorage({
            message: errorMessage,
            location: location,
            timestamp: new Date().toISOString(),
            stack: errorStack,
            url: url,
        });

        url = url || (await getTabUrl());
        const versionx = getVersion();
        const hintData: Record<string, any> = {location: location, urlx: url, versionx: versionx};
        if (mode !== undefined) {
            hintData.mode = mode;
        }
        if (depth !== undefined) {
            hintData.depth = depth;
        }
        scope.captureException(e, {data: hintData});
        return { ok: false, error: e };
    }
}

async function getTabUrl(): Promise<string> {
    if (chrome) {
        if (chrome.tabs) {
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            if (tabs.length > 0) {
                let url = tabs[0].url;
                if (url) {
                    return url;
                } else {
                    return "NO_URL_URL";
                }
            } else {
                return "NO_URL_LENGTH";
            }
        } else {
            return "NO_URL_TABS";
        }
    } else {
        return "NO_URL_CHROME";
    }
}


