/**
 * usePersistedState — Cloud-first persistence hook for LifeOS1
 *
 * Reads from Supabase on mount (cloud wins).
 * Writes to localStorage immediately + syncs to Supabase in background.
 * Data survives cache clears, browser switches, and device changes.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

// Get the logged-in user's email from Firebase auth state
function getUserEmail() {
  try {
    // Check window cache first (fastest)
    if (window.__lifeosUserEmail) return window.__lifeosUserEmail;

    // Check localStorage cache
    const cached = localStorage.getItem("lifeos_user_email");
    if (cached) return cached;

    // Try to get from Firebase directly (if available)
    if (window.auth?.currentUser?.email) {
      return window.auth.currentUser.email;
    }

    // Try to get from Firebase Auth context (global)
    if (window.__firebaseAuthContext?.user?.email) {
      return window.__firebaseAuthContext.user.email;
    }
  } catch (error) {
    console.warn("[usePersistedState] getUserEmail failed:", error);
  }
  return null;
}

// Supabase client helpers (using the official client)
async function cloudRead(userEmail, dataKey) {
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
        // Table doesn't exist
        console.warn(
          '[usePersistedState] Supabase table "user_data" not found. Run migrations first.',
        );
      } else {
        console.warn("[usePersistedState] Cloud read error:", error.message);
      }
      return undefined;
    }

    return data?.data_value;
  } catch (error) {
    console.warn("[usePersistedState] cloudRead failed:", error.message);
    return undefined;
  }
}

async function cloudWrite(userEmail, dataKey, value) {
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
      },
    );

    if (error) {
      console.warn("[usePersistedState] Cloud write error:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[usePersistedState] cloudWrite failed:", error.message);
    return false;
  }
}

/**
 * usePersistedState(key, defaultValue)
 *
 * Drop-in replacement for useState that persists to Supabase + localStorage.
 *
 * @param {string} key - Unique storage key (e.g. "lifeos_api_keys")
 * @param {*} defaultValue - Default value if nothing saved
 * @returns [value, setValue, { loaded, isSyncing }]
 */
export function usePersistedState(key, defaultValue) {
  // Start with localStorage for instant render (no flicker)
  const [value, setValueRaw] = useState(() => {
    try {
      const local = localStorage.getItem(key);
      if (local !== null) {
        return JSON.parse(local);
      }
    } catch (error) {
      console.warn(
        `[usePersistedState] Failed to parse localStorage key "${key}":`,
        error,
      );
      // Remove corrupted data
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.warn(
          `[usePersistedState] Failed to remove corrupted localStorage key "${key}":`,
          removeError,
        );
      }
    }
    return defaultValue;
  });

  const [loaded, setLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const writeTimer = useRef(null);
  const lastWrittenValue = useRef(value);
  const pendingWrites = useRef(new Map());
  const isMounted = useRef(true);
  const lastReadValue = useRef(value);

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
          console.warn(
            "[usePersistedState] Final write on unmount failed:",
            error,
          );
        });
      }

      pendingWrites.current.clear();
    };
  }, [key, userEmail]);

  // Track user email changes (for multi-user scenarios)
  useEffect(() => {
    let intervalId;
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
        console.warn("[usePersistedState] Failed to update user email:", error);
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

        if (cloudVal !== undefined) {
          // Cloud has data — use it and sync to localStorage
          const cloudStr = JSON.stringify(cloudVal);
          const localStr = JSON.stringify(value);

          // Only update if cloud data is different
          if (cloudStr !== localStr) {
            setValueRaw(cloudVal);
            lastWrittenValue.current = cloudVal;
            lastReadValue.current = cloudVal;
            try {
              localStorage.setItem(key, cloudStr);
            } catch (storageError) {
              console.warn(
                "[usePersistedState] Failed to write to localStorage:",
                storageError,
              );
            }
          }
        }
      } catch (error) {
        console.warn(
          "[usePersistedState] Cloud read failed, using local value:",
          error,
        );
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
    const handleStorageChange = (event) => {
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
          console.warn(
            "[usePersistedState] Failed to parse cross-tab update:",
            error,
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, value]);

  // setValue: write local immediately, debounce cloud write
  const setValue = useCallback(
    (newValOrFn) => {
      setValueRaw((prev) => {
        const next =
          typeof newValOrFn === "function" ? newValOrFn(prev) : newValOrFn;
        const nextStr = JSON.stringify(next);
        const prevStr = JSON.stringify(prev);

        // Skip if unchanged
        if (nextStr === prevStr) return prev;

        // Instant localStorage write
        try {
          localStorage.setItem(key, nextStr);
        } catch (storageError) {
          console.warn(
            "[usePersistedState] Failed to write to localStorage:",
            storageError,
          );
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
              console.warn("[usePersistedState] Cloud write failed:", error);
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
    [key, userEmail],
  );

  // Force sync to cloud (exposed via return object)
  const forceSync = useCallback(async () => {
    const email = userEmail || getUserEmail();
    if (!email || !isMounted.current) return false;

    try {
      setIsSyncing(true);
      const currentValue = lastWrittenValue.current;
      const success = await cloudWrite(email, key, currentValue);
      return success;
    } catch (error) {
      console.warn("[usePersistedState] Force sync failed:", error);
      return false;
    } finally {
      if (isMounted.current) {
        setIsSyncing(false);
      }
    }
  }, [key, userEmail]);

  return [value, setValue, { loaded, isSyncing, forceSync }];
}

/**
 * persistUserEmail — Call this from AuthorityContext when user logs in.
 * Caches email so usePersistedState can find it without prop drilling.
 */
export function persistUserEmail(email) {
  try {
    if (email) {
      window.__lifeosUserEmail = email;
      localStorage.setItem("lifeos_user_email", email);
    } else {
      // Clear on logout
      delete window.__lifeosUserEmail;
      localStorage.removeItem("lifeos_user_email");
    }
  } catch (error) {
    console.warn("[usePersistedState] Failed to cache user email:", error);
  }
}

/**
 * clearAllUserData - Call this when user deletes their account
 */
export async function clearAllUserData(userEmail) {
  if (!userEmail) {
    console.warn("[usePersistedState] clearAllUserData called without email");
    return;
  }

  // Clear cloud data
  try {
    const { error } = await supabase
      .from("user_data")
      .delete()
      .eq("user_email", userEmail);

    if (error) {
      console.warn(
        "[usePersistedState] Failed to clear cloud user data:",
        error,
      );
    }
  } catch (error) {
    console.warn("[usePersistedState] Failed to clear cloud user data:", error);
  }

  // Clear local data for this user (only keys starting with lifeos_)
  try {
    const keysToRemove = [];
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
        console.warn(
          `[usePersistedState] Failed to remove localStorage key "${key}":`,
          removeError,
        );
      }
    });
  } catch (error) {
    console.warn("[usePersistedState] Failed to clear local data:", error);
  }

  // Also clear the email cache
  persistUserEmail(null);
}

export default usePersistedState;
