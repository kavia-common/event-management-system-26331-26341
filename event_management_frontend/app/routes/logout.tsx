import { redirect } from "@remix-run/node";
import { destroyToken } from "~/utils/session.server";

// PUBLIC_INTERFACE
export async function loader() {
  /** Clear the token cookie and redirect to login. */
  const cleared = await destroyToken();
  return redirect("/login", { headers: { "Set-Cookie": cleared } });
}

export default function Logout() {
  return null;
}
