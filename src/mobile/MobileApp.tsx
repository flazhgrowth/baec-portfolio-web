import { lazy, Suspense, useState } from "react";
import { BOOK_TITLE } from "./bookPages";
import s from "./mobile.module.css";

const Book = lazy(() => import("./Book"));

/** Entry for the phone experience: a bookshelf that currently holds one book. */
export default function MobileApp() {
  const [phase, setPhase] = useState<"shelf" | "pulling" | "open">("shelf");

  const pull = () => {
    setPhase("pulling");
    window.setTimeout(() => setPhase("open"), 650);
  };

  if (phase === "open") {
    return (
      <Suspense fallback={<div className={s.root} />}>
        <Book onClose={() => setPhase("shelf")} />
      </Suspense>
    );
  }

  return (
    <main className={s.root}>
      <p className={s.shelfKicker}>Library</p>
      <div className={s.shelf}>
        <button
          type="button"
          className={`${s.spine} ${phase === "pulling" ? s.spinePulled : ""}`}
          onClick={pull}
          aria-label={`Open ${BOOK_TITLE}`}
        >
          <span className={s.spineTitle}>{BOOK_TITLE}</span>
        </button>
        <div className={s.board} />
      </div>
      <p className={s.shelfHint}>Tap the book to open it</p>
    </main>
  );
}
