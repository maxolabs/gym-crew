-- Gym Crew demo seed (standalone; NOT a migration)
-- Creates:
-- - 4 auth users (1 admin + 3 members)
-- - 1 gym group + memberships + locations
-- - check-in history (approved + one pending manual)
-- - badges history
--
-- Safe-ish to re-run: it deletes the demo group and demo users by email first.
--
-- Login credentials (all users share the same password):
--   Password: GymCrew123!
--   Admin:    admin@gymcrew.local
--   Member:   alex@gymcrew.local
--   Member:   sam@gymcrew.local
--   Member:   taylor@gymcrew.local

begin;

-- Ensure crypto available for password hashing
create extension if not exists pgcrypto;

-- Ensure at least one auth instance exists (some local setups start with auth.instances empty)
insert into auth.instances (id, uuid, raw_base_config, created_at, updated_at)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  '{}'::text,
  now(),
  now()
where not exists (select 1 from auth.instances);

-- ---------- constants ----------
-- demo IDs (stable)
do $$
begin
  -- no-op block to allow "constants" section in plain SQL editors
end $$;

-- ---------- cleanup (idempotency) ----------
-- Delete demo group data first (to avoid FK issues), then delete demo auth users.
with demo_group as (
  select id
  from public.gym_groups
  where name = 'Downtown Crew'
  limit 1
)
delete from public.manual_approvals
where check_in_id in (select id from public.check_ins where group_id in (select id from demo_group));

with demo_group as (
  select id
  from public.gym_groups
  where name = 'Downtown Crew'
  limit 1
)
delete from public.check_ins
where group_id in (select id from demo_group);

with demo_group as (
  select id
  from public.gym_groups
  where name = 'Downtown Crew'
  limit 1
)
delete from public.gym_locations
where group_id in (select id from demo_group);

with demo_group as (
  select id
  from public.gym_groups
  where name = 'Downtown Crew'
  limit 1
)
delete from public.badges
where group_id in (select id from demo_group);

with demo_group as (
  select id
  from public.gym_groups
  where name = 'Downtown Crew'
  limit 1
)
delete from public.group_invites
where group_id in (select id from demo_group);

with demo_group as (
  select id
  from public.gym_groups
  where name = 'Downtown Crew'
  limit 1
)
delete from public.group_members
where group_id in (select id from demo_group);

delete from public.gym_groups
where name = 'Downtown Crew';

-- Delete demo auth users by email (cascade will remove public.users due to FK)
delete from auth.identities
where user_id in (
  select id from auth.users where email in (
    'admin@gymcrew.local',
    'alex@gymcrew.local',
    'sam@gymcrew.local',
    'taylor@gymcrew.local'
  )
);

delete from auth.users
where email in (
  'admin@gymcrew.local',
  'alex@gymcrew.local',
  'sam@gymcrew.local',
  'taylor@gymcrew.local'
);

-- ---------- create auth users ----------
-- Note: Supabase auth expects both auth.users and auth.identities rows for email/password users.
with instance as (
  select id as instance_id
  from auth.instances
  order by created_at asc
  limit 1
),
ins as (
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    reauthentication_token,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  select
    u.id,
    instance.instance_id,
    'authenticated',
    'authenticated',
    u.email,
    crypt('GymCrew123!', gen_salt('bf')),
    ''::varchar,
    ''::varchar,
    ''::varchar,
    ''::varchar,
    ''::varchar,
    ''::varchar,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    u.meta,
    now(),
    now()
  from instance,
  (values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@gymcrew.local', '{"name":"Max Admin"}'::jsonb),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'alex@gymcrew.local', '{"name":"Alex"}'::jsonb),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'sam@gymcrew.local', '{"name":"Sam"}'::jsonb),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'taylor@gymcrew.local', '{"name":"Taylor"}'::jsonb)
  ) as u(id, email, meta)
  returning id, email
)
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  id,
  id::text,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
from ins;

-- public.users is created by trigger on auth.users insert (see schema)

-- ---------- create group ----------
insert into public.gym_groups (
  id,
  name,
  description,
  timezone,
  created_by,
  routine_url,
  routine_content_type,
  created_at
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Downtown Crew',
  'Demo group with locations, check-ins, streaks, and badges.',
  'America/New_York',
  '11111111-1111-1111-1111-111111111111',
  null,
  null,
  now() - interval '35 days'
);

-- memberships
insert into public.group_members (group_id, user_id, role, joined_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'ADMIN', now() - interval '35 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'MEMBER', now() - interval '34 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'MEMBER', now() - interval '34 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'MEMBER', now() - interval '33 days');

-- locations (NYC-ish coordinates)
insert into public.gym_locations (group_id, name, lat, lng, radius_m, created_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Downtown Gym', 40.712776, -74.005974, 500, now() - interval '34 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Uptown Gym', 40.787011, -73.975368, 600, now() - interval '30 days');

-- ---------- check-ins ----------
-- Admin streak: 7-day streak including today (approved GEO)
insert into public.check_ins (group_id, user_id, checkin_date, method, status, lat, lng, created_at)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  (d::date),
  'GEO',
  'APPROVED',
  40.712800,
  -74.006000,
  (d::date + time '18:10')::timestamptz
from generate_series(current_date - 6, current_date, interval '1 day') as d;

-- Alex: solid month so far (approved GEO every other day for ~2 weeks)
insert into public.check_ins (group_id, user_id, checkin_date, method, status, lat, lng, created_at)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  (d::date),
  'GEO',
  'APPROVED',
  40.712900,
  -74.005900,
  (d::date + time '07:40')::timestamptz
from generate_series(current_date - 13, current_date - 1, interval '2 day') as d;

-- Taylor: sporadic check-ins (mix of GEO + MANUAL approved)
insert into public.check_ins (group_id, user_id, checkin_date, method, status, lat, lng, created_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', current_date - 2, 'GEO', 'APPROVED', 40.787050, -73.975300, now() - interval '2 days' + interval '1 hour'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', current_date - 6, 'MANUAL', 'APPROVED', null, null, now() - interval '6 days' + interval '2 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', current_date - 9, 'GEO', 'APPROVED', 40.712750, -74.006050, now() - interval '9 days' + interval '3 hours');

-- Sam: one pending manual request (shows in dashboard approvals)
insert into public.check_ins (id, group_id, user_id, checkin_date, method, status, created_at)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  current_date - 1,
  'MANUAL',
  'PENDING',
  now() - interval '1 day' + interval '5 hours'
);

-- ---------- last month history (leaderboard + badge context) ----------
-- Build a previous-month window
with prev as (
  select
    date_trunc('month', (now() - interval '1 month'))::date as start_date,
    (date_trunc('month', now()) - interval '1 day')::date as end_date
)
insert into public.check_ins (group_id, user_id, checkin_date, method, status, lat, lng, created_at)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222', -- Alex wins last month
  d::date,
  'GEO',
  'APPROVED',
  40.712880,
  -74.005980,
  (d::date + time '06:55')::timestamptz
from prev, generate_series(prev.start_date, prev.start_date + 20, interval '1 day') d;

with prev as (
  select date_trunc('month', (now() - interval '1 month'))::date as start_date
)
insert into public.check_ins (group_id, user_id, checkin_date, method, status, lat, lng, created_at)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111', -- Admin second place last month
  d::date,
  'GEO',
  'APPROVED',
  40.712820,
  -74.006020,
  (d::date + time '19:15')::timestamptz
from prev, generate_series(prev.start_date, prev.start_date + 12, interval '2 day') d;

-- ---------- badges ----------
-- Winner badge for last month (Alex)
insert into public.badges (group_id, user_id, badge_type, period_start, period_end, created_at)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'MONTH_WINNER',
  date_trunc('month', (now() - interval '1 month'))::date,
  (date_trunc('month', now()) - interval '1 day')::date,
  now() - interval '2 days'
on conflict do nothing;

-- Older winner badge (Admin, two months ago)
insert into public.badges (group_id, user_id, badge_type, period_start, period_end, created_at)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'MONTH_WINNER',
  date_trunc('month', (now() - interval '2 month'))::date,
  (date_trunc('month', (now() - interval '1 month')) - interval '1 day')::date,
  now() - interval '40 days'
on conflict do nothing;

-- Optional: a reusable demo invite token (so you can try /join/... manually)
insert into public.group_invites (token, group_id, created_by, created_at, expires_at, uses, max_uses, active)
values (
  'demo-invite-token',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '2 days',
  now() + interval '30 days',
  0,
  50,
  true
)
on conflict do nothing;

commit;


