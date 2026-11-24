import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { HeroScene } from "./scenes/HeroScene";
import { Captions } from "./components/Captions";
import { Title } from "./components/Title";

export type VideoProps = {
  title: string;
  subtitle: string;
  /** JSON file in /public containing Caption[] from @remotion/captions. null = no captions */
  captionsFile: string | null;
  /** Audio file in /public (voiceover or music). null = silent */
  audioFile: string | null;
  accentColor: string;
};

export const Video: React.FC<VideoProps> = ({ title, subtitle, captionsFile, audioFile, accentColor }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Fade music in/out at the ends of the video.
  const volume = (f: number) =>
    interpolate(f, [0, 30, durationInFrames - 30, durationInFrames], [0, 0.6, 0.6, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill style={{ backgroundColor: "#05010f" }}>
      {/* 1. 3D layer: three.js via react-three-fiber, driven by Remotion's frame */}
      <ThreeCanvas width={width} height={height} camera={{ fov: 50, position: [0, 0, 8] }}>
        <HeroScene accentColor={accentColor} />
      </ThreeCanvas>

      {/* 2. 2D overlays: title + captions */}
      <Title title={title} subtitle={subtitle} accentColor={accentColor} />
      {captionsFile ? <Captions file={captionsFile} accentColor={accentColor} /> : null}

      {/* 3. Audio track */}
      {audioFile ? <Audio src={staticFile(audioFile)} volume={volume} /> : null}

      {/* subtle fade from black at start */}
      <AbsoluteFill
        style={{
          backgroundColor: "black",
          opacity: interpolate(frame, [0, 20], [1, 0], { extrapolateRight: "clamp" }),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
