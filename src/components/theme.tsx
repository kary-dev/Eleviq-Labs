"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "eleviq-theme";

/** Inline script injected before paint to avoid a theme flash. */
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('${STORAGE_KEY}') || 'dark';
    var c = document.documentElement.classList;
    c.remove('light','dark');
    c.add(t);
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (localStorage.getItem(STORAGE_KEY) as Theme) || "dark";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const c = document.documentElement.classList;
    c.remove("light", "dark");
    c.add(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return { theme, toggle };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className={`btn-ghost h-10 w-10 !p-0 ${className}`}
    >
      {theme === "dark" ? (
        // Sun
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
        </svg>
      ) : (
        // Moon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
