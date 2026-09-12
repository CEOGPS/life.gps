import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/SupabaseAuthContext";

// Client-side logout: signs out via SupabaseAuthContext, then returns home.
export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    logout().finally(() => navigate("/", { replace: true }));
  }, [logout, navigate]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Signing out...</p>
    </div>
  );
}