import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";

/** How many ms of words are grouped onto one caption "page". */
const COMBINE_MS = 1200;

export const Captions: React.FC<{ file: string; accentColor: string }> = ({ file, accentColor }) => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [handle] = useState(() => delayRender(`Loading captions ${file}`));
  const { fps } = useVideoConfig();

  useEffect(() => {
    fetch(staticFile(file))
      .then((r) => r.json())
      .then((data: Caption[]) => {
        setCaptions(data);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [file, handle]);

  const pages = useMemo(
    () => (captions ? createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: COMBINE_MS }).pages : []),
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? Math.min(next.startMs, page.startMs + page.durationMs + 600) : page.startMs + page.durationMs + 600;
        const duration = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <CaptionPage page={page} accentColor={accentColor} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CaptionPage: React.FC<{ page: TikTokPage; accentColor: string }> = ({ page, accentColor }) => {
  const frame = useCurrentFrame(); // relative to the Sequence start
  const { fps, width } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const base = width / 1920;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 140 * Math.max(base, 0.6) + (base < 1 ? 300 : 0) }}>
      <div
        style={{
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          fontSize: 72 * Math.max(base, 0.9),
          fontWeight: 800,
          color: "white",
          textAlign: "center",
          maxWidth: "85%",
          whiteSpace: "pre-wrap",
          textShadow: "0 4px 16px rgba(0,0,0,0.8)",
          WebkitTextStroke: "2px black",
          paintOrder: "stroke",
        }}
      >
        {page.tokens.map((token, i) => {
          const active = token.fromMs <= nowMs && token.toMs > nowMs;
          // Keep the leading space outside the inline-block, or it gets swallowed.
          const space = token.text.match(/^\s*/)?.[0] ?? "";
          return (
            <span key={i}>
              {space}
              <span
                style={{
                  color: active ? accentColor : "white",
                  display: "inline-block",
                  margin: "0 0.06em",
                  transform: active ? "scale(1.08)" : "scale(1)",
                }}
              >
                {token.text.trimStart()}
              </span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
