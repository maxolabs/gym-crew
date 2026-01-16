# Gym Crew

Mobile-first PWA to track gym attendance with friends (groups), validate check-ins via geolocation, and gamify consistency (leaderboards, streaks, badges).

## Quick start

### 1) Create a Supabase project

- Enable **Email + Password** auth in Supabase Auth.
- (Recommended for a private app) Disable email confirmations while you iterate.

### Option A (recommended): Local Supabase via Docker (Supabase CLI)

This runs the full Supabase stack locally (DB/Auth/Storage) using Docker.

Prereqs:

- Docker Desktop
- Supabase CLI (`brew install supabase/tap/supabase`)

Commands:

```bash
make install
make supabase-start
make db-reset
make supabase-status
```

If you’re using **Colima** and see an error about mounting `~/.colima/default/docker.sock`, Supabase’s log collector container is trying to mount the Docker socket. The Makefile already avoids this by default, but you can be explicit:

```bash
make supabase-start SUPABASE_START_ARGS="--exclude vector"
```

Troubleshooting:

```bash
make doctor
```

Then create `.env.local` with the values shown by `make supabase-status`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=... # from supabase status
```

Finally:

```bash
make dev
```

## Demo seed (optional)

This repo includes a **standalone** demo seed (not a migration) at `supabase/seeds/demo_seed.sql`.

- **Admin login**: `admin@gymcrew.local`
- **Member logins**: `alex@gymcrew.local`, `sam@gymcrew.local`, `taylor@gymcrew.local`
- **Password (all users)**: `GymCrew123!`

Run it locally:

```bash
make seed-demo
```

Or in Supabase Studio:

- Open Studio (local): `http://127.0.0.1:54323`
- Go to **SQL Editor** → paste the file contents → **Run**

Note: `make seed-demo` runs the seed by executing `psql` inside the local DB container (works even if your Supabase CLI version doesn’t support `db query`).

### Option B: Hosted Supabase

Run these in the Supabase SQL editor:

- `supabase/schema.sql` (reference)
- `supabase/storage.sql` (reference)

### 3) Configure env vars (local)

Create `.env.local` (not committed) with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

You can copy `env.example` as a template.

### 4) Install and run

```bash
npm i
npm run dev
```

## Notes

- **Join links**: created by admins via `create_group_invite(group_id, ...)`, redeemed via `join_group_with_token(token)`.
- **Routine storage**: private bucket `routines`, stored at `routines/{groupId}/routine.(pdf|png|jpg)`; members can read, admins can write.
- **One check-in/day**: enforced by a unique constraint on `(group_id, user_id, checkin_date)`.

## Deploy on Vercel

1) Create a Vercel project from this repo.
2) Add environment variables in Vercel (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3) Point those values at your **hosted** Supabase project (production).
4) Deploy.

Notes:
- `vercel.json` sets cache headers for the service worker and web manifest to ensure updates are picked up reliably.
- Logout redirects use forwarded headers or `VERCEL_URL` to build the correct origin in production.


