import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient.ts";

/**
 * Get the current user's email from multiple sources:
 * 1. Supabase Auth session (if using Supabase Auth)
 * 2. Firebase Auth currentUser (if using Firebase Auth)
 * 3. localStorage cache (set by persistUserEmail)
 * 4. window.__lifeosUserEmail cache
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  // 1. Try Supabase Auth session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) return session.user.email;
  } catch {}

  // 2. Try Firebase Auth (if available)
  try {
    if (typeof window !== "undefined" && (window as any).auth?.currentUser?.email) {
      return (window as any).auth.currentUser.email;
    }
  } catch {}

  // 3. Try window cache
  try {
    if (typeof window !== "undefined" && (window as any).__lifeosUserEmail) {
      return (window as any).__lifeosUserEmail;
    }
  } catch {}

  // 4. Try localStorage
  try {
    const cached = localStorage.getItem("lifeos_user_email");
    if (cached) return cached;
  } catch {}

  return null;
}

/**
 * Hook to get current user email reactively
 * Updates when auth state changes
 */
export function useUserEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEmail = async () => {
      const e = await getCurrentUserEmail();
      if (!cancelled) setEmail(e);
    };

    loadEmail();

    // Listen for Supabase auth changes
    let supabaseUnsub: (() => void) | null = null;
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user?.email) setEmail(session.user.email);
        else {
          // Fallback to Firebase/localStorage
          const e = await getCurrentUserEmail();
          if (!cancelled) setEmail(e);
        }
      });
      supabaseUnsub = () => subscription.unsubscribe();
    } catch {}

    // Listen for Firebase auth changes (if available)
    let firebaseUnsub: (() => void) | null = null;
    try {
      if (typeof window !== "undefined" && (window as any).auth) {
        firebaseUnsub = (window as any).auth.onAuthStateChanged(async (user: any) => {
          if (user?.email) setEmail(user.email);
          else {
            const e = await getCurrentUserEmail();
            if (!cancelled) setEmail(e);
          }
        });
      }
    } catch {}

    // Listen for localStorage changes (cross-tab)
    const handleStorage = async (e: StorageEvent) => {
      if (e.key === "lifeos_user_email" && e.newValue) {
        setEmail(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      cancelled = true;
      supabaseUnsub?.();
      firebaseUnsub?.();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return email;
}