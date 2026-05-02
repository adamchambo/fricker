import { getFirebaseAuth } from "./firebase";

const baseUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let authToken: string | undefined;
  try {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      authToken = await auth.currentUser.getIdToken();
    }
  } catch {
    // not configured or signed out
  }

  const headers = new Headers(init.headers);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${baseUrl()}${path}`, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : res.statusText;
    throw new ApiError(msg || "Request failed", res.status, data);
  }
  return (data as T) ?? (null as T);
}
