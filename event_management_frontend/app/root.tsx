import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  NavLink,
  useLocation,
  useRouteLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Root loader exposes env and simple auth presence to client. */
  const cookie = request.headers.get("Cookie") || "";
  const match = /token=([^;]+)/.exec(cookie);
  const isAuthenticated = !!match;
  return json({
    ENV: { VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? "http://localhost:4000" },
    isAuthenticated,
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-[#f9fafb] text-[#111827]">
        {children}
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.ENV = ${JSON.stringify({
              VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? "http://localhost:4000",
            })};
          `,
          }}
        />
      </body>
    </html>
  );
}

function Sidebar() {
  const location = useLocation();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-gray-700 hover:bg-gray-100 hover:text-blue-700"
    }`;

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="px-4 py-6">
        <nav className="flex flex-col gap-1">
          <NavLink to="/events" className={linkClass} prefetch="intent">
            <span>📅</span> <span>Events</span>
          </NavLink>
          <NavLink to="/events/new" className={linkClass} prefetch="intent">
            <span>➕</span> <span>Create Event</span>
          </NavLink>
        </nav>
      </div>
      <div className="mt-auto px-4 py-6 text-xs text-gray-500">
        <p>Ocean Professional UI</p>
      </div>
    </aside>
  );
}

export type RootLoaderData = {
  ENV: { VITE_API_BASE_URL: string };
  isAuthenticated: boolean;
};

function TopNav() {
  const data = useRouteLoaderData<RootLoaderData>("root");
  const apiBase = data?.ENV?.VITE_API_BASE_URL ?? "N/A";
  const isAuthed = Boolean(data?.isAuthenticated);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-content-center rounded-lg bg-gradient-to-br from-blue-500/10 to-gray-50">
            <span className="text-blue-600">EM</span>
          </div>
          <span className="font-semibold">Event Manager</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-gray-500 sm:block">API: {apiBase}</span>
          <a
            href={isAuthed ? "/logout" : "/login"}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-white shadow transition hover:bg-blue-700"
          >
            {isAuthed ? "Logout" : "Login"}
          </a>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto flex max-w-7xl">
        {!isAuthRoute && <Sidebar />}
        <main className={`flex-1 p-6 ${!isAuthRoute ? "bg-transparent" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
