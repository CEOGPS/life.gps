import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { AuthProvider } from "@/lib/SupabaseAuthContext";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { MusicProvider } from "@/lib/MusicContext";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider>
        <TooltipProvider>
          <ThemeProvider>
            <MusicProvider>
              <Toaster />
              {children}
            </MusicProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
