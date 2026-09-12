import * as THREE from "three";

/**
 * Suspense-compatible texture cache for the real photographs. Unlike the prototype
 * (which sets `colorSpace` in the load callback, after the material referencing the
 * texture already exists) this sets it before the texture is ever handed to a
 * <meshStandardMaterial>, since `readPhotoTexture` only returns once loading has
 * finished.
 */
type Entry =
  | { status: "pending"; promise: Promise<void> }
  | { status: "ready"; texture: THREE.Texture }
  | { status: "error"; error: unknown };

const entries = new Map<string, Entry>();
const loader = new THREE.TextureLoader();
const settledListeners = new Set<() => void>();

function allSettled(): boolean {
  return entries.size > 0 && [...entries.values()].every((e) => e.status !== "pending");
}

function notifySettled(): void {
  if (allSettled()) settledListeners.forEach((fn) => fn());
}

function startLoad(src: string): Entry {
  const promise = new Promise<void>((resolve) => {
    loader.load(
      src,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        entries.set(src, { status: "ready", texture });
        notifySettled();
        resolve();
      },
      undefined,
      (err: unknown) => {
        entries.set(src, { status: "error", error: err });
        notifySettled();
        resolve();
      },
    );
  });
  const entry: Entry = { status: "pending", promise };
  entries.set(src, entry);
  return entry;
}

/** Suspense read: throws the in-flight promise while loading, the error once one
 * occurred, or returns the ready texture. */
export function readPhotoTexture(src: string): THREE.Texture {
  const entry = entries.get(src) ?? startLoad(src);
  if (entry.status === "ready") return entry.texture;
  if (entry.status === "error") throw entry.error;
  throw entry.promise;
}

/** Kicks off downloads without suspending — call at module load so photos are in
 * flight while the visitor reads the title card and types a name. */
export function preloadPhotoTextures(sources: string[]): void {
  for (const src of sources) {
    if (!entries.has(src)) startLoad(src);
  }
}

/** Fires once every texture requested so far has settled (loaded or failed). Used
 * to gate the "Enter the room" button on `assetsReady` without drei's useProgress. */
export function onPhotosSettled(cb: () => void): () => void {
  if (allSettled()) {
    cb();
    return () => {};
  }
  settledListeners.add(cb);
  return () => settledListeners.delete(cb);
}
