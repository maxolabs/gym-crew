-- ============================================================
-- Routine Builder: tables, indexes, RLS, RPCs, seed exercises
-- ============================================================

-- 1. EXERCISES (shared exercise library)
CREATE TABLE public.exercises (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  muscle_group text NOT NULL,
  youtube_url text,
  created_by uuid REFERENCES public.users(id),
  is_global  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercises_select ON public.exercises
  FOR SELECT USING (true);  -- anyone authed can browse exercises

CREATE POLICY exercises_insert ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 2. ROUTINES (one active per group)
CREATE TABLE public.routines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES public.gym_groups(id) ON DELETE CASCADE,
  name        text NOT NULL,
  total_weeks integer NOT NULL CHECK (total_weeks BETWEEN 1 AND 52),
  start_date  date NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid NOT NULL REFERENCES public.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX routines_one_active_per_group
  ON public.routines (group_id) WHERE (is_active = true);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY routines_select ON public.routines
  FOR SELECT USING (public.is_group_member(group_id));

-- 3. ROUTINE_DAYS
CREATE TABLE public.routine_days (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  label      text,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.routine_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY routine_days_select ON public.routine_days
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.routines r WHERE r.id = routine_id AND public.is_group_member(r.group_id))
  );

-- 4. ROUTINE_CIRCUITS
CREATE TABLE public.routine_circuits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id       uuid NOT NULL REFERENCES public.routine_days(id) ON DELETE CASCADE,
  label        text NOT NULL DEFAULT 'A',
  circuit_type text NOT NULL DEFAULT 'TRAINING' CHECK (circuit_type IN ('WARMUP','TRAINING','COOLDOWN')),
  weekly_sets  jsonb NOT NULL DEFAULT '{}',
  sort_order   integer NOT NULL DEFAULT 0,
  notes        text
);

ALTER TABLE public.routine_circuits ENABLE ROW LEVEL SECURITY;

CREATE POLICY routine_circuits_select ON public.routine_circuits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.routine_days d
      JOIN public.routines r ON r.id = d.routine_id
      WHERE d.id = day_id AND public.is_group_member(r.group_id)
    )
  );

-- 5. ROUTINE_CIRCUIT_EXERCISES
CREATE TABLE public.routine_circuit_exercises (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id         uuid NOT NULL REFERENCES public.routine_circuits(id) ON DELETE CASCADE,
  exercise_id        uuid NOT NULL REFERENCES public.exercises(id),
  reps               text,
  notes              text,
  youtube_url_override text,
  sort_order         integer NOT NULL DEFAULT 0
);

ALTER TABLE public.routine_circuit_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY routine_circuit_exercises_select ON public.routine_circuit_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.routine_circuits c
      JOIN public.routine_days d ON d.id = c.day_id
      JOIN public.routines r ON r.id = d.routine_id
      WHERE c.id = circuit_id AND public.is_group_member(r.group_id)
    )
  );

-- 6. ROUTINE_SESSIONS (user doing a day on a date)
CREATE TABLE public.routine_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id   uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id),
  day_id       uuid NOT NULL REFERENCES public.routine_days(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  week_number  integer NOT NULL,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX routine_sessions_unique
  ON public.routine_sessions (routine_id, user_id, day_id, session_date);

ALTER TABLE public.routine_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY routine_sessions_select ON public.routine_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY routine_sessions_insert ON public.routine_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY routine_sessions_update ON public.routine_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- 7. EXERCISE_LOGS (weight/reps per set)
CREATE TABLE public.exercise_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           uuid NOT NULL REFERENCES public.routine_sessions(id) ON DELETE CASCADE,
  circuit_exercise_id  uuid NOT NULL REFERENCES public.routine_circuit_exercises(id),
  set_number           integer NOT NULL,
  weight_kg            decimal,
  reps_done            integer,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX exercise_logs_unique
  ON public.exercise_logs (session_id, circuit_exercise_id, set_number);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercise_logs_select ON public.exercise_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.routine_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

CREATE POLICY exercise_logs_insert ON public.exercise_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.routine_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

CREATE POLICY exercise_logs_update ON public.exercise_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.routine_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Create routine (deactivates old, creates new)
CREATE OR REPLACE FUNCTION public.create_routine(
  p_group_id uuid,
  p_name text,
  p_total_weeks integer,
  p_start_date date
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_routine_id uuid;
BEGIN
  IF NOT public.is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'Not an admin of this group';
  END IF;

  -- Deactivate existing active routine
  UPDATE public.routines SET is_active = false
  WHERE group_id = p_group_id AND is_active = true;

  -- Create new routine
  INSERT INTO public.routines (group_id, name, total_weeks, start_date, is_active, created_by)
  VALUES (p_group_id, p_name, p_total_weeks, p_start_date, true, auth.uid())
  RETURNING id INTO v_routine_id;

  RETURN v_routine_id;
END;
$$;

-- Get active routine with full tree as JSON
CREATE OR REPLACE FUNCTION public.get_active_routine(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_routine record;
  v_result jsonb;
BEGIN
  IF NOT public.is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  SELECT * INTO v_routine FROM public.routines
  WHERE group_id = p_group_id AND is_active = true
  LIMIT 1;

  IF v_routine IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', v_routine.id,
    'group_id', v_routine.group_id,
    'name', v_routine.name,
    'total_weeks', v_routine.total_weeks,
    'start_date', v_routine.start_date,
    'is_active', v_routine.is_active,
    'created_by', v_routine.created_by,
    'created_at', v_routine.created_at,
    'days', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'day_number', d.day_number,
          'label', d.label,
          'sort_order', d.sort_order,
          'circuits', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', c.id,
                'label', c.label,
                'circuit_type', c.circuit_type,
                'weekly_sets', c.weekly_sets,
                'sort_order', c.sort_order,
                'notes', c.notes,
                'exercises', COALESCE((
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', ce.id,
                      'exercise_id', ce.exercise_id,
                      'exercise_name', e.name,
                      'muscle_group', e.muscle_group,
                      'reps', ce.reps,
                      'notes', ce.notes,
                      'youtube_url', COALESCE(ce.youtube_url_override, e.youtube_url),
                      'sort_order', ce.sort_order
                    ) ORDER BY ce.sort_order
                  )
                  FROM public.routine_circuit_exercises ce
                  JOIN public.exercises e ON e.id = ce.exercise_id
                  WHERE ce.circuit_id = c.id
                ), '[]'::jsonb)
              ) ORDER BY c.sort_order
            )
            FROM public.routine_circuits c
            WHERE c.day_id = d.id
          ), '[]'::jsonb)
        ) ORDER BY d.sort_order
      )
      FROM public.routine_days d
      WHERE d.routine_id = v_routine.id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Bulk save entire routine structure
CREATE OR REPLACE FUNCTION public.save_routine_structure(
  p_routine_id uuid,
  p_structure jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_day jsonb;
  v_circuit jsonb;
  v_exercise jsonb;
  v_day_id uuid;
  v_circuit_id uuid;
BEGIN
  -- Verify ownership
  SELECT group_id INTO v_group_id FROM public.routines WHERE id = p_routine_id;
  IF NOT FOUND OR NOT public.is_group_admin(v_group_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete existing structure (cascade will handle children)
  DELETE FROM public.routine_days WHERE routine_id = p_routine_id;

  -- Insert new structure
  FOR v_day IN SELECT * FROM jsonb_array_elements(p_structure->'days')
  LOOP
    INSERT INTO public.routine_days (routine_id, day_number, label, sort_order)
    VALUES (
      p_routine_id,
      (v_day->>'day_number')::integer,
      v_day->>'label',
      (v_day->>'sort_order')::integer
    ) RETURNING id INTO v_day_id;

    FOR v_circuit IN SELECT * FROM jsonb_array_elements(COALESCE(v_day->'circuits', '[]'::jsonb))
    LOOP
      INSERT INTO public.routine_circuits (day_id, label, circuit_type, weekly_sets, sort_order, notes)
      VALUES (
        v_day_id,
        v_circuit->>'label',
        v_circuit->>'circuit_type',
        COALESCE(v_circuit->'weekly_sets', '{}'::jsonb),
        (v_circuit->>'sort_order')::integer,
        v_circuit->>'notes'
      ) RETURNING id INTO v_circuit_id;

      FOR v_exercise IN SELECT * FROM jsonb_array_elements(COALESCE(v_circuit->'exercises', '[]'::jsonb))
      LOOP
        INSERT INTO public.routine_circuit_exercises (circuit_id, exercise_id, reps, notes, youtube_url_override, sort_order)
        VALUES (
          v_circuit_id,
          (v_exercise->>'exercise_id')::uuid,
          v_exercise->>'reps',
          v_exercise->>'notes',
          v_exercise->>'youtube_url_override',
          (v_exercise->>'sort_order')::integer
        );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

-- Start routine session (idempotent)
CREATE OR REPLACE FUNCTION public.start_routine_session(
  p_routine_id uuid,
  p_day_id uuid,
  p_week_number integer
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_group_id uuid;
BEGIN
  SELECT group_id INTO v_group_id FROM public.routines WHERE id = p_routine_id;
  IF NOT FOUND OR NOT public.is_group_member(v_group_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Idempotent: return existing session if already started today
  SELECT id INTO v_session_id FROM public.routine_sessions
  WHERE routine_id = p_routine_id
    AND user_id = auth.uid()
    AND day_id = p_day_id
    AND session_date = CURRENT_DATE;

  IF v_session_id IS NOT NULL THEN
    RETURN v_session_id;
  END IF;

  INSERT INTO public.routine_sessions (routine_id, user_id, day_id, session_date, week_number)
  VALUES (p_routine_id, auth.uid(), p_day_id, CURRENT_DATE, p_week_number)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Log exercise set (upsert)
CREATE OR REPLACE FUNCTION public.log_exercise_set(
  p_session_id uuid,
  p_circuit_exercise_id uuid,
  p_set_number integer,
  p_weight_kg decimal,
  p_reps_done integer
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Verify session ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.routine_sessions WHERE id = p_session_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not your session';
  END IF;

  INSERT INTO public.exercise_logs (session_id, circuit_exercise_id, set_number, weight_kg, reps_done)
  VALUES (p_session_id, p_circuit_exercise_id, p_set_number, p_weight_kg, p_reps_done)
  ON CONFLICT (session_id, circuit_exercise_id, set_number)
  DO UPDATE SET weight_kg = EXCLUDED.weight_kg, reps_done = EXCLUDED.reps_done
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Complete routine session + award XP
CREATE OR REPLACE FUNCTION public.complete_routine_session(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session record;
  v_xp_result record;
BEGIN
  SELECT * INTO v_session FROM public.routine_sessions
  WHERE id = p_session_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.completed_at IS NOT NULL THEN
    RETURN jsonb_build_object('already_completed', true);
  END IF;

  UPDATE public.routine_sessions SET completed_at = now()
  WHERE id = p_session_id;

  -- Award 20 XP for completing a workout session
  SELECT * INTO v_xp_result FROM public.award_xp(auth.uid(), 20, 'WORKOUT_SESSION', p_session_id, 1.0);

  RETURN jsonb_build_object(
    'completed', true,
    'xp_awarded', 20,
    'new_total', v_xp_result.new_total,
    'new_level', v_xp_result.new_level,
    'leveled_up', v_xp_result.leveled_up,
    'level_title', v_xp_result.level_title,
    'level_color', v_xp_result.level_color
  );
END;
$$;

-- ============================================================
-- SEED EXERCISES (~40 global exercises)
-- ============================================================

INSERT INTO public.exercises (name, muscle_group, is_global) VALUES
-- Warmup (8)
('Jumping Jacks', 'Warmup', true),
('High Knees', 'Warmup', true),
('Arm Circles', 'Warmup', true),
('Leg Swings', 'Warmup', true),
('Hip Circles', 'Warmup', true),
('Bodyweight Squats', 'Warmup', true),
('Inchworms', 'Warmup', true),
('Mountain Climbers', 'Warmup', true),
-- Chest (5)
('Bench Press', 'Chest', true),
('Incline Dumbbell Press', 'Chest', true),
('Cable Flyes', 'Chest', true),
('Push-Ups', 'Chest', true),
('Dumbbell Chest Press', 'Chest', true),
-- Back (6)
('Pull-Ups', 'Back', true),
('Barbell Rows', 'Back', true),
('Lat Pulldown', 'Back', true),
('Seated Cable Row', 'Back', true),
('Dumbbell Rows', 'Back', true),
('Face Pulls', 'Back', true),
-- Shoulders (5)
('Overhead Press', 'Shoulders', true),
('Lateral Raises', 'Shoulders', true),
('Front Raises', 'Shoulders', true),
('Reverse Flyes', 'Shoulders', true),
('Arnold Press', 'Shoulders', true),
-- Legs (9)
('Barbell Squats', 'Legs', true),
('Romanian Deadlifts', 'Legs', true),
('Leg Press', 'Legs', true),
('Lunges', 'Legs', true),
('Leg Curls', 'Legs', true),
('Leg Extensions', 'Legs', true),
('Calf Raises', 'Legs', true),
('Bulgarian Split Squats', 'Legs', true),
('Hip Thrusts', 'Legs', true),
-- Arms (5)
('Barbell Curls', 'Arms', true),
('Tricep Pushdowns', 'Arms', true),
('Hammer Curls', 'Arms', true),
('Skull Crushers', 'Arms', true),
('Dips', 'Arms', true),
-- Core (5)
('Plank', 'Core', true),
('Russian Twists', 'Core', true),
('Hanging Leg Raises', 'Core', true),
('Ab Wheel Rollouts', 'Core', true),
('Cable Woodchops', 'Core', true);
