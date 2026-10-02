import { useEffect, useRef, useState, type CSSProperties } from "react";
import GalleryCanvas from "@/scene/GalleryCanvas";
import Overlay from "@/overlay/Overlay";
import { GalleryStoreContext } from "@/store/GalleryStoreContext";
import { createGalleryStore, type GalleryStore, type InputProfile } from "@/store/galleryStore";
import { isWebGLSupported } from "@/hooks/webgl";
import { NOCTURNE_COMPILED } from "@/space/compiled";
import { ARTWORKS } from "@/space/artworks";
import { isRealArtwork } from "@/space/types";
import { onPhotosSettled, preloadPhotoTextures } from "@/textures/photoTextures";
import { fetchNotesSummary } from "@/api/notes";

export default function DesktopApp({ profile }: { profile: InputProfile }) {
  const [webglOk] = useState(isWebGLSupported);

  const storeRef = useRef<GalleryStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createGalleryStore({ roomId: NOCTURNE_COMPILED.startRoom.id, profile });
  }
  const store = storeRef.current;

  useEffect(() => {
    store.setState({ profile });
  }, [store, profile]);

  useEffect(() => {
    const sources = Object.values(ARTWORKS)
      .filter(isRealArtwork)
      .map((a) => a.src);
    preloadPhotoTextures(sources);
    return onPhotosSettled(() => store.setState({ assetsReady: true }));
  }, [store]);

  useEffect(() => {
    fetchNotesSummary()
      .then((artKeys) => store.setState({ notedArtKeys: artKeys }))
      .catch(() => {
        // best-effort — an outage here should only mean the frame cue doesn't show
      });
  }, [store]);

  const gateStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100vh",
    padding: 40,
    textAlign: "center",
    fontFamily: "var(--font-sans)",
    fontSize: 15,
    lineHeight: 1.6,
    opacity: 0.75,
  };

  if (!webglOk) {
    return (
      <div style={gateStyle}>
        This gallery needs WebGL, which this browser doesn&apos;t support. Try a recent
        version of Chrome, Firefox, Safari, or Edge.
      </div>
    );
  }

  return (
    <GalleryStoreContext.Provider value={store}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: "var(--surface-void)",
        }}
      >
        <GalleryCanvas compiled={NOCTURNE_COMPILED} />
        <Overlay compiled={NOCTURNE_COMPILED} />
      </div>
    </GalleryStoreContext.Provider>
  );
}
