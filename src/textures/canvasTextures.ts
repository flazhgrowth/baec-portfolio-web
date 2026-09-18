import * as THREE from "three";
import type { PlaquePalette } from "@/space/types";

/** Canvas-generated placeholder/plaque/sky textures, cached by content key so the
 * six placeholder hangs that repeat across rooms share one texture instead of the
 * prototype's fresh-canvas-per-instance. */
const cache = new Map<string, THREE.CanvasTexture>();

function cached(key: string, build: () => THREE.CanvasTexture): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const tex = build();
  cache.set(key, tex);
  return tex;
}

export function placeholderTexture(label: string, ar: number, dark: boolean): THREE.CanvasTexture {
  return cached(`ph:${label}:${ar}:${dark}`, () => {
    const w = 900;
    const h = Math.round(w / ar);
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d")!;
    const bg = dark ? "#24211d" : "#d5cfc2";
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = dark ? "rgba(255,248,236,0.11)" : "rgba(24,21,16,0.17)";
    g.lineWidth = 9;
    for (let i = -h; i < w + h; i += 30) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i - h, h);
      g.stroke();
    }
    const bw = Math.min(w * 0.82, 560);
    const bh = 86;
    g.fillStyle = bg;
    g.fillRect((w - bw) / 2, (h - bh) / 2, bw, bh);
    g.fillStyle = dark ? "rgba(240,233,221,0.82)" : "rgba(26,23,18,0.72)";
    g.font = "500 34px ui-monospace, SFMono-Regular, Menlo, monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, w / 2, h / 2 + 1);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}

export function plaqueTexture(title: string, meta: string, pal: PlaquePalette): THREE.CanvasTexture {
  return cached(`plaque:${title}|${meta}|${pal.bg}|${pal.ink}`, () => {
    const w = 512;
    const h = 216;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d")!;
    g.fillStyle = pal.bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = pal.ink;
    g.font = '500 38px Georgia, "Times New Roman", serif';
    g.textBaseline = "top";
    g.fillText(title, 22, 46);
    g.globalAlpha = 0.62;
    g.font = "400 24px ui-monospace, SFMono-Regular, Menlo, monospace";
    g.fillText(meta, 22, 112);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}

/** Drawn curtain hung across the Special Room's doorway while it's locked — see
 * scene/GateVeil.tsx. A single arch-shaped panel fills the whole opening (not a
 * repeating strip), so the canvas is drawn once at the doorway's own aspect. */
export function veilTexture(): THREE.CanvasTexture {
  return cached("veil", () => {
    const w = 512;
    const h = 768;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d")!;

    g.fillStyle = "#2a1418";
    g.fillRect(0, 0, w, h);

    // vertical fold shading — alternating soft light/dark bands read as draped fabric
    const folds = 14;
    const foldW = w / folds;
    for (let i = 0; i < folds; i++) {
      const x = i * foldW;
      const grad = g.createLinearGradient(x, 0, x + foldW, 0);
      grad.addColorStop(0, "rgba(0,0,0,0.32)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.07)");
      grad.addColorStop(1, "rgba(0,0,0,0.32)");
      g.fillStyle = grad;
      g.fillRect(x, 0, foldW, h);
    }

    // darker valance along the top, vignette toward the floor
    g.fillStyle = "rgba(0,0,0,0.28)";
    g.fillRect(0, 0, w, h * 0.07);
    const vg = g.createLinearGradient(0, h * 0.55, 0, h);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.4)");
    g.fillStyle = vg;
    g.fillRect(0, h * 0.55, w, h * 0.45);

    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "rgba(201,167,105,0.85)";
    g.font = '400 30px Georgia, "Times New Roman", serif';
    g.fillText("BY INVITATION ONLY", w / 2, h * 0.5);
    g.font = "400 16px ui-monospace, SFMono-Regular, Menlo, monospace";
    g.fillStyle = "rgba(201,167,105,0.55)";
    g.fillText("· THE AIMER ·", w / 2, h * 0.5 + 34);

    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}

export function skyPaneTexture(a: string, b: string): THREE.CanvasTexture {
  return cached(`sky:${a}:${b}`, () => {
    const n = 256;
    const cv = document.createElement("canvas");
    cv.width = n;
    cv.height = n;
    const g = cv.getContext("2d")!;
    const rg = g.createRadialGradient(n / 2, n / 2, n * 0.05, n / 2, n / 2, n * 0.62);
    rg.addColorStop(0, a);
    rg.addColorStop(1, b);
    g.fillStyle = rg;
    g.fillRect(0, 0, n, n);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}
