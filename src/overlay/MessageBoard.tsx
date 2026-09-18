import { useState } from "react";
import { randomGuestName, submitVisitor } from "@/api/visitors";
import { submitMessage, hasSentMessage } from "@/api/messages";
import { useGallery } from "@/store/useGallery";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import styles from "@/overlay/overlay.module.css";

const MAX_MESSAGE_LENGTH = 500;

/** Lets a visitor leave a freeform message, separate from the name-gate guestbook
 * entry. POST /messages requires a POST /guests record for the same visit_id — a
 * visitor who used "Skip" on the title card never triggered that call, so this
 * registers one (with a random name) right before the first send, instead of
 * surfacing a confusing "visit not found" error for having skipped the name gate. */
export default function MessageBoard() {
  const store = useGalleryStore();
  const open = useGallery((s) => s.messageOpen);
  const visitorLogged = useGallery((s) => s.visitorLogged);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(() => hasSentMessage());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !submitting && !sent;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!visitorLogged) {
        await submitVisitor(randomGuestName());
        store.setState({ visitorLogged: true });
      }
      await submitMessage(trimmed);
      setSent(true);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.guestbookPanel}>
      <div className={styles.guestbookHeader}>
        <span>Leave a Message</span>
        <button className={styles.guestbookClose} onClick={() => store.setState({ messageOpen: false })}>
          close
        </button>
      </div>
      <div className={styles.guestbookBody}>
        {sent ? (
          <div className={styles.guestbookMuted}>Thank you — your message has been left.</div>
        ) : (
          <>
            <textarea
              className={styles.messageInput}
              value={text}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Say something…"
              disabled={submitting}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
            />
            <button className={styles.messageSubmit} onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? "Sending…" : "Send"}
            </button>
            {error && <div className={styles.guestbookMuted}>{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}
