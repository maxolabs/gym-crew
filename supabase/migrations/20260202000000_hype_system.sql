-- Hype System Migration
-- Adds fire reaction (hype) to check-ins for social engagement

-- =========================
-- Hypes Table
-- =========================

CREATE TABLE public.hypes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid NOT NULL REFERENCES public.check_ins(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(check_in_id, from_user_id)
);

CREATE INDEX idx_hypes_check_in_id ON public.hypes (check_in_id);
CREATE INDEX idx_hypes_to_user_id ON public.hypes (to_user_id);

-- =========================
-- Row Level Security
-- =========================

ALTER TABLE public.hypes ENABLE ROW LEVEL SECURITY;

-- SELECT: user is member of the check-in's group
DROP POLICY IF EXISTS hypes_select ON public.hypes;
CREATE POLICY hypes_select ON public.hypes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.check_ins ci
      JOIN public.group_members gm ON gm.group_id = ci.group_id
      WHERE ci.id = hypes.check_in_id
        AND gm.user_id = auth.uid()
    )
  );

-- INSERT: enforced via RPC (send_hype), no direct insert
-- No direct insert policy needed since we use SECURITY DEFINER function

-- =========================
-- Send Hype RPC
-- =========================

CREATE OR REPLACE FUNCTION public.send_hype(p_check_in_id uuid)
RETURNS TABLE (
  success boolean,
  hype_count bigint,
  already_hyped boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_check_in record;
  v_inserted boolean;
  v_count bigint;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get check-in details
  SELECT ci.id, ci.user_id, ci.group_id, ci.status
  INTO v_check_in
  FROM public.check_ins ci
  WHERE ci.id = p_check_in_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Check-in not found';
  END IF;

  -- Validate check-in is approved
  IF v_check_in.status != 'APPROVED' THEN
    RAISE EXCEPTION 'Can only hype approved check-ins';
  END IF;

  -- Validate caller is not the check-in owner
  IF v_check_in.user_id = v_caller_id THEN
    RAISE EXCEPTION 'Cannot hype your own check-in';
  END IF;

  -- Validate caller is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_check_in.group_id AND user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  -- Insert hype (idempotent)
  INSERT INTO public.hypes (check_in_id, from_user_id, to_user_id)
  VALUES (p_check_in_id, v_caller_id, v_check_in.user_id)
  ON CONFLICT (check_in_id, from_user_id) DO NOTHING;

  -- Check if we actually inserted (or it was a duplicate)
  v_inserted := FOUND;

  -- Award 1 XP to check-in owner (only if new hype)
  IF v_inserted THEN
    PERFORM public.award_xp(
      v_check_in.user_id,
      1,
      'hype',
      p_check_in_id,
      1.0
    );
  END IF;

  -- Get total hype count for this check-in
  SELECT count(*) INTO v_count
  FROM public.hypes
  WHERE check_in_id = p_check_in_id;

  RETURN QUERY SELECT v_inserted OR NOT v_inserted, v_count, NOT v_inserted;
END;
$$;

-- =========================
-- Hype Achievement Definitions
-- =========================

INSERT INTO public.achievement_definitions (slug, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity)
VALUES
  ('hype_first', 'First Hype', 'Send your first hype', 'Flame', 'SPECIAL', 'EVENT', '{"event": "hype_sent", "count": 1}', 10, 'COMMON'),
  ('hype_50', 'Hype Machine', 'Send 50 hypes', 'Flame', 'MILESTONE', 'EVENT', '{"event": "hype_sent", "count": 50}', 75, 'RARE'),
  ('hype_200', 'Hype Legend', 'Send 200 hypes', 'Flame', 'MILESTONE', 'EVENT', '{"event": "hype_sent", "count": 200}', 150, 'EPIC')
ON CONFLICT (slug) DO NOTHING;
