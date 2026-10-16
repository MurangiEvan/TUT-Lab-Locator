# TUT Lab Locator

A production-ready full-stack lab locator experience with a Next.js frontend and an Express + Prisma backend.

## Structure

- frontend: Next.js app router, Tailwind CSS, shadcn-inspired UI patterns, auth pages, lab discovery flow.
- backend: Express.js API with Prisma, JWT auth, labs, services, bookings, reviews, and favorites.

## Local development

The repository has a root Next.js app and a separate `frontend` Next.js package.
Environment files are provided for both; each app loads the file in its own
directory.

### Root app

From the repository root, run `npm run dev`. The root `.env.local` points Prisma
at the local SQLite database, while `.env` provides NextAuth settings.

### Backend

1. Install PostgreSQL and create a database named `lab_locator`. The provided
   `backend/.env` assumes a local `postgres` user with password `postgres`;
   update `DATABASE_URL` if your PostgreSQL credentials differ.
2. Run:
   - `cd backend`
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`
   - `npm run dev`

### Frontend

The standalone frontend reads `frontend/.env.local`, which points to the local
backend API. Start it with:

```sh
cd frontend
npm run dev
```

The frontend is available at http://localhost:3000 and the API at http://localhost:5000/api.

Student accounts use the student's number as the email prefix, followed by
`@tut4life.ac.za`. Public registration creates student accounts only. Admin
accounts must be promoted separately after they register. For the root app,
run `npm run promote-admin -- <student-number>` from the repository root.
Admins sign in using their TUT student number. Signed-in students can book labs
from each campus page; their booking requests are listed on `/welcome`.

## Deployment

- Frontend: deploy to Vercel using the frontend folder.
- Backend: deploy to Vercel using the backend folder and the provided vercel.json.
