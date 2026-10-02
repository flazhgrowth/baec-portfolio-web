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
