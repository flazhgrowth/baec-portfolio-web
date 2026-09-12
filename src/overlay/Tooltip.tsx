import { useEffect, useRef } from "react";
import { tooltipNodeRef } from "@/controller/tooltipNode";
import { useGallery } from "@/store/useGallery";
import styles from "@/overlay/overlay.module.css";

/** The controller writes this node's left/top directly on pointermove, bypassing
 * React entirely — only the text (a store value, changed on hover transition) goes
 * through a normal render. */
export default function Tooltip() {
  const text = useGallery((s) => s.tooltipText);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tooltipNodeRef.current = ref.current;
    return () => {
      tooltipNodeRef.current = null;
    };
  }, []);

  return (
    <div ref={ref} className={styles.tooltip} style={{ opacity: text ? 1 : 0 }}>
      {text}
    </div>
  );
}
