import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient.ts";

/**
 * usePersistentState — Unified cloud-first persistence hook for LifeOS1
 * 
 * Features:
 * - Reads from Supabase user_data table on mount (cloud wins)
 * - Writes to localStorage immediately + syncs to Supabase in background
 * - Data survives cache clears, browser switches, and device changes
 * - Cross-tab synchronization via storage events
 * - Firebase auth email detection for multi-user support
 * - Debounced cloud writes (500ms) to batch rapid updates
 * - Force sync capability for critical updates
 * - Supports both tuple destructuring [value, setValue, meta] and object destructuring {value, setValue, ...}
 */

// Get the logged-in user's email from Firebase auth state
function getUserEmail(): string | null {
  try {
    // Check window cache first (fastest)
    if ((window as any).__lifeosUserEmail) return (window as any).__lifeosUserEmail;

    // Check localStorage cache
    const cached = localStorage.getItem("lifeos_user_email");
    if (cached) return cached;

    // Try to get from Firebase directly (if available)
    if ((window as any).auth?.currentUser?.email) {
      return (window as any).auth.currentUser.email;
    }

    // Try to get from Firebase Auth context (global)
    if ((window as any).__firebaseAuthContext?.user?.email) {
      return (window as any).__firebaseAuthContext.user.email;
    }
  } catch (error) {
    console.warn("[usePersistentState] getUserEmail failed:", error);
  }
  return null;
}

// Supabase cloud read
async function cloudRead(userEmail: string, dataKey: string): Promise<unknown> {
  if (!userEmail || !dataKey) return undefined;

  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data_value")
      .eq("user_email", userEmail)
      .eq("data_key", dataKey)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") {
        console.warn('[usePersistentState] Supabase table "user_data" not found. Run migrations first.');
      } else {
        console.warn("[usePersistentState] Cloud read error:", error.message);
      }
      return undefined;
    }

    return data?.data_value;
  } catch (error) {
    console.warn("[usePersistentState] cloudRead failed:", error);
    return undefined;
  }
}

// Supabase cloud write
async function cloudWrite(userEmail: string, dataKey: string, value: unknown): Promise<boolean> {
  if (!userEmail || !dataKey) return false;

  try {
    const { error } = await supabase.from("user_data").upsert(
      {
        user_email: userEmail,
        data_key: dataKey,
        data_value: value,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_email,data_key",
      }
    );

    if (error) {
      console.warn("[usePersistentState] Cloud write error:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[usePersistentState] cloudWrite failed:", error);
    return false;
  }
}

export interface PersistentStateMeta {
  loaded: boolean;
  isSyncing: boolean;
  forceSync: () => Promise<boolean>;
}

/**
 * usePersistentState(key, defaultValue)
 * 
 * Drop-in replacement for useState that persists to Supabase + localStorage.
 * Supports both destructuring patterns:
 *   const [value, setValue, meta] = usePersistentState(key, default)
 *   const { value, setValue, loaded, isSyncing, forceSync } = usePersistentState(key, default)
 * 
 * @param key - Unique storage key (e.g. "lifeos_api_keys")
 * @param defaultValue - Default value if nothing saved
 * @returns [value, setValue, meta] tuple with additional named properties
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [
  T,
  (newValOrFn: T | ((prev: T) => T)) => void,
  PersistentStateMeta
] & {
  value: T;
  setValue: (newValOrFn: T | ((prev: T) => T)) => void;
  loaded: boolean;
  isSyncing: boolean;
  forceSync: () => Promise<boolean>;
} {
  // Start with localStorage for instant render (no flicker)
  const [value, setValueRaw] = useState<T>(() => {
    try {
      const local = localStorage.getItem(key);
      if (local !== null) {
        return JSON.parse(local);
      }
    } catch (error) {
      console.warn(`[usePersistentState] Failed to parse localStorage key "${key}":`, error);
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`[usePersistentState] Failed to remove corrupted localStorage key "${key}":`, removeError);
      }
    }
    return defaultValue;
  });

  const [loaded, setLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWrittenValue = useRef<T>(value);
  const pendingWrites = useRef<Map<string, number>>(new Map());
  const isMounted = useRef(true);
  const lastReadValue = useRef<T>(value);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (writeTimer.current) {
        clearTimeout(writeTimer.current);
        writeTimer.current = null;
      }

      // Write final value on unmount (important for last changes)
      const email = userEmail || getUserEmail();
      if (email && lastWrittenValue.current !== undefined) {
        cloudWrite(email, key, lastWrittenValue.current).catch((error) => {
          console.warn("[usePersistentState] Final write on unmount failed:", error);
        });
      }

      pendingWrites.current.clear();
    };
  }, [key, userEmail]);

  // Track user email changes (for multi-user scenarios)
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let isSubscribed = true;

    const updateUserEmail = () => {
      if (!isSubscribed) return;

      try {
        const email = getUserEmail();
        if (email !== userEmail) {
          setUserEmail(email);
          // Reset loaded state when user changes
          if (email !== userEmail) {
            setLoaded(false);
          }
        }
      } catch (error) {
        console.warn("[usePersistentState] Failed to update user email:", error);
      }
    };

    updateUserEmail();

    // Poll for email changes (reduced frequency for performance)
    intervalId = setInterval(updateUserEmail, 3000);

    return () => {
      isSubscribed = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, [userEmail]);

  // On mount and when userEmail changes: pull from cloud
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!userEmail) {
        if (isMounted.current && !cancelled) {
          setLoaded(true);
        }
        return;
      }

      try {
        const cloudVal = await cloudRead(userEmail, key);
        if (cancelled || !isMounted.current) return;

        if (cloudVal !== undefined && cloudVal !== null) {
          // Cloud has data — use it and sync to localStorage
          const cloudStr = JSON.stringify(cloudVal);
          const localStr = JSON.stringify(value);

          // Only update if cloud data is different
          if (cloudStr !== localStr) {
            setValueRaw(cloudVal as T);
            lastWrittenValue.current = cloudVal as T;
            lastReadValue.current = cloudVal as T;
            try {
              localStorage.setItem(key, cloudStr);
            } catch (storageError) {
              console.warn("[usePersistentState] Failed to write to localStorage:", storageError);
            }
          }
        }
      } catch (error) {
        console.warn("[usePersistentState] Cloud read crashed, falling back to local:", error);
      } finally {
        if (!cancelled && isMounted.current) {
          setLoaded(true);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [key, userEmail, value]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === key &&
        event.newValue !== null &&
        event.storageArea === localStorage
      ) {
        try {
          const newValue = JSON.parse(event.newValue);
          const currentStr = JSON.stringify(value);
          const newStr = JSON.stringify(newValue);

          // Only update if different to avoid loops
          if (newStr !== currentStr) {
            setValueRaw(newValue);
            lastWrittenValue.current = newValue;
            lastReadValue.current = newValue;
          }
        } catch (error) {
          console.warn("[usePersistentState] Failed to parse cross-tab update:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, value]);

  // setValue: write local immediately, debounce cloud write
  const setValue = useCallback(
    (newValOrFn: T | ((prev: T) => T)) => {
      setValueRaw((prev) => {
        const next = typeof newValOrFn === "function" ? (newValOrFn as (prev: T) => T)(prev) : newValOrFn;
        const nextStr = JSON.stringify(next);
        const prevStr = JSON.stringify(prev);

        // Skip if unchanged
        if (nextStr === prevStr) return prev;

        // Instant localStorage write
        try {
          localStorage.setItem(key, nextStr);
        } catch (storageError) {
          console.warn("[usePersistentState] Failed to write to localStorage:", storageError);
        }

        lastWrittenValue.current = next;
        lastReadValue.current = next;

        // Debounced cloud write (500ms to batch rapid updates)
        if (writeTimer.current) {
          clearTimeout(writeTimer.current);
          writeTimer.current = null;
        }

        // Track pending write
        const writeId = Date.now();
        pendingWrites.current.set(key, writeId);

        writeTimer.current = setTimeout(async () => {
          // Only write if this is still the most recent pending write
          if (pendingWrites.current.get(key) !== writeId) {
            pendingWrites.current.delete(key);
            return;
          }
          pendingWrites.current.delete(key);

          const email = userEmail || getUserEmail();
          if (email && isMounted.current) {
            setIsSyncing(true);
            try {
              await cloudWrite(email, key, next);
            } catch (error) {
              console.warn("[usePersistentState] Cloud write failed:", error);
            } finally {
              if (isMounted.current) {
                setIsSyncing(false);
              }
            }
          }
          writeTimer.current = null;
        }, 500);

        return next;
      });
    },
    [key, userEmail]
  );

  // Force sync to cloud (exposed via return object)
  const forceSync = useCallback(async (): Promise<boolean> => {
    const email = userEmail || getUserEmail();
    if (!email || !isMounted.current) return false;

    try {
      setIsSyncing(true);
      const currentValue = lastWrittenValue.current;
      const success = await cloudWrite(email, key, currentValue);
      return success;
    } catch (error) {
      console.warn("[usePersistentState] Force sync failed:", error);
      return false;
    } finally {
      if (isMounted.current) {
        setIsSyncing(false);
      }
    }
  }, [key, userEmail]);

  const meta: PersistentStateMeta = { loaded, isSyncing, forceSync };

  // Return tuple with named properties for both destructuring patterns
  const result: [
    T,
    (newValOrFn: T | ((prev: T) => T)) => void,
    PersistentStateMeta
  ] & {
    value: T;
    setValue: (newValOrFn: T | ((prev: T) => T)) => void;
    loaded: boolean;
    isSyncing: boolean;
    forceSync: () => Promise<boolean>;
  } = [value, setValue, meta] as any;

  result.value = value;
  result.setValue = setValue;
  result.loaded = loaded;
  result.isSyncing = isSyncing;
  result.forceSync = forceSync;

  return result;
}

/**
 * persistUserEmail — Call this from FirebaseAuthContext when user logs in.
 * Caches email so usePersistentState can find it without prop drilling.
 */
export function persistUserEmail(email: string | null): void {
  try {
    if (email) {
      (window as any).__lifeosUserEmail = email;
      localStorage.setItem("lifeos_user_email", email);
    } else {
      // Clear on logout
      delete (window as any).__lifeosUserEmail;
      localStorage.removeItem("lifeos_user_email");
    }
  } catch (error) {
    console.warn("[usePersistentState] Failed to cache user email:", error);
  }
}

/**
 * clearAllUserData - Call this when user deletes their account
 */
export async function clearAllUserData(userEmail: string): Promise<void> {
  if (!userEmail) {
    console.warn("[usePersistentState] clearAllUserData called without email");
    return;
  }

  // Clear cloud data
  try {
    const { error } = await supabase
      .from("user_data")
      .delete()
      .eq("user_email", userEmail);

    if (error) {
      console.warn("[usePersistentState] Failed to clear cloud user data:", error);
    }
  } catch (error) {
    console.warn("[usePersistentState] Failed to clear cloud user data:", error);
  }

  // Clear local data for this user (only keys starting with lifeos_)
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("lifeos_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`[usePersistentState] Failed to remove localStorage key "${key}":`, removeError);
      }
    });
  } catch (error) {
    console.warn("[usePersistentState] Failed to clear local data:", error);
  }

  // Also clear the email cache
  persistUserEmail(null);
}

export default usePersistentState;