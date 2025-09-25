import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { apiFetch, readTokenFromCookie, requireUserSession } from "~/utils/api";

type EventDetail = {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  owner_id?: number;
};

type Attendee = {
  user_id: number;
  name?: string;
  email?: string;
  status?: "invited" | "confirmed" | "declined";
};

type LoaderData = {
  event: EventDetail;
  attendees: Attendee[];
  isOwner: boolean;
};

type ActionData = { error?: string; success?: string };

// PUBLIC_INTERFACE
export async function loader({ request, params }: LoaderFunctionArgs) {
  /** Load event details and attendees. */
  const id = Number(params.id);
  if (!id) throw new Response("Not found", { status: 404 });

  const token = readTokenFromCookie(request);

  const event = await apiFetch<EventDetail>(`/events/${id}`, {
    method: "GET",
    token: token || undefined,
  });

  const attendees = await apiFetch<Attendee[]>(`/events/${id}/attendees`, {
    method: "GET",
    token: token || undefined,
  });

  const isOwner = Boolean(token); // optimistic; backend will enforce owner-only for mutations
  return json<LoaderData>({ event, attendees, isOwner });
}

// PUBLIC_INTERFACE
export async function action({ request, params }: ActionFunctionArgs) {
  /** Handles update, delete, add/remove attendee actions. */
  const form = await request.formData();
  const intent = String(form.get("_intent") || "");
  const id = Number(params.id);
  if (!id) {
    return json<ActionData>({ error: "Invalid event." }, { status: 400 });
  }

  if (intent === "delete") {
    const { token } = await requireUserSession(request);
    await apiFetch<{ success?: boolean }>(`/events/${id}`, { method: "DELETE", token });
    return redirect("/events");
  }

  if (intent === "update") {
    const { token } = await requireUserSession(request);
    const payload: Record<string, string | undefined> = {
      title: (form.get("title") as string) || undefined,
      description: (form.get("description") as string) || undefined,
      location: (form.get("location") as string) || undefined,
      start_time: (form.get("start_time") as string) || undefined,
      end_time: (form.get("end_time") as string) || undefined,
    };
    await apiFetch(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      token,
    });
    return json<ActionData>({ success: "Event updated." });
  }

  if (intent === "addAttendee") {
    const { token } = await requireUserSession(request);
    const user_id = Number(form.get("user_id"));
    const status = String(form.get("status") || "invited");
    await apiFetch(`/events/${id}/attendees`, {
      method: "POST",
      body: JSON.stringify({ user_id, status }),
      token,
    });
    return json<ActionData>({ success: "Attendee added." });
  }

  if (intent === "removeAttendee") {
    const { token } = await requireUserSession(request);
    const userId = Number(form.get("user_id"));
    await apiFetch(`/events/${id}/attendees/${userId}`, {
      method: "DELETE",
      token,
    });
    return json<ActionData>({ success: "Attendee removed." });
  }

  return json<ActionData>({ error: "Unknown action." }, { status: 400 });
}

export default function EventDetailRoute() {
  const { event, attendees, isOwner } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <p className="text-sm text-gray-500">
            {new Date(event.start_time).toLocaleString()} —{" "}
            {new Date(event.end_time).toLocaleString()}
          </p>
        </div>
        <Link
          to="/events"
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {actionData?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionData.error}
        </div>
      )}
      {actionData?.success && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {actionData.success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Overview</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {event.description || "No description provided."}
            </p>
            <div className="mt-4 grid gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-700">Location: </span>
                {event.location || "TBA"}
              </div>
              <div>
                <span className="font-medium text-gray-700">Starts: </span>
                {new Date(event.start_time).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-gray-700">Ends: </span>
                {new Date(event.end_time).toLocaleString()}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Edit Event</h2>
              <Form method="post" className="grid gap-4">
                <input type="hidden" name="_intent" value="update" />
                <div className="grid gap-1.5">
                  <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
                  <input
                    id="title"
                    name="title"
                    defaultValue={event.title}
                    className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    defaultValue={event.description}
                    className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="location" className="text-sm font-medium text-gray-700">Location</label>
                  <input
                    id="location"
                    name="location"
                    defaultValue={event.location}
                    className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="start_time" className="text-sm font-medium text-gray-700">Start time</label>
                    <input
                      id="start_time"
                      type="datetime-local"
                      name="start_time"
                      defaultValue={toLocalInputValue(event.start_time)}
                      className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="end_time" className="text-sm font-medium text-gray-700">End time</label>
                    <input
                      id="end_time"
                      type="datetime-local"
                      name="end_time"
                      defaultValue={toLocalInputValue(event.end_time)}
                      className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>

                  <Form method="post">
                    <input type="hidden" name="_intent" value="delete" />
                    <button
                      type="submit"
                      className="rounded-md bg-red-600 px-4 py-2 text-white shadow hover:bg-red-700 transition"
                    >
                      Delete Event
                    </button>
                  </Form>
                </div>
              </Form>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Attendees</h2>
            {attendees.length === 0 ? (
              <p className="text-sm text-gray-500">No attendees yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {attendees.map((a) => (
                  <li key={a.user_id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {a.name || `User #${a.user_id}`}
                      </p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        {a.status || "invited"}
                      </span>
                      {isOwner && (
                        <Form method="post">
                          <input type="hidden" name="_intent" value="removeAttendee" />
                          <input type="hidden" name="user_id" value={String(a.user_id)} />
                          <button
                            type="submit"
                            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            Remove
                          </button>
                        </Form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isOwner && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-medium">Add attendee</h3>
              <Form method="post" className="flex items-end gap-3">
                <input type="hidden" name="_intent" value="addAttendee" />
                <div>
                  <label htmlFor="att_user_id" className="mb-1 block text-xs font-medium text-gray-600">
                    User ID
                  </label>
                  <input
                    id="att_user_id"
                    name="user_id"
                    type="number"
                    min={1}
                    required
                    className="w-40 rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. 12"
                  />
                </div>
                <div>
                  <label htmlFor="att_status" className="mb-1 block text-xs font-medium text-gray-600">
                    Status
                  </label>
                  <select
                    id="att_status"
                    name="status"
                    defaultValue="invited"
                    className="w-40 rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="invited">invited</option>
                    <option value="confirmed">confirmed</option>
                    <option value="declined">declined</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-amber-500 px-4 py-2 text-white shadow hover:bg-amber-600 transition disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </button>
              </Form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function toLocalInputValue(date: string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}
