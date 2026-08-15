// /lib/FirebaseAuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

// Types
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
  type:
    | "user_not_registered"
    | "network"
    | "firebase"
    | "unauthorized"
    | "unknown";
  message: string;
  code?: string;
  originalError?: any;
}

interface AuthContextType {
  // State
  user: User | null;
  firebaseUser: FirebaseUser | null;
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

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
  onUserNotRegistered?: (user: FirebaseUser) => void;
  registrationCheck?: (user: FirebaseUser) => Promise<boolean>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = (
  firebaseUser: FirebaseUser | null,
): User | null => {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    role: "user", // Default role, can be fetched from backend
    createdAt: firebaseUser.metadata.creationTime
      ? new Date(firebaseUser.metadata.creationTime).getTime()
      : undefined,
    lastLoginAt: firebaseUser.metadata.lastSignInTime
      ? new Date(firebaseUser.metadata.lastSignInTime).getTime()
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
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
    async (firebaseUserObj: FirebaseUser): Promise<boolean> => {
      // If custom registration check is provided, use it
      if (registrationCheck) {
        return await registrationCheck(firebaseUserObj);
      }

      // Default implementation - check your backend API
      try {
        const response = await fetch("/api/user/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: firebaseUserObj.uid,
            email: firebaseUserObj.email,
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
    async (firebaseUserObj: FirebaseUser): Promise<boolean> => {
      try {
        const idToken = await firebaseUserObj.getIdToken();
        const response = await fetch("/api/user/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: firebaseUserObj.uid,
            email: firebaseUserObj.email,
            displayName: firebaseUserObj.displayName,
            photoURL: firebaseUserObj.photoURL,
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
    if (firebaseUser) {
      try {
        return await firebaseUser.getIdToken();
      } catch (error) {
        console.error("Failed to get Firebase token:", error);
        return null;
      }
    }

    if (authTokens?.access_token) {
      return authTokens.access_token;
    }

    return null;
  }, [firebaseUser, authTokens]);

  // Check user authentication status
  const checkUserAuth = useCallback(async () => {
    if (!auth) {
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }
    // Prevent multiple simultaneous checks
    if (isLoadingAuth && authChecked) return;

    setIsLoadingAuth(true);
    clearError();

    try {
      const currentFirebaseUser = auth.currentUser;

      if (!currentFirebaseUser) {
        setUser(null);
        setFirebaseUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        return;
      }

      setFirebaseUser(currentFirebaseUser);

      // Check if user is registered in your backend
      const isRegistered = await isUserRegistered(currentFirebaseUser);

      if (!isRegistered) {
        // Try to auto-register if possible
        const registered = await registerUser(currentFirebaseUser);

        if (!registered) {
          setError(
            "user_not_registered",
            "User authenticated but not registered in application database",
            "user_not_registered",
          );
          setUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);

          // Call the callback if provided
          if (onUserNotRegistered) {
            onUserNotRegistered(currentFirebaseUser);
          }
          return;
        }
      }

      // User is authenticated and registered
      const convertedUser = convertFirebaseUser(currentFirebaseUser);
      setUser(convertedUser);
      setIsAuthenticated(true);
      setAuthChecked(true);
    } catch (error: any) {
      console.error("Auth check failed:", error);
      setError(
        "unknown",
        error.message || "Authentication check failed",
        error.code,
        error,
      );
      setUser(null);
      setFirebaseUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [
    isLoadingAuth,
    authChecked,
    isUserRegistered,
    registerUser,
    onUserNotRegistered,
  ]);

  // Sign in with Google popup or redirect
  const signInWithGoogle = useCallback(
    async (useRedirect: boolean = false) => {
      setIsLoadingAuth(true);
      clearError();

      try {
        if (useRedirect) {
          // Use redirect for mobile or when popups are blocked
          await signInWithRedirect(auth, googleProvider);
          // The result will be handled in the redirect result effect
        } else {
          // Use popup for better UX
          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUserObj = result.user;

          // Check registration
          const isRegistered = await isUserRegistered(firebaseUserObj);

          if (!isRegistered) {
            const registered = await registerUser(firebaseUserObj);
            if (!registered) {
              setError(
                "user_not_registered",
                "User authenticated but not registered",
                "user_not_registered",
              );
              await signOut(auth);
              setIsLoadingAuth(false);
              return;
            }
          }

          // Update state
          setFirebaseUser(firebaseUserObj);
          setUser(convertFirebaseUser(firebaseUserObj));
          setIsAuthenticated(true);
          setAuthChecked(true);
        }
      } catch (error: any) {
        console.error("Google sign in failed:", error);

        // Handle specific Firebase errors
        if (error.code === "auth/popup-blocked") {
          setError(
            "unknown",
            "Popup was blocked. Please allow popups or try redirect mode.",
            error.code,
            error,
          );
        } else if (error.code === "auth/popup-closed-by-user") {
          setError("unknown", "Sign in was cancelled", error.code, error);
        } else {
          setError(
            "firebase",
            error.message || "Google sign in failed",
            error.code,
            error,
          );
        }

        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [isUserRegistered, registerUser],
  );

  // Sign in with specific email (for the three pre-configured accounts)
  const signInWithSpecificEmail = useCallback(
    async (email: string) => {
      setIsLoadingAuth(true);
      clearError();

      try {
        // Configure Google provider to use specific email
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          login_hint: email,
        });

        const result = await signInWithPopup(auth, provider);
        const firebaseUserObj = result.user;

        // Verify they signed in with the expected email
        if (firebaseUserObj.email !== email) {
          await signOut(auth);
          setError(
            "unauthorized",
            `Please sign in with ${email}`,
            "wrong_account",
          );
          setIsLoadingAuth(false);
          return;
        }

        // Check registration
        const isRegistered = await isUserRegistered(firebaseUserObj);

        if (!isRegistered) {
          const registered = await registerUser(firebaseUserObj);
          if (!registered) {
            setError(
              "user_not_registered",
              "User authenticated but not registered",
              "user_not_registered",
            );
            await signOut(auth);
            setIsLoadingAuth(false);
            return;
          }
        }

        setFirebaseUser(firebaseUserObj);
        setUser(convertFirebaseUser(firebaseUserObj));
        setIsAuthenticated(true);
        setAuthChecked(true);
      } catch (error: any) {
        console.error("Specific email sign in failed:", error);
        setError(
          "firebase",
          error.message || "Sign in failed",
          error.code,
          error,
        );
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [isUserRegistered, registerUser],
  );

  // Sign in with email and password
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setIsLoadingAuth(true);
      clearError();

      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUserObj = result.user;

        // Check if email is verified (optional - depends on your security requirements)
        if (!firebaseUserObj.emailVerified) {
          setError(
            "unauthorized",
            "Please verify your email before signing in",
            "email_not_verified",
          );
          await signOut(auth);
          setIsLoadingAuth(false);
          return;
        }

        // Check registration
        const isRegistered = await isUserRegistered(firebaseUserObj);

        if (!isRegistered) {
          const registered = await registerUser(firebaseUserObj);
          if (!registered) {
            setError(
              "user_not_registered",
              "User authenticated but not registered",
              "user_not_registered",
            );
            await signOut(auth);
            setIsLoadingAuth(false);
            return;
          }
        }

        setFirebaseUser(firebaseUserObj);
        setUser(convertFirebaseUser(firebaseUserObj));
        setIsAuthenticated(true);
        setAuthChecked(true);
      } catch (error: any) {
        console.error("Email sign in failed:", error);

        // Handle specific auth errors
        switch (error.code) {
          case "auth/user-not-found":
            setError(
              "firebase",
              "No account found with this email",
              error.code,
              error,
            );
            break;
          case "auth/wrong-password":
            setError("firebase", "Incorrect password", error.code, error);
            break;
          case "auth/too-many-requests":
            setError(
              "firebase",
              "Too many failed attempts. Try again later.",
              error.code,
              error,
            );
            break;
          default:
            setError(
              "firebase",
              error.message || "Sign in failed",
              error.code,
              error,
            );
        }

        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [isUserRegistered, registerUser],
  );

  // Sign up with email and password
  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setIsLoadingAuth(true);
      clearError();

      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUserObj = result.user;

        // Update profile if display name provided
        if (displayName && firebaseUserObj) {
          await updateProfile(firebaseUserObj, { displayName });
        }

        // Send email verification
        await sendEmailVerification(firebaseUserObj);

        // Register in your backend
        const registered = await registerUser(firebaseUserObj);

        if (!registered) {
          setError(
            "user_not_registered",
            "Failed to register user in application",
            "registration_failed",
          );
          await signOut(auth);
          setIsLoadingAuth(false);
          return;
        }

        setFirebaseUser(firebaseUserObj);
        setUser(convertFirebaseUser(firebaseUserObj));
        setIsAuthenticated(true);
        setAuthChecked(true);
      } catch (error: any) {
        console.error("Sign up failed:", error);

        switch (error.code) {
          case "auth/email-already-in-use":
            setError("firebase", "Email already registered", error.code, error);
            break;
          case "auth/weak-password":
            setError(
              "firebase",
              "Password should be at least 6 characters",
              error.code,
              error,
            );
            break;
          default:
            setError(
              "firebase",
              error.message || "Sign up failed",
              error.code,
              error,
            );
        }

        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [registerUser],
  );

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setIsLoadingAuth(true);
    clearError();

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password reset failed:", error);

      switch (error.code) {
        case "auth/user-not-found":
          setError(
            "firebase",
            "No account found with this email",
            error.code,
            error,
          );
          break;
        default:
          setError(
            "firebase",
            error.message || "Password reset failed",
            error.code,
            error,
          );
      }

      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Send verification email
  const sendVerificationEmail = useCallback(async () => {
    if (!firebaseUser) {
      setError("unauthorized", "No user logged in", "no_user");
      return;
    }

    try {
      await sendEmailVerification(firebaseUser);
    } catch (error: any) {
      console.error("Failed to send verification email:", error);
      setError(
        "firebase",
        error.message || "Failed to send verification email",
        error.code,
        error,
      );
      throw error;
    }
  }, [firebaseUser]);

  // Update user profile
  const updateUserProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      if (!firebaseUser) {
        setError("unauthorized", "No user logged in", "no_user");
        return;
      }

      try {
        await updateProfile(firebaseUser, data);

        // Update local state
        setFirebaseUser({ ...firebaseUser, ...data });
        if (user) {
          setUser({
            ...user,
            displayName: data.displayName ?? user.displayName,
            photoURL: data.photoURL ?? user.photoURL,
          });
        }
      } catch (error: any) {
        console.error("Failed to update profile:", error);
        setError(
          "firebase",
          error.message || "Failed to update profile",
          error.code,
          error,
        );
        throw error;
      }
    },
    [firebaseUser, user],
  );

  // Logout
  const logout = useCallback(async () => {
    setIsLoadingAuth(true);

    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setIsAuthenticated(false);
      setAuthChecked(false);
      setAuthTokensState(null);
      clearError();
    } catch (error: any) {
      console.error("Logout failed:", error);
      setError("firebase", error.message || "Logout failed", error.code, error);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Handle redirect result (for mobile or when popups are blocked)
  useEffect(() => {
    if (!auth) return;
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const firebaseUserObj = result.user;

          const isRegistered = await isUserRegistered(firebaseUserObj);

          if (!isRegistered) {
            const registered = await registerUser(firebaseUserObj);
            if (!registered) {
              setError(
                "user_not_registered",
                "User authenticated but not registered",
                "user_not_registered",
              );
              await signOut(auth);
              return;
            }
          }

          setFirebaseUser(firebaseUserObj);
          setUser(convertFirebaseUser(firebaseUserObj));
          setIsAuthenticated(true);
          setAuthChecked(true);
        }
      } catch (error: any) {
        console.error("Redirect result error:", error);
        setError(
          "firebase",
          error.message || "Redirect sign in failed",
          error.code,
          error,
        );
      }
    };

    handleRedirectResult();
  }, [isUserRegistered, registerUser]);

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUserObj) => {
      if (firebaseUserObj) {
        setFirebaseUser(firebaseUserObj);

        // Check if user is registered
        const isRegistered = await isUserRegistered(firebaseUserObj);

        if (!isRegistered) {
          const registered = await registerUser(firebaseUserObj);
          if (!registered) {
            setError(
              "user_not_registered",
              "User authenticated but not registered",
              "user_not_registered",
            );
            setUser(null);
            setIsAuthenticated(false);
            setAuthChecked(true);
            setIsLoadingAuth(false);
            return;
          }
        }

        setUser(convertFirebaseUser(firebaseUserObj));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setFirebaseUser(null);
        setIsAuthenticated(false);
      }

      setAuthChecked(true);
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [isUserRegistered, registerUser]);

  // Context value
  const value: AuthContextType = {
    // State
    user,
    firebaseUser,
    isAuthenticated,
    isLoadingAuth,
    authChecked,
    authError,

    // Methods
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
