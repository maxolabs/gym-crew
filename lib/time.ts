import { formatInTimeZone } from "date-fns-tz";
import { addMonths, subDays } from "date-fns";

export function todayInTz(timezone: string, now = new Date()) {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}

export function monthRangeInTz(timezone: string, now = new Date()) {
  const ym = formatInTimeZone(now, timezone, "yyyy-MM");
  const start = `${ym}-01`;
  const startAsDate = new Date(`${start}T00:00:00Z`);
  const nextMonthStart = addMonths(startAsDate, 1);
  const end = formatInTimeZone(subDays(nextMonthStart, 1), timezone, "yyyy-MM-dd");
  return { start, end };
}

export function prevMonthStartInTz(timezone: string, now = new Date()) {
  const ym = formatInTimeZone(now, timezone, "yyyy-MM");
  const start = new Date(`${ym}-01T00:00:00Z`);
  const prev = addMonths(start, -1);
  return formatInTimeZone(prev, timezone, "yyyy-MM-01");
}

export function computeStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  if (!set.has(today)) return 0;
  let streak = 0;
  let cur = new Date(`${today}T00:00:00Z`);
  while (true) {
    const key = cur.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    cur = new Date(cur.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}







