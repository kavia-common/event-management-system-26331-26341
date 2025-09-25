# Event Management Frontend (Remix)

This frontend implements:
- Authentication: Login, Register, Logout
- Events: List, Create, View, Edit, Delete
- Attendees: View, Add, Remove
- Styling: Ocean Professional (blue & amber accents, modern, minimalist)

## Environment

Copy `.env.example` to `.env` and set:
- `VITE_API_BASE_URL` — the base URL of the backend API.

## Development

Install dependencies and run:

```bash
npm install
npm run dev
```

Open the dev server URL provided by the environment.

## Notes

- Authentication token is stored in an HTTP-only cookie named `token`.
- Backend endpoints are consumed from the provided OpenAPI specification.
- UI includes success and error states, responsive cards, and sidebar/topnav layout.
