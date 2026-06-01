"use client";

import { useEffect, useState } from "react";
import {
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  normalizeTheme,
  type ThemePref,
} from "@/lib/theme";

const LABEL: Record<ThemePref, string> = {
  light: "Claro",
  dark: "Escuro",
  system: "Sistema",
};

/** Aplica o tema no <html> baseado na preferencia. */
function applyTheme(pref: ThemePref) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const wantsDark =
    pref === "dark" ||
    (pref === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  html.classList.toggle("dark", wantsDark);
}

/** Salva a preferencia em cookie + localStorage. */
function persistTheme(pref: ThemePref) {
  try {
    document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
    localStorage.setItem(THEME_COOKIE, pref);
  } catch {
    // ignore
  }
}

export function ThemeToggle({ initial }: { initial: ThemePref }) {
  const [pref, setPref] = useState<ThemePref>(initial);

  // Re-aplica quando pref muda
  useEffect(() => {
    applyTheme(pref);
    persistTheme(pref);
  }, [pref]);

  // Se escolheu "system", escuta mudanca do OS
  useEffect(() => {
    if (pref !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [pref]);

  // Sincroniza com outras abas via localStorage
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === THEME_COOKIE) setPref(normalizeTheme(e.newValue));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="inline-flex items-center bg-graphite-100 dark:bg-graphite-700 rounded-md p-0.5 gap-0.5">
      {(["light", "dark", "system"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setPref(opt)}
          aria-pressed={pref === opt}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            pref === opt
              ? "bg-white dark:bg-graphite-900 text-graphite-900 dark:text-graphite-50 shadow-sm"
              : "text-graphite-600 dark:text-graphite-300 hover:text-graphite-900 dark:hover:text-white"
          }`}
        >
          {LABEL[opt]}
        </button>
      ))}
    </div>
  );
}
