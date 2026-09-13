/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.
export function isDevelopmentMode(): boolean {
    return import.meta.env.MODE === 'development';
}

export function getVersion(): string {
    if (chrome) {
        if (chrome.runtime) {
            return chrome.runtime.getManifest().version;
        } else {
            return "NO_VER_RUNTIME";
        }
    } else {
        return "NO_VER_CHROME";
    }
}
