import { useState, type FormEvent } from "react";
import { controllerRef } from "@/controller/controllerRef";
import { SPECIAL_ROOM_ID } from "@/controller/gatedRoom";
import { validateSpecialToken } from "@/api/special";
import { useGallery } from "@/store/useGallery";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import styles from "@/overlay/overlay.module.css";

/** The token gate blocking the Special Room's doorway. Unlike the name-gate's
 * optimistic POST, this call is always awaited — the room stays locked (and
 * free-walking stays blocked, see controller/gatedRoom.ts) until the backend
 * confirms the token with a 2xx from POST /specials/validate. */
export default function SpecialGate() {
  const store = useGalleryStore();
  const open = useGallery((s) => s.specialGateOpen);
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function close() {
    if (submitting) return;
    store.setState({ specialGateOpen: false });
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Enter a token.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await validateSpecialToken(trimmed);
      controllerRef.current?.unlockSpecial();
      controllerRef.current?.gotoRoom(SPECIAL_ROOM_ID);
      setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not validate that token.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.gateBackdrop} onClick={close}>
      <div className={styles.gatePanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.gateTitle}>Special Room</div>
        <div className={styles.gateBody}>This room is sealed. Enter your invitation token to continue.</div>
        <form className={styles.gateForm} onSubmit={handleSubmit}>
          <input
            className={styles.gateInput}
            type="text"
            placeholder="Token"
            value={token}
            autoFocus
            disabled={submitting}
            onChange={(e) => {
              setToken(e.target.value);
              if (error) setError(null);
            }}
          />
          <div className={styles.gateActions}>
            <button type="button" className={styles.gateCancel} onClick={close} disabled={submitting}>
              cancel
            </button>
            <button type="submit" className={styles.gateSubmit} disabled={submitting || !token.trim()}>
              {submitting ? "checking…" : "unlock"}
            </button>
          </div>
          <div className={styles.gateHint}>{error ?? " "}</div>
        </form>
      </div>
    </div>
  );
}
