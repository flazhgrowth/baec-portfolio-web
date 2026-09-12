import { apiFetch } from "@/api/client";
import type { CreateVisitorResponse, GuestbookResponse } from "@/api/types";

const TIMEOUT_MS = 5000;
const VISIT_ID_KEY = "nocturne-visit-id";

/** A per-tab idempotency key so a background retry of the optimistic POST can't
 * double-log the same visit — the server is expected to dedupe on this. */
function visitId(): string {
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

export async function submitVisitor(name: string): Promise<CreateVisitorResponse> {
  return apiFetch<CreateVisitorResponse>("/visitors", {
    method: "POST",
    body: JSON.stringify({ name, visitId: visitId() }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

export async function fetchGuestbook(limit = 50): Promise<GuestbookResponse> {
  return apiFetch<GuestbookResponse>(`/guestbook?limit=${limit}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}
