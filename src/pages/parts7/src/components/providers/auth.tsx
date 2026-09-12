// Auth is handled directly via the Supabase client (see src/lib/supabase.ts
// and src/hooks/use-auth.ts). No wrapping provider is required, but this
// component is kept so DefaultProviders' shape doesn't change elsewhere.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
