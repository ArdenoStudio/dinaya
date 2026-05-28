import { useVideoConfig, interpolate, Easing, spring } from "remotion";
import { C, FONT, SPRING } from "../design";

const PulsingDot: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const pulse = Math.sin((frame / 30) * Math.PI * 2) * 0.3 + 0.7;
  return (
    <div style={{ position: "relative", width: 8, height: 8 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: pulse }} />
      <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: color, opacity: (pulse - 0.7) * 0.4 }} />
    </div>
  );
};

export const Scene2BookingCard: React.FC<{ localFrame: number }> = ({ localFrame: frame }) => {
  const { fps, width, height } = useVideoConfig();

  const cardSpring = spring({ frame, fps, config: SPRING.reveal, delay: 0 });
  const cardY = (1 - cardSpring) * 120;
  const cardOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const el1 = spring({ frame, fps, config: SPRING.snap, delay: 12 });
  const el2 = spring({ frame, fps, config: SPRING.snap, delay: 22 });
  const el3 = spring({ frame, fps, config: SPRING.snap, delay: 32 });
  const el4 = spring({ frame, fps, config: SPRING.snap, delay: 48 });
  const el5 = spring({ frame, fps, config: SPRING.snap, delay: 60 });

  const elOpacity = (delay: number) =>
    interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });

  const bgGlow = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

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
      {/* Cobalt glow under card */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0.08) 40%, transparent 70%)`,
          opacity: bgGlow,
          top: "50%",
          left: "50%",
          marginTop: -300,
          marginLeft: -300,
        }}
      />

      {/* Hero booking card */}
      <div
        style={{
          transform: `translateY(${cardY}px)`,
          opacity: cardOpacity,
          width: 360,
          borderRadius: 28,
          background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: `0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.12) inset`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Top cobalt stripe */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.cobalt}, ${C.cobaltLight}, transparent)`,
            opacity: 0.9,
          }}
        />

        <div style={{ padding: "28px 28px 26px" }}>
          {/* Date row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              opacity: elOpacity(12),
              transform: `translateY(${(1 - el1) * 10}px)`,
            }}
          >
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Today · Wed, 28 May
            </div>
            <PulsingDot frame={frame} color={C.green} />
          </div>

          {/* Service name */}
          <div
            style={{
              opacity: elOpacity(22),
              transform: `translateY(${(1 - el2) * 12}px)`,
              marginBottom: 24,
            }}
          >
            <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: C.white, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 6 }}>
              Hair & Color
            </div>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 400, color: C.textMuted }}>
              Glam Studio · Colombo 3
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20, opacity: elOpacity(32) }} />

          {/* Time slots */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 22,
              opacity: elOpacity(32),
              transform: `translateY(${(1 - el3) * 8}px)`,
            }}
          >
            {[{ t: "2:00 PM", active: true }, { t: "3:30 PM", active: false }, { t: "5:00 PM", active: false }].map(({ t, active }) => (
              <div
                key={t}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px 0",
                  borderRadius: 12,
                  background: active ? `linear-gradient(135deg, ${C.cobalt}, #1d4ed8)` : "rgba(255,255,255,0.05)",
                  border: active ? `1px solid rgba(96,165,250,0.3)` : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: active ? `0 8px 24px rgba(37,99,235,0.35)` : "none",
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? C.white : C.textMuted,
                }}
              >
                {t}
              </div>
            ))}
          </div>

          {/* Available badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 100,
              padding: "7px 14px",
              marginBottom: 20,
              opacity: elOpacity(48),
              transform: `scale(${0.9 + el4 * 0.1})`,
            }}
          >
            <PulsingDot frame={frame} color={C.green} />
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: C.green, letterSpacing: "0.02em" }}>
              Available today
            </span>
          </div>

          {/* CTA */}
          <div
            style={{
              width: "100%",
              padding: "15px 0",
              borderRadius: 16,
              background: `linear-gradient(135deg, ${C.cobalt}, #1d4ed8)`,
              boxShadow: `0 12px 32px rgba(37,99,235,0.45), 0 1px 0 rgba(255,255,255,0.15) inset`,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 600,
              color: C.white,
              letterSpacing: "0.01em",
              opacity: elOpacity(60),
              transform: `translateY(${(1 - el5) * 8}px)`,
            }}
          >
            Book Appointment
          </div>
        </div>
      </div>

      {/* Label below */}
      <div
        style={{
          marginTop: 24,
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 400,
          color: C.textDim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Book in seconds
      </div>
    </div>
  );
};
