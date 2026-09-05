import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Safe verification fallback ensures Vite doesn't crash during build scripts
export const isIframe =
  typeof window !== "undefined" ? window.self !== window.top : false;
