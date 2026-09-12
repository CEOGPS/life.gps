import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/SupabaseAuthContext";
import { motion } from "framer-motion";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth, isLoadingAuth } = useAuth();
  const next = searchParams.get("next") || "/";

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase handles the OAuth callback automatically via onAuthStateChange
      // Just wait for auth to be checked then redirect
      await checkUserAuth();
      navigate(next, { replace: true });
    };
    handleCallback();
  }, [checkUserAuth, navigate, next]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-svh w-full items-center justify-center"
    >
      <div className="text-center">
        <div className="inline-flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </motion.div>
  );
}