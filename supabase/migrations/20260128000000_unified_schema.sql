-- Gym Crew Unified Schema
-- Combines all migrations into a single file for fresh deployments
-- Trainer-Client model with routine deadlines

-- =========================
-- Extensions
-- =========================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Tables
-- =========================

-- Users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  user_type text NOT NULL DEFAULT 'USER' CHECK (user_type IN ('USER', 'TRAINER')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Gym groups (created by trainers)
CREATE TABLE IF NOT EXISTS public.gym_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  timezone text NOT NULL DEFAULT 'UTC',
  created_by uuid NOT NULL REFERENCES public.users (id),
  routine_url text,
  routine_content_type text,
  routine_name text,
  routine_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Group membership
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id uuid NOT NULL REFERENCES public.gym_groups (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Gym locations for check-in boundaries
CREATE TABLE IF NOT EXISTS public.gym_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.gym_groups (id) ON DELETE CASCADE,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radius_m integer NOT NULL DEFAULT 500,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Check-ins (daily attendance records)
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.gym_groups (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  checkin_date date NOT NULL,
  method text NOT NULL CHECK (method IN ('GEO', 'MANUAL')),
  status text NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  lat double precision,
  lng double precision,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS check_ins_group_date_idx ON public.check_ins (group_id, checkin_date);
CREATE INDEX IF NOT EXISTS check_ins_user_idx ON public.check_ins (user_id);

-- Manual approval tracking
CREATE TABLE IF NOT EXISTS public.manual_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid NOT NULL REFERENCES public.check_ins (id) ON DELETE CASCADE,
  approver_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (check_in_id, approver_user_id)
);

-- Badges (achievements)
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.gym_groups (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  badge_type text NOT NULL CHECK (badge_type IN ('MONTH_WINNER')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id, badge_type, period_start, period_end)
);

-- Group invite tokens
CREATE TABLE IF NOT EXISTS public.group_invites (
  token text PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.gym_groups (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  uses integer NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 50,
  active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS group_invites_group_idx ON public.group_invites (group_id);

-- =========================
-- Auth Trigger
-- =========================

-- Creates a user profile when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url, user_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    NULLIF(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'user_type', 'USER')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================
-- Helper Functions
-- =========================

-- Check if current user is a trainer
CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND user_type = 'TRAINER'
  );
END;
$$;

-- Check if user is a member of a group (with RLS bypass to prevent recursion)
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
  );
END;
$$;

-- Check if user is an admin of a group (with RLS bypass to prevent recursion)
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'ADMIN'
  );
END;
$$;

-- =========================
-- RPC Functions
-- =========================

-- Create a gym group (trainers only)
CREATE OR REPLACE FUNCTION public.create_gym_group(
  p_name text,
  p_description text,
  p_timezone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.is_trainer() THEN
    RAISE EXCEPTION 'only_trainers_can_create_groups';
  END IF;

  INSERT INTO public.gym_groups (name, description, timezone, created_by)
  VALUES (p_name, p_description, COALESCE(p_timezone, 'UTC'), auth.uid())
  RETURNING id INTO v_group_id;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, auth.uid(), 'ADMIN')
  ON CONFLICT DO NOTHING;

  RETURN v_group_id;
END;
$$;

-- Create an invite link for a group
CREATE OR REPLACE FUNCTION public.create_group_invite(
  p_group_id uuid,
  p_expires_in_hours integer DEFAULT 168,
  p_max_uses integer DEFAULT 50
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF NOT public.is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  v_token := encode(gen_random_bytes(18), 'base64url');

  INSERT INTO public.group_invites (token, group_id, created_by, expires_at, max_uses)
  VALUES (
    v_token,
    p_group_id,
    auth.uid(),
    now() + (COALESCE(p_expires_in_hours, 168) || ' hours')::interval,
    COALESCE(p_max_uses, 50)
  );

  RETURN v_token;
END;
$$;

-- Join a group with an invite token
CREATE OR REPLACE FUNCTION public.join_group_with_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.group_invites%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Use FOR UPDATE to lock the row and prevent race conditions
  SELECT * INTO v_inv
  FROM public.group_invites
  WHERE token = p_token
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  IF v_inv.uses >= v_inv.max_uses THEN
    RAISE EXCEPTION 'invite_max_uses_reached';
  END IF;

  -- Increment uses immediately (atomically with lock)
  UPDATE public.group_invites
  SET uses = uses + 1
  WHERE token = p_token;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_inv.group_id, auth.uid(), 'MEMBER')
  ON CONFLICT DO NOTHING;

  RETURN v_inv.group_id;
END;
$$;

-- Get user's groups with stats (optimized query)
CREATE OR REPLACE FUNCTION public.get_my_groups_with_stats(
  p_month_start date,
  p_month_end date
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  timezone text,
  created_at timestamptz,
  role text,
  my_month_count bigint,
  routine_deadline timestamptz,
  routine_name text,
  trainer_id uuid,
  trainer_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    g.timezone,
    g.created_at,
    gm.role,
    COALESCE((
      SELECT COUNT(*)
      FROM public.check_ins ci
      WHERE ci.group_id = g.id
        AND ci.user_id = auth.uid()
        AND ci.status = 'APPROVED'
        AND ci.checkin_date BETWEEN p_month_start AND p_month_end
    ), 0) AS my_month_count,
    g.routine_deadline,
    g.routine_name,
    g.created_by AS trainer_id,
    u.name AS trainer_name
  FROM public.gym_groups g
  JOIN public.group_members gm ON gm.group_id = g.id AND gm.user_id = auth.uid()
  JOIN public.users u ON u.id = g.created_by
  ORDER BY g.created_at DESC;
END;
$$;

-- Approve a manual check-in
CREATE OR REPLACE FUNCTION public.approve_manual_checkin(p_check_in_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ci public.check_ins%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_ci FROM public.check_ins WHERE id = p_check_in_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'checkin_not_found';
  END IF;

  IF NOT public.is_group_member(v_ci.group_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_ci.user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_self_approve';
  END IF;

  IF v_ci.method <> 'MANUAL' OR v_ci.status <> 'PENDING' THEN
    RAISE EXCEPTION 'not_pending_manual';
  END IF;

  INSERT INTO public.manual_approvals (check_in_id, approver_user_id)
  VALUES (p_check_in_id, auth.uid())
  ON CONFLICT DO NOTHING;

  UPDATE public.check_ins
  SET status = 'APPROVED'
  WHERE id = p_check_in_id
    AND status = 'PENDING';

  RETURN true;
END;
$$;

-- Reject a manual check-in (admin only)
CREATE OR REPLACE FUNCTION public.reject_manual_checkin(p_check_in_id uuid, p_reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ci public.check_ins%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_ci FROM public.check_ins WHERE id = p_check_in_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'checkin_not_found';
  END IF;

  IF NOT public.is_group_admin(v_ci.group_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_ci.method <> 'MANUAL' OR v_ci.status <> 'PENDING' THEN
    RAISE EXCEPTION 'not_pending_manual';
  END IF;

  UPDATE public.check_ins
  SET status = 'REJECTED',
      reject_reason = NULLIF(p_reason, '')
  WHERE id = p_check_in_id;

  RETURN true;
END;
$$;

-- Award month winner badge
CREATE OR REPLACE FUNCTION public.award_month_winner(p_group_id uuid, p_period_start date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start date := date_trunc('month', p_period_start)::date;
  v_end date := (date_trunc('month', p_period_start) + interval '1 month' - interval '1 day')::date;
  v_winner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.badges
    WHERE group_id = p_group_id
      AND badge_type = 'MONTH_WINNER'
      AND period_start = v_start
      AND period_end = v_end
  ) THEN
    RETURN;
  END IF;

  SELECT ci.user_id
  INTO v_winner
  FROM public.check_ins ci
  WHERE ci.group_id = p_group_id
    AND ci.status = 'APPROVED'
    AND ci.checkin_date BETWEEN v_start AND v_end
  GROUP BY ci.user_id
  ORDER BY count(*) DESC, min(ci.created_at) ASC
  LIMIT 1;

  IF v_winner IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.badges (group_id, user_id, badge_type, period_start, period_end)
  VALUES (p_group_id, v_winner, 'MONTH_WINNER', v_start, v_end)
  ON CONFLICT DO NOTHING;
END;
$$;

-- =========================
-- Row Level Security
-- =========================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Users: can read all authenticated users, update self only
DROP POLICY IF EXISTS users_select_all ON public.users;
CREATE POLICY users_select_all ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Groups: members can read, creator can insert, admin can update/delete
DROP POLICY IF EXISTS groups_select_members ON public.gym_groups;
CREATE POLICY groups_select_members ON public.gym_groups
  FOR SELECT USING (public.is_group_member(id));

DROP POLICY IF EXISTS groups_insert_authed ON public.gym_groups;
CREATE POLICY groups_insert_authed ON public.gym_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS groups_update_admin ON public.gym_groups;
CREATE POLICY groups_update_admin ON public.gym_groups
  FOR UPDATE USING (public.is_group_admin(id)) WITH CHECK (public.is_group_admin(id));

DROP POLICY IF EXISTS groups_delete_admin ON public.gym_groups;
CREATE POLICY groups_delete_admin ON public.gym_groups
  FOR DELETE USING (public.is_group_admin(id));

-- Group members: members can read, admin can insert/update, admin or self can delete
DROP POLICY IF EXISTS members_select_members ON public.group_members;
CREATE POLICY members_select_members ON public.group_members
  FOR SELECT USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS members_insert_admin ON public.group_members;
CREATE POLICY members_insert_admin ON public.group_members
  FOR INSERT WITH CHECK (public.is_group_admin(group_id));

DROP POLICY IF EXISTS members_update_admin ON public.group_members;
CREATE POLICY members_update_admin ON public.group_members
  FOR UPDATE USING (public.is_group_admin(group_id)) WITH CHECK (public.is_group_admin(group_id));

DROP POLICY IF EXISTS members_delete_admin_or_self ON public.group_members;
CREATE POLICY members_delete_admin_or_self ON public.group_members
  FOR DELETE USING (public.is_group_admin(group_id) OR user_id = auth.uid());

-- Locations: members can read, admin can manage
DROP POLICY IF EXISTS loc_select_members ON public.gym_locations;
CREATE POLICY loc_select_members ON public.gym_locations
  FOR SELECT USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS loc_insert_admin ON public.gym_locations;
CREATE POLICY loc_insert_admin ON public.gym_locations
  FOR INSERT WITH CHECK (public.is_group_admin(group_id));

DROP POLICY IF EXISTS loc_update_admin ON public.gym_locations;
CREATE POLICY loc_update_admin ON public.gym_locations
  FOR UPDATE USING (public.is_group_admin(group_id)) WITH CHECK (public.is_group_admin(group_id));

DROP POLICY IF EXISTS loc_delete_admin ON public.gym_locations;
CREATE POLICY loc_delete_admin ON public.gym_locations
  FOR DELETE USING (public.is_group_admin(group_id));

-- Check-ins: members can read, self can insert, admin can update
DROP POLICY IF EXISTS ci_select_members ON public.check_ins;
CREATE POLICY ci_select_members ON public.check_ins
  FOR SELECT USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS ci_insert_self ON public.check_ins;
CREATE POLICY ci_insert_self ON public.check_ins
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  );

DROP POLICY IF EXISTS ci_update_admin ON public.check_ins;
CREATE POLICY ci_update_admin ON public.check_ins
  FOR UPDATE USING (public.is_group_admin(group_id)) WITH CHECK (public.is_group_admin(group_id));

-- Manual approvals: members can read/insert (if not self-approving)
DROP POLICY IF EXISTS ma_select_members ON public.manual_approvals;
CREATE POLICY ma_select_members ON public.manual_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.check_ins ci
      WHERE ci.id = manual_approvals.check_in_id
        AND public.is_group_member(ci.group_id)
    )
  );

DROP POLICY IF EXISTS ma_insert_members ON public.manual_approvals;
CREATE POLICY ma_insert_members ON public.manual_approvals
  FOR INSERT WITH CHECK (
    approver_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.check_ins ci
      WHERE ci.id = manual_approvals.check_in_id
        AND public.is_group_member(ci.group_id)
        AND ci.user_id <> auth.uid()
        AND ci.status = 'PENDING'
        AND ci.method = 'MANUAL'
    )
  );

-- Badges: owner or group members can read
DROP POLICY IF EXISTS badges_select_member_or_self ON public.badges;
CREATE POLICY badges_select_member_or_self ON public.badges
  FOR SELECT USING (user_id = auth.uid() OR public.is_group_member(group_id));

-- Invites: admin can manage
DROP POLICY IF EXISTS invites_select_admin ON public.group_invites;
CREATE POLICY invites_select_admin ON public.group_invites
  FOR SELECT USING (public.is_group_admin(group_id));

DROP POLICY IF EXISTS invites_insert_admin ON public.group_invites;
CREATE POLICY invites_insert_admin ON public.group_invites
  FOR INSERT WITH CHECK (public.is_group_admin(group_id));

DROP POLICY IF EXISTS invites_update_admin ON public.group_invites;
CREATE POLICY invites_update_admin ON public.group_invites
  FOR UPDATE USING (public.is_group_admin(group_id)) WITH CHECK (public.is_group_admin(group_id));

DROP POLICY IF EXISTS invites_delete_admin ON public.group_invites;
CREATE POLICY invites_delete_admin ON public.group_invites
  FOR DELETE USING (public.is_group_admin(group_id));

-- =========================
-- Storage
-- =========================

INSERT INTO storage.buckets (id, name, public)
VALUES ('routines', 'routines', false)
ON CONFLICT (id) DO NOTHING;

-- Helper to extract group_id from storage path
CREATE OR REPLACE FUNCTION public.routine_group_id(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(split_part(object_name, '/', 2), '')::uuid;
$$;

-- Storage policies for routines bucket
DROP POLICY IF EXISTS "routines_read_members" ON storage.objects;
CREATE POLICY "routines_read_members"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'routines'
  AND public.is_group_member(public.routine_group_id(name))
);

DROP POLICY IF EXISTS "routines_write_admin" ON storage.objects;
CREATE POLICY "routines_write_admin"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'routines'
  AND public.is_group_admin(public.routine_group_id(name))
)
WITH CHECK (
  bucket_id = 'routines'
  AND public.is_group_admin(public.routine_group_id(name))
);
