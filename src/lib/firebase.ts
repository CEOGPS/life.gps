import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim(),
};

const firebaseReady = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Prevent duplicate app init on hot reload — skip silently if config is incomplete
let app = getApps()[0] ?? null;
if (!app && firebaseReady) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.warn("Firebase init failed:", e.message);
  }
}
const auth = app ? getAuth(app) : null;

// Analytics — initialize synchronously with error handling
let analytics = null;
try {
  if (app && typeof window !== "undefined" && isSupported()) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn("Analytics initialization failed:", error);
}

// Base Google Provider
const baseGoogleProvider = new GoogleAuthProvider();
baseGoogleProvider.addScope("email");
baseGoogleProvider.addScope("profile");

/**
 * Sign in with Google. Pass login_hint to pre-select a specific account.
 * @param {string} [hint] - email address to hint (e.g. "chris@ceogps.com")
 * @returns {Promise<UserCredential>}
 */
export async function signInWithGoogle(hint) {
  if (!auth) throw new Error("Firebase not configured");
  if (hint) {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    provider.setCustomParameters({ login_hint: hint });
    return signInWithPopup(auth, provider);
  }
  return signInWithPopup(auth, baseGoogleProvider);
}

/**
 * Sign in with specific email (alias for signInWithGoogle with hint)
 * @param {string} email - Email address to sign in with
 * @returns {Promise<UserCredential>}
 */
export async function signInWithSpecificEmail(email) {
  return signInWithGoogle(email);
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function signInWithEmail(email, password) {
  if (!auth) throw new Error("Firebase not configured");
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Register new user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function registerWithEmail(email, password) {
  if (!auth) throw new Error("Firebase not configured");
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  if (password.length < 6) {
    throw new Error("Password should be at least 6 characters");
  }
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  if (!auth) throw new Error("Firebase not configured");
  if (!email) {
    throw new Error("Email is required");
  }
  return sendPasswordResetEmail(auth, email);
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function logout() {
  if (!auth) return;
  return signOut(auth);
}

/**
 * Subscribe to auth state changes
 * @param {function} callback
 * @returns {function} Unsubscribe function
 */
export function onAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Get sign-in methods for an email address
 * @param {string} email
 * @returns {Promise<string[]>}
 */
export async function getSignInMethods(email) {
  if (!auth || !email) return [];
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods;
  } catch (error) {
    console.error("Failed to get sign-in methods:", error);
    return [];
  }
}

/**
 * Get current user's ID token
 * @returns {Promise<string|null>}
 */
export async function getIdToken() {
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("Failed to get ID token:", error);
    return null;
  }
}

// Firebase error messages for consistent error handling
export const FirebaseErrorMessages = {
  "auth/user-not-found": "No account found with this email",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "This email is already registered",
  "auth/weak-password": "Password should be at least 6 characters",
  "auth/popup-blocked": "Popup was blocked. Please allow popups for this site.",
  "auth/popup-closed-by-user": "Sign in was cancelled",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/invalid-email": "Invalid email address format",
  "auth/user-disabled": "This account has been disabled",
  "auth/operation-not-allowed": "This sign-in method is not enabled",
};

/**
 * Get user-friendly error message from Firebase error
 * @param {Error} error - Firebase error object
 * @returns {string}
 */
export function getFirebaseErrorMessage(error) {
  if (error?.code && FirebaseErrorMessages[error.code]) {
    return FirebaseErrorMessages[error.code];
  }
  return error?.message || "An unexpected error occurred";
}

// Exports for compatibility with AuthorityContext
export { auth, analytics, app };
export { onAuthStateChanged } from "firebase/auth";
export const firebaseSignOut = () => (auth ? signOut(auth) : Promise.resolve());

export default app;
