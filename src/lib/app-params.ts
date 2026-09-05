// LifeOS1 — app parameters (no Base44 dependency)
const isNode = typeof window === "undefined";

const storage: {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} = isNode
  ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  : window.localStorage;

function getParam(key: string, defaultValue?: string): string | null {
  if (isNode) return defaultValue || null;
  const urlParams = new URLSearchParams(window.location.search);
  const fromUrl = urlParams.get(key);
  if (fromUrl) {
    try {
      storage.setItem("lifeos_" + key, fromUrl);
    } catch {}
    return fromUrl;
  }
  if (defaultValue) {
    try {
      storage.setItem("lifeos_" + key, defaultValue);
    } catch {}
    return defaultValue;
  }
  try {
    return storage.getItem("lifeos_" + key) || null;
  } catch {
    return null;
  }
}

export const appParams = {
  appId: "lifeos1",
  appBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
  fromUrl: typeof window !== "undefined" ? window.location.href : "/",
};

export { getParam };