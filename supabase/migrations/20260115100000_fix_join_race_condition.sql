-- Fix race condition in join_group_with_token by using SELECT FOR UPDATE
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

  -- Use FOR UPDATE to lock the row and prevent race conditions
  select * into v_inv
  from public.group_invites
  where token = p_token
    and active = true
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    raise exception 'invalid_or_expired_token';
  end if;

  if v_inv.uses >= v_inv.max_uses then
    raise exception 'invite_max_uses_reached';
  end if;

  -- Increment uses immediately (atomically with lock)
  update public.group_invites
  set uses = uses + 1
  where token = p_token;

  insert into public.group_members (group_id, user_id, role)
  values (v_inv.group_id, auth.uid(), 'MEMBER')
  on conflict do nothing;

  return v_inv.group_id;
end;
$$;
