# Frontend

This Next.js app provides the public-facing lab discovery experience, search UI, authentication entry points, and booking-oriented pages.

## Scripts

- `npm run dev` — start the local development server
- `npm run build` — build for production
- `npm run lint` — run ESLint

## Environment

The local `.env.local` sets `NEXT_PUBLIC_API_URL` to the backend API base URL,
including `/api`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, configure `NEXT_PUBLIC_API_URL` in the frontend hosting
provider before building.

Student registration uses the student number to form an
`<student-number>@tut4life.ac.za` account email. Public registration is limited
to students; admins must be promoted separately and can then use the admin
sign-in option.
