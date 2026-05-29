import { useVideoConfig, interpolate, Easing, spring } from "remotion";
import { C, FONT, SPRING } from "../design";

export const Scene3Tagline: React.FC<{ localFrame: number }> = ({ localFrame: frame }) => {
  const { fps, width, height } = useVideoConfig();

  const line1Spring = spring({ frame, fps, config: SPRING.reveal, delay: 0 });
  const line1Opacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const line2Spring = spring({ frame, fps, config: SPRING.reveal, delay: 18 });
  const line2Opacity = interpolate(frame, [18, 36], [0, 1], { extrapolateRight: "clamp" });

  const accentSpring = spring({ frame, fps, config: SPRING.slow, delay: 38 });

  const subOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const subY = interpolate(frame, [55, 75], [10, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  const bgOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  return (
    <div
      style={{
        width,
        height,
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle violet ambient */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)",
          opacity: bgOpacity,
          top: "50%",
          left: "50%",
          marginTop: -350,
          marginLeft: -350,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingLeft: 48, paddingRight: 48 }}>
        {/* "Your salon." */}
        <div
          style={{
            fontFamily: FONT,
            fontSize: 72,
            fontWeight: 700,
            color: C.white,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            opacity: line1Opacity,
            transform: `translateY(${(1 - line1Spring) * 32}px)`,
            textAlign: "center",
          }}
        >
          Your salon.
        </div>

        {/* "Your schedule." — gradient on "schedule" */}
        <div
          style={{
            fontFamily: FONT,
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            opacity: line2Opacity,
            transform: `translateY(${(1 - line2Spring) * 32}px)`,
            textAlign: "center",
          }}
        >
          <span style={{ color: C.white }}>Your </span>
          <span
            style={{
              color: "transparent",
              background: `linear-gradient(135deg, ${C.cobaltLight} 0%, ${C.cobalt} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            schedule.
          </span>
        </div>

        {/* Accent line */}
        <div
          style={{
            marginTop: 28,
            width: 280 * accentSpring,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.cobalt}, transparent)`,
            opacity: accentSpring * 0.7,
          }}
        />

        {/* Sub-line */}
        <div
          style={{
            marginTop: 20,
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 400,
            color: C.textMuted,
            letterSpacing: "0.01em",
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          Sri Lanka&apos;s first smart salon booking platform
        </div>
      </div>
    </div>
  );
};
