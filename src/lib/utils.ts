import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function calculateStreak(lastActive: number): number {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  const lastActiveDay = Math.floor(lastActive / dayInMs);
  const nowDay = Math.floor(now / dayInMs);
  return Math.max(0, nowDay - lastActiveDay);
}

export function getXPForDifficulty(difficulty: string): number {
  const xpMap: Record<string, number> = {
    beginner: 10,
    easy: 20,
    medium: 40,
    hard: 75,
    challenge: 120,
  };
  return xpMap[difficulty] || 10;
}

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXPForNextLevel(xp: number): number {
  const currentLevel = getLevelFromXP(xp);
  return currentLevel * 100 - xp;
}