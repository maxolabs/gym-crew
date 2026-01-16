-- Gym Crew - Storage bucket + policies for routines
-- Create a PRIVATE bucket named "routines" (readable by group members, writable by admins).

insert into storage.buckets (id, name, public)
values ('routines', 'routines', false)
on conflict (id) do nothing;

-- Helper to extract group_id from object name: routines/{groupId}/routine.ext
create or replace function public.routine_group_id(object_name text)
returns uuid
language sql
stable
as $$
  select nullif(split_part(object_name, '/', 2), '')::uuid;
$$;

-- Allow members to read routine objects
drop policy if exists "routines_read_members" on storage.objects;
create policy "routines_read_members"
on storage.objects
for select
using (
  bucket_id = 'routines'
  and public.is_group_member(public.routine_group_id(name))
);

-- Allow admins to upload/replace/delete
drop policy if exists "routines_write_admin" on storage.objects;
create policy "routines_write_admin"
on storage.objects
for all
using (
  bucket_id = 'routines'
  and public.is_group_admin(public.routine_group_id(name))
)
with check (
  bucket_id = 'routines'
  and public.is_group_admin(public.routine_group_id(name))
);



