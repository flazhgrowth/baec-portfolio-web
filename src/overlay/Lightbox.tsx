import { useEffect, useMemo, useState } from "react";
import { isRealArtwork } from "@/space/types";
import { useGallery } from "@/store/useGallery";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import styles from "@/overlay/overlay.module.css";
import type { ArtRecord, CompiledSpace } from "@/space/types";

/** A same-language stand-in for canvasTextures.ts's placeholderTexture, rendered
 * as an <img> (via a data URI) instead of a WebGL canvas — the Lightbox needs a
 * plain image element so it can size itself with ordinary CSS (max-width/
 * max-height), not a three.js texture. */
function placeholderDataUri(label: string, ar: number, dark: boolean): string {
  const w = 900;
  const h = Math.round(w / ar);
  const bg = dark ? "#24211d" : "#d5cfc2";
  const stroke = dark ? "rgba(255,248,236,0.14)" : "rgba(24,21,16,0.17)";
  const text = dark ? "rgba(240,233,221,0.82)" : "rgba(26,23,18,0.72)";
  const bw = Math.min(w * 0.5, 420);
  const bh = 64;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${bg}"/>` +
    `<pattern id="s" width="30" height="30" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">` +
    `<line x1="0" y1="0" x2="0" y2="30" stroke="${stroke}" stroke-width="9"/>` +
    `</pattern>` +
    `<rect width="${w}" height="${h}" fill="url(#s)"/>` +
    `<rect x="${(w - bw) / 2}" y="${(h - bh) / 2}" width="${bw}" height="${bh}" fill="${bg}"/>` +
    `<text x="50%" y="${h / 2 + 1}" fill="${text}" font-family="ui-monospace,Menlo,monospace" ` +
    `font-size="26" text-anchor="middle" dominant-baseline="middle">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A large, screen-fitting view of whatever picture the caption panel is
 * currently describing — shown alongside it (not instead of it) while `mode ===
 * "art"`. Purely decorative, like CaptionPanel: pointer-events stay off so a
 * click anywhere still reaches the canvas's own click-to-step-back handling. */
export default function Lightbox({ compiled }: { compiled: CompiledSpace }) {
  const store = useGalleryStore();
  const caption = useGallery((s) => s.caption);
  const hasNote = useGallery((s) => (caption ? s.notedArtKeys.includes(caption.key) : false));
  const visible = caption != null;
  const spec = compiled.spec;

  // Keeps rendering the last picture while fading out, instead of the image
  // vanishing the instant `caption` goes null (mode leaves "art" before the
  // fade transition finishes) — same visible-vs-content split CaptionPanel
  // uses, just carried a step further since an <img> can't blank gracefully.
  const [last, setLast] = useState<ArtRecord | null>(null);
  useEffect(() => {
    if (caption) setLast(caption);
  }, [caption]);
  const shown = caption ?? last;

  const src = useMemo(() => {
    if (!shown) return "";
    const art = shown.artwork;
    return isRealArtwork(art) ? art.src : placeholderDataUri(art.ph, art.ar, spec.darkPlaceholder);
  }, [shown, spec.darkPlaceholder]);

  return (
    <div
      className={styles.lightbox}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
    >
      {shown && (
        <div className={styles.lightboxFrameWrap}>
          <div className={styles.lightboxFrame} style={{ background: spec.frame }}>
            <div className={styles.lightboxMat} style={{ background: spec.mat }}>
              <img className={styles.lightboxImg} src={src} alt={shown.title} />
            </div>
          </div>
          {caption && (
            <button
              className={styles.lightboxNoteBtn}
              onClick={() =>
                store.setState({
                  notesOpen: true,
                  notesArtKey: caption.key,
                  guestbookOpen: false,
                  messageOpen: false,
                })
              }
            >
              {hasNote ? "View notes" : "Leave a note"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
