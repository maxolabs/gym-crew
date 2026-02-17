-- Progression System Migration
-- Adds XP tracking, levels, and progression features

-- =========================
-- Add XP columns to users table
-- =========================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_level integer DEFAULT 1;

-- =========================
-- Level Definitions Table
-- =========================

CREATE TABLE IF NOT EXISTS public.level_definitions (
  level integer PRIMARY KEY,
  title text NOT NULL,
  xp_required integer NOT NULL, -- cumulative XP needed
  perks jsonb, -- e.g., {"streak_freezes": 1, "custom_avatar_border": true}
  color text NOT NULL -- theme color for this level
);

-- Seed levels (exponential curve)
INSERT INTO public.level_definitions (level, title, xp_required, color) VALUES
  (1, 'Newcomer', 0, '#6B7280'),
  (2, 'Beginner', 100, '#6B7280'),
  (3, 'Regular', 300, '#6B7280'),
  (4, 'Committed', 600, '#3B82F6'),
  (5, 'Dedicated', 1000, '#3B82F6'),
  (6, 'Consistent', 1500, '#3B82F6'),
  (7, 'Determined', 2200, '#8B5CF6'),
  (8, 'Relentless', 3000, '#8B5CF6'),
  (9, 'Unstoppable', 4000, '#8B5CF6'),
  (10, 'Iron Will', 5500, '#F59E0B'),
  (11, 'Titan', 7500, '#F59E0B'),
  (12, 'Legend', 10000, '#F59E0B'),
  (13, 'Mythic', 15000, '#EF4444'),
  (14, 'Immortal', 25000, '#EF4444'),
  (15, 'Gym God', 50000, '#EF4444')
ON CONFLICT (level) DO NOTHING;

-- =========================
-- XP Transactions Table
-- =========================

CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source text NOT NULL, -- 'checkin', 'achievement', 'challenge', 'streak_bonus', 'approval'
  source_id uuid, -- reference to check_in, achievement, etc.
  multiplier decimal DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xp_transactions_user_idx ON public.xp_transactions (user_id);
CREATE INDEX IF NOT EXISTS xp_transactions_created_idx ON public.xp_transactions (created_at DESC);

-- =========================
-- Row Level Security
-- =========================

ALTER TABLE public.level_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Level definitions: anyone authenticated can read
DROP POLICY IF EXISTS level_defs_select_authed ON public.level_definitions;
CREATE POLICY level_defs_select_authed ON public.level_definitions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- XP transactions: users can view own
DROP POLICY IF EXISTS xp_transactions_select_own ON public.xp_transactions;
CREATE POLICY xp_transactions_select_own ON public.xp_transactions
  FOR SELECT USING (user_id = auth.uid());

-- =========================
-- Award XP Function
-- =========================

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_id uuid DEFAULT NULL,
  p_multiplier decimal DEFAULT 1.0
)
RETURNS TABLE (
  new_total integer,
  new_level integer,
  leveled_up boolean,
  level_title text,
  level_color text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_level integer;
  v_new_level integer;
  v_new_total integer;
  v_title text;
  v_color text;
  v_effective_amount integer;
BEGIN
  -- Calculate effective amount with multiplier
  v_effective_amount := FLOOR(p_amount * p_multiplier)::integer;

  -- Get current level
  SELECT current_level INTO v_old_level FROM public.users WHERE id = p_user_id;

  IF v_old_level IS NULL THEN
    v_old_level := 1;
  END IF;

  -- Insert transaction
  INSERT INTO public.xp_transactions (user_id, amount, source, source_id, multiplier)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_multiplier);

  -- Update total XP
  UPDATE public.users
  SET total_xp = COALESCE(total_xp, 0) + v_effective_amount
  WHERE id = p_user_id
  RETURNING total_xp INTO v_new_total;

  -- Calculate new level
  SELECT level, title, color INTO v_new_level, v_title, v_color
  FROM public.level_definitions
  WHERE xp_required <= v_new_total
  ORDER BY level DESC
  LIMIT 1;

  IF v_new_level IS NULL THEN
    v_new_level := 1;
    SELECT title, color INTO v_title, v_color FROM public.level_definitions WHERE level = 1;
  END IF;

  -- Update level if changed
  IF v_new_level > v_old_level THEN
    UPDATE public.users SET current_level = v_new_level WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_new_total, v_new_level, (v_new_level > v_old_level), v_title, v_color;
END;
$$;

-- =========================
-- Get User Level Info
-- =========================

CREATE OR REPLACE FUNCTION public.get_user_level_info(p_user_id uuid)
RETURNS TABLE (
  total_xp integer,
  current_level integer,
  level_title text,
  level_color text,
  xp_for_current_level integer,
  xp_for_next_level integer,
  progress_percent integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_xp integer;
  v_current_level integer;
  v_current_def public.level_definitions%rowtype;
  v_next_def public.level_definitions%rowtype;
  v_progress integer;
BEGIN
  -- Get user's XP and level
  SELECT u.total_xp, u.current_level INTO v_total_xp, v_current_level
  FROM public.users u WHERE u.id = p_user_id;

  v_total_xp := COALESCE(v_total_xp, 0);
  v_current_level := COALESCE(v_current_level, 1);

  -- Get current level definition
  SELECT * INTO v_current_def FROM public.level_definitions WHERE level = v_current_level;

  -- Get next level definition
  SELECT * INTO v_next_def FROM public.level_definitions WHERE level = v_current_level + 1;

  -- Calculate progress
  IF v_next_def.level IS NULL THEN
    -- Max level
    v_progress := 100;
  ELSE
    v_progress := ROUND(
      (v_total_xp - v_current_def.xp_required)::numeric /
      NULLIF(v_next_def.xp_required - v_current_def.xp_required, 0)::numeric * 100
    )::integer;
    v_progress := GREATEST(0, LEAST(100, v_progress));
  END IF;

  RETURN QUERY SELECT
    v_total_xp,
    v_current_level,
    v_current_def.title,
    v_current_def.color,
    v_current_def.xp_required,
    COALESCE(v_next_def.xp_required, v_current_def.xp_required),
    v_progress;
END;
$$;

-- =========================
-- Allow users to read own XP fields
-- =========================

-- Update users RLS to allow reading own total_xp and current_level (already covered by existing policy)
-- The existing users_select_self policy covers this

-- =========================
-- Backfill XP from existing achievements
-- =========================

-- Create function to backfill XP for existing users
CREATE OR REPLACE FUNCTION public.backfill_user_xp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user record;
  v_total integer;
  v_level integer;
BEGIN
  FOR v_user IN SELECT id FROM public.users
  LOOP
    -- Calculate total XP from achievements
    SELECT COALESCE(SUM(ad.xp_reward), 0)::integer INTO v_total
    FROM public.user_achievements ua
    JOIN public.achievement_definitions ad ON ad.id = ua.achievement_id
    WHERE ua.user_id = v_user.id;

    -- Calculate level
    SELECT level INTO v_level
    FROM public.level_definitions
    WHERE xp_required <= v_total
    ORDER BY level DESC
    LIMIT 1;

    v_level := COALESCE(v_level, 1);

    -- Update user
    UPDATE public.users
    SET total_xp = v_total, current_level = v_level
    WHERE id = v_user.id;
  END LOOP;
END;
$$;

-- Run backfill
SELECT public.backfill_user_xp();

-- Drop the backfill function after use (optional, can keep for future migrations)
DROP FUNCTION IF EXISTS public.backfill_user_xp();
