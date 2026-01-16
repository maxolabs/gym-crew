## Gym Crew architecture (high-level)

### Data access pattern

- **Server Components** (pages) read data using `lib/supabase/server.ts` (cookie-based Supabase session).
- **Client Components** perform mutations with `lib/supabase/browser.ts`, then call `router.refresh()` to re-render Server Components with fresh data.
- Auth protection is handled via `middleware.ts` session refresh + redirects.

### State management

- **Current group** is stored in `localStorage` at `gymcrew:lastGroupId` (set by `components/group/SetCurrentGroup.tsx`).
- Most app state is “server state” (Supabase); UI uses small local component state for loading/error UX.

### “API endpoints”

This app leans on Supabase as the API:

- **DB RPC**:
  - `create_gym_group(...)` → creates group + adds creator as ADMIN
  - `create_group_invite(...)` → generates tokenized join link (ADMIN)
  - `join_group_with_token(token)` → consumes invite and joins as MEMBER
  - `approve_manual_checkin(check_in_id)` → approves a pending manual check-in (not self)
  - `reject_manual_checkin(check_in_id, reason)` → optional rejection (ADMIN)
  - `award_month_winner(group_id, month_start)` → idempotently awards `MONTH_WINNER`
- **Storage**:
  - Bucket `routines` (private), object path `routines/{groupId}/routine.(pdf|png|jpg)`

### PWA

- Web manifest: `app/manifest.ts`
- Service worker: `public/sw.js` (registered by `components/pwa/ServiceWorkerRegistration.tsx`)

### Security / permissions

- All core tables have **RLS enabled**; helper functions `is_group_member` / `is_group_admin` are used in policies.
- Routines bucket is private; members can read, admins can write (see `supabase/storage.sql`).


