import React, { createContext, useContext, useState, type ReactNode } from "react";

type AuthTokens = {
  access_token?: string | null;
  [key: string]: unknown;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  setAuthTokens: (tokens: AuthTokens | null) => void;
  logout: () => void;
  authenticatedFetch: (
    url: string | URL | Request,
    options?: RequestInit,
  ) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  const setAuthTokens = (newTokens: AuthTokens | null) => {
    setTokens(newTokens);
  };

  const logout = () => {
    setTokens(null);
  };

  // Automatically injects the bearer token into outgoing API calls
  const authenticatedFetch = async (
    url: string | URL | Request,
    options: RequestInit = {},
  ) => {
    if (!tokens?.access_token) {
      throw new Error("No access token available. User is unauthenticated.");
    }

    const headers = new Headers(options.headers as HeadersInit | undefined);
    headers.set("Authorization", `Bearer ${tokens.access_token}`);

    return fetch(url, { ...options, headers });
  };

  const isAuthenticated = !!tokens?.access_token;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        tokens,
        setAuthTokens,
        logout,
        authenticatedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useWorkerAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useWorkerAuth must be used within an AuthProvider");
  }
  return context;
};