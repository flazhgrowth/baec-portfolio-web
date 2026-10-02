import { ARTWORKS } from "@/space/artworks";
import { isRealArtwork, type RealArtwork } from "@/space/types";

export const BOOK_TITLE = "Collexion #1";

/** First and last photograph of the book; everything else follows table order. */
const FIRST = "x1";
const LAST = "p2";

export interface BookPhoto extends RealArtwork {
  key: string;
}

/** Real photographs only (placeholders such as `sp1` have nothing to show),
 * opening with FIRST and closing with LAST. */
export const BOOK_PHOTOS: BookPhoto[] = (() => {
  const middle = Object.entries(ARTWORKS)
    .filter(([k, a]) => isRealArtwork(a) && k !== FIRST && k !== LAST)
    .map(([key, a]) => ({ key, ...(a as RealArtwork) }));
  const pick = (key: string): BookPhoto => ({ key, ...(ARTWORKS[key] as RealArtwork) });
  return [pick(FIRST), ...middle, pick(LAST)];
})();

/** Photos keyed n1, n2, ... are the Nostalgia set (the North Room on desktop). */
export const isNostalgia = (key: string): boolean => /^n\d+$/.test(key);

/** Section page shown just before the first Nostalgia photo. EDIT THE TEXT HERE. */
export const NOSTALGIA_INTRO = {
  kicker: "[N]",
  title: "Nostalgia",
  text: "Placeholder: a few words on why these photographs are set apart, the older frames, the first cameras, the years they come from.",
};

/** Closing page — one paragraph per entry. EDIT THE TEXT HERE. */
export const THANKS_PARAGRAPHS = [
  "I'm grateful that you decided to spend your time here, through the Collexion #1.",
  "This bookshelf styling is actually the mobile version of Collexion #1 in Desktop. The Desktop version is a gallery, and gives you game like experience. So you can walk around the gallery (there are 4 rooms in the gallery, and the photos are spread across these 4 rooms), leaves notes, and note any photo you find interesting. (NB: you can also leave message for the whole experience in the gallery there)",
  "Collexion Series (hopefully, there will more Collexions in the future. Still currating my photos, as of now) is basically, like how it sounds, collection.",
];
