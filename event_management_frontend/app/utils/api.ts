import { redirect } from "@remix-run/node";

/**
 * Small API client wrapper to interact with the backend.
 * Handles base URL, JSON parsing, auth token headers and error normalization.
 */

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const API_BASE_URL =
  (typeof process !== "undefined" &&
    (process.env.VITE_API_BASE_URL as string)) ||
  (typeof window !== "undefined" &&
    (window as unknown as { ENV?: { VITE_API_BASE_URL?: string } }).ENV
      ?.VITE_API_BASE_URL) ||
  "http://localhost:4000";

export function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/+$/, "");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message:
        (isJson && (body?.message || body?.error)) ||
        res.statusText ||
        "Request failed",
      details: isJson ? body : undefined,
    };
    throw err;
  }

  return body as T;
}

/**
/ PUBLIC_INTERFACE
*/
export async function requireUserSession(request: Request) {
  /** Ensures a user session exists or redirects to login. */
  const cookie = request.headers.get("Cookie") || "";
  const match = /token=([^;]+)/.exec(cookie);
  if (!match) {
    throw redirect("/login");
  }
  const token = decodeURIComponent(match[1]);
  return { token };
}

/**
/ PUBLIC_INTERFACE
*/
export function readTokenFromCookie(request: Request): string | null {
  /** Read token from request cookie. */
  const cookie = request.headers.get("Cookie") || "";
  const match = /token=([^;]+)/.exec(cookie);
  return match ? decodeURIComponent(match[1]) : null;
}
