-- Gym Crew initial schema + policies + storage bucket policies
-- Source: supabase/schema.sql + supabase/storage.sql

-- =========================
-- schema.sql
-- =========================

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.gym_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  timezone text not null default 'UTC',
  created_by uuid not null references public.users (id),
  routine_url text,
  routine_content_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.gym_groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('ADMIN','MEMBER')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.gym_locations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.gym_groups (id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  radius_m integer not null default 500,
  created_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.gym_groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  checkin_date date not null,
  method text not null check (method in ('GEO','MANUAL')),
  status text not null check (status in ('PENDING','APPROVED','REJECTED')),
  lat double precision,
  lng double precision,
  reject_reason text,
  created_at timestamptz not null default now(),
  unique (group_id, user_id, checkin_date)
);

create index if not exists check_ins_group_date_idx on public.check_ins (group_id, checkin_date);
create index if not exists check_ins_user_idx on public.check_ins (user_id);

create table if not exists public.manual_approvals (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  approver_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (check_in_id, approver_user_id)
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.gym_groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  badge_type text not null check (badge_type in ('MONTH_WINNER')),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  unique (group_id, user_id, badge_type, period_start, period_end)
);

create table if not exists public.group_invites (
  token text primary key,
  group_id uuid not null references public.gym_groups (id) on delete cascade,
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  uses integer not null default 0,
  max_uses integer not null default 50,
  active boolean not null default true
);

create index if not exists group_invites_group_idx on public.group_invites (group_id);

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'ADMIN'
  );
end;
$$;

create or replace function public.create_gym_group(
  p_name text,
  p_description text,
  p_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.gym_groups (name, description, timezone, created_by)
  values (p_name, p_description, coalesce(p_timezone, 'UTC'), auth.uid())
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, auth.uid(), 'ADMIN')
  on conflict do nothing;

  return v_group_id;
end;
$$;

create or replace function public.create_group_invite(
  p_group_id uuid,
  p_expires_in_hours integer default 168,
  p_max_uses integer default 50
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_group_admin(p_group_id) then
    raise exception 'not_authorized';
  end if;

  v_token := encode(gen_random_bytes(18), 'base64url');

  insert into public.group_invites (token, group_id, created_by, expires_at, max_uses)
  values (
    v_token,
    p_group_id,
    auth.uid(),
    now() + (coalesce(p_expires_in_hours, 168) || ' hours')::interval,
    coalesce(p_max_uses, 50)
  );

  return v_token;
end;
$$;

create or replace function public.join_group_with_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.group_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_inv
  from public.group_invites
  where token = p_token
    and active = true
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'invalid_or_expired_token';
  end if;

  if v_inv.uses >= v_inv.max_uses then
    raise exception 'invite_max_uses_reached';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_inv.group_id, auth.uid(), 'MEMBER')
  on conflict do nothing;

  update public.group_invites
  set uses = uses + 1
  where token = p_token;

  return v_inv.group_id;
end;
$$;

create or replace function public.approve_manual_checkin(p_check_in_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ci public.check_ins%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_ci from public.check_ins where id = p_check_in_id;
  if not found then
    raise exception 'checkin_not_found';
  end if;

  if not public.is_group_member(v_ci.group_id) then
    raise exception 'not_authorized';
  end if;

  if v_ci.user_id = auth.uid() then
    raise exception 'cannot_self_approve';
  end if;

  if v_ci.method <> 'MANUAL' or v_ci.status <> 'PENDING' then
    raise exception 'not_pending_manual';
  end if;

  insert into public.manual_approvals (check_in_id, approver_user_id)
  values (p_check_in_id, auth.uid())
  on conflict do nothing;

  update public.check_ins
  set status = 'APPROVED'
  where id = p_check_in_id
    and status = 'PENDING';

  return true;
end;
$$;

create or replace function public.reject_manual_checkin(p_check_in_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ci public.check_ins%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  select * into v_ci from public.check_ins where id = p_check_in_id;
  if not found then
    raise exception 'checkin_not_found';
  end if;
  if not public.is_group_admin(v_ci.group_id) then
    raise exception 'not_authorized';
  end if;
  if v_ci.method <> 'MANUAL' or v_ci.status <> 'PENDING' then
    raise exception 'not_pending_manual';
  end if;
  update public.check_ins
  set status = 'REJECTED',
      reject_reason = nullif(p_reason,'')
  where id = p_check_in_id;
  return true;
end;
$$;

create or replace function public.award_month_winner(p_group_id uuid, p_period_start date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start date := date_trunc('month', p_period_start)::date;
  v_end date := (date_trunc('month', p_period_start) + interval '1 month' - interval '1 day')::date;
  v_winner uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_group_member(p_group_id) then
    raise exception 'not_authorized';
  end if;

  if exists (
    select 1 from public.badges
    where group_id = p_group_id
      and badge_type = 'MONTH_WINNER'
      and period_start = v_start
      and period_end = v_end
  ) then
    return;
  end if;

  select ci.user_id
  into v_winner
  from public.check_ins ci
  where ci.group_id = p_group_id
    and ci.status = 'APPROVED'
    and ci.checkin_date between v_start and v_end
  group by ci.user_id
  order by count(*) desc, min(ci.created_at) asc
  limit 1;

  if v_winner is null then
    return;
  end if;

  insert into public.badges (group_id, user_id, badge_type, period_start, period_end)
  values (p_group_id, v_winner, 'MONTH_WINNER', v_start, v_end)
  on conflict do nothing;
end;
$$;

alter table public.users enable row level security;
alter table public.gym_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.gym_locations enable row level security;
alter table public.check_ins enable row level security;
alter table public.manual_approvals enable row level security;
alter table public.badges enable row level security;
alter table public.group_invites enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select using (id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists groups_select_members on public.gym_groups;
create policy groups_select_members on public.gym_groups
  for select using (public.is_group_member(id));

drop policy if exists groups_insert_authed on public.gym_groups;
create policy groups_insert_authed on public.gym_groups
  for insert with check (auth.uid() = created_by);

drop policy if exists groups_update_admin on public.gym_groups;
create policy groups_update_admin on public.gym_groups
  for update using (public.is_group_admin(id)) with check (public.is_group_admin(id));

drop policy if exists groups_delete_admin on public.gym_groups;
create policy groups_delete_admin on public.gym_groups
  for delete using (public.is_group_admin(id));

drop policy if exists members_select_members on public.group_members;
create policy members_select_members on public.group_members
  for select using (public.is_group_member(group_id));

drop policy if exists members_insert_admin on public.group_members;
create policy members_insert_admin on public.group_members
  for insert with check (public.is_group_admin(group_id));

drop policy if exists members_update_admin on public.group_members;
create policy members_update_admin on public.group_members
  for update using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

drop policy if exists members_delete_admin_or_self on public.group_members;
create policy members_delete_admin_or_self on public.group_members
  for delete using (public.is_group_admin(group_id) or user_id = auth.uid());

drop policy if exists loc_select_members on public.gym_locations;
create policy loc_select_members on public.gym_locations
  for select using (public.is_group_member(group_id));

drop policy if exists loc_insert_admin on public.gym_locations;
create policy loc_insert_admin on public.gym_locations
  for insert with check (public.is_group_admin(group_id));

drop policy if exists loc_update_admin on public.gym_locations;
create policy loc_update_admin on public.gym_locations
  for update using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

drop policy if exists loc_delete_admin on public.gym_locations;
create policy loc_delete_admin on public.gym_locations
  for delete using (public.is_group_admin(group_id));

drop policy if exists ci_select_members on public.check_ins;
create policy ci_select_members on public.check_ins
  for select using (public.is_group_member(group_id));

drop policy if exists ci_insert_self on public.check_ins;
create policy ci_insert_self on public.check_ins
  for insert with check (
    user_id = auth.uid()
    and public.is_group_member(group_id)
  );

drop policy if exists ci_update_admin on public.check_ins;
create policy ci_update_admin on public.check_ins
  for update using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

drop policy if exists ma_select_members on public.manual_approvals;
create policy ma_select_members on public.manual_approvals
  for select using (
    exists (
      select 1
      from public.check_ins ci
      where ci.id = manual_approvals.check_in_id
        and public.is_group_member(ci.group_id)
    )
  );

drop policy if exists ma_insert_members on public.manual_approvals;
create policy ma_insert_members on public.manual_approvals
  for insert with check (
    approver_user_id = auth.uid()
    and exists (
      select 1 from public.check_ins ci
      where ci.id = manual_approvals.check_in_id
        and public.is_group_member(ci.group_id)
        and ci.user_id <> auth.uid()
        and ci.status = 'PENDING'
        and ci.method = 'MANUAL'
    )
  );

drop policy if exists badges_select_member_or_self on public.badges;
create policy badges_select_member_or_self on public.badges
  for select using (user_id = auth.uid() or public.is_group_member(group_id));

drop policy if exists invites_select_admin on public.group_invites;
create policy invites_select_admin on public.group_invites
  for select using (public.is_group_admin(group_id));

drop policy if exists invites_insert_admin on public.group_invites;
create policy invites_insert_admin on public.group_invites
  for insert with check (public.is_group_admin(group_id));

drop policy if exists invites_update_admin on public.group_invites;
create policy invites_update_admin on public.group_invites
  for update using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

drop policy if exists invites_delete_admin on public.group_invites;
create policy invites_delete_admin on public.group_invites
  for delete using (public.is_group_admin(group_id));

-- =========================
-- storage.sql
-- =========================

insert into storage.buckets (id, name, public)
values ('routines', 'routines', false)
on conflict (id) do nothing;

create or replace function public.routine_group_id(object_name text)
returns uuid
language sql
stable
as $$
  select nullif(split_part(object_name, '/', 2), '')::uuid;
$$;

drop policy if exists "routines_read_members" on storage.objects;
create policy "routines_read_members"
on storage.objects
for select
using (
  bucket_id = 'routines'
  and public.is_group_member(public.routine_group_id(name))
);

drop policy if exists "routines_write_admin" on storage.objects;
create policy "routines_write_admin"
on storage.objects
for all
using (
  bucket_id = 'routines'
  and public.is_group_admin(public.routine_group_id(name))
)
with check (
  bucket_id = 'routines'
  and public.is_group_admin(public.routine_group_id(name))
);


