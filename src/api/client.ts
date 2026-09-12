const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** Thin fetch wrapper against the Go/Chi backend described in docs/api-contract.md.
 * The backend is deployed separately; this only needs to match its contract. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }
  try {
    return (await res.json()) as T;
  } catch {
    // a proxy/load-balancer error page (HTML, 200-with-empty-body, etc) instead of
    // the expected JSON — surface something calmer than a raw SyntaxError.
    throw new Error("Unexpected response from the server.");
  }
}
