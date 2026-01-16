-- Fix RLS recursion (stack depth exceeded) by making helper functions SECURITY DEFINER
-- and disabling row_security inside the function.

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



