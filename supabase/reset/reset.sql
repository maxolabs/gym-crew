-- Gym Crew Database Reset Script
-- WARNING: This will delete ALL data and schema objects
-- Run this before re-applying migrations for a fresh start

-- =========================
-- Drop Storage Policies
-- =========================
DROP POLICY IF EXISTS "routines_read_members" ON storage.objects;
DROP POLICY IF EXISTS "routines_write_admin" ON storage.objects;

-- Delete storage bucket contents and bucket
DELETE FROM storage.objects WHERE bucket_id = 'routines';
DELETE FROM storage.buckets WHERE id = 'routines';

-- =========================
-- Drop RLS Policies
-- =========================
DROP POLICY IF EXISTS users_select_all ON public.users;
DROP POLICY IF EXISTS users_select_self ON public.users;
DROP POLICY IF EXISTS users_update_self ON public.users;

DROP POLICY IF EXISTS groups_select_members ON public.gym_groups;
DROP POLICY IF EXISTS groups_insert_authed ON public.gym_groups;
DROP POLICY IF EXISTS groups_update_admin ON public.gym_groups;
DROP POLICY IF EXISTS groups_delete_admin ON public.gym_groups;

DROP POLICY IF EXISTS members_select_members ON public.group_members;
DROP POLICY IF EXISTS members_insert_admin ON public.group_members;
DROP POLICY IF EXISTS members_update_admin ON public.group_members;
DROP POLICY IF EXISTS members_delete_admin_or_self ON public.group_members;

DROP POLICY IF EXISTS loc_select_members ON public.gym_locations;
DROP POLICY IF EXISTS loc_insert_admin ON public.gym_locations;
DROP POLICY IF EXISTS loc_update_admin ON public.gym_locations;
DROP POLICY IF EXISTS loc_delete_admin ON public.gym_locations;

DROP POLICY IF EXISTS ci_select_members ON public.check_ins;
DROP POLICY IF EXISTS ci_insert_self ON public.check_ins;
DROP POLICY IF EXISTS ci_update_admin ON public.check_ins;

DROP POLICY IF EXISTS ma_select_members ON public.manual_approvals;
DROP POLICY IF EXISTS ma_insert_members ON public.manual_approvals;

DROP POLICY IF EXISTS badges_select_member_or_self ON public.badges;

DROP POLICY IF EXISTS invites_select_admin ON public.group_invites;
DROP POLICY IF EXISTS invites_insert_admin ON public.group_invites;
DROP POLICY IF EXISTS invites_update_admin ON public.group_invites;
DROP POLICY IF EXISTS invites_delete_admin ON public.group_invites;

-- =========================
-- Drop Triggers
-- =========================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =========================
-- Drop Functions
-- =========================
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_trainer();
DROP FUNCTION IF EXISTS public.is_group_member(uuid);
DROP FUNCTION IF EXISTS public.is_group_admin(uuid);
DROP FUNCTION IF EXISTS public.create_gym_group(text, text, text);
DROP FUNCTION IF EXISTS public.create_group_invite(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.join_group_with_token(text);
DROP FUNCTION IF EXISTS public.get_my_groups_with_stats(date, date);
DROP FUNCTION IF EXISTS public.approve_manual_checkin(uuid);
DROP FUNCTION IF EXISTS public.reject_manual_checkin(uuid, text);
DROP FUNCTION IF EXISTS public.award_month_winner(uuid, date);
DROP FUNCTION IF EXISTS public.routine_group_id(text);

-- =========================
-- Drop Tables (order matters due to foreign keys)
-- =========================
DROP TABLE IF EXISTS public.manual_approvals CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.gym_locations CASCADE;
DROP TABLE IF EXISTS public.group_invites CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.gym_groups CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =========================
-- Clear Supabase Migration History (optional)
-- =========================
-- Uncomment the following line if you want to clear migration history
-- DELETE FROM supabase_migrations.schema_migrations;

-- =========================
-- Delete Auth Users (optional - be careful!)
-- =========================
-- Uncomment the following lines to delete all auth users
-- This is destructive and cannot be undone!
-- DELETE FROM auth.users;

SELECT 'Database reset complete. Run migrations to recreate schema.' AS status;
