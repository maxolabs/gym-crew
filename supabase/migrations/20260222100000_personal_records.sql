-- ============================================================
-- Personal Records (PRs) per exercise per user
-- ============================================================

CREATE TABLE public.personal_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  weight_kg   decimal NOT NULL,
  reps        integer NOT NULL DEFAULT 1,
  notes       text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- One PR per user per exercise (upsert pattern)
CREATE UNIQUE INDEX personal_records_user_exercise
  ON public.personal_records (user_id, exercise_id);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY personal_records_select ON public.personal_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY personal_records_insert ON public.personal_records
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY personal_records_update ON public.personal_records
  FOR UPDATE USING (user_id = auth.uid());

-- Upsert RPC for saving a PR
CREATE OR REPLACE FUNCTION public.save_personal_record(
  p_exercise_id uuid,
  p_weight_kg decimal,
  p_reps integer DEFAULT 1,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.personal_records (user_id, exercise_id, weight_kg, reps, notes)
  VALUES (auth.uid(), p_exercise_id, p_weight_kg, p_reps, p_notes)
  ON CONFLICT (user_id, exercise_id)
  DO UPDATE SET
    weight_kg = EXCLUDED.weight_kg,
    reps = EXCLUDED.reps,
    notes = COALESCE(EXCLUDED.notes, personal_records.notes),
    recorded_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
