import { useEffect, useRef, useState } from "react";
import { randomGuestName, submitVisitor } from "@/api/visitors";
import { fetchNotes, hasSentNote, submitNote } from "@/api/notes";
import { useGallery } from "@/store/useGallery";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import styles from "@/overlay/overlay.module.css";
import type { NoteRecord } from "@/api/types";

const MAX_NOTE_LENGTH = 240;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/** Notes left on one specific artwork — opened from CaptionPanel's "Leave a note"
 * button, distinct from the gallery-wide Guestbook/MessageBoard. Combines
 * Guestbook's lazy-fetch-on-open list with MessageBoard's awaited-submit form, but
 * keyed per artwork rather than fetched/sent once ever. */
export default function NotesPanel() {
  const store = useGalleryStore();
  const open = useGallery((s) => s.notesOpen);
  const artKey = useGallery((s) => s.notesArtKey);
  const visitorLogged = useGallery((s) => s.visitorLogged);

  const [notes, setNotes] = useState<NoteRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fetchedForKey = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !artKey || fetchedForKey.current === artKey) return;
    fetchedForKey.current = artKey;
    setNotes(null);
    setLoadError(null);
    setLoading(true);
    fetchNotes(artKey)
      .then((res) => setNotes(res.notes))
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Could not load notes for this piece.");
      })
      .finally(() => setLoading(false));
  }, [open, artKey]);

  if (!open || !artKey) return null;

  const sent = hasSentNote(artKey);
  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_NOTE_LENGTH && !submitting && !sent;

  async function handleSubmit() {
    if (!canSubmit || !artKey) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!visitorLogged) {
        await submitVisitor(randomGuestName());
        store.setState({ visitorLogged: true });
      }
      await submitNote(artKey, trimmed);
      setNotes((prev) => [{ name: "You", note: trimmed, left_at: new Date().toISOString() }, ...(prev ?? [])]);
      const known = store.getState().notedArtKeys;
      if (!known.includes(artKey)) store.setState({ notedArtKeys: [...known, artKey] });
      setText("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not send that note.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.guestbookPanel}>
      <div className={styles.guestbookHeader}>
        <span>Notes</span>
        <button className={styles.guestbookClose} onClick={() => store.setState({ notesOpen: false })}>
          close
        </button>
      </div>
      <div className={styles.guestbookBody}>
        {loading && <div className={styles.guestbookMuted}>Loading…</div>}
        {loadError && <div className={styles.guestbookMuted}>{loadError}</div>}
        {!loading && !loadError && notes?.length === 0 && (
          <div className={styles.guestbookMuted}>No notes yet — leave the first.</div>
        )}
        {notes?.map((n, i) => (
          <div key={n.id ?? `${n.name}-${n.left_at}-${i}`} className={styles.guestbookRow} style={{ display: "block" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className={styles.guestbookName}>{n.name}</span>
              <span className={styles.guestbookDate}>{formatDate(n.left_at)}</span>
            </div>
            <div style={{ opacity: 0.8, marginTop: 3 }}>{n.note}</div>
          </div>
        ))}
        {sent ? (
          <div className={styles.guestbookMuted}>You've already left a note here.</div>
        ) : (
          <>
            <textarea
              className={styles.messageInput}
              value={text}
              maxLength={MAX_NOTE_LENGTH}
              placeholder="Leave a note on this piece…"
              disabled={submitting}
              onChange={(e) => {
                setText(e.target.value);
                if (submitError) setSubmitError(null);
              }}
            />
            <button className={styles.messageSubmit} onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? "Sending…" : "Pin note"}
            </button>
            {submitError && <div className={styles.guestbookMuted}>{submitError}</div>}
          </>
        )}
      </div>
    </div>
  );
}
