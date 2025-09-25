import { redirect } from "@remix-run/node";

export async function loader() {
  return redirect("/events");
}

export default function Index() {
  return null;
}
