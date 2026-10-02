import { BOOK_PHOTOS, BOOK_TITLE, NOSTALGIA_INTRO, THANKS_PARAGRAPHS, isNostalgia } from "./bookPages";
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
    el("p", s.coverSub, "The Photos, and the stories behind it, kinda.."),
    el("p", s.coverHint, "swipe to turn"),
  );
  pages.push(cover);

  // Contents page: entries are filled in once every page's index is known.
  const contents = el("div", `${s.page} ${s.paper} ${s.toc}`);
  const tocList = el("ul", s.tocList);
  contents.append(el("h2", s.introTitle, "Contents"), tocList);
  pages.push(contents);
  const addToc = (label: string, index: number) => {
    const li = el("li", s.tocItem);
    const btn = el("button", s.tocBtn);
    btn.type = "button";
    btn.dataset.goto = String(index);
    btn.append(el("span", s.tocLabel, label), el("span", s.tocNum, String(index + 1)));
    li.append(btn);
    tocList.append(li);
  };

  let introDone = false;
  addToc("Photographs", pages.length);
  BOOK_PHOTOS.forEach((p) => {
    if (!introDone && isNostalgia(p.key)) {
      introDone = true;
      addToc(`${NOSTALGIA_INTRO.kicker} ${NOSTALGIA_INTRO.title}`, pages.length);
      const intro = el("div", `${s.page} ${s.paper} ${s.fin}`);
      intro.append(
        el("p", s.introKicker, NOSTALGIA_INTRO.kicker),
        el("h2", s.introTitle, NOSTALGIA_INTRO.title),
        el("p", s.finText, NOSTALGIA_INTRO.text),
      );
      pages.push(intro);
    }
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
    page.append(frame, plate, el("span", s.folio, String(pages.length + 1)));
    pages.push(page);
  });

  const thanks = el("div", `${s.page} ${s.paper} ${s.thanks}`);
  addToc("Thank you", pages.length);
  thanks.append(el("h2", s.introTitle, "Thank you"));
  THANKS_PARAGRAPHS.forEach((t) => thanks.append(el("p", s.thanksText, t)));
  pages.push(thanks);

  // blank leaf keeps the total even so the back cover pairs correctly in spreads
  if ((pages.length + 1) % 2 !== 0) pages.push(el("div", `${s.page} ${s.paper}`));

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
