"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative ml-2 rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      <Sun className="absolute inset-0 m-auto h-5 w-5 scale-100 transition-all dark:scale-0" />
      <Moon className="absolute inset-0 m-auto h-5 w-5 scale-0 transition-all dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
