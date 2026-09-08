// Lightweight localStorage-based database for offline PWA
// Saves data in the browser (PWA) for persistence

export interface UserProfile {
  id?: string;
  xp: number;
  level: number;
  streak: number;
  lastActive: number;
  joinedAt: number;
  totalProblemsSolved: number;
  totalSubmissions: number;
  dailyGoal: number;
  dailyGoalCompleted: boolean;
}

export interface StudentProgress {
  problemId: string;
  status: "locked" | "available" | "in-progress" | "solved" | "failed";
  attempts: number;
  bestTime?: string;
  completedAt?: number;
  lastAttemptCode?: string;
}

const STORAGE_KEYS = {
  USER: 'codora_user_profile',
  PROGRESS: 'codora_progress',
  ACHIEVEMENTS: 'codora_achievements',
  SETTINGS: 'codora_settings',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to write to localStorage:', error);
  }
}

export async function getUserProfile(): Promise<UserProfile | undefined> {
  const profile = safeGet<UserProfile | null>(STORAGE_KEYS.USER, null);
  return profile || undefined;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  safeSet(STORAGE_KEYS.USER, profile);
}

export async function getProgress(problemId: string): Promise<StudentProgress | undefined> {
  const all = safeGet<Record<string, StudentProgress>>(STORAGE_KEYS.PROGRESS, {});
  return all[problemId];
}

export async function saveProgress(progress: StudentProgress): Promise<void> {
  const all = safeGet<Record<string, StudentProgress>>(STORAGE_KEYS.PROGRESS, {});
  all[progress.problemId] = progress;
  safeSet(STORAGE_KEYS.PROGRESS, all);
}

export async function getAllProgress(): Promise<StudentProgress[]> {
  const all = safeGet<Record<string, StudentProgress>>(STORAGE_KEYS.PROGRESS, {});
  return Object.values(all);
}

export async function saveAchievements(achievements: unknown[]): Promise<void> {
  safeSet(STORAGE_KEYS.ACHIEVEMENTS, achievements);
}

export async function getAchievements<T = unknown>(): Promise<T[]> {
  return safeGet<T[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
}

export async function getSettings<T = unknown>(): Promise<T | undefined> {
  return safeGet<T | null>(STORAGE_KEYS.SETTINGS, null) || undefined;
}

export async function saveSettings(settings: unknown): Promise<void> {
  safeSet(STORAGE_KEYS.SETTINGS, settings);
}

export async function saveSubmission(submission: unknown): Promise<void> {
  // No-op for now
}

export async function getAllSubmissions(): Promise<unknown[]> {
  return [];
}

export async function clearAllData(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}