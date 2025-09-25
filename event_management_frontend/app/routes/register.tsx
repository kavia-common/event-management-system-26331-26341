import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { apiFetch } from "~/utils/api";
import { commitToken } from "~/utils/session.server";

type ActionData = {
  error?: string;
  success?: string;
};

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Redirect if already authenticated. */
  const cookie = request.headers.get("Cookie") || "";
  const match = /token=([^;]+)/.exec(cookie);
  if (match) return redirect("/events");
  return json({});
}

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Handle registration and login flow. */
  const form = await request.formData();
  const name = String(form.get("name") || "");
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  if (!name || !email || !password) {
    return json<ActionData>({ error: "All fields are required." }, { status: 400 });
  }

  try {
    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    // Auto login after register
    const login = await apiFetch<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const setCookie = await commitToken(login.token);
    return redirect("/events", { headers: { "Set-Cookie": setCookie } });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return json<ActionData>(
      { error: err?.message || "Registration failed. Please try again." },
      { status: err?.status || 500 }
    );
  }
}

export default function Register() {
  const data = useActionData<ActionData>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  return (
    <div className="mx-auto grid max-w-md gap-6 rounded-xl bg-white p-8 shadow-sm">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-semibold text-[#111827]">Create your account</h1>
        <p className="text-sm text-gray-500">Join to create and manage events</p>
      </div>

      {data?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {data.error}
        </div>
      )}

      <Form method="post" className="grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Ada Lovelace"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="you@example.com"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </Form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
