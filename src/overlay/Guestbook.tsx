import { useEffect, useRef, useState } from "react";
import { fetchGuestbook } from "@/api/visitors";
import { useGallery } from "@/store/useGallery";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import styles from "@/overlay/overlay.module.css";
import type { VisitorRecord } from "@/api/types";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/** Fetched lazily on first open, not preloaded — a backend outage should only ever
 * degrade the guestbook panel, never the entry flow. */
export default function Guestbook() {
  const store = useGalleryStore();
  const open = useGallery((s) => s.guestbookOpen);
  const [entries, setEntries] = useState<VisitorRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    fetchGuestbook()
      .then((res) => setEntries(res.guests))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load the guestbook.");
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.guestbookPanel}>
      <div className={styles.guestbookHeader}>
        <span>Guestbook</span>
        <button className={styles.guestbookClose} onClick={() => store.setState({ guestbookOpen: false })}>
          close
        </button>
      </div>
      <div className={styles.guestbookBody}>
        {loading && <div className={styles.guestbookMuted}>Loading…</div>}
        {error && <div className={styles.guestbookMuted}>{error}</div>}
        {!loading && !error && entries?.length === 0 && (
          <div className={styles.guestbookMuted}>No visitors yet — be the first.</div>
        )}
        {entries?.map((v) => (
          <div key={v.id ?? `${v.name}-${v.visited_at}`} className={styles.guestbookRow}>
            <span className={styles.guestbookName}>{v.name}</span>
            <span className={styles.guestbookDate}>{formatDate(v.visited_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
