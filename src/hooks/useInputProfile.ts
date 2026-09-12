import { useEffect, useState } from "react";
import type { InputProfile } from "@/store/galleryStore";

const QUERY = "(max-width: 767px), (pointer: coarse)";

function readProfile(): InputProfile {
  if (typeof window === "undefined" || !window.matchMedia) return "desktop";
  return window.matchMedia(QUERY).matches ? "touch" : "desktop";
}

/** Touch/small-screen profile, re-evaluated on viewport or pointer-type change
 * (orientation flip, devtools resize). Never remounts the scene or the controller —
 * callers just read the current value. */
export function useInputProfile(): InputProfile {
  const [profile, setProfile] = useState<InputProfile>(readProfile);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setProfile(mql.matches ? "touch" : "desktop");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return profile;
}
