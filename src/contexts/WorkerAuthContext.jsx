import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [tokens, setTokens] = useState(null);

  const setAuthTokens = (newTokens) => {
    setTokens(newTokens);
  };

  const logout = () => {
    setTokens(null);
  };

  // Automatically injects the bearer token into outgoing API calls
  const authenticatedFetch = async (url, options = {}) => {
    if (!tokens?.access_token) {
      throw new Error("No access token available. User is unauthenticated.");
    }

    const headers = new Headers(options.headers || {});
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
