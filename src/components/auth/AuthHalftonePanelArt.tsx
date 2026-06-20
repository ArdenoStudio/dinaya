/** Ordered 2×2 Bayer-style dither tile for halftone midtones. */
const DITHER_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%23000'/%3E%3Crect x='2' y='1' width='1' height='1' fill='%23000'/%3E%3Crect x='1' y='2' width='1' height='1' fill='%23000'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000'/%3E%3C/svg%3E\")";

/**
 * Auth7-style halftone cloud panel — the original template uses a pre-dithered
 * AVIF (`assets.watermelon.sh/auth-7.avif`). Here we recreate the look with
 * high-contrast cloud shapes + an ordered dither overlay (no external asset).
 */
export function AuthHalftonePanelArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#ece7df]" aria-hidden>
      {/* Cloud mass — high contrast silhouettes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 95% 75% at 18% 62%, #0c0c0c 0%, transparent 58%)",
            "radial-gradient(ellipse 80% 65% at 72% 38%, #111 0%, transparent 55%)",
            "radial-gradient(ellipse 70% 55% at 55% 78%, #080808 0%, transparent 52%)",
            "radial-gradient(ellipse 55% 45% at 88% 72%, #141414 0%, transparent 48%)",
            "radial-gradient(ellipse 45% 40% at 35% 28%, #1a1a1a 0%, transparent 50%)",
            "linear-gradient(165deg, #050505 0%, transparent 42%, #0a0a0a 100%)",
          ].join(", "),
        }}
      />

      {/* Ordered dither — visible dot grid in mid-tones (the Auth7 “pattern”) */}
      <div
        className="absolute inset-0 opacity-[0.42] mix-blend-multiply"
        style={{
          backgroundImage: DITHER_TILE,
          backgroundSize: "3px 3px",
        }}
      />

      {/* Fine cross-hatch for extra grain */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-multiply"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 4px)",
            "repeating-linear-gradient(-45deg, #000 0 1px, transparent 1px 4px)",
          ].join(", "),
        }}
      />

      {/* Vignette so overlaid copy stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.35) 38%, rgba(5,5,5,0.12) 68%, rgba(5,5,5,0.55) 100%)",
        }}
      />
    </div>
  );
}
