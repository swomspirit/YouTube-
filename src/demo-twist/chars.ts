import * as THREE from "three";

/*
 * Simple 2D characters (round head, dot eyes, line brows/mouth, stick arms with ball hands)
 * drawn on canvases and used as camera-facing sprites inside a 3D scene. Original designs.
 */
export type Look = {
  skin: string;
  shirt: string;
  hair: "short" | "bob" | "bald" | "curly" | "long";
  hairColor: string;
  hat?: "beanie" | "cap" | "flat";
  hatColor?: string;
  glasses?: "round" | "shades";
  beard?: boolean;
  back?: boolean; // seen from behind
};
export type Expr = "neutral" | "focus" | "smirk" | "worried" | "shock" | "angry";

const INK = "#1c1a22";
const cache = new Map<string, THREE.Texture>();

const drawHair = (g: CanvasRenderingContext2D, L: Look, cx: number, cy: number, r: number, back: boolean) => {
  g.fillStyle = L.hairColor;
  g.strokeStyle = INK;
  g.lineWidth = 6;
  if (L.hair === "bald") return;
  g.beginPath();
  if (back) {
    g.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (L.hair === "bob" || L.hair === "long") {
    g.arc(cx, cy - r * 0.05, r * 1.06, Math.PI * 0.9, Math.PI * 2.1);
    g.lineTo(cx + r * 1.06, cy + r * (L.hair === "long" ? 1.1 : 0.55));
    g.lineTo(cx + r * 0.8, cy + r * (L.hair === "long" ? 1.1 : 0.55));
    g.quadraticCurveTo(cx + r * 0.85, cy - r * 0.5, cx, cy - r * 0.62);
    g.quadraticCurveTo(cx - r * 0.85, cy - r * 0.5, cx - r * 0.8, cy + r * (L.hair === "long" ? 1.1 : 0.55));
    g.lineTo(cx - r * 1.06, cy + r * (L.hair === "long" ? 1.1 : 0.55));
    g.closePath();
  } else if (L.hair === "curly") {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.05 + (i / 8) * 0.9);
      g.moveTo(cx + Math.cos(a) * r + r * 0.28, cy + Math.sin(a) * r);
      g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.28, 0, Math.PI * 2);
    }
  } else {
    g.arc(cx, cy, r * 1.02, Math.PI * 1.02, Math.PI * 1.98);
    g.quadraticCurveTo(cx + r * 0.4, cy - r * 0.55, cx - r * 0.2, cy - r * 0.6);
    g.quadraticCurveTo(cx - r * 0.7, cy - r * 0.5, cx - r * 1.0, cy - r * 0.1);
    g.closePath();
  }
  g.fill();
  g.stroke();
};

/** Upper body (seated) character as a texture. Canvas 256x320, head centred near the top. */
export const characterTexture = (L: Look, expr: Expr = "neutral", blur = 0) => {
  const key = JSON.stringify([L, expr, blur]);
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 256;
  const H = 320;
  const RES = 2.5;
  const c = document.createElement("canvas");
  c.width = W * RES;
  c.height = H * RES;
  const g = c.getContext("2d")!;
  g.scale(RES, RES);
  if (blur) g.filter = `blur(${blur}px)`;
  g.lineJoin = "round";
  g.lineCap = "round";
  const cx = W / 2;
  const headY = 105;
  const r = 78;
  // body
  g.fillStyle = L.shirt;
  g.strokeStyle = INK;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(cx - 70, H);
  g.lineTo(cx - 62, 190);
  g.quadraticCurveTo(cx, 168, cx + 62, 190);
  g.lineTo(cx + 70, H);
  g.closePath();
  g.fill();
  g.stroke();
  // shirt shading
  g.fillStyle = "rgba(0,0,0,0.15)";
  g.fillRect(cx + 30, 196, 34, H - 196);
  if (!L.back) {
    // collar
    g.fillStyle = "#f4f2ec";
    g.beginPath();
    g.moveTo(cx - 20, 182);
    g.lineTo(cx, 206);
    g.lineTo(cx + 20, 182);
    g.closePath();
    g.fill();
  }
  // stick arms + ball hands resting on the table edge
  if (!L.back) {
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(cx - 58, 210);
    g.quadraticCurveTo(cx - 92, 262, cx - 62, 300);
    g.moveTo(cx + 58, 210);
    g.quadraticCurveTo(cx + 92, 262, cx + 62, 300);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(cx - 60, 300, 14, 0, Math.PI * 2);
    g.arc(cx + 60, 300, 14, 0, Math.PI * 2);
    g.fill();
  }
  // head
  if (L.back) drawHair(g, L, cx, headY, r, true);
  g.fillStyle = L.skin;
  g.beginPath();
  g.arc(cx, headY, r, 0, Math.PI * 2);
  if (!L.back) {
    g.fill();
    g.stroke();
    // soft cel shadow
    g.fillStyle = "rgba(0,0,0,0.1)";
    g.beginPath();
    g.arc(cx, headY, r, -Math.PI * 0.35, Math.PI * 0.45);
    g.quadraticCurveTo(cx + r * 0.55, headY, cx + r * 0.46, headY - r * 0.82);
    g.fill();
    // face
    g.fillStyle = INK;
    g.strokeStyle = INK;
    const ey = headY + 8;
    const ex = 26;
    const eh = expr === "shock" ? 15 : 11;
    if (L.glasses === "shades") {
      g.fillStyle = "#15131a";
      g.beginPath();
      g.roundRect(cx - ex - 22, ey - 14, 40, 26, 8);
      g.roundRect(cx + ex - 18, ey - 14, 40, 26, 8);
      g.fill();
      g.fillRect(cx - 6, ey - 6, 12, 5);
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.fillRect(cx - ex - 14, ey - 9, 10, 4);
      g.fillRect(cx + ex - 10, ey - 9, 10, 4);
    } else {
      g.beginPath();
      g.ellipse(cx - ex, ey, 8, eh, 0, 0, Math.PI * 2);
      g.ellipse(cx + ex, ey, 8, eh, 0, 0, Math.PI * 2);
      g.fill();
      if (L.glasses === "round") {
        g.lineWidth = 5;
        g.beginPath();
        g.arc(cx - ex, ey, 19, 0, Math.PI * 2);
        g.moveTo(cx + ex + 19, ey);
        g.arc(cx + ex, ey, 19, 0, Math.PI * 2);
        g.moveTo(cx - ex + 19, ey);
        g.lineTo(cx + ex - 19, ey);
        g.stroke();
      }
    }
    // brows
    g.lineWidth = 7;
    g.beginPath();
    const by = ey - 26;
    const tilt = expr === "angry" || expr === "focus" ? 7 : expr === "worried" ? -7 : expr === "shock" ? -2 : 0;
    const lift = expr === "shock" ? -8 : 0;
    g.moveTo(cx - ex - 16, by + lift - tilt);
    g.lineTo(cx - ex + 14, by + lift + tilt);
    g.moveTo(cx + ex + 16, by + lift - tilt);
    g.lineTo(cx + ex - 14, by + lift + tilt);
    g.stroke();
    // mouth
    g.lineWidth = 5;
    g.beginPath();
    const my = headY + 44;
    if (expr === "shock") {
      g.ellipse(cx, my + 4, 10, 13, 0, 0, Math.PI * 2);
      g.fillStyle = "#4a1a22";
      g.fill();
    } else if (expr === "smirk") {
      g.moveTo(cx - 12, my + 2);
      g.quadraticCurveTo(cx + 6, my + 6, cx + 16, my - 4);
    } else if (expr === "worried") {
      g.moveTo(cx - 14, my + 4);
      g.quadraticCurveTo(cx, my - 4, cx + 14, my + 4);
    } else {
      g.moveTo(cx - 12, my);
      g.lineTo(cx + 12, my);
    }
    g.stroke();
    if (L.beard) {
      g.fillStyle = L.hairColor;
      g.beginPath();
      g.moveTo(cx - r * 0.85, headY + 10);
      g.quadraticCurveTo(cx - r * 0.6, headY + r * 1.05, cx, headY + r * 1.08);
      g.quadraticCurveTo(cx + r * 0.6, headY + r * 1.05, cx + r * 0.85, headY + 10);
      g.quadraticCurveTo(cx + r * 0.3, headY + 34, cx, headY + 34);
      g.quadraticCurveTo(cx - r * 0.3, headY + 34, cx - r * 0.85, headY + 10);
      g.fill();
      g.lineWidth = 6;
      g.stroke();
      g.strokeStyle = INK;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(cx - 12, headY + 44);
      g.lineTo(cx + 12, headY + 44);
      g.stroke();
    }
    drawHair(g, L, cx, headY, r, false);
  }
  // hats
  if (L.hat) {
    g.fillStyle = L.hatColor ?? "#2a2d3a";
    g.strokeStyle = INK;
    g.lineWidth = 6;
    g.beginPath();
    if (L.hat === "beanie") {
      g.arc(cx, headY - 6, r * 1.04, Math.PI, Math.PI * 2);
      g.lineTo(cx + r * 1.06, headY - 4);
      g.lineTo(cx - r * 1.06, headY - 4);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.fillRect(cx - r * 1.04, headY - 26, r * 2.08, 22);
    } else if (L.hat === "cap") {
      g.arc(cx, headY - 10, r * 1.02, Math.PI, Math.PI * 2);
      g.closePath();
      g.fill();
      g.stroke();
      g.beginPath();
      g.ellipse(cx - 30, headY - 12, 70, 14, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    } else {
      g.ellipse(cx, headY - 40, r * 1.05, r * 0.5, 0, Math.PI, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
};

/** Deterministic random looks for crowd characters. */
export const randomLook = (i: number): Look => {
  const r = (k: number) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const skins = ["#f3d2b3", "#e6b48f", "#c98e64", "#9c6a46", "#70482f", "#f5dcc4"];
  const shirts = ["#3d5a80", "#9a3b3b", "#56794b", "#6b5b95", "#c2a14a", "#3c3c46", "#d07a3a", "#2e6f6f", "#b25a7a"];
  const hairs: Look["hair"][] = ["short", "bob", "bald", "curly", "long", "short"];
  const hairColors = ["#2b1d16", "#5a3a22", "#a8743f", "#1b1b20", "#8f8f8f", "#c9a25c"];
  const L: Look = {
    skin: skins[Math.floor(r(1) * skins.length)],
    shirt: shirts[Math.floor(r(2) * shirts.length)],
    hair: hairs[Math.floor(r(3) * hairs.length)],
    hairColor: hairColors[Math.floor(r(4) * hairColors.length)],
  };
  if (r(5) < 0.25) {
    L.hat = (["beanie", "cap", "flat"] as const)[Math.floor(r(6) * 3)];
    L.hatColor = ["#2a2d3a", "#5c4a3a", "#3a4f6a", "#6a3a3a"][Math.floor(r(7) * 4)];
  }
  if (r(8) < 0.2) L.glasses = r(9) < 0.5 ? "round" : "shades";
  if (r(10) < 0.15) L.beard = true;
  return L;
};
