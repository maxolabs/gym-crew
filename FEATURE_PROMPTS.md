# Gym Crew - Feature Implementation Prompts

> Detailed prompts for AI agents to implement new features. Each section contains everything needed for a one-shot implementation.

---

## Table of Contents

1. [Achievement Badge System](#1-achievement-badge-system)
2. [XP & Levels System](#2-xp--levels-system)
3. [Challenges & Competitions](#3-challenges--competitions)
4. [Streak Freezes](#4-streak-freezes)
5. [Social Recognition (Hype System)](#5-social-recognition-hype-system)
6. [Workout Logging System](#6-workout-logging-system)
7. [Personal Records Dashboard](#7-personal-records-dashboard)
8. [Body Measurements Tracking](#8-body-measurements-tracking)
9. [Smart Insights & Analytics](#9-smart-insights--analytics)
10. [Push Notifications](#10-push-notifications)

---

## 1. Achievement Badge System

### Context
Currently, the app only has a `MONTH_WINNER` badge. We need a comprehensive achievement system that rewards various behaviors and milestones to increase engagement and retention.

### Database Schema

Add to `supabase/schema.sql`:

```sql
-- Expand badge_type enum (or create new table for flexibility)
CREATE TABLE achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- e.g., 'streak_7', 'early_bird', 'centurion'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name from lucide
  category TEXT NOT NULL, -- 'streak', 'consistency', 'time', 'social', 'milestone'
  requirement_type TEXT NOT NULL, -- 'streak_days', 'total_checkins', 'time_based', 'special'
  requirement_value JSONB, -- flexible: {"days": 7} or {"hour_before": 7, "count": 5}
  xp_reward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  group_id UUID REFERENCES gym_groups(id) ON DELETE CASCADE, -- NULL for global achievements
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB, -- store context like "streak_length": 30
  UNIQUE(user_id, achievement_id, group_id)
);

-- Seed initial achievements
INSERT INTO achievement_definitions (slug, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity) VALUES
-- Streak achievements
('streak_7', '7-Day Warrior', 'Maintain a 7-day check-in streak', 'flame', 'streak', 'streak_days', '{"days": 7}', 100, 'common'),
('streak_14', 'Two Week Titan', 'Maintain a 14-day check-in streak', 'flame', 'streak', 'streak_days', '{"days": 14}', 250, 'common'),
('streak_30', '30-Day Legend', 'Maintain a 30-day check-in streak', 'flame', 'streak', 'streak_days', '{"days": 30}', 500, 'rare'),
('streak_60', 'Iron Will', 'Maintain a 60-day check-in streak', 'flame', 'streak', 'streak_days', '{"days": 60}', 1000, 'epic'),
('streak_100', 'Unstoppable', 'Maintain a 100-day check-in streak', 'flame', 'streak', 'streak_days', '{"days": 100}', 2500, 'legendary'),

-- Milestone achievements
('checkins_10', 'Getting Started', 'Complete 10 total check-ins', 'target', 'milestone', 'total_checkins', '{"count": 10}', 50, 'common'),
('checkins_50', 'Committed', 'Complete 50 total check-ins', 'target', 'milestone', 'total_checkins', '{"count": 50}', 200, 'common'),
('checkins_100', 'Centurion', 'Complete 100 total check-ins', 'trophy', 'milestone', 'total_checkins', '{"count": 100}', 500, 'rare'),
('checkins_250', 'Dedicated', 'Complete 250 total check-ins', 'trophy', 'milestone', 'total_checkins', '{"count": 250}', 1000, 'epic'),
('checkins_500', 'Gym Rat', 'Complete 500 total check-ins', 'crown', 'milestone', 'total_checkins', '{"count": 500}', 2500, 'legendary'),

-- Time-based achievements
('early_bird', 'Early Bird', 'Check in before 7 AM five times', 'sunrise', 'time', 'time_based', '{"hour_before": 7, "count": 5}', 150, 'common'),
('night_owl', 'Night Owl', 'Check in after 8 PM five times', 'moon', 'time', 'time_based', '{"hour_after": 20, "count": 5}', 150, 'common'),
('weekend_warrior', 'Weekend Warrior', 'Check in on 10 weekends', 'calendar', 'time', 'time_based', '{"weekend_count": 10}', 200, 'common'),

-- Consistency achievements
('perfect_week', 'Perfect Week', 'Check in every day for a week', 'star', 'consistency', 'perfect_period', '{"period": "week"}', 300, 'rare'),
('perfect_month', 'Perfect Month', 'Check in every day for a month', 'star', 'consistency', 'perfect_period', '{"period": "month"}', 1000, 'legendary'),

-- Special achievements
('comeback_kid', 'Comeback Kid', 'Return after 7+ days absence', 'rotate-ccw', 'special', 'comeback', '{"days_absent": 7}', 100, 'common'),
('first_checkin', 'First Steps', 'Complete your first check-in', 'footprints', 'special', 'first', '{}', 25, 'common'),
('group_joiner', 'Team Player', 'Join your first group', 'users', 'special', 'first_group', '{}', 25, 'common');

-- RLS Policies
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievement definitions"
  ON achievement_definitions FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Achievement Checker Function

Create `lib/achievements.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js'

type AchievementCheck = {
  slug: string
  check: (ctx: CheckContext) => Promise<boolean>
}

type CheckContext = {
  supabase: SupabaseClient
  userId: string
  groupId?: string
  checkInTime?: Date
  totalCheckIns?: number
  currentStreak?: number
}

const achievementChecks: AchievementCheck[] = [
  // Streak achievements
  { slug: 'streak_7', check: async (ctx) => (ctx.currentStreak ?? 0) >= 7 },
  { slug: 'streak_14', check: async (ctx) => (ctx.currentStreak ?? 0) >= 14 },
  { slug: 'streak_30', check: async (ctx) => (ctx.currentStreak ?? 0) >= 30 },
  { slug: 'streak_60', check: async (ctx) => (ctx.currentStreak ?? 0) >= 60 },
  { slug: 'streak_100', check: async (ctx) => (ctx.currentStreak ?? 0) >= 100 },

  // Milestone achievements
  { slug: 'checkins_10', check: async (ctx) => (ctx.totalCheckIns ?? 0) >= 10 },
  { slug: 'checkins_50', check: async (ctx) => (ctx.totalCheckIns ?? 0) >= 50 },
  { slug: 'checkins_100', check: async (ctx) => (ctx.totalCheckIns ?? 0) >= 100 },
  { slug: 'checkins_250', check: async (ctx) => (ctx.totalCheckIns ?? 0) >= 250 },
  { slug: 'checkins_500', check: async (ctx) => (ctx.totalCheckIns ?? 0) >= 500 },

  // Time-based (check against checkInTime)
  { slug: 'early_bird', check: async (ctx) => {
    if (!ctx.checkInTime) return false
    const { count } = await ctx.supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.userId)
      .eq('status', 'APPROVED')
      .lt('created_at::time', '07:00:00')
    return (count ?? 0) >= 5
  }},
  // ... similar for night_owl, weekend_warrior

  // First check-in
  { slug: 'first_checkin', check: async (ctx) => (ctx.totalCheckIns ?? 0) >= 1 },
]

export async function checkAndAwardAchievements(ctx: CheckContext): Promise<string[]> {
  const awarded: string[] = []

  // Get user's existing achievements
  const { data: existing } = await ctx.supabase
    .from('user_achievements')
    .select('achievement_id, achievement_definitions(slug)')
    .eq('user_id', ctx.userId)

  const earnedSlugs = new Set(existing?.map(e => e.achievement_definitions?.slug) ?? [])

  // Get all achievement definitions
  const { data: definitions } = await ctx.supabase
    .from('achievement_definitions')
    .select('*')

  for (const check of achievementChecks) {
    if (earnedSlugs.has(check.slug)) continue

    const definition = definitions?.find(d => d.slug === check.slug)
    if (!definition) continue

    const earned = await check.check(ctx)
    if (earned) {
      await ctx.supabase.from('user_achievements').insert({
        user_id: ctx.userId,
        achievement_id: definition.id,
        group_id: ctx.groupId || null,
        metadata: { streak: ctx.currentStreak, total: ctx.totalCheckIns }
      })
      awarded.push(definition.name)
    }
  }

  return awarded
}
```

### UI Components

#### `components/achievements/AchievementBadge.tsx`
```typescript
// Display a single achievement with rarity-based styling
// Props: achievement, size ('sm' | 'md' | 'lg'), showTooltip
// Rarity colors: common=gray, rare=blue, epic=purple, legendary=gold
// Include subtle glow/animation for legendary badges
// Show lock icon overlay for unearned achievements
```

#### `components/achievements/AchievementToast.tsx`
```typescript
// Celebratory toast when achievement is earned
// Include confetti animation for rare+ achievements
// Show XP earned with animated counter
// Auto-dismiss after 5 seconds with progress bar
```

#### `components/achievements/AchievementsGrid.tsx`
```typescript
// Grid display of all achievements (earned and locked)
// Group by category with collapsible sections
// Show progress for in-progress achievements (e.g., "47/50 check-ins")
// Filter tabs: All, Earned, Locked, By Category
```

#### `app/(app)/achievements/page.tsx`
```typescript
// Full achievements page
// Header with total achievements earned (e.g., "12/24 Achievements")
// Total XP display with level indicator
// AchievementsGrid component
// Recent achievements section at top
```

### Integration Points

1. **After successful check-in** (`app/(app)/g/[groupId]/page.tsx`):
   - Call `checkAndAwardAchievements()` with current context
   - Display AchievementToast for any newly earned achievements

2. **Dashboard** (`app/(app)/dashboard/page.tsx`):
   - Add "Recent Achievements" section showing last 3 earned
   - Add link to full achievements page

3. **Profile** (`app/(app)/profile/page.tsx`):
   - Show achievement showcase (user picks 3 to display)
   - Total achievement count and XP

4. **Group leaderboard**:
   - Show small achievement badge icons next to names
   - Option to view member's achievements

### Visual Design

- **Rarity Colors**:
  - Common: `bg-zinc-100 text-zinc-600 border-zinc-300`
  - Rare: `bg-blue-50 text-blue-600 border-blue-300`
  - Epic: `bg-purple-50 text-purple-600 border-purple-300`
  - Legendary: `bg-amber-50 text-amber-600 border-amber-300` with subtle shimmer animation

- **Badge Shape**: Rounded square with icon centered, category indicator as small tag

- **Locked State**: Grayscale with 50% opacity, lock icon overlay

---

## 2. XP & Levels System

### Context
Add a progression system where users earn XP from check-ins and achievements, leveling up to unlock titles and perks. This creates long-term engagement beyond daily check-ins.

### Database Schema

```sql
-- Add to users table or create separate progression table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;

-- Level definitions
CREATE TABLE level_definitions (
  level INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  xp_required INTEGER NOT NULL, -- cumulative XP needed
  perks JSONB, -- e.g., {"streak_freezes": 1, "custom_avatar_border": true}
  color TEXT -- theme color for this level
);

-- XP transaction log (for history and debugging)
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'checkin', 'achievement', 'challenge', 'streak_bonus'
  source_id UUID, -- reference to check_in, achievement, etc.
  multiplier DECIMAL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed levels (exponential curve)
INSERT INTO level_definitions (level, title, xp_required, color) VALUES
(1, 'Newcomer', 0, '#6B7280'),
(2, 'Beginner', 100, '#6B7280'),
(3, 'Regular', 300, '#6B7280'),
(4, 'Committed', 600, '#3B82F6'),
(5, 'Dedicated', 1000, '#3B82F6'),
(6, 'Consistent', 1500, '#3B82F6'),
(7, 'Determined', 2200, '#8B5CF6'),
(8, 'Relentless', 3000, '#8B5CF6'),
(9, 'Unstoppable', 4000, '#8B5CF6'),
(10, 'Iron Will', 5500, '#F59E0B'),
(11, 'Titan', 7500, '#F59E0B'),
(12, 'Legend', 10000, '#F59E0B'),
(13, 'Mythic', 15000, '#EF4444'),
(14, 'Immortal', 25000, '#EF4444'),
(15, 'Gym God', 50000, '#EF4444');

-- RLS
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own XP" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);

-- Function to award XP and handle level ups
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL,
  p_multiplier DECIMAL DEFAULT 1.0
) RETURNS TABLE(new_total INTEGER, new_level INTEGER, leveled_up BOOLEAN, level_title TEXT) AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_total INTEGER;
  v_title TEXT;
BEGIN
  -- Get current level
  SELECT current_level INTO v_old_level FROM users WHERE id = p_user_id;

  -- Insert transaction
  INSERT INTO xp_transactions (user_id, amount, source, source_id, multiplier)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_multiplier);

  -- Update total XP
  UPDATE users
  SET total_xp = total_xp + FLOOR(p_amount * p_multiplier)
  WHERE id = p_user_id
  RETURNING total_xp INTO v_new_total;

  -- Calculate new level
  SELECT level, title INTO v_new_level, v_title
  FROM level_definitions
  WHERE xp_required <= v_new_total
  ORDER BY level DESC
  LIMIT 1;

  -- Update level if changed
  IF v_new_level > v_old_level THEN
    UPDATE users SET current_level = v_new_level WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_new_total, v_new_level, (v_new_level > v_old_level), v_title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### XP Rewards Configuration

```typescript
// lib/xp-config.ts
export const XP_REWARDS = {
  // Base rewards
  CHECKIN_BASE: 10,
  CHECKIN_GEO: 15, // bonus for GPS check-in

  // Streak multipliers (applied to check-in XP)
  STREAK_MULTIPLIERS: {
    7: 1.5,   // 7+ day streak = 1.5x
    14: 1.75, // 14+ day streak = 1.75x
    30: 2.0,  // 30+ day streak = 2x
    60: 2.5,  // 60+ day streak = 2.5x
    100: 3.0, // 100+ day streak = 3x
  },

  // Achievements award XP defined in achievement_definitions table

  // Challenges
  CHALLENGE_COMPLETION: 50,
  CHALLENGE_WIN: 100,

  // Social
  APPROVE_CHECKIN: 2, // small reward for helping others
  RECEIVE_HYPE: 1,
} as const

export function getStreakMultiplier(streakDays: number): number {
  const thresholds = Object.keys(XP_REWARDS.STREAK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a)

  for (const threshold of thresholds) {
    if (streakDays >= threshold) {
      return XP_REWARDS.STREAK_MULTIPLIERS[threshold as keyof typeof XP_REWARDS.STREAK_MULTIPLIERS]
    }
  }
  return 1.0
}
```

### UI Components

#### `components/xp/LevelBadge.tsx`
```typescript
// Compact level display with colored ring
// Props: level, size, showTitle
// Color based on level_definitions.color
// Animate on level up
```

#### `components/xp/XPProgressBar.tsx`
```typescript
// Shows current XP progress to next level
// Props: currentXP, currentLevel
// Fetch next level XP requirement
// Animated fill on XP gain
// Show "Level X: Title" above bar
// Show "X/Y XP to next level" below bar
```

#### `components/xp/LevelUpModal.tsx`
```typescript
// Celebratory modal on level up
// Show new level with animation
// Display new title
// List any perks unlocked
// Confetti animation
// Share button (optional)
```

#### `components/xp/XPGainToast.tsx`
```typescript
// Floating "+X XP" indicator
// Show multiplier if active (e.g., "+15 XP (2x streak!)")
// Animate upward and fade
```

### Integration Points

1. **Check-in success**: Award base XP with streak multiplier, show XPGainToast
2. **Achievement earned**: Award achievement XP, include in AchievementToast
3. **Profile page**: Show LevelBadge and XPProgressBar prominently
4. **Leaderboard**: Option to sort by level/XP instead of check-ins
5. **Group member list**: Show level badges next to names

---

## 3. Challenges & Competitions

### Context
Add time-limited challenges that give users specific goals beyond daily check-ins. Includes personal challenges, head-to-head duels, and group-wide competitions.

### Database Schema

```sql
-- Challenge templates (reusable challenge definitions)
CREATE TABLE challenge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'personal', 'duel', 'group'
  goal_type TEXT NOT NULL, -- 'checkin_count', 'streak', 'consistency'
  goal_value INTEGER NOT NULL, -- e.g., 5 check-ins
  duration_days INTEGER NOT NULL, -- e.g., 7 days
  xp_reward INTEGER NOT NULL,
  icon TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active challenge instances
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES challenge_templates(id),
  group_id UUID REFERENCES gym_groups(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  goal_value INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participants and progress
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  is_winner BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Duel invitations
CREATE TABLE duel_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours'
);

-- Seed weekly challenge templates
INSERT INTO challenge_templates (name, description, challenge_type, goal_type, goal_value, duration_days, xp_reward, icon) VALUES
('Weekly Warrior', 'Check in 5 times this week', 'personal', 'checkin_count', 5, 7, 75, 'calendar-check'),
('Perfect Week', 'Check in every day this week', 'personal', 'consistency', 7, 7, 150, 'star'),
('Weekend Push', 'Check in both Saturday and Sunday', 'personal', 'checkin_count', 2, 7, 50, 'battery-charging'),
('Streak Starter', 'Build a 5-day streak', 'personal', 'streak', 5, 14, 100, 'flame'),
('Head to Head', 'Get more check-ins than your opponent', 'duel', 'checkin_count', 0, 7, 100, 'swords'),
('Team Goal', 'Group reaches combined check-in goal', 'group', 'checkin_count', 50, 7, 200, 'users');

-- RLS Policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_invites ENABLE ROW LEVEL SECURITY;

-- Users can see challenges in their groups
CREATE POLICY "View group challenges" ON challenges FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

-- Participants can view their challenges
CREATE POLICY "View own participation" ON challenge_participants FOR SELECT
  USING (user_id = auth.uid());

-- Function to update challenge progress (call after each check-in)
CREATE OR REPLACE FUNCTION update_challenge_progress(p_user_id UUID, p_group_id UUID)
RETURNS void AS $$
DECLARE
  v_challenge RECORD;
  v_progress INTEGER;
BEGIN
  FOR v_challenge IN
    SELECT c.*, cp.id as participant_id
    FROM challenges c
    JOIN challenge_participants cp ON cp.challenge_id = c.id
    WHERE cp.user_id = p_user_id
    AND c.group_id = p_group_id
    AND c.status = 'active'
    AND c.ends_at > NOW()
  LOOP
    -- Calculate progress based on goal_type
    CASE v_challenge.goal_type
      WHEN 'checkin_count' THEN
        SELECT COUNT(*) INTO v_progress
        FROM check_ins
        WHERE user_id = p_user_id
        AND group_id = p_group_id
        AND status = 'APPROVED'
        AND created_at >= v_challenge.starts_at
        AND created_at <= v_challenge.ends_at;
      WHEN 'streak' THEN
        -- Use existing streak calculation
        SELECT streak INTO v_progress FROM get_user_streak(p_user_id, p_group_id);
      WHEN 'consistency' THEN
        SELECT COUNT(DISTINCT checkin_date) INTO v_progress
        FROM check_ins
        WHERE user_id = p_user_id
        AND group_id = p_group_id
        AND status = 'APPROVED'
        AND created_at >= v_challenge.starts_at;
    END CASE;

    -- Update progress
    UPDATE challenge_participants
    SET progress = v_progress,
        completed_at = CASE WHEN v_progress >= v_challenge.goal_value AND completed_at IS NULL THEN NOW() ELSE completed_at END
    WHERE id = v_challenge.participant_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### UI Components

#### `components/challenges/ChallengeCard.tsx`
```typescript
// Display a challenge with progress
// Props: challenge, userProgress, compact?
// Show: icon, name, description, progress bar, time remaining
// Different styling for personal/duel/group types
// "Join" button for joinable challenges
// "Completed" badge with XP earned
```

#### `components/challenges/ActiveChallenges.tsx`
```typescript
// List of user's active challenges
// Group by type (personal, duels, group)
// Show progress for each
// Link to challenge detail page
// Empty state: "No active challenges - Start one!"
```

#### `components/challenges/ChallengeCreator.tsx`
```typescript
// For trainers: Create group challenges
// Select from templates or custom
// Set start date, duration, goal
// Preview before creating
```

#### `components/challenges/DuelChallenge.tsx`
```typescript
// Head-to-head view
// Show both participants with avatars
// VS indicator in middle
// Progress bars for each
// Live countdown timer
// Winner crown animation when complete
```

#### `components/challenges/WeeklyChallenges.tsx`
```typescript
// Dashboard widget showing available weekly challenges
// Auto-generated each Monday
// "Accept Challenge" button
// Progress tracking inline
```

### Pages

#### `app/(app)/challenges/page.tsx`
```typescript
// Challenges hub
// Tabs: Active, Available, Completed, Duels
// Active: Current challenges with progress
// Available: Challenges user can join
// Completed: History with results
// Duels: Challenge a friend section
```

#### `app/(app)/challenges/[id]/page.tsx`
```typescript
// Challenge detail page
// Full description and rules
// Leaderboard (for group challenges)
// Progress visualization
// Time remaining with countdown
// Share/invite buttons for duels
```

### Integration Points

1. **After check-in**: Call `update_challenge_progress()`
2. **Dashboard**: Show "Active Challenges" widget (max 3)
3. **Group page**: Show active group challenges
4. **Notifications**: Alert when challenge starts/ends/completed
5. **Weekly cron**: Auto-create weekly challenges, finalize winners

---

## 4. Streak Freezes

### Context
Allow users to protect their streak by "freezing" it for a day. This reduces anxiety about losing progress and keeps users engaged even when they legitimately can't make it to the gym.

### Database Schema

```sql
-- Track streak freeze inventory and usage
CREATE TABLE streak_freezes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES gym_groups(id) ON DELETE CASCADE, -- NULL for global freezes
  freeze_type TEXT NOT NULL, -- 'earned', 'purchased', 'gifted', 'level_reward'
  used_on DATE, -- NULL if not yet used
  expires_at TIMESTAMPTZ, -- optional expiration
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add freeze allowance tracking to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_freezes_available INTEGER DEFAULT 1;

-- RLS
ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own freezes" ON streak_freezes
  FOR ALL USING (auth.uid() = user_id);

-- Function to use a streak freeze
CREATE OR REPLACE FUNCTION use_streak_freeze(p_user_id UUID, p_group_id UUID, p_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_freeze_id UUID;
BEGIN
  -- Find an available freeze (prefer non-expiring, then earliest expiring)
  SELECT id INTO v_freeze_id
  FROM streak_freezes
  WHERE user_id = p_user_id
  AND (group_id = p_group_id OR group_id IS NULL)
  AND used_on IS NULL
  AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY expires_at NULLS LAST, created_at
  LIMIT 1
  FOR UPDATE;

  IF v_freeze_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE streak_freezes
  SET used_on = p_date
  WHERE id = v_freeze_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if date is frozen (used in streak calculation)
CREATE OR REPLACE FUNCTION is_date_frozen(p_user_id UUID, p_group_id UUID, p_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM streak_freezes
    WHERE user_id = p_user_id
    AND (group_id = p_group_id OR group_id IS NULL)
    AND used_on = p_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant one freeze per month (run on 1st of each month)
CREATE OR REPLACE FUNCTION grant_monthly_freeze()
RETURNS void AS $$
BEGIN
  INSERT INTO streak_freezes (user_id, freeze_type, expires_at)
  SELECT id, 'earned', NOW() + INTERVAL '60 days'
  FROM users
  WHERE user_type = 'USER';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Updated Streak Calculation

Modify the existing streak calculation in `lib/streak.ts` to account for frozen days:

```typescript
export async function calculateStreak(
  supabase: SupabaseClient,
  userId: string,
  groupId?: string
): Promise<number> {
  // Fetch check-ins and freezes
  const [checkInsResult, freezesResult] = await Promise.all([
    supabase
      .from('check_ins')
      .select('checkin_date')
      .eq('user_id', userId)
      .eq('status', 'APPROVED')
      .order('checkin_date', { ascending: false })
      .limit(120),
    supabase
      .from('streak_freezes')
      .select('used_on')
      .eq('user_id', userId)
      .not('used_on', 'is', null)
  ])

  const checkInDates = new Set(checkInsResult.data?.map(c => c.checkin_date) ?? [])
  const frozenDates = new Set(freezesResult.data?.map(f => f.used_on) ?? [])

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  // Check if today counts (either checked in or still time to check in)
  const todayStr = formatDate(currentDate)
  const hasCheckedInToday = checkInDates.has(todayStr)

  if (!hasCheckedInToday) {
    // Start from yesterday if no check-in today
    currentDate.setDate(currentDate.getDate() - 1)
  }

  while (true) {
    const dateStr = formatDate(currentDate)
    const hasCheckIn = checkInDates.has(dateStr)
    const isFrozen = frozenDates.has(dateStr)

    if (hasCheckIn) {
      streak++
    } else if (isFrozen) {
      // Frozen day doesn't break streak but doesn't add to it
      // Continue checking previous days
    } else {
      // No check-in and not frozen = streak broken
      break
    }

    currentDate.setDate(currentDate.getDate() - 1)

    // Safety limit
    if (streak > 365) break
  }

  return streak
}
```

### UI Components

#### `components/streak/StreakFreezeCard.tsx`
```typescript
// Display available freezes with "Use Freeze" button
// Show count: "2 freezes available"
// Explain what freeze does
// Disable if no freezes available
// Show expiration if applicable
```

#### `components/streak/StreakFreezeHistory.tsx`
```typescript
// List of used and available freezes
// Show: date used, type (earned/purchased), status
// Calendar view option showing frozen days
```

#### `components/streak/UseStreakFreezeModal.tsx`
```typescript
// Confirmation modal for using a freeze
// "Use freeze for [date]?"
// Warning: "This cannot be undone"
// Show remaining freezes after use
```

### Integration Points

1. **Dashboard**: Show freeze count in streak card
2. **Streak broken notification**: Offer to retroactively use freeze
3. **Level up rewards**: Grant freeze at certain levels
4. **Profile settings**: View freeze inventory and history
5. **Monthly cron job**: Auto-grant monthly freeze

### Business Rules

- Users get 1 free freeze per month (expires in 60 days)
- Additional freezes earned at levels 5, 10, 15
- Freeze can be used retroactively within 24 hours of missed day
- Maximum 5 freezes stockpiled per user
- Trainers can gift freezes to group members

---

## 5. Social Recognition (Hype System)

### Context
Add lightweight social interactions that let group members encourage each other. A "hype" is a quick tap to celebrate someone's check-in, creating positive reinforcement and community feeling.

### Database Schema

```sql
CREATE TABLE hypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hype_type TEXT DEFAULT 'fire', -- 'fire', 'muscle', 'clap', 'star'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(check_in_id, from_user_id) -- one hype per check-in per user
);

-- Aggregate hype counts (materialized for performance)
CREATE TABLE user_hype_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_hypes_received INTEGER DEFAULT 0,
  total_hypes_given INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE hypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View hypes in your groups" ON hypes FOR SELECT
  USING (
    to_user_id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Create hypes for group members" ON hypes FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Function to send hype
CREATE OR REPLACE FUNCTION send_hype(p_check_in_id UUID, p_hype_type TEXT DEFAULT 'fire')
RETURNS BOOLEAN AS $$
DECLARE
  v_to_user_id UUID;
BEGIN
  -- Get check-in owner
  SELECT user_id INTO v_to_user_id FROM check_ins WHERE id = p_check_in_id;

  -- Can't hype yourself
  IF v_to_user_id = auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Insert hype (will fail on duplicate)
  INSERT INTO hypes (check_in_id, from_user_id, to_user_id, hype_type)
  VALUES (p_check_in_id, auth.uid(), v_to_user_id, p_hype_type)
  ON CONFLICT (check_in_id, from_user_id) DO NOTHING;

  -- Update stats
  INSERT INTO user_hype_stats (user_id, total_hypes_received)
  VALUES (v_to_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET total_hypes_received = user_hype_stats.total_hypes_received + 1,
      updated_at = NOW();

  INSERT INTO user_hype_stats (user_id, total_hypes_given)
  VALUES (auth.uid(), 1)
  ON CONFLICT (user_id) DO UPDATE
  SET total_hypes_given = user_hype_stats.total_hypes_given + 1,
      updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### UI Components

#### `components/social/HypeButton.tsx`
```typescript
// Animated button to send hype
// Props: checkInId, currentHypeCount, hasHyped
// States: default (can hype), hyped (already sent), animating
// Click triggers fire/confetti micro-animation
// Show count with icon (e.g., "🔥 12")
// Haptic feedback on mobile (navigator.vibrate)
```

#### `components/social/HypeReaction.tsx`
```typescript
// Display hype reactions on a check-in
// Show reaction icons with counts
// Expandable to show who hyped
// Animate new hypes in real-time (Supabase realtime)
```

#### `components/social/HypeNotification.tsx`
```typescript
// Toast when you receive hypes
// "Alex and 3 others hyped your check-in! 🔥"
// Batch multiple hypes into single notification
// Link to the check-in
```

#### `components/social/HypeLeaderboard.tsx`
```typescript
// "Most Supportive" leaderboard
// Rank by hypes given (encourages positivity)
// Show in group stats
// Monthly reset option
```

### Integration Points

1. **Activity feed** (new feature): Show recent check-ins with hype buttons
2. **Group dashboard**: Add activity feed section
3. **Leaderboard entries**: Show small hype count next to names
4. **Notifications**: Real-time hype notifications
5. **Profile**: "Hypes received" stat, "Most Supportive" badge

### Activity Feed Component

#### `components/social/ActivityFeed.tsx`
```typescript
// Real-time feed of group activity
// Items: check-ins, achievements, challenge completions
// Each check-in card has HypeButton
// Infinite scroll with pagination
// Supabase realtime subscription for new items
// Filter: "All", "Check-ins", "Achievements"
```

### Hype Types (Reactions)

```typescript
export const HYPE_TYPES = {
  fire: { emoji: '🔥', label: 'Fire', color: '#EF4444' },
  muscle: { emoji: '💪', label: 'Strong', color: '#3B82F6' },
  clap: { emoji: '👏', label: 'Props', color: '#10B981' },
  star: { emoji: '⭐', label: 'Star', color: '#F59E0B' },
} as const
```

---

## 6. Workout Logging System

### Context
Currently, the app only tracks attendance (check-ins). This feature adds the ability to log actual workout details including exercises, sets, reps, and weights. This is fundamental for personal records tracking.

### Database Schema

```sql
-- Exercise library
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'strength', 'cardio', 'flexibility', 'other'
  muscle_groups TEXT[], -- ['chest', 'triceps', 'shoulders']
  equipment TEXT, -- 'barbell', 'dumbbell', 'machine', 'bodyweight', 'cable'
  description TEXT,
  instructions TEXT[],
  is_system BOOLEAN DEFAULT false, -- true for pre-built exercises
  created_by UUID REFERENCES users(id), -- for custom exercises
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout sessions (linked to check-ins)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES gym_groups(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES check_ins(id) ON DELETE SET NULL,
  name TEXT, -- optional workout name
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual exercises in a workout
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  exercise_name TEXT NOT NULL, -- denormalized for quick reference
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sets within each exercise
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL, -- in user's preferred unit
  weight_unit TEXT DEFAULT 'kg', -- 'kg' or 'lb'
  duration_seconds INTEGER, -- for timed exercises
  distance_meters DECIMAL, -- for cardio
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10), -- Rate of Perceived Exertion
  is_warmup BOOLEAN DEFAULT false,
  is_dropset BOOLEAN DEFAULT false,
  is_failure BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout templates (saved routines)
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES gym_groups(id), -- NULL for personal templates
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL, -- [{exercise_id, sets: [{reps, weight}]}]
  is_public BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common exercises
INSERT INTO exercises (name, category, muscle_groups, equipment, is_system) VALUES
-- Chest
('Bench Press', 'strength', '{"chest", "triceps", "shoulders"}', 'barbell', true),
('Incline Bench Press', 'strength', '{"chest", "triceps", "shoulders"}', 'barbell', true),
('Dumbbell Fly', 'strength', '{"chest"}', 'dumbbell', true),
('Push Up', 'strength', '{"chest", "triceps", "shoulders"}', 'bodyweight', true),
('Cable Crossover', 'strength', '{"chest"}', 'cable', true),

-- Back
('Deadlift', 'strength', '{"back", "glutes", "hamstrings"}', 'barbell', true),
('Pull Up', 'strength', '{"back", "biceps"}', 'bodyweight', true),
('Barbell Row', 'strength', '{"back", "biceps"}', 'barbell', true),
('Lat Pulldown', 'strength', '{"back", "biceps"}', 'machine', true),
('Seated Row', 'strength', '{"back", "biceps"}', 'cable', true),

-- Legs
('Squat', 'strength', '{"quadriceps", "glutes", "hamstrings"}', 'barbell', true),
('Leg Press', 'strength', '{"quadriceps", "glutes"}', 'machine', true),
('Romanian Deadlift', 'strength', '{"hamstrings", "glutes", "back"}', 'barbell', true),
('Leg Extension', 'strength', '{"quadriceps"}', 'machine', true),
('Leg Curl', 'strength', '{"hamstrings"}', 'machine', true),
('Calf Raise', 'strength', '{"calves"}', 'machine', true),
('Lunge', 'strength', '{"quadriceps", "glutes"}', 'dumbbell', true),

-- Shoulders
('Overhead Press', 'strength', '{"shoulders", "triceps"}', 'barbell', true),
('Lateral Raise', 'strength', '{"shoulders"}', 'dumbbell', true),
('Face Pull', 'strength', '{"shoulders", "back"}', 'cable', true),

-- Arms
('Barbell Curl', 'strength', '{"biceps"}', 'barbell', true),
('Tricep Pushdown', 'strength', '{"triceps"}', 'cable', true),
('Hammer Curl', 'strength', '{"biceps", "forearms"}', 'dumbbell', true),
('Skull Crusher', 'strength', '{"triceps"}', 'barbell', true),

-- Core
('Plank', 'strength', '{"core"}', 'bodyweight', true),
('Hanging Leg Raise', 'strength', '{"core"}', 'bodyweight', true),
('Cable Crunch', 'strength', '{"core"}', 'cable', true),

-- Cardio
('Treadmill', 'cardio', '{"cardio"}', 'machine', true),
('Rowing Machine', 'cardio', '{"cardio", "back"}', 'machine', true),
('Cycling', 'cardio', '{"cardio", "quadriceps"}', 'machine', true);

-- RLS Policies
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view system exercises
CREATE POLICY "View exercises" ON exercises FOR SELECT
  USING (is_system = true OR created_by = auth.uid());

-- Users manage own workouts
CREATE POLICY "Manage own workouts" ON workouts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Manage own workout exercises" ON workout_exercises FOR ALL
  USING (workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()));

CREATE POLICY "Manage own sets" ON workout_sets FOR ALL
  USING (workout_exercise_id IN (
    SELECT we.id FROM workout_exercises we
    JOIN workouts w ON w.id = we.workout_id
    WHERE w.user_id = auth.uid()
  ));
```

### UI Components

#### `components/workout/WorkoutLogger.tsx`
```typescript
// Main workout logging interface
// Props: checkInId?, groupId
// Features:
// - Start/end workout timer
// - Add exercises from library (search/filter)
// - For each exercise: add sets with reps/weight/RPE
// - Quick-add from recent exercises
// - Save as template option
// - Notes field
```

#### `components/workout/ExercisePicker.tsx`
```typescript
// Modal to select exercise
// Search by name
// Filter by: category, muscle group, equipment
// Recent exercises section at top
// "Create Custom" option
// Show exercise details on long press
```

#### `components/workout/SetLogger.tsx`
```typescript
// Input row for a single set
// Fields: set #, reps (number input), weight (number input), RPE (optional slider)
// Checkboxes: warmup, dropset, to failure
// Swipe to delete
// Auto-fill from previous set
// "+2.5 kg" quick increment buttons
```

#### `components/workout/WorkoutSummary.tsx`
```typescript
// Post-workout summary
// Total volume (sets × reps × weight)
// Exercises completed
// Duration
// PRs hit (highlighted)
// Comparison to last similar workout
// Share option
```

#### `components/workout/ActiveWorkout.tsx`
```typescript
// Floating bottom bar during active workout
// Shows: timer, exercise count, "Finish" button
// Persists across navigation
// Can minimize/expand
// Warns before leaving page
```

### Pages

#### `app/(app)/workout/page.tsx`
```typescript
// Workout hub
// "Start Workout" primary button
// Recent workouts list
// Templates section
// Quick stats (this week's volume)
```

#### `app/(app)/workout/[id]/page.tsx`
```typescript
// View past workout details
// All exercises with sets
// Notes
// Edit option
// "Repeat Workout" button
```

#### `app/(app)/workout/active/page.tsx`
```typescript
// Active workout logging screen
// Full-screen workout logger
// Timer always visible
// Rest timer between sets
// Exercise list with sets
```

### Integration Points

1. **After check-in**: Prompt "Log your workout?"
2. **Dashboard**: Show "Last workout" card with summary
3. **Profile**: Workout stats (total workouts, avg duration)
4. **Group**: Optional workout feed showing members' sessions

---

## 7. Personal Records Dashboard

### Context
Track and celebrate personal bests across all exercises. This is a key motivator for gym-goers and provides tangible proof of progress.

### Database Schema

```sql
-- Personal records table (auto-calculated from workout_sets)
CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- '1rm', 'max_weight', 'max_reps', 'max_volume'
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL, -- 'kg', 'lb', 'reps'
  workout_set_id UUID REFERENCES workout_sets(id) ON DELETE SET NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  previous_record DECIMAL, -- for tracking improvement
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id, record_type)
);

-- PR history (keeps all PRs, not just current)
CREATE TABLE personal_record_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_record_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own PRs" ON personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "View own PR history" ON personal_record_history FOR SELECT
  USING (auth.uid() = user_id);

-- Function to check and update PRs after logging a set
CREATE OR REPLACE FUNCTION check_personal_record()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_exercise_id UUID;
  v_current_1rm DECIMAL;
  v_existing_pr DECIMAL;
  v_estimated_1rm DECIMAL;
BEGIN
  -- Get workout owner and exercise
  SELECT w.user_id, we.exercise_id
  INTO v_user_id, v_exercise_id
  FROM workout_sets ws
  JOIN workout_exercises we ON we.id = ws.workout_exercise_id
  JOIN workouts w ON w.id = we.workout_id
  WHERE ws.id = NEW.id;

  -- Skip warmup sets
  IF NEW.is_warmup THEN
    RETURN NEW;
  END IF;

  -- Calculate estimated 1RM using Brzycki formula
  -- 1RM = weight × (36 / (37 - reps))
  IF NEW.reps > 0 AND NEW.reps <= 12 AND NEW.weight > 0 THEN
    v_estimated_1rm := NEW.weight * (36.0 / (37.0 - NEW.reps));
  ELSE
    v_estimated_1rm := NEW.weight;
  END IF;

  -- Check against existing PR
  SELECT value INTO v_existing_pr
  FROM personal_records
  WHERE user_id = v_user_id
  AND exercise_id = v_exercise_id
  AND record_type = '1rm';

  -- Update if new PR
  IF v_existing_pr IS NULL OR v_estimated_1rm > v_existing_pr THEN
    INSERT INTO personal_records (user_id, exercise_id, record_type, value, unit, workout_set_id, previous_record)
    VALUES (v_user_id, v_exercise_id, '1rm', v_estimated_1rm, NEW.weight_unit, NEW.id, v_existing_pr)
    ON CONFLICT (user_id, exercise_id, record_type)
    DO UPDATE SET
      value = v_estimated_1rm,
      unit = NEW.weight_unit,
      workout_set_id = NEW.id,
      previous_record = personal_records.value,
      achieved_at = NOW();

    -- Add to history
    INSERT INTO personal_record_history (user_id, exercise_id, record_type, value, unit)
    VALUES (v_user_id, v_exercise_id, '1rm', v_estimated_1rm, NEW.weight_unit);
  END IF;

  -- Also check max weight (actual, not estimated)
  SELECT value INTO v_existing_pr
  FROM personal_records
  WHERE user_id = v_user_id
  AND exercise_id = v_exercise_id
  AND record_type = 'max_weight';

  IF v_existing_pr IS NULL OR NEW.weight > v_existing_pr THEN
    INSERT INTO personal_records (user_id, exercise_id, record_type, value, unit, workout_set_id, previous_record)
    VALUES (v_user_id, v_exercise_id, 'max_weight', NEW.weight, NEW.weight_unit, NEW.id, v_existing_pr)
    ON CONFLICT (user_id, exercise_id, record_type)
    DO UPDATE SET
      value = NEW.weight,
      unit = NEW.weight_unit,
      workout_set_id = NEW.id,
      previous_record = personal_records.value,
      achieved_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_pr_on_set_insert
  AFTER INSERT ON workout_sets
  FOR EACH ROW EXECUTE FUNCTION check_personal_record();
```

### UI Components

#### `components/pr/PRDashboard.tsx`
```typescript
// Main PR overview
// "Big 3" featured: Bench, Squat, Deadlift with large cards
// Recent PRs section
// All-time PR count
// Filter by muscle group/exercise
```

#### `components/pr/PRCard.tsx`
```typescript
// Display a single PR
// Props: exercise, value, unit, achievedAt, improvement
// Show: exercise name, PR value, date achieved
// Improvement badge: "+5 kg from previous"
// Trend indicator (up arrow)
// Click to see history
```

#### `components/pr/PRCelebration.tsx`
```typescript
// Full-screen celebration when PR is hit
// Confetti animation
// "NEW PERSONAL RECORD!" text
// Exercise name and new value
// Improvement from previous
// Share button
// XP earned indicator
```

#### `components/pr/PRHistory.tsx`
```typescript
// Timeline/chart of PR progression
// Props: exerciseId
// Line chart showing value over time
// Milestone markers
// Date range selector
```

#### `components/pr/PRComparison.tsx`
```typescript
// Compare current PRs to past periods
// "This month vs Last month"
// Show improvement percentage
// Highlight biggest gains
```

#### `components/pr/OneRMCalculator.tsx`
```typescript
// Calculator widget
// Input: weight lifted, reps completed
// Output: Estimated 1RM
// Formula selector: Brzycki, Epley, Lander
// "Test your max" workout suggestion
```

### Pages

#### `app/(app)/records/page.tsx`
```typescript
// Personal records hub
// Featured "Big 3" lifts
// All exercises with PRs (searchable)
// Recent PRs timeline
// Stats: total PRs, this month's PRs
// Sharing: "My Gym Stats" card generator
```

#### `app/(app)/records/[exerciseId]/page.tsx`
```typescript
// Single exercise PR detail
// Current PR prominently displayed
// Progress chart over time
// All-time history list
// Recent workouts with this exercise
// Tips to improve (optional)
```

### Integration Points

1. **Workout logging**: Real-time PR detection during workout
2. **Post-workout**: PRs highlighted in summary
3. **Dashboard widget**: "Recent PRs" section
4. **Profile**: PR showcase (pick 3 to feature)
5. **Social**: Share PR achievements
6. **Achievements**: PR-based badges

### PR Detection Logic

```typescript
// lib/pr-detection.ts
import { SupabaseClient } from '@supabase/supabase-js'

// Brzycki formula for 1RM estimation
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps > 12) return weight * 1.05 // rough estimate for high rep
  return weight * (36 / (37 - reps))
}

export async function checkForPR(
  supabase: SupabaseClient,
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number,
  unit: 'kg' | 'lb'
): Promise<{ isPR: boolean; type: string; improvement?: number } | null> {
  const estimated1RM = estimate1RM(weight, reps)

  const { data: currentPR } = await supabase
    .from('personal_records')
    .select('value')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .eq('record_type', '1rm')
    .single()

  if (!currentPR || estimated1RM > currentPR.value) {
    return {
      isPR: true,
      type: '1rm',
      improvement: currentPR ? estimated1RM - currentPR.value : undefined
    }
  }

  return null
}
```

---

## 8. Body Measurements Tracking

### Context
Allow users to track body measurements over time to visualize physical progress beyond just strength gains.

### Database Schema

```sql
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,

  -- Weight
  weight DECIMAL, -- in user's preferred unit
  weight_unit TEXT DEFAULT 'kg',

  -- Body fat (various methods)
  body_fat_percentage DECIMAL,
  body_fat_method TEXT, -- 'scale', 'calipers', 'dexa', 'visual'

  -- Circumference measurements (in cm or inches)
  measurement_unit TEXT DEFAULT 'cm',
  neck DECIMAL,
  shoulders DECIMAL,
  chest DECIMAL,
  left_arm DECIMAL,
  right_arm DECIMAL,
  left_forearm DECIMAL,
  right_forearm DECIMAL,
  waist DECIMAL,
  hips DECIMAL,
  left_thigh DECIMAL,
  right_thigh DECIMAL,
  left_calf DECIMAL,
  right_calf DECIMAL,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, measured_at)
);

-- Progress photos (stored in Supabase Storage)
CREATE TABLE progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES body_measurements(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL, -- 'front', 'side', 'back'
  taken_at DATE NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals for measurements
CREATE TABLE measurement_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  measurement_type TEXT NOT NULL, -- 'weight', 'body_fat_percentage', 'waist', etc.
  target_value DECIMAL NOT NULL,
  target_unit TEXT NOT NULL,
  target_date DATE,
  starting_value DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  achieved_at TIMESTAMPTZ,
  UNIQUE(user_id, measurement_type)
);

-- RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own measurements" ON body_measurements
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own photos" ON progress_photos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own goals" ON measurement_goals
  FOR ALL USING (auth.uid() = user_id);
```

### UI Components

#### `components/measurements/MeasurementForm.tsx`
```typescript
// Form to log new measurements
// Sections: Weight & Body Fat, Upper Body, Lower Body
// Each field optional (log what you have)
// Unit toggle (metric/imperial)
// "Copy from last" button
// Add photos option
// Date picker (default today)
```

#### `components/measurements/MeasurementCard.tsx`
```typescript
// Display single measurement entry
// Expandable: show all logged values
// Change indicators vs previous entry
// Attached photos thumbnail
// Edit/delete options
```

#### `components/measurements/ProgressChart.tsx`
```typescript
// Line chart for measurement over time
// Props: measurementType, dateRange
// Multiple metrics overlay option
// Goal line indicator
// Pinch to zoom on mobile
// Tap point for details
```

#### `components/measurements/BodyMap.tsx`
```typescript
// Visual body diagram
// Tap body part to see that measurement
// Color coded: green (improving), yellow (stable), red (regressing)
// Shows latest value on each point
```

#### `components/measurements/ProgressPhotos.tsx`
```typescript
// Photo comparison interface
// Side-by-side view of two dates
// Slider to reveal/compare
// Before/after label
// Date selection for each side
// Swipe between front/side/back
```

#### `components/measurements/GoalProgress.tsx`
```typescript
// Visual progress toward goal
// Props: goalType
// Progress bar with current vs target
// Projected completion date
// "On track" / "Behind" indicator
```

### Pages

#### `app/(app)/body/page.tsx`
```typescript
// Body tracking hub
// Current stats overview (weight, bf%)
// Recent entries list
// Progress charts
// "Log Measurements" FAB
// Goals section
// Photos (if any)
```

#### `app/(app)/body/log/page.tsx`
```typescript
// Full measurement logging page
// MeasurementForm component
// Progress photo upload
// Save and continue
```

#### `app/(app)/body/photos/page.tsx`
```typescript
// Progress photos gallery
// Timeline view
// Comparison tool
// Privacy settings
```

### Integration Points

1. **Dashboard**: Weight trend mini-chart
2. **Profile**: Current weight/body fat display
3. **Weekly reminder**: "Time to log measurements!"
4. **Achievements**: Body goal achievements
5. **Export**: Download measurement history as CSV

---

## 9. Smart Insights & Analytics

### Context
Provide AI-generated insights based on workout and check-in data. Help users understand patterns and improve their training.

### Database Schema

```sql
-- Store generated insights
CREATE TABLE user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'strength_progress', 'consistency', 'muscle_balance', 'recommendation'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB, -- supporting data
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important
  is_read BOOLEAN DEFAULT false,
  valid_until TIMESTAMPTZ, -- insight may expire
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics aggregates (pre-computed for performance)
CREATE TABLE user_analytics (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Check-in analytics
  total_checkins INTEGER DEFAULT 0,
  checkins_this_week INTEGER DEFAULT 0,
  checkins_this_month INTEGER DEFAULT 0,
  avg_checkins_per_week DECIMAL DEFAULT 0,
  most_active_day TEXT, -- 'Monday', 'Tuesday', etc.
  most_active_time TEXT, -- 'morning', 'afternoon', 'evening'

  -- Workout analytics
  total_workouts INTEGER DEFAULT 0,
  total_volume_kg DECIMAL DEFAULT 0,
  avg_workout_duration INTEGER DEFAULT 0, -- minutes
  favorite_exercises TEXT[], -- top 5 exercise IDs

  -- Streak analytics
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,

  -- PR analytics
  total_prs INTEGER DEFAULT 0,
  prs_this_month INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own insights" ON user_insights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own analytics" ON user_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Function to generate insights (called weekly or on-demand)
CREATE OR REPLACE FUNCTION generate_user_insights(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_analytics user_analytics%ROWTYPE;
  v_last_month_checkins INTEGER;
  v_this_month_checkins INTEGER;
BEGIN
  SELECT * INTO v_analytics FROM user_analytics WHERE user_id = p_user_id;

  -- Get month comparison
  SELECT COUNT(*) INTO v_this_month_checkins
  FROM check_ins
  WHERE user_id = p_user_id
  AND status = 'APPROVED'
  AND checkin_date >= date_trunc('month', CURRENT_DATE);

  SELECT COUNT(*) INTO v_last_month_checkins
  FROM check_ins
  WHERE user_id = p_user_id
  AND status = 'APPROVED'
  AND checkin_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
  AND checkin_date < date_trunc('month', CURRENT_DATE);

  -- Consistency insight
  IF v_this_month_checkins > v_last_month_checkins THEN
    INSERT INTO user_insights (user_id, insight_type, title, description, priority, data)
    VALUES (
      p_user_id,
      'consistency',
      'You''re Crushing It! 💪',
      format('You have %s check-ins this month, up from %s last month. Keep up the momentum!',
             v_this_month_checkins, v_last_month_checkins),
      8,
      jsonb_build_object('this_month', v_this_month_checkins, 'last_month', v_last_month_checkins)
    )
    ON CONFLICT DO NOTHING;
  ELSIF v_this_month_checkins < v_last_month_checkins * 0.7 THEN
    INSERT INTO user_insights (user_id, insight_type, title, description, priority, data)
    VALUES (
      p_user_id,
      'consistency',
      'Let''s Get Back on Track',
      format('Your check-ins are down this month. You had %s last month - let''s beat that!',
             v_last_month_checkins),
      7,
      jsonb_build_object('this_month', v_this_month_checkins, 'last_month', v_last_month_checkins)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add more insight generators: muscle balance, plateau detection, etc.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Insight Types

```typescript
// lib/insights.ts
export const INSIGHT_TYPES = {
  // Positive insights
  STREAK_MILESTONE: 'streak_milestone',
  CONSISTENCY_UP: 'consistency_up',
  NEW_PR_TREND: 'new_pr_trend',
  VOLUME_INCREASE: 'volume_increase',
  BEST_MONTH: 'best_month',

  // Actionable insights
  PLATEAU_DETECTED: 'plateau_detected',
  MUSCLE_IMBALANCE: 'muscle_imbalance',
  RECOVERY_NEEDED: 'recovery_needed',
  DELOAD_SUGGESTION: 'deload_suggestion',
  CONSISTENCY_DOWN: 'consistency_down',

  // Informational
  FAVORITE_DAY: 'favorite_day',
  STRONGEST_LIFT: 'strongest_lift',
  WORKOUT_PATTERN: 'workout_pattern',
} as const

export interface Insight {
  type: keyof typeof INSIGHT_TYPES
  title: string
  description: string
  icon: string
  color: 'green' | 'blue' | 'yellow' | 'red'
  action?: {
    label: string
    href: string
  }
}
```

### UI Components

#### `components/insights/InsightCard.tsx`
```typescript
// Display single insight
// Props: insight
// Icon based on type
// Color coding: positive (green), neutral (blue), action needed (yellow), warning (red)
// Expandable for more details
// Action button if applicable
// Dismiss/mark as read
```

#### `components/insights/InsightsFeed.tsx`
```typescript
// List of insights
// Sorted by priority and recency
// Unread indicator
// "Mark all read" option
// Empty state: "Keep training to unlock insights!"
```

#### `components/insights/StatsOverview.tsx`
```typescript
// Dashboard widget with key stats
// Animated counters
// Mini trend indicators
// Tap to expand each stat
```

#### `components/insights/TrendChart.tsx`
```typescript
// Generic trend visualization
// Props: data, type, period
// Responsive line/bar chart
// Comparison overlays (this period vs last)
// Goal line if set
```

#### `components/insights/WeeklyReport.tsx`
```typescript
// Weekly summary card
// Check-ins this week vs goal
// Workouts completed
// Top achievement
// "Share" card generator
```

### Pages

#### `app/(app)/insights/page.tsx`
```typescript
// Analytics dashboard
// Key metrics at top
// Insights feed
// Charts: consistency, volume, strength progress
// Date range selector
// Export data option
```

### Integration Points

1. **Dashboard**: "This Week" summary widget
2. **Weekly email/notification**: Insights digest
3. **Post-workout**: Relevant insights based on session
4. **Achievements**: Insight-triggered achievements

---

## 10. Push Notifications

### Context
Keep users engaged with timely, relevant push notifications. Requires PWA setup with service worker and notification permission.

### Implementation

#### Service Worker Enhancement

Update `public/sw.js`:

```javascript
// Handle push events
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type
    },
    actions: data.actions || [],
    tag: data.tag || 'default', // prevent duplicate notifications
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window or open new one
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
```

### Database Schema

```sql
-- Store push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- {p256dh, auth}
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, endpoint)
);

-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Notification types (all default true)
  checkin_reminders BOOLEAN DEFAULT true,
  streak_warnings BOOLEAN DEFAULT true,
  achievement_alerts BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  social_notifications BOOLEAN DEFAULT true, -- hypes, etc.
  group_announcements BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,

  -- Timing preferences
  reminder_time TIME DEFAULT '18:00', -- default 6 PM
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log (for analytics and debugging)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own notification log" ON notification_log
  FOR SELECT USING (auth.uid() = user_id);
```

### Notification Types

```typescript
// lib/notifications.ts
export const NOTIFICATION_TYPES = {
  // Engagement
  CHECKIN_REMINDER: {
    type: 'checkin_reminder',
    title: "Don't break your streak! 🔥",
    body: (streak: number) => `You're on a ${streak}-day streak. Check in today!`,
    url: '/dashboard'
  },

  STREAK_WARNING: {
    type: 'streak_warning',
    title: 'Streak in danger! ⚠️',
    body: (streak: number) => `Your ${streak}-day streak ends at midnight. Still time to check in!`,
    url: '/dashboard'
  },

  // Social
  HYPE_RECEIVED: {
    type: 'hype_received',
    title: 'You got hyped! 🔥',
    body: (from: string, count: number) =>
      count > 1 ? `${from} and ${count - 1} others hyped your check-in!` : `${from} hyped your check-in!`,
    url: '/dashboard'
  },

  MEMBER_CHECKIN: {
    type: 'member_checkin',
    title: 'Teammate at the gym! 💪',
    body: (name: string) => `${name} just checked in. Join them?`,
    url: '/dashboard'
  },

  // Achievements
  ACHIEVEMENT_EARNED: {
    type: 'achievement_earned',
    title: 'Achievement Unlocked! 🏆',
    body: (name: string) => `You earned "${name}"!`,
    url: '/achievements'
  },

  NEW_PR: {
    type: 'new_pr',
    title: 'New Personal Record! 🎉',
    body: (exercise: string, value: string) => `${exercise}: ${value}`,
    url: '/records'
  },

  // Challenges
  CHALLENGE_STARTING: {
    type: 'challenge_starting',
    title: 'Challenge starts now! 🚀',
    body: (name: string) => `"${name}" has begun. Good luck!`,
    url: '/challenges'
  },

  CHALLENGE_ENDING: {
    type: 'challenge_ending',
    title: 'Challenge ends soon! ⏰',
    body: (name: string, hours: number) => `"${name}" ends in ${hours} hours`,
    url: '/challenges'
  },

  DUEL_INVITE: {
    type: 'duel_invite',
    title: 'Challenge received! ⚔️',
    body: (from: string) => `${from} challenged you to a duel!`,
    url: '/challenges'
  },

  // Trainer
  APPROVAL_NEEDED: {
    type: 'approval_needed',
    title: 'Check-in needs approval',
    body: (name: string) => `${name} requested manual check-in approval`,
    url: '/trainer'
  },

  // Periodic
  WEEKLY_SUMMARY: {
    type: 'weekly_summary',
    title: 'Your week in review 📊',
    body: (checkins: number) => `${checkins} check-ins this week. Tap to see your stats!`,
    url: '/insights'
  }
} as const
```

### Push Service

```typescript
// lib/push-service.ts
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string
    body: string
    url?: string
    type: string
    tag?: string
    actions?: { action: string; title: string }[]
  }
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expired, remove from database
      return { success: false, expired: true }
    }
    return { success: false, error: error.message }
  }
}
```

### UI Components

#### `components/notifications/NotificationPrompt.tsx`
```typescript
// Permission request UI
// Explain benefits
// "Enable Notifications" button
// "Maybe Later" option
// Don't show again preference
```

#### `components/notifications/NotificationSettings.tsx`
```typescript
// Settings page section
// Toggle for each notification type
// Reminder time picker
// Quiet hours setting
// Test notification button
```

### Scheduled Jobs (Edge Functions or Cron)

```typescript
// supabase/functions/send-reminders/index.ts
// Run daily at multiple times to catch different reminder_time preferences

export async function sendDailyReminders() {
  const { data: users } = await supabase
    .from('users')
    .select(`
      id,
      name,
      notification_preferences!inner(checkin_reminders, reminder_time),
      push_subscriptions(endpoint, keys)
    `)
    .eq('notification_preferences.checkin_reminders', true)

  const now = new Date()

  for (const user of users ?? []) {
    // Check if it's their reminder time
    // Check if they haven't checked in today
    // Check quiet hours
    // Send notification if all conditions met
  }
}
```

### Integration Points

1. **After check-in**: Notify group members (opt-in)
2. **Evening (configurable)**: Streak reminder if not checked in
3. **Achievement earned**: Instant notification
4. **Challenge events**: Start, ending soon, complete
5. **Social**: Hype notifications (batched)
6. **Weekly**: Summary notification

---

## Implementation Order Recommendation

For maximum impact with reasonable effort:

1. **Achievement Badge System** - Foundational for engagement
2. **Workout Logging System** - Required for PR tracking
3. **Personal Records Dashboard** - High-value feature users love
4. **XP & Levels System** - Adds progression depth
5. **Social Recognition (Hype)** - Quick win for engagement
6. **Challenges & Competitions** - Drives retention
7. **Push Notifications** - Re-engagement tool
8. **Body Measurements** - Completes tracking suite
9. **Smart Insights** - Polish feature
10. **Streak Freezes** - Quality of life improvement

---

## Notes for Implementation

- All features should follow existing code patterns (Supabase client usage, component structure, Tailwind styling)
- Use existing UI components from `components/ui/` where possible
- Maintain mobile-first responsive design
- All database changes need corresponding RLS policies
- Test with existing user types (USER and TRAINER)
- Consider offline support for key features (PWA)
- Use Supabase Realtime for live updates where appropriate
