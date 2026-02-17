// XP Rewards Configuration
// Defines XP values for various actions and streak multipliers

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
} as const;

export function getStreakMultiplier(streakDays: number): number {
  const thresholds = Object.keys(XP_REWARDS.STREAK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (streakDays >= threshold) {
      return XP_REWARDS.STREAK_MULTIPLIERS[threshold as keyof typeof XP_REWARDS.STREAK_MULTIPLIERS];
    }
  }
  return 1.0;
}

export function getXPForCheckIn(method: "GEO" | "MANUAL", streakDays: number): {
  baseXP: number;
  multiplier: number;
  totalXP: number;
} {
  const baseXP = method === "GEO" ? XP_REWARDS.CHECKIN_GEO : XP_REWARDS.CHECKIN_BASE;
  const multiplier = getStreakMultiplier(streakDays);
  const totalXP = Math.floor(baseXP * multiplier);

  return { baseXP, multiplier, totalXP };
}

// Level colors for UI
export const LEVEL_COLORS = {
  gray: "#6B7280",    // Levels 1-3
  blue: "#3B82F6",    // Levels 4-6
  purple: "#8B5CF6",  // Levels 7-9
  amber: "#F59E0B",   // Levels 10-12
  red: "#EF4444",     // Levels 13-15 (legendary)
} as const;

export function getLevelColorClass(color: string): string {
  switch (color) {
    case "#6B7280":
      return "text-gray-400";
    case "#3B82F6":
      return "text-blue-400";
    case "#8B5CF6":
      return "text-purple-400";
    case "#F59E0B":
      return "text-amber-400";
    case "#EF4444":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export function getLevelBgClass(color: string): string {
  switch (color) {
    case "#6B7280":
      return "bg-gray-500/10";
    case "#3B82F6":
      return "bg-blue-500/10";
    case "#8B5CF6":
      return "bg-purple-500/10";
    case "#F59E0B":
      return "bg-amber-500/10";
    case "#EF4444":
      return "bg-red-500/10";
    default:
      return "bg-gray-500/10";
  }
}

export function getLevelBorderClass(color: string): string {
  switch (color) {
    case "#6B7280":
      return "border-gray-500/30";
    case "#3B82F6":
      return "border-blue-500/30";
    case "#8B5CF6":
      return "border-purple-500/30";
    case "#F59E0B":
      return "border-amber-500/30";
    case "#EF4444":
      return "border-red-500/30";
    default:
      return "border-gray-500/30";
  }
}
