/**
 * Performance statistics tracking for multi-page downloads.
 * Accumulates timing, count, and size metrics across all download operations.
 */

export type OperationType =
    | 'imageTag'        // <img> elements
    | 'imageLink'       // <link> elements (favicon, fonts, preloads)
    | 'imageSrcset'     // <source> srcset in <picture> elements
    | 'cssDownload'
    | 'scriptDownload'
    | 'cssUrlProcessing'
    | 'htmlParsing'
    | 'domCleanup'
    | 'linkDiscovery'
    | 'linkInlining'
    | 'opfsWrite'
    | 'zipCreation';

export interface OperationStats {
    timeMs: number;
    count: number;
    bytes: number;
    // Detailed timing breakdown (for network operations)
    networkMs: number;
    encodeMs: number;
}

// Image operation types for aggregation
const IMAGE_TYPES: OperationType[] = ['imageTag', 'imageLink', 'imageSrcset'];

export class PerformanceStats {
    private stats: Map<OperationType, OperationStats> = new Map();
    private startTime: number = 0;
    private pageCount: number = 0;

    start(): void {
        this.startTime = performance.now();
    }

    recordOperation(
        type: OperationType,
        timeMs: number,
        bytes: number = 0,
        timing?: { networkMs: number; encodeMs: number }
    ): void {
        const current = this.stats.get(type) || { timeMs: 0, count: 0, bytes: 0, networkMs: 0, encodeMs: 0 };
        current.timeMs += timeMs;
        current.count += 1;
        current.bytes += bytes;
        if (timing) {
            current.networkMs += timing.networkMs;
            current.encodeMs += timing.encodeMs;
        }
        this.stats.set(type, current);
    }

    incrementPageCount(): void {
        this.pageCount++;
    }

    getFormattedStats(): string {
        const totalTime = performance.now() - this.startTime;
        const totalBytes = Array.from(this.stats.values())
            .reduce((sum, s) => sum + s.bytes, 0);

        const lines: string[] = [];
        lines.push('');
        lines.push('=== Download Performance Statistics ===');
        lines.push(`Total Time: ${totalTime.toFixed(0)}ms | Pages: ${this.pageCount} | Total Size: ${this.formatBytes(totalBytes)}`);
        lines.push('');
        lines.push('Operation         | Time (ms) |    % | Count |    Size');
        lines.push('------------------|-----------|------|-------|--------');

        // Aggregate image stats
        const imageStats = this.getAggregatedImageStats();

        // Build list with aggregated images + other operations
        const aggregatedEntries: Array<[string, OperationStats]> = [];

        if (imageStats.count > 0) {
            aggregatedEntries.push(['Images (total)', imageStats]);
        }

        // Add non-image operations
        for (const [type, stats] of this.stats.entries()) {
            if (!IMAGE_TYPES.includes(type)) {
                aggregatedEntries.push([this.formatName(type), stats]);
            }
        }

        // Sort by time descending
        aggregatedEntries.sort((a, b) => b[1].timeMs - a[1].timeMs);

        for (const [name, stats] of aggregatedEntries) {
            const pct = totalTime > 0 ? (stats.timeMs / totalTime * 100) : 0;
            const namePadded = name.padEnd(17);
            const time = stats.timeMs.toFixed(0).padStart(9);
            const pctStr = pct.toFixed(1).padStart(4);
            const count = stats.count.toString().padStart(5);
            const size = stats.bytes > 0 ? this.formatBytes(stats.bytes).padStart(8) : '       -';
            lines.push(`${namePadded} | ${time} | ${pctStr} | ${count} | ${size}`);
        }

        // Add detailed image breakdown if there are images
        if (imageStats.count > 0) {
            lines.push('');
            lines.push('--- Image Breakdown by Source ---');
            lines.push('Source            | Time (ms) |    % | Count |    Size');
            lines.push('------------------|-----------|------|-------|--------');

            const imageEntries: Array<[OperationType, OperationStats]> = [];
            for (const type of IMAGE_TYPES) {
                const stats = this.stats.get(type);
                if (stats && stats.count > 0) {
                    imageEntries.push([type, stats]);
                }
            }
            imageEntries.sort((a, b) => b[1].timeMs - a[1].timeMs);

            for (const [type, stats] of imageEntries) {
                const pct = imageStats.timeMs > 0 ? (stats.timeMs / imageStats.timeMs * 100) : 0;
                const name = this.formatImageSource(type).padEnd(17);
                const time = stats.timeMs.toFixed(0).padStart(9);
                const pctStr = pct.toFixed(1).padStart(4);
                const count = stats.count.toString().padStart(5);
                const size = stats.bytes > 0 ? this.formatBytes(stats.bytes).padStart(8) : '       -';
                lines.push(`${name} | ${time} | ${pctStr} | ${count} | ${size}`);
            }

            // Add timing breakdown (network vs encode)
            lines.push('');
            lines.push('--- Image Breakdown by Phase ---');
            this.appendPhaseBreakdown(lines, imageStats);
        }

        // CSS breakdown
        const cssStats = this.stats.get('cssDownload');
        if (cssStats && cssStats.count > 0) {
            lines.push('');
            lines.push('--- CSS Breakdown by Phase ---');
            this.appendPhaseBreakdown(lines, cssStats);
        }

        // Scripts breakdown
        const scriptStats = this.stats.get('scriptDownload');
        if (scriptStats && scriptStats.count > 0) {
            lines.push('');
            lines.push('--- Scripts Breakdown by Phase ---');
            this.appendPhaseBreakdown(lines, scriptStats);
        }

        lines.push('');
        return lines.join('\n');
    }

    private appendPhaseBreakdown(lines: string[], stats: OperationStats): void {
        lines.push('Phase             | Time (ms) |    % |');
        lines.push('------------------|-----------|------|');

        const networkPct = stats.timeMs > 0 ? (stats.networkMs / stats.timeMs * 100) : 0;
        const encodePct = stats.timeMs > 0 ? (stats.encodeMs / stats.timeMs * 100) : 0;
        const otherMs = stats.timeMs - stats.networkMs - stats.encodeMs;
        const otherPct = stats.timeMs > 0 ? (otherMs / stats.timeMs * 100) : 0;

        lines.push(`${'Network fetch'.padEnd(17)} | ${stats.networkMs.toFixed(0).padStart(9)} | ${networkPct.toFixed(1).padStart(4)} |`);
        if (stats.encodeMs > 0) {
            lines.push(`${'Base64 encode'.padEnd(17)} | ${stats.encodeMs.toFixed(0).padStart(9)} | ${encodePct.toFixed(1).padStart(4)} |`);
        }
        if (otherMs > 10) { // Only show if significant
            lines.push(`${'Other overhead'.padEnd(17)} | ${otherMs.toFixed(0).padStart(9)} | ${otherPct.toFixed(1).padStart(4)} |`);
        }
    }

    private getAggregatedImageStats(): OperationStats {
        const result: OperationStats = { timeMs: 0, count: 0, bytes: 0, networkMs: 0, encodeMs: 0 };
        for (const type of IMAGE_TYPES) {
            const stats = this.stats.get(type);
            if (stats) {
                result.timeMs += stats.timeMs;
                result.count += stats.count;
                result.bytes += stats.bytes;
                result.networkMs += stats.networkMs;
                result.encodeMs += stats.encodeMs;
            }
        }
        return result;
    }

    private formatName(type: OperationType): string {
        const names: Record<OperationType, string> = {
            imageTag: 'Images <img>',
            imageLink: 'Images <link>',
            imageSrcset: 'Images srcset',
            cssDownload: 'CSS',
            scriptDownload: 'Scripts',
            cssUrlProcessing: 'CSS URLs',
            htmlParsing: 'HTML Parsing',
            domCleanup: 'DOM Cleanup',
            linkDiscovery: 'Link Discovery',
            linkInlining: 'Link Inlining',
            opfsWrite: 'OPFS Write',
            zipCreation: 'Zip Creation',
        };
        return names[type];
    }

    private formatImageSource(type: OperationType): string {
        const names: Record<string, string> = {
            imageTag: '<img> tags',
            imageLink: '<link> tags',
            imageSrcset: '<source> srcset',
        };
        return names[type] || type;
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
