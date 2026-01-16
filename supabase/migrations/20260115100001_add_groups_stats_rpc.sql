-- Get user's groups with monthly check-in counts (optimizes N+1 queries)
create or replace function public.get_my_groups_with_stats(
  p_month_start date,
  p_month_end date
)
returns table (
  id uuid,
  name text,
  description text,
  timezone text,
  created_at timestamptz,
  role text,
  my_month_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  return query
  select
    g.id,
    g.name,
    g.description,
    g.timezone,
    g.created_at,
    gm.role,
    coalesce(counts.cnt, 0) as my_month_count
  from public.gym_groups g
  inner join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid()
  left join (
    select ci.group_id, count(*) as cnt
    from public.check_ins ci
    where ci.user_id = auth.uid()
      and ci.status = 'APPROVED'
      and ci.checkin_date >= p_month_start
      and ci.checkin_date <= p_month_end
    group by ci.group_id
  ) counts on counts.group_id = g.id
  order by g.created_at desc;
end;
$$;
