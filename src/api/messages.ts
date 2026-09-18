import { apiFetch } from "@/api/client";
import { visitId } from "@/api/visitors";

const TIMEOUT_MS = 5000;
const MESSAGE_SENT_KEY = "nocturne-message-sent";

/** Best-effort local flag so the panel can show "already sent" without a GET
 * endpoint to check against — the backend remains the actual source of truth (it
 * rejects a second message for the same visit_id on its own; this only avoids an
 * unnecessary round trip in the common case of the same tab reopening the panel). */
export function hasSentMessage(): boolean {
  try {
    return sessionStorage.getItem(MESSAGE_SENT_KEY) === "1";
  } catch {
    return false;
  }
}

function markMessageSent(): void {
  try {
    sessionStorage.setItem(MESSAGE_SENT_KEY, "1");
  } catch {
    // best-effort UX flag only — nothing to fall back to
  }
}

/** POST /messages requires a visit_id that already has a POST /guests record — see
 * overlay/MessageBoard.tsx, which registers one (with a random name) first for a
 * visitor who used "Skip" on the title card. Unlike the optimistic guestbook POST,
 * this one is always awaited by the caller: the visitor is actively submitting from
 * an open panel, so the real result (success or the server's error) should show. */
export async function submitMessage(msg: string): Promise<void> {
  await apiFetch<null>("/messages", {
    method: "POST",
    body: JSON.stringify({ visit_id: visitId(), msg }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  markMessageSent();
}
