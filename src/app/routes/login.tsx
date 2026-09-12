import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Client-side login page backed by the real SupabaseAuthContext (signInWithGoogle
// performs a redirect through Supabase OAuth, which returns to /auth/callback).
export default function Login() {
  const { signInWithGoogle, isAuthenticated, authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const next = searchParams.get("next") || "/protected";

  if (isAuthenticated) {
    navigate(next, { replace: true });
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signInWithGoogle(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome!</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {authError && (
                  <p className="text-sm text-destructive-500">
                    {authError.message}
                  </p>
                )}
                <Button
                  type="button"
                  className="w-full"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                >
                  {loading ? "Redirecting..." : "Continue with Google"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}