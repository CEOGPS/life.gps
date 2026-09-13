/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.

import { describe, it, expect } from 'vitest';
import { isValidUrl } from './UrlUtils';

describe('isValidUrl', () => {
    it('returns true for valid URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('https://example.com/path')).toBe(true);
        expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
        expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('returns false for URLs with encoded pipe in domain', () => {
        // This is the specific bug case - pipe character encoded in domain
        expect(isValidUrl('https://nationalanthems.info%7Canthem')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
        expect(isValidUrl('not-a-url')).toBe(false);
        expect(isValidUrl('')).toBe(false);
        expect(isValidUrl('javascript:void(0)')).toBe(true); // javascript: URLs are valid URL objects
        expect(isValidUrl('mailto:test@example.com')).toBe(true); // mailto: URLs are valid
    });
});
