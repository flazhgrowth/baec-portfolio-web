import { apiFetch } from "@/api/client";
import type { CreateVisitorResponse, GuestbookResponse } from "@/api/types";

const TIMEOUT_MS = 5000;
const VISIT_ID_KEY = "nocturne-visit-id";

/** A per-tab idempotency key so a background retry of the optimistic POST can't
 * double-log the same visit — the server is expected to dedupe on this. Exported so
 * api/messages.ts can key a message to the same visit. */
export function visitId(): string {
  try {
    const existing = sessionStorage.getItem(VISIT_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(VISIT_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const GUEST_ADJECTIVES = ["Quiet", "Curious", "Wandering", "Midnight", "Distant", "Gentle", "Passing", "Nameless"];
const GUEST_NOUNS = ["Visitor", "Guest", "Wanderer", "Stranger", "Onlooker"];

/** Used to register a guest record for a visitor who used "Skip" on the title card
 * (never triggering submitVisitor) but later wants to leave a message — see
 * overlay/MessageBoard.tsx, which needs a guest row to already exist for its visit_id. */
export function randomGuestName(): string {
  const a = GUEST_ADJECTIVES[Math.floor(Math.random() * GUEST_ADJECTIVES.length)];
  const n = GUEST_NOUNS[Math.floor(Math.random() * GUEST_NOUNS.length)];
  const num = Math.floor(Math.random() * 9000 + 1000);
  return `${a} ${n} #${num}`;
}

export async function submitVisitor(name: string): Promise<CreateVisitorResponse> {
  return apiFetch<CreateVisitorResponse>("/guests", {
    method: "POST",
    body: JSON.stringify({ name, visit_id: visitId() }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

export async function fetchGuestbook(size = 50): Promise<GuestbookResponse> {
  return apiFetch<GuestbookResponse>(`/guests?size=${size}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}
