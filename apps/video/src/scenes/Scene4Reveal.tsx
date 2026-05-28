import { useVideoConfig, interpolate, Easing, spring } from "remotion";
import { C, FONT, SPRING } from "../design";

const DINAYA_MARK = "M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z";

export const Scene4Reveal: React.FC<{ localFrame: number }> = ({ localFrame: frame }) => {
  const { fps, width, height } = useVideoConfig();

  const bloomSpring = spring({ frame, fps, config: SPRING.slow, delay: 0 });
  const bloomOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  const markSpring = spring({ frame, fps, config: SPRING.snap, delay: 8 });
  const markOpacity = interpolate(frame, [8, 28], [0, 1], { extrapolateRight: "clamp" });

  const wordSpring = spring({ frame, fps, config: SPRING.reveal, delay: 20 });
  const wordOpacity = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });

  const urlOpacity = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const urlY = interpolate(frame, [38, 55], [14, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  const badgeOpacity = interpolate(frame, [58, 76], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const badgeY = interpolate(frame, [58, 76], [12, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  const shimmerX = interpolate(frame, [30, 80], [-60, 130], { extrapolateRight: "clamp" });
  const shimmerOpacity = interpolate(frame, [30, 45, 75, 85], [0, 0.7, 0.7, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        width,
        height,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Layered bloom */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 800 * bloomSpring, height: 800 * bloomSpring, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 65%)", opacity: bloomOpacity }} />
        <div style={{ position: "absolute", width: 380 * bloomSpring, height: 380 * bloomSpring, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(37,99,235,0.28) 0%, transparent 70%)", opacity: bloomOpacity }} />
        <div style={{ position: "absolute", width: 140 * bloomSpring, height: 140 * bloomSpring, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(96,165,250,0.45) 0%, transparent 70%)", opacity: bloomOpacity }} />
      </div>

      {/* Logo group */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scale(${0.75 + markSpring * 0.25})`,
          opacity: markOpacity,
          position: "relative",
        }}
      >
        {/* Spiral mark */}
        <div style={{ position: "relative", overflow: "hidden", width: 72, height: 72, marginBottom: 14 }}>
          <svg viewBox="318 319 875 866" width={72} height={72} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="markGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={C.cobaltLight} />
                <stop offset="100%" stopColor={C.cobalt} />
              </linearGradient>
            </defs>
            <path fill="url(#markGrad)" d={DINAYA_MARK} />
          </svg>
          {/* Shimmer */}
          <div
            style={{
              position: "absolute",
              top: -20,
              left: `${shimmerX}%`,
              width: 60,
              height: 120,
              background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.65) 50%, transparent 80%)",
              opacity: shimmerOpacity,
              transform: "skewX(-15deg)",
            }}
          />
        </div>

        {/* Wordmark */}
        <div
          style={{
            opacity: wordOpacity,
            transform: `translateY(${(1 - wordSpring) * 10}px)`,
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 700,
            color: C.white,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          Dinaya
        </div>
      </div>

      {/* dinaya.lk */}
      <div
        style={{
          marginTop: 18,
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 400,
          color: C.textMuted,
          letterSpacing: "0.18em",
        }}
      >
        dinaya.lk
      </div>

      {/* Coming Soon */}
      <div style={{ marginTop: 20, opacity: badgeOpacity, transform: `translateY(${badgeY}px)` }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(37,99,235,0.1)",
            border: `1px solid rgba(37,99,235,0.25)`,
            borderRadius: 100,
            padding: "8px 20px",
            boxShadow: "0 0 24px rgba(37,99,235,0.15)",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.cobaltLight, boxShadow: `0 0 8px ${C.cobaltLight}` }} />
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: C.cobaltLight, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
};
