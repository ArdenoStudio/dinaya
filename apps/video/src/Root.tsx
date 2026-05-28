import "./index.css";
import { Composition } from "remotion";
import { DinayaComingSoon } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DinayaComingSoon"
        component={DinayaComingSoon}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
