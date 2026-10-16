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

### Full TUT Labs application

GitHub Pages cannot host this application. It only serves static files; this
project requires a running Next.js server for sign-in, registration, bookings,
and API routes. If GitHub Pages is configured to publish the repository root,
GitHub displays this README because there is no static `index.html` there.

Deploy the root application to a Node.js host such as Vercel or Render instead.
For Vercel, import this repository and set the project root directory to `.`.
Do not select the `frontend` folder: the current student sign-in and booking
features are implemented in the root Next.js application.

Before enabling production sign-in and bookings, configure a persistent
production database. The root Prisma schema currently uses SQLite, which is
suitable for local development but is not durable on serverless filesystems
such as Vercel. Use a Node.js host with persistent disk storage, or migrate the
root Prisma schema to a hosted PostgreSQL database before deploying there.
Configure `DATABASE_URL`, `NEXTAUTH_URL` (the deployed app's HTTPS URL), and a
secure `NEXTAUTH_SECRET` in the hosting provider's environment settings. Never
commit production credentials to this repository.

### Standalone frontend and backend

The separate `frontend` and `backend` folders are additional applications.
They can be deployed independently using their own environment settings; they
are not the root app's current authentication and booking backend.
