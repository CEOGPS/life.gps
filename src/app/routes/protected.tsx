import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/SupabaseAuthContext";
import { Button } from "@/components/ui/button";

// Client-side route guard using SupabaseAuthContext's live session state.
export default function ProtectedPage() {
  const { user, isAuthenticated, authChecked, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?next=/protected" replace />;
  }

  const email = user?.email ?? "user";

  return (
    <div className="flex items-center justify-center h-screen gap-2">
      <p>
        Hello <span className="text-primary font-semibold">{email}</span>
      </p>
      <Button onClick={() => navigate("/logout")}>Logout</Button>
    </div>
  );
}