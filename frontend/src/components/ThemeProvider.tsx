"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme; // Current active theme (forces light on public pages)
  storedTheme: Theme; // User's preferred theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [storedTheme, setStoredTheme] = useState<Theme>("light");
  const pathname = usePathname();

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      // Use a microtask to avoid cascading render warning
      Promise.resolve().then(() => setStoredTheme(stored as Theme));
    } else {
      window.localStorage.setItem("theme", "light");
    }
  }, []);

  const isDashboard = useMemo(() => {
    if (!pathname) return false;
    return pathname.startsWith('/doctor') || 
           pathname.startsWith('/client') || 
           pathname.startsWith('/user') || 
           pathname.startsWith('/meeting');
  }, [pathname]);

  const activeTheme = useMemo<Theme>(() => {
    return isDashboard ? storedTheme : "light";
  }, [isDashboard, storedTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
  }, [activeTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: activeTheme,
      storedTheme,
      setTheme: (t: Theme) => {
        setStoredTheme(t);
        window.localStorage.setItem("theme", t);
      },
      toggleTheme: () => {
        setStoredTheme((prev) => {
          const next = prev === "light" ? "dark" : "light";
          window.localStorage.setItem("theme", next);
          return next;
        });
      }
    }),
    [activeTheme, storedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
