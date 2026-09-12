import { useStore } from "zustand";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import type { GalleryState } from "@/store/galleryStore";

/** Subscribes to one slice of the gallery store. Re-renders only when the selected
 * slice changes — e.g. `roomId` changes once per doorway transit, not per frame. */
export function useGallery<T>(selector: (state: GalleryState) => T): T {
  const store = useGalleryStore();
  return useStore(store, selector);
}
