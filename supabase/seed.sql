-- Seed data for testing achievements
-- Run after migrations with: supabase db reset

-- Create test users in auth.users with proper Supabase format
-- Password for all: password123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'trainer@test.com',
    '$2a$10$PznXR4PLq4OQ.Wv3kx/6T.zLVlM3QLMzU8Fz1JFXD5gVjRMQK/MsW', -- password123
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test Trainer", "user_type": "TRAINER"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'client@test.com',
    '$2a$10$PznXR4PLq4OQ.Wv3kx/6T.zLVlM3QLMzU8Fz1JFXD5gVjRMQK/MsW', -- password123
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test Client", "user_type": "USER"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'client2@test.com',
    '$2a$10$PznXR4PLq4OQ.Wv3kx/6T.zLVlM3QLMzU8Fz1JFXD5gVjRMQK/MsW', -- password123
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Streak Master", "user_type": "USER"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- Create identities for each user (required for email login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub": "11111111-1111-1111-1111-111111111111", "email": "trainer@test.com"}',
    'email',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub": "22222222-2222-2222-2222-222222222222", "email": "client@test.com"}',
    'email',
    '22222222-2222-2222-2222-222222222222',
    now(),
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '{"sub": "33333333-3333-3333-3333-333333333333", "email": "client2@test.com"}',
    'email',
    '33333333-3333-3333-3333-333333333333',
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Create a test group
INSERT INTO public.gym_groups (id, name, description, timezone, created_by)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Gym', 'A gym for testing achievements', 'America/New_York', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Add members to the group
INSERT INTO public.group_members (group_id, user_id, role)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'ADMIN'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'MEMBER'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'MEMBER')
ON CONFLICT DO NOTHING;

-- Add a gym location
INSERT INTO public.gym_locations (id, group_id, name, lat, lng, radius_m)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main Gym', 40.7128, -74.0060, 500)
ON CONFLICT (id) DO NOTHING;

-- Create check-ins for Test Client (22222222...)
-- 15 check-ins to trigger: first_checkin, checkins_10
INSERT INTO public.check_ins (group_id, user_id, checkin_date, method, status, created_at)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  (CURRENT_DATE - (n || ' days')::interval)::date,
  'GEO',
  'APPROVED',
  now() - (n || ' days')::interval
FROM generate_series(0, 14) AS n
ON CONFLICT DO NOTHING;

-- Create check-ins for Streak Master (33333333...)
-- 35 consecutive days to trigger: streak_7, streak_14, streak_30, checkins_10
INSERT INTO public.check_ins (group_id, user_id, checkin_date, method, status, created_at)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  (CURRENT_DATE - (n || ' days')::interval)::date,
  'GEO',
  'APPROVED',
  now() - (n || ' days')::interval
FROM generate_series(0, 34) AS n
ON CONFLICT DO NOTHING;

-- Award some achievements manually for demo purposes
-- First Steps for both clients
SELECT public.award_achievement('22222222-2222-2222-2222-222222222222', 'first_checkin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}');
SELECT public.award_achievement('33333333-3333-3333-3333-333333333333', 'first_checkin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}');

-- Milestone achievements for Test Client
SELECT public.award_achievement('22222222-2222-2222-2222-222222222222', 'checkins_10', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}');

-- Streak achievements for Streak Master
SELECT public.award_achievement('33333333-3333-3333-3333-333333333333', 'checkins_10', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}');
SELECT public.award_achievement('33333333-3333-3333-3333-333333333333', 'streak_7', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}');
SELECT public.award_achievement('33333333-3333-3333-3333-333333333333', 'streak_14', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}');
SELECT public.award_achievement('33333333-3333-3333-3333-333333333333', 'streak_30', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}');

-- Group joiner achievement
SELECT public.award_achievement('22222222-2222-2222-2222-222222222222', 'group_joiner', NULL, '{}');
SELECT public.award_achievement('33333333-3333-3333-3333-333333333333', 'group_joiner', NULL, '{}');
