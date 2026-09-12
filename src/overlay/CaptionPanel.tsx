import { useGallery } from "@/store/useGallery";
import styles from "@/overlay/overlay.module.css";

export default function CaptionPanel() {
  const caption = useGallery((s) => s.caption);
  const visible = caption != null;

  return (
    <div
      className={styles.caption}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
    >
      <div className={styles.capTitle}>{caption?.title}</div>
      <div className={styles.capMeta}>{caption?.meta}</div>
      <div className={styles.capNote}>{caption?.note}</div>
      <div className={styles.capBack}>esc, or click the room, to step back</div>
    </div>
  );
}
