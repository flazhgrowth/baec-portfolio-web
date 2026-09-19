import { apiFetch } from "@/api/client";
import { visitId } from "@/api/visitors";
import type { NotesResponse, NotesSummaryResponse } from "@/api/types";

const TIMEOUT_MS = 5000;
const NOTE_SENT_PREFIX = "nocturne-note-sent:";

/** Best-effort local flag, one per artwork — same posture as api/messages.ts's
 * hasSentMessage/markMessageSent, just keyed so a visitor can still leave a note on a
 * different piece after sending one. The backend remains the actual source of truth
 * (it rejects a second note for the same (visit_id, art_key) pair regardless). */
export function hasSentNote(artKey: string): boolean {
  try {
    return sessionStorage.getItem(NOTE_SENT_PREFIX + artKey) === "1";
  } catch {
    return false;
  }
}

function markNoteSent(artKey: string): void {
  try {
    sessionStorage.setItem(NOTE_SENT_PREFIX + artKey, "1");
  } catch {
    // best-effort UX flag only — nothing to fall back to
  }
}

/** POST /notes requires a visit_id that already has a POST /guests record — see
 * overlay/NotesPanel.tsx, which registers one (with a random name) first for a visitor
 * who used "Skip", the same dance overlay/MessageBoard.tsx already does. Unlike the
 * optimistic guestbook POST, this one is always awaited: the visitor is actively
 * submitting from an open panel, so the real result should show. */
export async function submitNote(artKey: string, note: string): Promise<void> {
  await apiFetch<null>("/notes", {
    method: "POST",
    body: JSON.stringify({ visit_id: visitId(), art_key: artKey, note }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  markNoteSent(artKey);
}

export async function fetchNotes(artKey: string, size = 50): Promise<NotesResponse> {
  return apiFetch<NotesResponse>(`/notes?art_key=${encodeURIComponent(artKey)}&size=${size}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** Fetched once, unconditionally, at app load (see App.tsx) — not lazily like
 * fetchNotes — so the frame cue (Hang.tsx) can show without opening any panel.
 * Failure is swallowed by the caller: an outage here should only mean no cues show. */
export async function fetchNotesSummary(): Promise<string[]> {
  const res = await apiFetch<NotesSummaryResponse>("/notes/summary", {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return res.art_keys;
}
