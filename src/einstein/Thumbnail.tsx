import { AbsoluteFill, Img, staticFile } from "remotion";

/** YouTube thumbnail (1280x720): shocked Einstein + "NOT E=mc²" hook over the light-burst art. */
export const EinsteinThumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: "#05030f", fontFamily: "Inter, 'Arial Black', Arial, sans-serif" }}>
    <Img src={staticFile("einstein-art/hero.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.95) saturate(1.2)", transform: "scale(1.15) translateX(-60px)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,3,15,0.92) 0%, rgba(5,3,15,0.55) 48%, rgba(5,3,15,0) 75%)" }} />
    <div style={{ position: "absolute", left: 54, top: 70 }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <div style={{ fontSize: 150, fontWeight: 900, color: "white", letterSpacing: -4, lineHeight: 1, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>E=mc²</div>
        <div style={{ position: "absolute", left: -14, right: -14, top: "48%", height: 22, background: "#ff2d3d", transform: "rotate(-8deg)", borderRadius: 6, boxShadow: "0 4px 18px rgba(0,0,0,0.5)" }} />
      </div>
      <div style={{ fontSize: 92, fontWeight: 900, color: "#ffd34d", lineHeight: 1.0, marginTop: 26, letterSpacing: -2, textShadow: "0 6px 26px rgba(0,0,0,0.7)" }}>
        HIS NOBEL
        <br />
        WAS FOR <span style={{ color: "#c48bff" }}>LIGHT</span>
      </div>
    </div>
    <Img src={staticFile("einstein-art/host/shock.png")} style={{ position: "absolute", right: 40, bottom: -40, height: 760, filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.7))" }} />
  </AbsoluteFill>
);
