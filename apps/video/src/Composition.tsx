import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2BookingCard } from "./scenes/Scene2BookingCard";
import { Scene3Tagline } from "./scenes/Scene3Tagline";
import { Scene4Reveal } from "./scenes/Scene4Reveal";

// Load Inter — Remotion will embed the font at render time
loadFont();

// 15 seconds @ 30fps = 450 frames
// Scenes overlap with cross-fades for a cinematic feel
//
// Scene 1: f 0–100   (hold to 90, fade out 90–110)
// Scene 2: f 85–250  (fade in 85–100, hold to 235, fade out 235–250)
// Scene 3: f 235–355 (fade in 235–255, hold to 340, fade out 340–355)
// Scene 4: f 340–450 (fade in 340–360, hold to 430, fade to black 430–450)

const fade = (frame: number, inStart: number, inEnd: number, outStart: number, outEnd: number) => {
  const fadeIn = inStart === inEnd
    ? 1
    : interpolate(frame, [inStart, inEnd], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      });
  const fadeOut = interpolate(frame, [outStart, outEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  // In the overlap region both are < 1; min gives correct cross-fade
  return Math.min(fadeIn, fadeOut);
};

// Per-scene local frame (so each scene's internal frame counter starts at 0)
const localFrame = (frame: number, start: number) => Math.max(0, frame - start);

export const DinayaComingSoon: React.FC = () => {
  const frame = useCurrentFrame();

  const s1Opacity = fade(frame, 0, 0, 90, 110);
  const s2Opacity = fade(frame, 85, 100, 235, 250);
  const s3Opacity = fade(frame, 235, 255, 340, 355);
  const s4Opacity = fade(frame, 340, 360, 430, 450);

  return (
    <AbsoluteFill style={{ background: "#070c18", fontFamily: '"Inter", system-ui, sans-serif' }}>
      {s1Opacity > 0 && (
        <AbsoluteFill style={{ opacity: s1Opacity }}>
          <Scene1Hook localFrame={localFrame(frame, 0)} />
        </AbsoluteFill>
      )}
      {s2Opacity > 0 && (
        <AbsoluteFill style={{ opacity: s2Opacity }}>
          <Scene2BookingCard localFrame={localFrame(frame, 85)} />
        </AbsoluteFill>
      )}
      {s3Opacity > 0 && (
        <AbsoluteFill style={{ opacity: s3Opacity }}>
          <Scene3Tagline localFrame={localFrame(frame, 235)} />
        </AbsoluteFill>
      )}
      {s4Opacity > 0 && (
        <AbsoluteFill style={{ opacity: s4Opacity }}>
          <Scene4Reveal localFrame={localFrame(frame, 340)} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
