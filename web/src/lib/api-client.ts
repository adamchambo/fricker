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

/** Turn API `{ error: ... }` bodies into readable text (handles Zod `flatten()` objects). */
function formatErrorValue(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (typeof err !== "object") return String(err);

  const o = err as Record<string, unknown>;

  if (Array.isArray(o.formErrors) || (o.fieldErrors != null && typeof o.fieldErrors === "object")) {
    const parts: string[] = [];
    if (Array.isArray(o.formErrors)) {
      for (const x of o.formErrors) {
        if (typeof x === "string" && x) parts.push(x);
      }
    }
    if (o.fieldErrors && typeof o.fieldErrors === "object") {
      for (const [k, v] of Object.entries(o.fieldErrors as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          const msgs = v.filter((x): x is string => typeof x === "string");
          if (msgs.length) parts.push(`${k}: ${msgs.join(", ")}`);
        }
      }
    }
    if (parts.length) return parts.join(" · ");
  }

  if (typeof o.message === "string" && o.message) return o.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Request failed";
  }
}

function messageFromResponseData(data: unknown, statusText: string): string {
  if (typeof data === "object" && data !== null && "error" in data) {
    const text = formatErrorValue((data as { error: unknown }).error);
    if (text) return text;
  }
  if (typeof data === "string" && data.trim()) return data;
  return statusText || "Request failed";
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
    const msg = messageFromResponseData(data, res.statusText);
    throw new ApiError(msg || "Request failed", res.status, data);
  }
  return (data as T) ?? (null as T);
}
