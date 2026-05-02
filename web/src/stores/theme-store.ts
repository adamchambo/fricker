import { create } from "zustand";

type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  initialized: boolean;
  initFromStorage: () => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  initialized: false,
  initFromStorage: () => {
    if (get().initialized) return;
    if (typeof window === "undefined") return;
    const stored =
      localStorage.getItem("fricker-theme") ?? localStorage.getItem("hangout-theme");
    const theme = stored === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme, initialized: true });
  },
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    if (typeof window !== "undefined") {
      localStorage.setItem("fricker-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
    }
    set({ theme: next, initialized: true });
  },
}));
