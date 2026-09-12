import { useGallery } from "@/store/useGallery";
import styles from "@/overlay/overlay.module.css";

export default function Veil() {
  const veil = useGallery((s) => s.veil);
  return <div className={styles.veil} style={{ opacity: veil ? 1 : 0, background: "var(--surface-void)" }} />;
}
