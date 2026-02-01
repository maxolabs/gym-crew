-- Achievement System Migration
-- Adds achievement definitions and user earned achievements

-- =========================
-- Tables
-- =========================

-- Achievement catalog (static definitions)
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,  -- lucide icon name
  category text NOT NULL CHECK (category IN ('STREAK', 'MILESTONE', 'TIME', 'CONSISTENCY', 'SPECIAL')),
  requirement_type text NOT NULL,
  requirement_value jsonb NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  rarity text NOT NULL CHECK (rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User earned achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.gym_groups(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Unique index that handles NULL group_id properly
CREATE UNIQUE INDEX IF NOT EXISTS user_achievements_unique_idx
  ON public.user_achievements (user_id, achievement_id, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS user_achievements_user_idx ON public.user_achievements (user_id);
CREATE INDEX IF NOT EXISTS user_achievements_achievement_idx ON public.user_achievements (achievement_id);

-- =========================
-- Seed Achievement Definitions
-- =========================

INSERT INTO public.achievement_definitions (slug, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity)
VALUES
  -- Streak achievements
  ('streak_7', 'Week Warrior', 'Maintain a 7-day check-in streak', 'Flame', 'STREAK', 'STREAK_DAYS', '{"days": 7}', 50, 'COMMON'),
  ('streak_14', 'Fortnight Fighter', 'Maintain a 14-day check-in streak', 'Flame', 'STREAK', 'STREAK_DAYS', '{"days": 14}', 100, 'COMMON'),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day check-in streak', 'Flame', 'STREAK', 'STREAK_DAYS', '{"days": 30}', 200, 'RARE'),
  ('streak_60', 'Two Month Titan', 'Maintain a 60-day check-in streak', 'Flame', 'STREAK', 'STREAK_DAYS', '{"days": 60}', 400, 'EPIC'),
  ('streak_100', 'Century Champion', 'Maintain a 100-day check-in streak', 'Crown', 'STREAK', 'STREAK_DAYS', '{"days": 100}', 1000, 'LEGENDARY'),

  -- Milestone achievements
  ('checkins_10', 'Getting Started', 'Complete 10 check-ins', 'Target', 'MILESTONE', 'TOTAL_CHECKINS', '{"count": 10}', 25, 'COMMON'),
  ('checkins_50', 'Dedicated', 'Complete 50 check-ins', 'Target', 'MILESTONE', 'TOTAL_CHECKINS', '{"count": 50}', 100, 'COMMON'),
  ('checkins_100', 'Centurion', 'Complete 100 check-ins', 'Medal', 'MILESTONE', 'TOTAL_CHECKINS', '{"count": 100}', 250, 'RARE'),
  ('checkins_250', 'Gym Veteran', 'Complete 250 check-ins', 'Medal', 'MILESTONE', 'TOTAL_CHECKINS', '{"count": 250}', 500, 'EPIC'),
  ('checkins_500', 'Iron Legend', 'Complete 500 check-ins', 'Trophy', 'MILESTONE', 'TOTAL_CHECKINS', '{"count": 500}', 1000, 'LEGENDARY'),

  -- Time-based achievements
  ('early_bird', 'Early Bird', 'Check in before 7 AM', 'Sunrise', 'TIME', 'TIME_WINDOW', '{"before_hour": 7}', 50, 'COMMON'),
  ('night_owl', 'Night Owl', 'Check in after 9 PM', 'Moon', 'TIME', 'TIME_WINDOW', '{"after_hour": 21}', 50, 'COMMON'),
  ('weekend_warrior', 'Weekend Warrior', 'Check in on both Saturday and Sunday', 'Calendar', 'TIME', 'WEEKEND_CHECKIN', '{}', 75, 'RARE'),

  -- Consistency achievements
  ('perfect_week', 'Perfect Week', 'Check in every day for a full week', 'CheckCircle', 'CONSISTENCY', 'PERFECT_WEEK', '{}', 150, 'RARE'),
  ('perfect_month', 'Perfect Month', 'Check in every day for a full month', 'Star', 'CONSISTENCY', 'PERFECT_MONTH', '{}', 500, 'LEGENDARY'),

  -- Special achievements
  ('first_checkin', 'First Steps', 'Complete your first check-in', 'Footprints', 'SPECIAL', 'EVENT', '{"event": "first_checkin"}', 10, 'COMMON'),
  ('group_joiner', 'Team Player', 'Join your first group', 'Users', 'SPECIAL', 'EVENT', '{"event": "group_join"}', 25, 'COMMON')
ON CONFLICT (slug) DO NOTHING;

-- =========================
-- RPC Functions
-- =========================

-- Award an achievement to a user (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.award_achievement(
  p_user_id uuid,
  p_slug text,
  p_group_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS TABLE (
  awarded boolean,
  achievement_id uuid,
  achievement_name text,
  achievement_description text,
  achievement_icon text,
  achievement_rarity text,
  achievement_xp integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_def public.achievement_definitions%rowtype;
  v_already_earned boolean;
BEGIN
  -- Get the achievement definition
  SELECT * INTO v_def
  FROM public.achievement_definitions
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::integer;
    RETURN;
  END IF;

  -- Check if already earned (with same group_id context)
  SELECT EXISTS (
    SELECT 1 FROM public.user_achievements ua
    WHERE ua.user_id = p_user_id
      AND ua.achievement_id = v_def.id
      AND COALESCE(ua.group_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(p_group_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) INTO v_already_earned;

  IF v_already_earned THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::integer;
    RETURN;
  END IF;

  -- Insert the achievement
  INSERT INTO public.user_achievements (user_id, achievement_id, group_id, metadata)
  VALUES (p_user_id, v_def.id, p_group_id, p_metadata)
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT
    true,
    v_def.id,
    v_def.name,
    v_def.description,
    v_def.icon,
    v_def.rarity,
    v_def.xp_reward;
END;
$$;

-- Get user's total XP from achievements
CREATE OR REPLACE FUNCTION public.get_user_achievement_xp(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(ad.xp_reward), 0)::integer
  FROM public.user_achievements ua
  JOIN public.achievement_definitions ad ON ad.id = ua.achievement_id
  WHERE ua.user_id = p_user_id;
$$;

-- =========================
-- Row Level Security
-- =========================

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievement definitions: anyone authenticated can read
DROP POLICY IF EXISTS achievement_defs_select_authed ON public.achievement_definitions;
CREATE POLICY achievement_defs_select_authed ON public.achievement_definitions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- User achievements: can read own or group members' achievements
DROP POLICY IF EXISTS user_achievements_select ON public.user_achievements;
CREATE POLICY user_achievements_select ON public.user_achievements
  FOR SELECT USING (
    user_id = auth.uid()
    OR (group_id IS NOT NULL AND public.is_group_member(group_id))
  );

-- User achievements: insert only via RPC (award_achievement function)
-- No direct insert policy needed since we use SECURITY DEFINER function
