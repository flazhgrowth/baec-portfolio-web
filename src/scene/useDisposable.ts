import { useEffect } from "react";

interface Disposable {
  dispose(): void;
}

/** r3f only auto-disposes geometries/materials it constructs as JSX children — an
 * object built with useMemo and handed in via a `geometry`/`material` prop is not
 * tracked, so it needs this. */
export function useDisposable<T extends Disposable>(resource: T): void {
  useEffect(() => {
    return () => resource.dispose();
  }, [resource]);
}
