// /lib/SupabaseAuthContext.tsx
// Supabase Auth Context - replaces FirebaseAuthContext
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient.ts";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { persistUserEmail } from "./usePersistentState.ts";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role?: "user" | "admin" | "owner";
  createdAt?: number;
  lastLoginAt?: number;
}

export interface AuthError {
  type: "user_not_registered" | "network" | "supabase" | "unauthorized" | "unknown";
  message: string;
  code?: string;
  originalError?: any;
}

interface AuthContextType {
  // State
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  authChecked: boolean;
  authError: AuthError | null;

  // Methods
  checkUserAuth: () => Promise<void>;
  signInWithGoogle: (useRedirect?: boolean) => Promise<void>;
  signInWithSpecificEmail: (email: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateUserProfile: (data: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
  setAuthTokens: (tokens: any) => void;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  onUserNotRegistered?: (user: SupabaseUser) => void;
  registrationCheck?: (user: SupabaseUser) => Promise<boolean>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper function to convert Supabase user to our User type
const convertSupabaseUser = (
  supabaseUser: SupabaseUser | null,
): User | null => {
  if (!supabaseUser) return null;

  return {
    uid: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
    photoURL: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
    emailVerified: supabaseUser.email_confirmed_at !== null,
    role: "user", // Default role, can be fetched from backend
    createdAt: supabaseUser.created_at
      ? new Date(supabaseUser.created_at).getTime()
      : undefined,
    lastLoginAt: supabaseUser.last_sign_in_at
      ? new Date(supabaseUser.last_sign_in_at).getTime()
      : undefined,
  };
};

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onUserNotRegistered,
  registrationCheck,
}) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [authTokens, setAuthTokensState] = useState<any>(null);

  // Helper to set auth error
  const setError = (
    type: AuthError["type"],
    message: string,
    code?: string,
    error?: any,
  ) => {
    const authErrorObj: AuthError = {
      type,
      message,
      code,
      originalError: error,
    };
    setAuthError(authErrorObj);
    console.error(`Auth Error [${type}]:`, message, error);
  };

  // Clear error
  const clearError = () => setAuthError(null);

  // Check if user is registered in your backend/database
  const isUserRegistered = useCallback(
    async (supabaseUserObj: SupabaseUser): Promise<boolean> => {
      // If custom registration check is provided, use it
      if (registrationCheck) {
        return await registrationCheck(supabaseUserObj);
      }

      // Default implementation - check your backend API
      try {
        const response = await fetch("/api/user/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: supabaseUserObj.id,
            email: supabaseUserObj.email,
          }),
        });

        if (!response.ok) {
          // User not found in your database
          if (response.status === 404) {
            return false;
          }
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        return data.isRegistered === true;
      } catch (error) {
        console.error("Failed to check user registration:", error);
        // If we can't check, assume not registered for security
        return false;
      }
    },
    [registrationCheck],
  );

  // Register user in your backend
  const registerUser = useCallback(
    async (supabaseUserObj: SupabaseUser): Promise<boolean> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const idToken = session?.access_token;
        
        const response = await fetch("/api/user/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: supabaseUserObj.id,
            email: supabaseUserObj.email,
            displayName: supabaseUserObj.user_metadata?.full_name || supabaseUserObj.user_metadata?.name,
            photoURL: supabaseUserObj.user_metadata?.avatar_url || supabaseUserObj.user_metadata?.picture,
          }),
        });

        if (!response.ok) {
          throw new Error(`Registration failed: ${response.status}`);
        }

        return true;
      } catch (error) {
        console.error("Failed to register user:", error);
        return false;
      }
    },
    [],
  );

  // Set auth tokens (for OAuth flows)
  const setAuthTokens = useCallback((tokens: any) => {
    setAuthTokensState(tokens);
    // Store in memory only, not localStorage for security
    // If you need persistence, use encrypted storage or httpOnly cookies
  }, []);

  // Get auth token for API calls
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
    if (authTokens?.access_token) {
      return authTokens.access_token;
    }
    return null;
  }, [authTokens]);

  // Check user authentication status
  const checkUserAuth = useCallback(async () => {
    if (!supabase) {
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }
    // Prevent multiple simultaneous checks
    if (isLoadingAuth && authChecked) return;

    setIsLoadingAuth(true);
    clearError();

    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!currentSession || !currentSession.user) {
        setUser(null);
        setSupabaseUser(null);
        setSession(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        return;
      }

      setSession(currentSession);
      setSupabaseUser(currentSession.user);

      // Check if user is registered in your backend
      const isRegistered = await isUserRegistered(currentSession.user);

      if (!isRegistered) {
        // Try to auto-register if possible
        const registered = await registerUser(currentSession.user);

        if (!registered) {
          setError(
            "user_not_registered",
            "User authenticated but not registered in application database",
            "user_not_registered",
          );
          // Call optional callback
          if (onUserNotRegistered) {
            onUserNotRegistered(currentSession.user);
          }
          setUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);
          return;
        }
      }

      // Convert Supabase user to our User type
      const convertedUser = convertSupabaseUser(currentSession.user);
      setUser(convertedUser);
      setIsAuthenticated(true);
      setAuthChecked(true);
      persistUserEmail(currentSession.user.email || "");
    } catch (error: any) {
      console.error("Auth check failed:", error);
      setError("supabase", error.message || "Authentication check failed", error.code);
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [isUserRegistered, registerUser, onUserNotRegistered]);

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }

    // Initial check
    checkUserAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[SupabaseAuth] Auth state change:", event, newSession?.user?.email);

        if (event === "SIGNED_IN" && newSession) {
          setSession(newSession);
          setSupabaseUser(newSession.user);
          
          // Check if user is registered
          const isRegistered = await isUserRegistered(newSession.user);
          
          if (!isRegistered) {
            const registered = await registerUser(newSession.user);
            
            if (!registered) {
              setError(
                "user_not_registered",
                "User authenticated but not registered in application database",
                "user_not_registered",
              );
              if (onUserNotRegistered) {
                onUserNotRegistered(newSession.user);
              }
              setUser(null);
              setIsAuthenticated(false);
              setAuthChecked(true);
              setIsLoadingAuth(false);
              return;
            }
          }
          
          const convertedUser = convertSupabaseUser(newSession.user);
          setUser(convertedUser);
          setIsAuthenticated(true);
          persistUserEmail(newSession.user.email || "");
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setSupabaseUser(null);
          setSession(null);
          setIsAuthenticated(false);
        } else if (event === "TOKEN_REFRESHED" && newSession) {
          setSession(newSession);
          setSupabaseUser(newSession.user);
        }

        setAuthChecked(true);
        setIsLoadingAuth(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUserAuth, isUserRegistered, registerUser, onUserNotRegistered]);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(
    async (useRedirect = false) => {
      if (!supabase) {
        setError("supabase", "Supabase client not initialized");
        return;
      }

      clearError();
      setIsLoadingAuth(true);

      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: useRedirect
              ? `${window.location.origin}/auth/callback`
              : undefined,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
            scopes: "email profile openid https://mail.google.com/ https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar",
          },
        });

        if (error) throw error;

        if (!useRedirect && data?.url) {
          window.location.href = data.url;
        }
      } catch (error: any) {
        console.error("Google sign in failed:", error);
        setError("supabase", error.message || "Google sign in failed", error.code);
        setIsLoadingAuth(false);
      }
    },
    [],
  );

  // Sign in with specific email (magic link)
  const signInWithSpecificEmail = useCallback(
    async (email: string) => {
      if (!supabase) {
        setError("supabase", "Supabase client not initialized");
        return;
      }

      clearError();
      setIsLoadingAuth(true);

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;
      } catch (error: any) {
        console.error("Email sign in failed:", error);
        setError("supabase", error.message || "Email sign in failed", error.code);
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [],
  );

  // Sign in with email and password
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        setError("supabase", "Supabase client not initialized");
        return;
      }

      clearError();
      setIsLoadingAuth(true);

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } catch (error: any) {
        console.error("Email sign in failed:", error);
        let message = "Sign in failed";
        switch (error.code) {
          case "auth/user-not-found":
            message = "No account found with this email";
            break;
          case "auth/wrong-password":
            message = "Incorrect password";
            break;
          case "auth/too-many-requests":
            message = "Too many failed attempts. Try again later.";
            break;
          default:
            message = error.message || "Sign in failed";
        }
        setError("supabase", message, error.code, error);
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [],
  );

  // Sign up with email and password
  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!supabase) {
        setError("supabase", "Supabase client not initialized");
        return;
      }

      clearError();
      setIsLoadingAuth(true);

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: displayName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;
      } catch (error: any) {
        console.error("Sign up failed:", error);
        setError("supabase", error.message || "Sign up failed", error.code, error);
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [],
  );

  // Logout
  const logout = useCallback(async () => {
    if (!supabase) return;

    clearError();
    setIsLoadingAuth(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error("Logout failed:", error);
      setError("supabase", error.message || "Logout failed", error.code);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      setError("supabase", "Supabase client not initialized");
      return;
    }

    clearError();
    setIsLoadingAuth(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Password reset failed:", error);
      setError("supabase", error.message || "Password reset failed", error.code);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Send verification email
  const sendVerificationEmail = useCallback(async () => {
    if (!supabase) {
      setError("supabase", "Supabase client not initialized");
      return;
    }

    clearError();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("unauthorized", "No user signed in");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: session.user.email || "",
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Verification email failed:", error);
      setError("supabase", error.message || "Failed to send verification email", error.code);
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      if (!supabase) {
        setError("supabase", "Supabase client not initialized");
        return;
      }

      clearError();
      setIsLoadingAuth(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setError("unauthorized", "No user signed in");
          return;
        }

        const updates: Record<string, any> = {};
        if (data.displayName) updates.full_name = data.displayName;
        if (data.photoURL) updates.avatar_url = data.photoURL;

        const { error } = await supabase.auth.updateUser({
          data: updates,
        });

        if (error) throw error;

        // Refresh session to get updated user
        await checkUserAuth();
      } catch (error: any) {
        console.error("Profile update failed:", error);
        setError("supabase", error.message || "Profile update failed", error.code);
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [checkUserAuth],
  );

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    isAuthenticated,
    isLoadingAuth,
    authChecked,
    authError,
    checkUserAuth,
    signInWithGoogle,
    signInWithSpecificEmail,
    signInWithEmail,
    signUpWithEmail,
    logout,
    resetPassword,
    sendVerificationEmail,
    updateUserProfile,
    setAuthTokens,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};