import { useEffect, useRef, useState } from "react";
import { PageFlip } from "page-flip";
import { buildPages, loadAround } from "./buildPages";
import s from "./mobile.module.css";

export default function Book({ onClose }: { onClose: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const pages = buildPages();
    // the library owns this subtree: React never renders children into `book`
    const book = document.createElement("div");
    host.append(book);

    const flip = new PageFlip(book, {
      width: 360,
      height: 560,
      size: "stretch",
      minWidth: 240,
      maxWidth: 520,
      minHeight: 380,
      maxHeight: 900,
      showCover: true,
      usePortrait: true,
      drawShadow: true,
      maxShadowOpacity: 0.45,
      flippingTime: 700,
      mobileScrollSupport: false,
      swipeDistance: 24,
      startZIndex: 0,
    });
    flip.loadFromHTML(pages);
    flipRef.current = flip;
    setCount(flip.getPageCount());
    loadAround(pages, 0);
    flip.on("flip", (e) => {
      const i = e.data as number;
      setPage(i);
      loadAround(pages, i, 3);
    });

    // delegated: StPageFlip may move/clone page nodes, so no per-node listeners
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-goto]");
      if (btn) flip.flip(Number(btn.dataset.goto));
    };
    host.addEventListener("click", onClick);

    return () => {
      host.removeEventListener("click", onClick);
      flipRef.current = null;
      flip.destroy();
      book.remove();
    };
  }, []);

  return (
    <div className={s.bookScreen}>
      <header className={s.bar}>
        <button type="button" className={s.barBtn} onClick={onClose}>
          ← Shelf
        </button>
        <span className={s.barCount}>{count ? `${page + 1} / ${count}` : ""}</span>
      </header>
      <div ref={hostRef} className={s.bookHost} />
      <footer className={s.nav}>
        <button type="button" className={s.navBtn} onClick={() => flipRef.current?.flipPrev()}>
          ‹
        </button>
        <button type="button" className={s.navBtn} onClick={() => flipRef.current?.flipNext()}>
          ›
        </button>
      </footer>
    </div>
  );
}
