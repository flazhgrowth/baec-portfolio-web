import type { Artwork } from "@/space/types";

/** The artwork table — transcribed verbatim from design/gallery3d.js's `C`. */
export const ARTWORKS: Record<string, Artwork> = {
  p1: {
    src: "/art/p1.jpg",
    title: "Crossing, 23:40",
    meta: "Oshiage, Tokyo · 2025",
    ar: 1.5,
    note: "A woman, two dogs and the tower. The only frame where all three held still.",
  },
  p2: {
    src: "/art/p2.jpg",
    title: "Senbon Torii",
    meta: "Fushimi Inari, Kyoto · 2025",
    ar: 1.5,
    note: "Eight thousand gates, and one person walking away from every one of them.",
  },
  p3: {
    src: "/art/p3.jpg",
    title: "Hōzenji Yokochō, Rain",
    meta: "Namba, Osaka · 2025",
    ar: 1.5,
    note: "Wet stone holds light better than anything else in the city.",
  },
  x1: {
    ph: "PHOTO 04 · 3:2",
    title: "Untitled",
    meta: "awaiting print",
    ar: 1.5,
    note: "An empty hang. Drop a photograph in to fill it.",
  },
  x2: {
    ph: "PHOTO 05 · 4:5",
    title: "Untitled",
    meta: "awaiting print",
    ar: 0.8,
    note: "An empty hang. Drop a photograph in to fill it.",
  },
  x3: {
    ph: "PHOTO 06 · 3:2",
    title: "Untitled",
    meta: "awaiting print",
    ar: 1.5,
    note: "An empty hang. Drop a photograph in to fill it.",
  },
  x4: {
    ph: "PHOTO 07 · 1:1",
    title: "Untitled",
    meta: "awaiting print",
    ar: 1.0,
    note: "An empty hang. Drop a photograph in to fill it.",
  },
  x5: {
    ph: "PHOTO 08 · 4:5",
    title: "Untitled",
    meta: "awaiting print",
    ar: 0.8,
    note: "An empty hang. Drop a photograph in to fill it.",
  },
  x6: {
    ph: "PHOTO 09 · 3:2",
    title: "Untitled",
    meta: "awaiting print",
    ar: 1.5,
    note: "An empty hang. Drop a photograph in to fill it.",
  },
};
