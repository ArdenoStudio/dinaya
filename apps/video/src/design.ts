// Dinaya brand design tokens for the video
export const C = {
  bg: "#070c18",          // deep space blue-black
  cobalt: "#2563EB",
  cobaltLight: "#60a5fa",
  cobaltGlow: "rgba(37,99,235,0.35)",
  amber: "#F59E0B",
  violet: "#7C3AED",
  green: "#22C55E",
  white: "#ffffff",
  textMuted: "rgba(255,255,255,0.45)",
  textDim: "rgba(255,255,255,0.2)",
  glassBg: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.08)",
};

export const SPRING = {
  // Apple's default interactive spring
  snap: { stiffness: 400, damping: 36, mass: 1 },
  // Apple's gentle reveal spring
  reveal: { stiffness: 240, damping: 28, mass: 1 },
  // Very soft, cinematic
  slow: { stiffness: 120, damping: 24, mass: 1 },
};

// Shared font family loaded in index.css via @remotion/google-fonts
export const FONT = '"Inter", system-ui, -apple-system, sans-serif';
