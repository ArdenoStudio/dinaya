import { useVideoConfig, interpolate, Easing } from "remotion";
import { C, FONT } from "../design";

export const Scene1Hook: React.FC<{ localFrame: number }> = ({ localFrame: frame }) => {
  const { width, height } = useVideoConfig();

  const glowScale = interpolate(frame, [0, 60], [0.3, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const glowOpacity = interpolate(frame, [0, 40], [0, 0.7], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const lineProgress = interpolate(frame, [20, 75], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const shimmerX = interpolate(frame, [20, 85], [-200, width + 200], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });
  const shimmerOpacity = interpolate(frame, [20, 35, 75, 90], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  const lineWidth = width * 0.72 * lineProgress;

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
      {/* Ambient radial */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.06) 45%, transparent 70%)`,
          transform: `scale(${glowScale})`,
          opacity: glowOpacity,
          top: "50%",
          left: "50%",
          marginTop: -450,
          marginLeft: -450,
        }}
      />

      {/* The line */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: lineWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, ${C.cobalt} 15%, rgba(147,197,253,0.9) 50%, ${C.cobalt} 85%, transparent 100%)`,
            borderRadius: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -10,
              left: shimmerX - 80,
              width: 160,
              height: 21,
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, transparent 70%)",
              opacity: shimmerOpacity,
            }}
          />
        </div>
      </div>

      {/* Barely visible label */}
      <div
        style={{
          position: "absolute",
          bottom: height * 0.18,
          opacity: interpolate(frame, [70, 90], [0, 0.15], { extrapolateRight: "clamp" }),
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: "0.35em",
          color: C.white,
          textTransform: "uppercase",
        }}
      >
        dinaya
      </div>
    </div>
  );
};
