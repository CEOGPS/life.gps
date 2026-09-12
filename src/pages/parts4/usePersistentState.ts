import { useEffect, useRef, useState } from "react";
import { getItem, setItem } from "./storage.ts";

/**
 * Drop-in replacement for useState that persists to Supabase.
 * Usage: const [tasks, setTasks] = usePersistentState<Task[]>("tasks", []);
 * Loads once on mount, debounce-saves on every change (400ms).
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    getItem<T>(key).then((stored) => {
      if (cancelled) return;
      if (stored !== null) setValue(stored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setItem(key, value);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, key, loaded]);

  return [value, setValue, loaded] as const;
}
