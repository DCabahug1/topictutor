"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

type Theme = "light" | "dark";

const CHANGE = "themechange";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function storedTheme(): Theme | null {
  try {
    const stored = localStorage.getItem("theme");
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
}

/**
 * Toggles light and dark. The choice is stored in localStorage.theme; until
 * something is stored, the page follows the system setting live.
 */
export function ThemeButton({ className = "" }: { className?: string }) {
  // Null on the server, which can't know the theme the head script chose.
  const theme = useSyncExternalStore<Theme | null>(subscribe, currentTheme, () => null);

  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = (event: MediaQueryListEvent) => {
      if (!storedTheme()) applyTheme(event.matches ? "dark" : "light");
    };
    // Keeps other tabs in step with a choice made here.
    const followStorage = (event: StorageEvent) => {
      if (event.key === "theme") applyTheme(storedTheme() ?? (system.matches ? "dark" : "light"));
    };
    system.addEventListener("change", followSystem);
    window.addEventListener("storage", followStorage);
    return () => {
      system.removeEventListener("change", followSystem);
      window.removeEventListener("storage", followStorage);
    };
  }, []);

  const toggle = () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode: the theme still changes for this page view.
    }
    applyTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`flex h-11 w-11 flex-none cursor-pointer items-center justify-center border-0 bg-transparent text-(--ink) ${className}`}
    >
      {isDark ? <SunIcon size={19} /> : <MoonIcon size={19} />}
    </button>
  );
}
