// src/theme/colors.js
export const C = {
  bg: "#0f0e17",
  bg2: "#1a1828",
  card: "#201e30",
  border: "#2e2b45",
  accent: "#e8b4d0",
  accent2: "#c084fc",
  accent3: "#60a5fa",
  accent4: "#34d399",
  text: "#f0eef8",
  muted: "#8b8aaa",
  danger: "#f87171",
  warning: "#fbbf24",
  amber: "#fbbf24",
  teal: "#2dd4bf",
  indigo: "#818cf8",
};

export const COLORS = [
  C.accent,
  C.accent2,
  C.accent3,
  C.accent4,
  C.warning,
  C.danger,
  C.teal,
  C.indigo,
];

// Formatters
export const fmtRp = (n) =>
  n >= 1000000
    ? `Rp ${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `Rp ${(n / 1000).toFixed(0)}K`
    : `Rp ${n}`;

export const fmtM = (n) => `Rp ${(n / 1000000).toFixed(1)}M`;
