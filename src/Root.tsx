import { Composition } from "remotion";
import { Video, type VideoProps } from "./Video";

const FPS = 30;
const DURATION_SECONDS = 12;

const defaultProps: VideoProps = {
  title: "Welcome to 3D",
  subtitle: "three.js + Remotion",
  captionsFile: "captions.json",
  audioFile: "audio/music.mp3",
  accentColor: "#7c5cff",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Landscape YouTube video */}
      <Composition
        id="Main3DVideo"
        component={Video}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
      {/* Vertical YouTube Short */}
      <Composition
        id="Short3DVideo"
        component={Video}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};
