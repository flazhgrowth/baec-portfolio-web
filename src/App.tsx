import { lazy, Suspense } from "react";
import { useInputProfile } from "@/hooks/useInputProfile";

// Each experience is its own chunk so a phone never downloads three.js and a
// desktop never downloads the photo book.
const DesktopApp = lazy(() => import("@/DesktopApp"));
const MobileApp = lazy(() => import("@/mobile/MobileApp"));

export default function App() {
  const profile = useInputProfile();
  return (
    <Suspense fallback={null}>
      {profile === "touch" ? <MobileApp /> : <DesktopApp profile={profile} />}
    </Suspense>
  );
}
