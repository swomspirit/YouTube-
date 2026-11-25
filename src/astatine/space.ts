import * as THREE from "three";
import { random } from "remotion";

/*
 * Procedural textures for the space scenes. Everything is seeded (remotion `random`)
 * so every render process produces identical pixels.
 */

// ---------- 3D value noise (seamless on a sphere) ----------
const hash = (x: number, y: number, z: number, seed: number) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};
const fade = (t: number) => t * t * (3 - 2 * t);
const noise3 = (x: number, y: number, z: number, seed: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const l = (a: number, b: number, k: number) => a + (b - a) * k;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz, seed);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
};
export const fbm = (x: number, y: number, z: number, seed: number, oct = 5) => {
  let a = 0.5, f = 1, s = 0, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * noise3(x * f, y * f, z * f, seed + i * 17);
    n += a;
    a *= 0.5;
    f *= 2.03;
  }
  return s / n;
};

/** Paint an equirectangular sphere texture from a per-pixel function of the unit direction. */
const sphereTexture = (w: number, h: number, px: (x: number, y: number, z: number, lat: number) => [number, number, number, number?]) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    const lat = Math.PI * (0.5 - (j + 0.5) / h);
    const cy = Math.sin(lat), cr = Math.cos(lat);
    for (let i = 0; i < w; i++) {
      const lon = (2 * Math.PI * (i + 0.5)) / w;
      const [r, gg, b, a = 255] = px(cr * Math.cos(lon), cy, cr * Math.sin(lon), lat);
      const k = (j * w + i) * 4;
      img.data[k] = r;
      img.data[k + 1] = gg;
      img.data[k + 2] = b;
      img.data[k + 3] = a;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
};
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * Math.min(1, Math.max(0, k)));

export const earthTexture = () =>
  sphereTexture(1024, 512, (x, y, z, lat) => {
    const n = fbm(x * 1.6 + 3, y * 1.6, z * 1.6, 11, 6);
    const ice = Math.abs(lat) - 1.3 + (fbm(x * 6, y * 6, z * 6, 5, 3) - 0.5) * 0.35;
    if (ice > 0) return [236, 243, 250];
    if (n < 0.52) {
      const d = (0.52 - n) / 0.52;
      return mix([40, 110, 180], [10, 40, 100], d * 2.2).map(Math.round) as [number, number, number];
    }
    const hgt = (n - 0.52) / 0.48;
    const dry = fbm(x * 4, y * 4, z * 4, 23, 3);
    const green = mix([62, 130, 66], [35, 92, 48], hgt * 2);
    const desert = [196, 170, 112];
    return mix(green, desert, (dry - 0.5) * 3 + (Math.abs(lat) < 0.45 ? 0.3 : -0.3)).map(Math.round) as [number, number, number];
  });

export const cloudTexture = () =>
  sphereTexture(1024, 512, (x, y, z) => {
    const n = fbm(x * 2.6, y * 2.6 + 5, z * 2.6, 41, 5);
    const a = Math.max(0, Math.min(1, (n - 0.53) * 4.5));
    return [255, 255, 255, Math.round(a * 220)];
  });

export const marsTexture = () =>
  sphereTexture(512, 256, (x, y, z, lat) => {
    const n = fbm(x * 2.2, y * 2.2, z * 2.2, 77, 5);
    const c = mix([198, 98, 52], [122, 52, 30], (n - 0.35) * 2.4);
    return (Math.abs(lat) > 1.35 ? [238, 225, 215] : c.map(Math.round)) as [number, number, number];
  });

const banded = (seed: number, palette: number[][], turb: number) =>
  sphereTexture(512, 256, (x, y, z) => {
    const w = fbm(x * 3, y * 3, z * 3, seed, 4) * turb;
    const band = (Math.sin((y + w) * 22) + 1) / 2;
    const band2 = (Math.sin((y + w * 0.6) * 9 + 1.3) + 1) / 2;
    const a = palette[0], b = palette[1], c = palette[2];
    return mix(mix(a, b, band), c, band2 * 0.6).map(Math.round) as [number, number, number];
  });
export const jupiterTexture = () => banded(91, [[214, 188, 156], [176, 120, 82], [238, 226, 205]], 0.35);
export const saturnTexture = () => banded(53, [[226, 204, 158], [196, 166, 116], [240, 228, 196]], 0.12);

export const ringTexture = () => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 8;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 512; i++) {
    const r = i / 512;
    const a = (0.35 + 0.65 * random(`ring${Math.floor(i / 3)}`)) * (r > 0.08 && r < 0.95 ? 1 : 0) * (r > 0.62 && r < 0.67 ? 0.1 : 1);
    g.fillStyle = `rgba(${220 - r * 40},${200 - r * 50},${160 - r * 40},${a})`;
    g.fillRect(i, 0, 1, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/** Soft round glow sprite. */
export const glowTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.2, "rgba(255,255,255,0.65)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

/** Wispy nebula cloud (white, tinted by the sprite material). */
export const nebulaTexture = (seed: number) => {
  const N = 256;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  const img = g.createImageData(N, N);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const u = i / N - 0.5, v = j / N - 0.5;
      const d = Math.sqrt(u * u + v * v) * 2;
      const n = fbm(u * 3.5, v * 3.5, seed * 0.37, seed, 6);
      const a = Math.max(0, (n - 0.42) * 2.6) * Math.max(0, 1 - d) ** 1.6;
      const k = (j * N + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
      img.data[k + 3] = Math.round(Math.min(1, a) * 255);
    }
  g.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
};

/** Spiral galaxy point cloud: positions + colors. */
export const galaxyPoints = (count = 9000) => {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const core = new THREE.Color("#ffe2b8");
  const arm = new THREE.Color("#7fb4ff");
  const pink = new THREE.Color("#ff8fd8");
  for (let i = 0; i < count; i++) {
    const r = Math.pow(random(`gr${i}`), 1.6) * 10;
    const branch = (i % 4) * ((Math.PI * 2) / 4);
    const spin = r * 0.55;
    const sc = 0.35 + r * 0.06;
    const rx = (random(`gx${i}`) - 0.5) * sc * 2;
    const ry = (random(`gy${i}`) - 0.5) * sc * 0.5;
    const rz = (random(`gz${i}`) - 0.5) * sc * 2;
    pos[i * 3] = Math.cos(branch + spin) * r + rx;
    pos[i * 3 + 1] = ry;
    pos[i * 3 + 2] = Math.sin(branch + spin) * r + rz;
    const c = core.clone().lerp(random(`gc${i}`) > 0.85 ? pink : arm, Math.min(1, r / 7));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  return { pos, col };
};
