// src/theme/ThemeContext.jsx — shared theme state across store + admin
import { createContext, useContext, useState } from "react";

export const THEMES = {
  blossom: {
    name: "Blossom",
    swatch: ["#fcd5ce", "#f8a5c2", "#c77dff"],
    light: {
      bg: "#fff5f7", surface: "#ffffff", card: "#ffffff",
      border: "#fcd5ce", borderStrong: "#f4a0bb",
      accent: "#e879a0", accentSoft: "#fce7f3",
      accentGrad: "linear-gradient(135deg, #f8a5c2 0%, #c77dff 100%)",
      text: "#3d1a26", textMid: "#8c4a6e", textSoft: "#c985aa",
      success: "#10b981", warning: "#f59e0b", danger: "#ef4444",
      chip: "#fce7f3", chipText: "#be185d",
    },
    dark: {
      bg: "#1a0d12", surface: "#2a1520", card: "#231018",
      border: "#5a2040", borderStrong: "#8b3060",
      accent: "#f472b6", accentSoft: "#4a1530",
      accentGrad: "linear-gradient(135deg, #db2777 0%, #9333ea 100%)",
      text: "#fde8f0", textMid: "#e8a0c8", textSoft: "#a06080",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      chip: "#4a1530", chipText: "#f9a8d4",
    },
  },
  lavender: {
    name: "Lavender",
    swatch: ["#e9d5ff", "#a78bfa", "#7c3aed"],
    light: {
      bg: "#f5f3ff", surface: "#ffffff", card: "#ffffff",
      border: "#e9d5ff", borderStrong: "#c4b5fd",
      accent: "#7c3aed", accentSoft: "#ede9fe",
      accentGrad: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
      text: "#1e1145", textMid: "#5b21b6", textSoft: "#9c85c8",
      success: "#059669", warning: "#d97706", danger: "#dc2626",
      chip: "#ede9fe", chipText: "#6d28d9",
    },
    dark: {
      bg: "#0f0a1e", surface: "#1a1230", card: "#160e28",
      border: "#3b2770", borderStrong: "#6d28d9",
      accent: "#a78bfa", accentSoft: "#2d1b6b",
      accentGrad: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
      text: "#ede9fe", textMid: "#c4b5fd", textSoft: "#7c6aa8",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      chip: "#2d1b6b", chipText: "#c4b5fd",
    },
  },
  peach: {
    name: "Peach",
    swatch: ["#fed7aa", "#fb923c", "#f97316"],
    light: {
      bg: "#fff7ed", surface: "#ffffff", card: "#ffffff",
      border: "#fed7aa", borderStrong: "#fdba74",
      accent: "#ea6c1a", accentSoft: "#fff0e0",
      accentGrad: "linear-gradient(135deg, #fdba74 0%, #f97316 100%)",
      text: "#3d1a08", textMid: "#9a3412", textSoft: "#c47c50",
      success: "#10b981", warning: "#f59e0b", danger: "#ef4444",
      chip: "#fff0e0", chipText: "#c2410c",
    },
    dark: {
      bg: "#1a0d05", surface: "#2a1508", card: "#231008",
      border: "#5a2508", borderStrong: "#9a3412",
      accent: "#fb923c", accentSoft: "#4a1b05",
      accentGrad: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)",
      text: "#fff0e0", textMid: "#fdba74", textSoft: "#9a6040",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      chip: "#4a1b05", chipText: "#fdba74",
    },
  },
  mint: {
    name: "Mint",
    swatch: ["#a7f3d0", "#34d399", "#059669"],
    light: {
      bg: "#f0fdf8", surface: "#ffffff", card: "#ffffff",
      border: "#a7f3d0", borderStrong: "#6ee7b7",
      accent: "#059669", accentSoft: "#ecfdf5",
      accentGrad: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
      text: "#022c22", textMid: "#065f46", textSoft: "#6ab89a",
      success: "#059669", warning: "#d97706", danger: "#dc2626",
      chip: "#ecfdf5", chipText: "#065f46",
    },
    dark: {
      bg: "#051a10", surface: "#0d2b1e", card: "#082318",
      border: "#1a5c3a", borderStrong: "#059669",
      accent: "#34d399", accentSoft: "#0a3020",
      accentGrad: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
      text: "#ecfdf5", textMid: "#6ee7b7", textSoft: "#4a9070",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      chip: "#0a3020", chipText: "#6ee7b7",
    },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState("blossom");
  const [isDark, setIsDark] = useState(false);
  const theme = THEMES[themeName];
  const T = isDark ? theme.dark : theme.light;
  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, isDark, setIsDark, T, theme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
