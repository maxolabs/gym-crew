-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix create_group_invite function to use valid hex encoding
CREATE OR REPLACE FUNCTION public.create_group_invite(
  p_group_id uuid,
  p_expires_in_hours integer default 168,
  p_max_uses integer default 50
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

  -- Use hex encoding (URL-safe, no special chars)
  v_token := encode(gen_random_bytes(18), 'hex');

  INSERT INTO public.group_invites (token, group_id, created_by, expires_at, max_uses)
  VALUES (
    v_token,
    p_group_id,
    auth.uid(),
    now() + (coalesce(p_expires_in_hours, 168) || ' hours')::interval,
    coalesce(p_max_uses, 50)
  );

  RETURN v_token;
END;
$$;
