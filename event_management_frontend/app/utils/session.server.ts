import { createCookie } from "@remix-run/node";

// PUBLIC_INTERFACE
export const sessionCookie = createCookie("token", {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  // In production set secure: true with HTTPS
  secure: false,
  maxAge: 60 * 60 * 24 * 7, // 7 days
});

// PUBLIC_INTERFACE
export async function commitToken(token: string) {
  /** Return Set-Cookie header value committing JWT token. */
  return await sessionCookie.serialize(token);
}

// PUBLIC_INTERFACE
export async function destroyToken() {
  /** Return Set-Cookie header value to clear JWT token. */
  return await sessionCookie.serialize("", { maxAge: 0 });
}
