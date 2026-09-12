import { useEffect, useState, type FormEvent } from "react";
import { controllerRef } from "@/controller/controllerRef";
import { submitVisitor } from "@/api/visitors";
import { useGallery } from "@/store/useGallery";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import styles from "@/overlay/overlay.module.css";
import type { CompiledSpace } from "@/space/types";

const MAX_NAME_LENGTH = 40;

/** The pre-entry title card and name gate. Entry is optimistic: the POST to the
 * backend fires on submit but is never awaited before calling `enter()` — a slow or
 * offline backend must never keep a visitor out of the gallery. */
export default function TitleCard({ compiled }: { compiled: CompiledSpace }) {
  const store = useGalleryStore();
  const entered = useGallery((s) => s.entered);
  const assetsReady = useGallery((s) => s.assetsReady);
  const [name, setName] = useState("");
  const [hidden, setHidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entered) return;
    const t = setTimeout(() => setHidden(true), 1000);
    return () => clearTimeout(t);
  }, [entered]);

  if (hidden) return null;

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH && assetsReady && !submitting;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (trimmed.length === 0) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    store.setState({ visitorName: trimmed });
    void submitVisitor(trimmed).catch((err: unknown) => {
      console.warn("[guestbook] failed to log visit", err);
    });
    controllerRef.current?.enter();
  }

  const spec = compiled.spec;

  return (
    <div className={styles.cover} style={{ opacity: entered ? 0 : 1, background: spec.bg }}>
      <div className={styles.cvK}>
        {spec.label} · {spec.rooms.length} rooms
      </div>
      <div className={styles.cvT}>Tokyo · Kyoto · Osaka</div>
      <div className={styles.cvS}>{spec.blurb}</div>
      <form className={styles.cvForm} onSubmit={handleSubmit}>
        <input
          className={styles.cvNameInput}
          type="text"
          name="visitorName"
          placeholder="Your name"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="name"
          disabled={submitting}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
        />
        <button className={styles.cvB} type="submit" disabled={!canSubmit}>
          {assetsReady ? "Enter the room" : "Preparing the room…"}
        </button>
        <div className={styles.cvHint}>{error ?? " "}</div>
      </form>
    </div>
  );
}
