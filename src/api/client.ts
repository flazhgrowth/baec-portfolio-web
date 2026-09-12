const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

interface ApiEnvelope<T> {
  code: string;
  message: string;
  data: T;
  servertime: number;
}

/** Thin fetch wrapper against the Go/Chi backend described in docs/api-contract.md.
 * The backend is deployed separately; this only needs to match its contract. Every
 * response (success or error) is wrapped in an envelope — this unwraps `data` on
 * success and throws `message` on a non-2xx status. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  let body: ApiEnvelope<T> | undefined;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // response body wasn't JSON at all — fall through to the generic messages below
  }

  if (!res.ok) {
    const message = body && typeof body.message === "string" ? body.message : `Request failed: ${res.status}`;
    throw new Error(message);
  }
  if (!body || typeof body !== "object" || !("data" in body)) {
    // a proxy/load-balancer error page (HTML, 200-with-empty-body, etc) instead of
    // the expected envelope — surface something calmer than a raw parse error.
    throw new Error("Unexpected response from the server.");
  }
  return body.data;
}
