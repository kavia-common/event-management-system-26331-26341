import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { apiFetch, readTokenFromCookie } from "~/utils/api";

type EventItem = {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  owner_id?: number;
};

type LoaderData = {
  events: EventItem[];
  page: number;
  limit: number;
};

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Loads paginated events from backend. */
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || 1);
  const limit = Number(url.searchParams.get("limit") || 10);

  const token = readTokenFromCookie(request);
  const qs = `?page=${page}&limit=${limit}`;
  const events = await apiFetch<EventItem[]>(`/events${qs}`, {
    method: "GET",
    token: token || undefined,
  });

  return json<LoaderData>({ events, page, limit });
}

export default function EventsIndex() {
  const { events, page, limit } = useLoaderData<LoaderData>();
  useSearchParams(); // keep URL state without unused variable

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-gray-500">Browse upcoming and past events</p>
        </div>
        <Link
          to="/events/new"
          className="rounded-md bg-amber-500 px-4 py-2 text-white shadow hover:bg-amber-600 transition"
        >
          Create Event
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Link
            to={`/events/${e.id}`}
            key={e.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-[#111827]">{e.title}</h3>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                {new Date(e.start_time).toLocaleDateString()}
              </span>
            </div>
            {e.description && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{e.description}</p>
            )}
            <div className="mt-3 text-xs text-gray-500">
              <span>Location: {e.location || "TBA"}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        {page > 1 && (
          <Link
            to={`?page=${page - 1}&limit=${limit}`}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Previous
          </Link>
        )}
        {events.length >= limit && (
          <Link
            to={`?page=${page + 1}&limit=${limit}`}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
