# Backend

This Express + Prisma API powers authentication, laboratory discovery, services, bookings, reviews, and favorites for Lab Locator.

## Scripts

- `npm run dev` — start the API locally
- `npm run build` — compile TypeScript
- `npm start` — run the compiled build

## Database

1. Create a PostgreSQL database named `lab_locator`.
2. Set `DATABASE_URL` in `.env` to your PostgreSQL connection string. The
   provided local-development value assumes user `postgres` and password
   `postgres`.
3. Set `JWT_SECRET` to a unique, private value before deploying.
4. Run `npx prisma migrate dev --name init`.
5. Run `npx prisma generate`.

The local `.env` also configures the API port (`PORT`), allowed frontend origin
(`FRONTEND_URL`), and token lifetime (`JWT_EXPIRES_IN`).

## Management roles

New accounts are created as `STUDENT`. Only `ADMIN` and `LAB_MANAGER` accounts can create, update, or delete laboratories and services, view all bookings, or update booking statuses. Students can still browse labs, create bookings, and view their own bookings.

Promote an existing account from the backend directory:

```bash
npm run promote-user -- 12345678@tut4life.ac.za ADMIN
```

Use `LAB_MANAGER` instead of `ADMIN` for a lab operations account. Role changes are intentionally kept out of public registration.

Public registration is limited to student accounts and requires an email in the
`@tut4life.ac.za` domain. Promote an existing account to `ADMIN` to enable the
admin sign-in option.
