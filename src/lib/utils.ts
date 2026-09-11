import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Intended default timezone for streak/daily-goal math. */
export const APP_TIMEZONE = "Asia/Manila";

/**
 * Returns a calendar-day key ("YYYY-MM-DD") for a timestamp in the app's
 * intended timezone. Free of the time / Date object weirdness around UTC days.
 */
export function getDayKey(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** Milliseconds since the epoch of the start of today (midnight) in APP_TIMEZONE. */
export function getStartOfTodayMs(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"));
  return asUTC;
}

/** True if `timestamp` falls on today (in APP_TIMEZONE). */
export function isToday(timestamp: number): boolean {
  return getDayKey(timestamp) === getDayKey();
}

/** True if `timestamp` falls on yesterday (in APP_TIMEZONE). */
export function isYesterday(timestamp: number): boolean {
  const today = new Date(getStartOfTodayMs());
  today.setUTCDate(today.getUTCDate() - 1);
  return getDayKey(timestamp) === getDayKey(today.getTime());
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return formatShortDate(timestamp);
}

export const XP_PER_LEVEL = 100;

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getXPForNextLevel(xp: number): number {
  const level = getLevelFromXP(xp);
  const intoLevel = xp - (level - 1) * XP_PER_LEVEL;
  return XP_PER_LEVEL - intoLevel;
}

export function getXPIntoLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

export function getXPForDifficulty(difficulty: string): number {
  const xpMap: Record<string, number> = {
    beginner: 10,
    easy: 20,
    medium: 40,
    hard: 75,
    challenge: 120,
  };
  return xpMap[difficulty] ?? 10;
}

/** Stable pseudo-random index from a seed string (no Math.random). */
export function seededIndex(seed: string, length: number): number {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}