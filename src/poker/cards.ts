import * as THREE from "three";

/* Card face/back textures drawn on canvases (cached). */
const SUIT: Record<string, { sym: string; red: boolean }> = { s: { sym: "♠", red: false }, h: { sym: "♥", red: true }, d: { sym: "♦", red: true }, c: { sym: "♣", red: false } };
const RANK: Record<string, string> = { T: "10", J: "J", Q: "Q", K: "K", A: "A" };
const cache = new Map<string, THREE.Texture>();

export const cardLabel = (c: string) => `${RANK[c[0]] ?? c[0]}${SUIT[c[1]].sym}`;
export const isRed = (c: string) => SUIT[c[1]].red;

export const cardTexture = (card: string | "back") => {
  const hit = cache.get(card);
  if (hit) return hit;
  const W = 256;
  const H = 356;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const r = 22;
  g.beginPath();
  g.roundRect(4, 4, W - 8, H - 8, r);
  if (card === "back") {
    g.fillStyle = "#f4f1ea";
    g.fill();
    g.beginPath();
    g.roundRect(18, 18, W - 36, H - 36, 14);
    g.fillStyle = "#b3122e";
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 3;
    for (let i = -H; i < W + H; i += 18) {
      g.beginPath();
      g.moveTo(i, 18);
      g.lineTo(i + H, H);
      g.stroke();
      g.beginPath();
      g.moveTo(i + H, 18);
      g.lineTo(i, H);
      g.stroke();
    }
    g.strokeStyle = "#f4f1ea";
    g.lineWidth = 6;
    g.strokeRect(30, 30, W - 60, H - 60);
  } else {
    g.fillStyle = "#fbfaf6";
    g.fill();
    g.strokeStyle = "#cfc8b8";
    g.lineWidth = 4;
    g.stroke();
    const { sym, red } = SUIT[card[1]];
    const rank = RANK[card[0]] ?? card[0];
    g.fillStyle = red ? "#d0172f" : "#15131b";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "bold 92px Arial, Helvetica, sans-serif";
    g.fillText(rank, 62, 70);
    g.font = "78px Arial, Helvetica, sans-serif";
    g.fillText(sym, 62, 150);
    g.font = "200px Arial, Helvetica, sans-serif";
    g.fillText(sym, W / 2 + 26, H / 2 + 62);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(card, tex);
  return tex;
};
