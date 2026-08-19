"use client";

import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-8 h-8 rounded-lg
                 border border-gray-200 dark:border-gray-700
                 bg-white dark:bg-gray-800
                 text-gray-600 dark:text-gray-300
                 hover:bg-gray-50 dark:hover:bg-gray-700
                 transition-colors"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light"
        ? <Moon className="h-4 w-4" />
        : <Sun className="h-4 w-4" />}
    </button>
  );
}
