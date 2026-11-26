import React from "react";
import { AbsoluteFill } from "remotion";
import { Guitarist } from "./Guitarist";
import { Crowd, Sparks, Stage } from "./Backgrounds";

/** 9:16 hero frame of Riff on stage, used as the start image for AI hook clips. */
export const GuitarHookFrame: React.FC = () => (
  <AbsoluteFill style={{ background: "#10002b" }}>
    <svg width={1080} height={1920} viewBox="170 -200 760 1351">
      <rect x={0} y={-400} width={1080} height={2000} fill="#10002b" />
      <Stage t={1.2} beat={0.6} energy={1} />
      <rect x={0} y={860} width={1080} height={700} fill="#0a0612" />
      <Sparks t={1.2} amount={0.8} />
      <Guitarist
        t={1.2}
        face="rock"
        outfit="rocker"
        fret={15}
        string={2}
        ringing={[]}
        pick={0.5}
        pickDir={1}
        pickString={2}
        bob={0}
        headbang={0}
        dive={0}
        guitar={{ color: "#9d0208", color2: "#e85d04", head: "#111", flames: true }}
      />
      <g transform="translate(0 60)">
        <Crowd t={1.2} beat={0.5} energy={1} />
      </g>
    </svg>
  </AbsoluteFill>
);
