export type AchievementCategory = 'STREAK' | 'MILESTONE' | 'TIME' | 'CONSISTENCY' | 'SPECIAL';
export type AchievementRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type AchievementDefinition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement_type: string;
  requirement_value: Record<string, unknown>;
  xp_reward: number;
  rarity: AchievementRarity;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  group_id: string | null;
  earned_at: string;
  metadata: Record<string, unknown>;
  achievement_definitions?: AchievementDefinition;
};

export type AwardedAchievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xp: number;
};

export type CheckInContext = {
  currentStreak: number;
  totalCheckIns: number;
  checkInTime: Date;
  isFirstCheckIn: boolean;
};
