import { apiFetch } from "@/api/client";

const TIMEOUT_MS = 8000;

/** Validates the token guarding the Special Room's doorway. Resolves on any 2xx
 * response (the room is unlocked); rejects with the backend's `message` otherwise.
 * Unlike the optimistic guestbook POST, this one is always awaited by the caller —
 * the room stays locked until the backend confirms it. */
export async function validateSpecialToken(token: string): Promise<void> {
  await apiFetch<null>("/specials/validate", {
    method: "POST",
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}
