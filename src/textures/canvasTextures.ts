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
