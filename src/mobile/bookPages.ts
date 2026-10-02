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
  title: "The Nostalgia, and The Now",
  text: "Some of these photos were taken using my older camera that is no longer with me. I don't have many cameras to begin with. My mom bought me the 700D (thanks mom). Then, when I finally made some monehhh for myself, I sold that baddie, and get myself the RP. Now, I'm using the R6 Mark II. Some photos from the older camera actually came out pretty great (great is a grandeur word. When I say great, the orientation will always be about, whether I like it or not), and to be honest, I don't think I won't be able to recreate these photos again. So, enjoy. (older photos with older camera has that [N] in it)",
};

/** Closing page — one paragraph per entry. EDIT THE TEXT HERE. */
export const THANKS_PARAGRAPHS = [
  "I'm grateful that you decided to spend your time here, through the Collexion #1.",
  "Collexion Series (hopefully, there will more Collexions in the future. Still currating my photos, as of now) is basically, like how it sounds, collection.",
  "This bookshelf styling is actually the mobile version of Collexion #1 in Desktop. The Desktop version is a gallery, and gives you game like experience. So you can walk around the gallery (there are 4 rooms in the gallery, and the photos are spread across these 4 rooms), leaves notes, and note any photo you find interesting. (NB: you can also leave message for the whole experience in the gallery there)",
  "Again, thank you for making it to the last page. Hopefully, you can see the next iteration of Collexion."
];
