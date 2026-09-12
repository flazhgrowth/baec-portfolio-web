import { createContext, useContext } from "react";
import type { GalleryStore } from "@/store/galleryStore";

export const GalleryStoreContext = createContext<GalleryStore | null>(null);

export function useGalleryStore(): GalleryStore {
  const store = useContext(GalleryStoreContext);
  if (!store) throw new Error("useGalleryStore must be used within GalleryStoreContext");
  return store;
}
