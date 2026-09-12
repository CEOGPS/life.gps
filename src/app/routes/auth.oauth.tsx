import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// Client-side OAuth callback. supabaseClient.ts already has detectSessionInUrl
// + flowType: "pkce", so the Supabase SDK auto-exchanges the ?code= param for a
// session on load — this page just waits for that and then redirects.
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const [message, setMessage] = useState("");

  const _next = searchParams.get("next");
  const next = _next?.startsWith("/") ? _next : "/protected";
  const errorParam = searchParams.get("error") || searchParams.get("error_description");

  useEffect(() => {
    if (errorParam) {
      setStatus("error");
      setMessage(errorParam);
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data?.session) {
        setStatus("error");
        setMessage(error?.message || "No session returned from provider.");
        return;
      }
      setStatus("ok");
    });
    return () => {
      cancelled = true;
    };
  }, [errorParam]);

  if (status === "ok") {
    return <Navigate to={next} replace />;
  }

  if (status === "error") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-destructive-500 mb-2">Sign-in failed</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Completing sign-in...</p>
    </div>
  );
}