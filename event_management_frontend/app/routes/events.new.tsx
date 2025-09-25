import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { apiFetch, requireUserSession } from "~/utils/api";

type ActionData = {
  error?: string;
  success?: string;
};

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Ensure authenticated to access create form. */
  await requireUserSession(request);
  return json({});
}

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Handle create event submission. */
  const { token } = await requireUserSession(request);
  const form = await request.formData();
  const title = String(form.get("title") || "");
  const description = String(form.get("description") || "");
  const location = String(form.get("location") || "");
  const start_time = String(form.get("start_time") || "");
  const end_time = String(form.get("end_time") || "");

  if (!title || !start_time || !end_time) {
    return json<ActionData>({ error: "Title, start and end time are required." }, { status: 400 });
  }

  try {
    const payload = { title, description, location, start_time, end_time };
    const created = await apiFetch<{ id: number }>("/events", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
    return redirect(`/events/${created.id}`);
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return json<ActionData>(
      { error: err?.message || "Failed to create event." },
      { status: err?.status || 500 }
    );
  }
}

export default function NewEvent() {
  const data = useActionData<ActionData>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Event</h1>
        <p className="text-sm text-gray-500">Fill in details to publish your event</p>
      </div>

      {data?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {data.error}
        </div>
      )}

      <Form method="post" className="grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
          <input
            id="title"
            name="title"
            required
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Annual Tech Conference"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Details about the event..."
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="location" className="text-sm font-medium text-gray-700">Location</label>
          <input
            id="location"
            name="location"
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Online / Venue address"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="start_time" className="text-sm font-medium text-gray-700">Start time</label>
            <input
              id="start_time"
              type="datetime-local"
              name="start_time"
              required
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="end_time" className="text-sm font-medium text-gray-700">End time</label>
            <input
              id="end_time"
              type="datetime-local"
              name="end_time"
              required
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>
        </div>
      </Form>
    </div>
  );
}
