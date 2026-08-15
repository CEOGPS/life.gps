import { createContext, useContext, useState, useEffect } from "react";

const ModelContext = createContext();

const STORAGE_KEY = "lifeos_global_model";
const DEFAULT_MODEL = "claude";

export function ModelProvider({ children }) {
  const [globalModel, setGlobalModel] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_MODEL;
    } catch {
      return DEFAULT_MODEL;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, globalModel);
    // Dispatch a custom event so other tabs/windows can sync
    window.dispatchEvent(
      new CustomEvent("globalModelChange", { detail: globalModel }),
    );
  }, [globalModel]);

  // Listen for changes from other components/tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) setGlobalModel(e.detail);
    };
    window.addEventListener("globalModelChange", handler);
    return () => window.removeEventListener("globalModelChange", handler);
  }, []);

  return (
    <ModelContext.Provider value={{ globalModel, setGlobalModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useGlobalModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useGlobalModel must be used within ModelProvider");
  return ctx;
}
