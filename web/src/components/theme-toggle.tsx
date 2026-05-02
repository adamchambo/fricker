"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const initFromStorage = useThemeStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => toggle()}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] shadow-[var(--shadow-soft)] transition-[transform,background-color] duration-200 hover:-translate-y-px active:translate-y-0"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      <span
        className="relative flex h-5 w-9 items-center rounded-full bg-[color-mix(in_srgb,var(--muted)_28%,var(--border))] p-0.5 transition-colors duration-300"
        aria-hidden
      >
        <span
          className={`block h-4 w-4 rounded-full bg-[var(--card)] shadow transition-transform duration-300 ease-out ${
            isDark ? "translate-x-[1.125rem]" : "translate-x-0"
          }`}
        />
      </span>
      {isDark ? "Night" : "Day"}
    </button>
  );
}
