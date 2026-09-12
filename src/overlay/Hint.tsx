import { useGallery } from "@/store/useGallery";
import styles from "@/overlay/overlay.module.css";

const HINTS = {
  desktop: "drag to look · w a s d to walk · click a photograph or a doorway",
  touch: "drag to look · tap a photograph or a doorway",
};

export default function Hint() {
  const hint = useGallery((s) => s.hint);
  const profile = useGallery((s) => s.profile);
  return (
    <div className={styles.hint} style={{ opacity: hint === "shown" ? 0.5 : 0 }}>
      {HINTS[profile]}
    </div>
  );
}
