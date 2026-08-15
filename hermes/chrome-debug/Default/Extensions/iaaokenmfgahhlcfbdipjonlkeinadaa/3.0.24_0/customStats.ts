import { isDevelopmentMode } from "@/public/tools";

// Tinybird Events API
const TINYBIRD_LOCAL_ENDPOINT = 'http://localhost:7181/v0/events?name=analytics_events';
const TINYBIRD_CLOUD_ENDPOINT = 'https://api.europe-west2.gcp.tinybird.co/v0/events?name=analytics_events';
const TINYBIRD_LOCAL_TOKEN = 'p.eyJ1IjogIjE1ZTQ3OTllLWE3MmQtNDM5Mi04NmRmLTk1ZTIzMzg2NGVhZiIsICJpZCI6ICI3NWU5NDc2MS01MWFiLTRlMWItYmZhZi00NGVmYmVlMjZmNjMiLCAiaG9zdCI6ICJsb2NhbCJ9.awEX5bmTzKjImq_UeJQpqHycruucYg44ZPQlxYGZUQo';
const TINYBIRD_CLOUD_TOKEN = 'p.eyJ1IjogImU5YWQ0MjIzLTI3MzUtNGEzZi1hOGE5LThmOWRmZThlMmNhMyIsICJpZCI6ICIwOTlkZGQ1ZC01MzMyLTQ1NzUtOTM5Yi02NWZiY2Y2NTkzMjEiLCAiaG9zdCI6ICJnY3AtZXVyb3BlLXdlc3QyIn0.IEMbZpoaXtC2MgWuzfHlkyyKvzXc_TA544122UwIjQk';

// Typed event properties matching Tinybird schema columns
export type TbEventData = {
    // Rating events
    source?: string;
    value?: number | null;
    // Onboarding events
    step?: number;
    completedStep?: number;
    skippedAtStep?: number;
    // Install event
    showOnboarding?: boolean;
    // Download events
    isMultiPage?: boolean;
    maxDepth?: number;
    url?: string;
    tier?: string;
    paid?: string;
};

export async function getOrCreateUserId(): Promise<string> {
    const result = await chrome.storage.sync.get('user_id');
    if (result.user_id) {
        return result.user_id;
    }
    const userId = crypto.randomUUID();
    await chrome.storage.sync.set({ user_id: userId });
    return userId;
}

async function detectBrowser(): Promise<string> {
    // Check for Brave first (has special API)
    if ((navigator as any).brave?.isBrave) {
        try {
            const isBrave = await (navigator as any).brave.isBrave();
            if (isBrave) return 'Brave';
        } catch {
            // Fall through to other detection
        }
    }

    // Use modern userAgentData if available
    const uaData = (navigator as any).userAgentData;
    if (uaData?.brands) {
        const brands = uaData.brands.map((b: { brand: string }) => b.brand);
        if (brands.includes('Microsoft Edge')) return 'Edge';
        if (brands.includes('Opera')) return 'Opera';
        if (brands.includes('Google Chrome')) return 'Chrome';
        if (brands.includes('Chromium')) return 'Chromium';
    }

    // Fallback to userAgent parsing
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Chrome/')) return 'Chrome';

    return 'Unknown';
}

async function collectMetadata(): Promise<Record<string, string | boolean>> {
    const browser = await detectBrowser();
    const uaData = (navigator as any).userAgentData;

    return {
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        extensionId: chrome.runtime.id,
        version: chrome.runtime.getManifest().version,
        platform: uaData?.platform || navigator.platform,
        browser,
        userAgent: navigator.userAgent,
        isProduction: !isDevelopmentMode(),
    };
}

export async function tbEvent(
    eventName: string,
    additionalData: TbEventData = {}
): Promise<void> {
    // Skip analytics in CI builds
    if (import.meta.env.VITE_CI) return;

    try {
        const userId = await getOrCreateUserId();
        const metadata = await collectMetadata();

        const payload = {
            event_name: eventName,
            userId,
            timestamp: metadata.timestamp,
            timezone: metadata.timezone,
            language: metadata.language,
            extensionId: metadata.extensionId,
            version: metadata.version,
            platform: metadata.platform,
            browser: metadata.browser,
            userAgent: metadata.userAgent,
            isProduction: metadata.isProduction ? 1 : 0,
            // Spread additional data as top-level properties for direct column mapping
            ...additionalData,
        };

        const isLocal = isDevelopmentMode();
        const endpoint = isLocal ? TINYBIRD_LOCAL_ENDPOINT : TINYBIRD_CLOUD_ENDPOINT;
        const token = isLocal ? TINYBIRD_LOCAL_TOKEN : TINYBIRD_CLOUD_TOKEN;

        await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        // Silently fail - don't disrupt user experience for analytics
        console.error('Failed to send event to Tinybird:', error);
    }
}
