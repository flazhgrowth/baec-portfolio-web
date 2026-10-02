import { BOOK_PHOTOS, BOOK_TITLE } from "./bookPages";
import s from "./mobile.module.css";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = cls;
  if (text) node.textContent = text;
  return node;
}

/** Builds the book's pages as plain DOM. StPageFlip moves and clones page
 * nodes, which React must not own, so these are created imperatively. */
export function buildPages(): HTMLElement[] {
  const pages: HTMLElement[] = [];

  const cover = el("div", `${s.page} ${s.cover}`);
  cover.dataset.density = "hard";
  cover.append(
    el("div", s.coverRule),
    el("h1", s.coverTitle, BOOK_TITLE),
    el("p", s.coverSub, "Photographs & notes"),
    el("p", s.coverHint, "swipe to turn"),
  );
  pages.push(cover);

  BOOK_PHOTOS.forEach((p, i) => {
    const page = el("div", `${s.page} ${s.paper}`);
    const frame = el("div", p.ar < 1 ? `${s.photo} ${s.photoPortrait}` : s.photo);
    const img = el("img", s.img);
    img.alt = p.title || p.meta;
    img.decoding = "async";
    img.draggable = false;
    img.dataset.src = p.src;
    frame.append(img);

    const plate = el("div", s.plate);
    if (p.title) plate.append(el("h2", s.pTitle, p.title));
    plate.append(el("p", s.pMeta, p.meta), el("p", s.pNote, p.note));
    page.append(frame, plate, el("span", s.folio, String(i + 1)));
    pages.push(page);
  });

  // keeps the page count even so the closing cover pairs correctly in spreads
  const fin = el("div", `${s.page} ${s.paper} ${s.fin}`);
  fin.append(el("p", s.finText, "Thank you for looking."));
  pages.push(fin);

  const back = el("div", `${s.page} ${s.cover}`);
  back.dataset.density = "hard";
  back.append(el("div", s.coverRule));
  pages.push(back);

  return pages;
}

/** Sets `src` for pages within `reach` of `index` — one spread plus neighbours —
 * so a phone never pulls all the photographs at once. */
export function loadAround(pages: HTMLElement[], index: number, reach = 2): void {
  for (let i = Math.max(0, index - reach); i <= Math.min(pages.length - 1, index + reach); i++) {
    const img = pages[i].querySelector<HTMLImageElement>("img[data-src]");
    if (img && !img.src) img.src = img.dataset.src ?? "";
  }
}
