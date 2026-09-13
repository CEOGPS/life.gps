/// Copyright (c) 2025 Alexej Plate
/// All rights reserved.
///
/// This repository and its contents are the exclusive property of Alexej Plate.
/// Unauthorized reproduction, modification, or distribution is strictly prohibited.

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for the cancelFetch fix.
 *
 * The bug was: When cancelFetch was called, it aborted and DELETED the AbortController.
 * If a new fetchUrl request arrived after the controller was deleted,
 * getOrCreateAbortController would create a NEW (non-aborted) controller.
 * This caused new requests to proceed instead of being cancelled.
 *
 * The fix: Don't delete the controller after aborting. Keep it so subsequent
 * requests will see the aborted signal.
 */

// Simulating the FIXED background.ts logic
const fetchAbortControllers = new Map<string, AbortController>();

function getOrCreateAbortController(taskId: string): AbortController {
    if (!fetchAbortControllers.has(taskId)) {
        fetchAbortControllers.set(taskId, new AbortController());
    }
    return fetchAbortControllers.get(taskId)!;
}

function cancelFetch(taskId: string): void {
    const controller = fetchAbortControllers.get(taskId);
    if (controller) {
        controller.abort();
        // FIX: Don't delete the controller - keep it so subsequent requests see the aborted signal
    }
}

describe('cancelFetch behavior', () => {
    beforeEach(() => {
        fetchAbortControllers.clear();
    });

    it('should abort in-flight requests when cancel is called', () => {
        const taskId = 'task-123';

        // Simulate a fetch request getting an abort controller
        const controller1 = getOrCreateAbortController(taskId);
        expect(controller1.signal.aborted).toBe(false);

        // Cancel the task
        cancelFetch(taskId);

        // The controller should be aborted
        expect(controller1.signal.aborted).toBe(true);
    });

    it('new requests after cancel should get the same aborted controller', () => {
        const taskId = 'task-123';

        // First request gets a controller
        const controller1 = getOrCreateAbortController(taskId);

        // Cancel is called
        cancelFetch(taskId);
        expect(controller1.signal.aborted).toBe(true);

        // A new request arrives AFTER cancel
        // This simulates a queued fetchUrl message that arrives after cancelFetch
        const controller2 = getOrCreateAbortController(taskId);

        // FIXED: The controller should be the SAME (aborted) one
        expect(controller2).toBe(controller1); // Same controller
        expect(controller2.signal.aborted).toBe(true); // Still aborted
    });

    it('new requests after cancel should still be aborted', () => {
        const taskId = 'task-123';

        // First request gets a controller
        const controller1 = getOrCreateAbortController(taskId);

        // Cancel is called
        cancelFetch(taskId);
        expect(controller1.signal.aborted).toBe(true);

        // A new request arrives AFTER cancel (race condition scenario)
        const controller2 = getOrCreateAbortController(taskId);

        // The new controller should be aborted (same controller, already aborted)
        expect(controller2.signal.aborted).toBe(true);
    });
});
