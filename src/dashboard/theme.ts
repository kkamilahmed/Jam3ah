import { useEffect, useState } from "react";

// One light/dark preference for every page of the site, remembered per browser.
// Without a saved choice it follows the device setting.
const KEY = "dashboard_theme";

export const BG = { light: "#f6f4ef", dark: "#0f1113" } as const;

export function readDarkPreference(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved === "dark";
  } catch {
    /* storage blocked: fall back to the device setting */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function useDashTheme() {
  const [dark, setDark] = useState(readDarkPreference);

  useEffect(() => {
    document.body.style.backgroundColor = dark ? BG.dark : BG.light;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  // Keep other open tabs (for example the TV screen) in step.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setDark(readDarkPreference()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = () => setDark(d => {
    try { localStorage.setItem(KEY, d ? "light" : "dark"); } catch { /* not saved */ }
    return !d;
  });

  return { dark, toggle, themeAttr: dark ? "dark" : "light" } as const;
}
