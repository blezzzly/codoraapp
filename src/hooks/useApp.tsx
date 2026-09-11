"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { worlds as baseWorlds, problems } from "@/data/problems";
import { achievementList, checkAchievements } from "@/data/achievements";
import type {
  UserProfile,
  StudentProgress,
  Achievement,
  ProblemStatus,
  World,
  Problem,
} from "@/types";
import * as db from "@/lib/database";
import { getLevelFromXP, getDayKey, isToday, XP_PER_LEVEL } from "@/lib/utils";
import { DEFAULT_LANGUAGE, isSupportedLanguage, LanguageId } from "@/lib/languages";
import type { ActivityEntry, ExportBundle } from "@/lib/database";

const defaultAchievements: Achievement[] = achievementList.map((a) => ({
  ...a,
  unlocked: false,
}));

interface AppContextType {
  profile: UserProfile;
  progress: Record<string, StudentProgress>;
  achievements: Achievement[];
  worlds: World[];
  problems: Problem[];
  language: LanguageId;
  solvedChallenges: string[];
  isLoaded: boolean;
  todaySolved: number;
  dailyGoalComplete: boolean;
  solvedCount: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  recentActivity: ActivityEntry[];
  setLanguage: (language: LanguageId) => void;
  setUsername: (username: string) => void;
  updateProgress: (
    problemId: string,
    status: ProblemStatus,
    code?: string,
    lang?: string
  ) => Promise<void>;
  updateDailyGoal: (goal: number) => void;
  markChallengeSolved: (challengeId: string) => void;
  refreshData: () => void;
  resetAllData: () => void;
  exportData: () => ExportBundle;
  importData: (input: unknown) => { ok: boolean; error?: string };
  isUnlocked: (problemId: string) => boolean;
  nextProblem: Problem;
}

const defaultProfile: Omit<UserProfile, "lastActiveDay" | "username"> & {
  username: string;
  lastActiveDay: string;
} = {
  username: "Learner",
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDay: "",
  joinedAt: 0,
  totalProblemsSolved: 0,
  totalSubmissions: 0,
  dailyGoal: 5,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const LANGUAGES_ORDER: LanguageId[] = ["cpp", "java", "python"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...defaultProfile,
    lastActiveDay: getDayKey(),
    joinedAt: Date.now(),
  }));
  const [progress, setProgress] = useState<Record<string, StudentProgress>>({});
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [language, setLanguageState] = useState<LanguageId>(DEFAULT_LANGUAGE);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(db.getUserProfile());
    setProgress(db.getProgress());
    setSolvedChallenges(db.getSolvedChallenges());
    setRecentActivity(db.getActivity());

    const storedLang = db.getSavedLanguage();
    if (storedLang && isSupportedLanguage(storedLang)) {
      setLanguageState(storedLang as LanguageId);
    }

    const loaded = db.getAchievements();
    setAchievements(loaded.length > 0 ? loaded : defaultAchievements);
    setIsLoaded(true);
  }, []);

  const orderedProblems = useMemo(
    () =>
      [...problems].sort(
        (a, b) => a.worldOrder - b.worldOrder || a.lessonOrder - b.lessonOrder
      ),
    []
  );

  const orderIndex = useMemo(() => {
    const map = new Map<string, number>();
    orderedProblems.forEach((p, i) => map.set(p.id, i));
    return map;
  }, [orderedProblems]);

  const isUnlocked = useCallback(
    (problemId: string): boolean => {
      const index = orderIndex.get(problemId);
      if (index === undefined) return false;
      if (index === 0) return true;
      const prev = orderedProblems[index - 1];
      return progress[prev.id]?.status === "solved";
    },
    [orderIndex, orderedProblems, progress]
  );

  const derivedWorlds: World[] = useMemo(() => {
    return baseWorlds.map((world) => {
      const worldProblems = problems.filter((p) => p.world === world.id);
      const solvedInWorld = worldProblems.filter(
        (p) => progress[p.id]?.status === "solved"
      ).length;
      const unlocked = worldProblems.some((p) => isUnlocked(p.id));
      return {
        ...world,
        lessons: worldProblems.map((p) => p.id),
        unlocked,
        mastery:
          worldProblems.length === 0
            ? 0
            : Math.round((solvedInWorld / worldProblems.length) * 100),
      };
    });
  }, [problems, progress, isUnlocked]);

  const solvedCount = useMemo(
    () =>
      Object.values(progress).filter((p) => p.status === "solved").length,
    [progress]
  );

  const todaySolved = useMemo(
    () =>
      Object.values(progress).filter(
        (p) => p.status === "solved" && p.completedAt && isToday(p.completedAt)
      ).length,
    [progress]
  );

  const dailyGoalComplete = profile.dailyGoal > 0 && todaySolved >= profile.dailyGoal;
  const level = getLevelFromXP(profile.xp);
  const xpIntoLevel = profile.xp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;

  const nextProblem = useMemo(() => {
    return (
      orderedProblems.find((p) => progress[p.id]?.status !== "solved") ??
      orderedProblems[orderedProblems.length - 1]
    );
  }, [orderedProblems, progress]);

  /** A single source of truth for streak updates. */
  const applyDayActivity = useCallback(
    (prev: UserProfile): UserProfile => {
      const today = getDayKey();
      if (prev.lastActiveDay === today) return prev;
      let nextStreak = prev.streak;
      // eslint-disable-next-line react-hooks/immutability
      if (isYesterdayForDay(prev.lastActiveDay)) {
        nextStreak = prev.streak + 1;
      } else {
        nextStreak = 1;
      }
      return { ...prev, streak: nextStreak, lastActiveDay: today };
    },
    []
  );

  function isYesterdayForDay(dayKey: string | undefined): boolean {
    if (!dayKey || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(yesterday);
      const year = parts.find((p) => p.type === "year")?.value ?? "";
      const month = parts.find((p) => p.type === "month")?.value ?? "";
      const day = parts.find((p) => p.type === "day")?.value ?? "";
      return dayKey === `${year}-${month}-${day}`;
    } catch {
      return false;
    }
  }

  const updateProgress = useCallback(
    async (problemId: string, status: ProblemStatus, code?: string, lang?: string) => {
      setProfile((prevProfile) => {
        const existing = progress[problemId];
        const wasSolved = existing?.status === "solved";

        const problem = problems.find((p) => p.id === problemId);
        const earned = status === "solved" && !wasSolved ? problem?.xpReward ?? 0 : 0;
        const withStreak = status === "solved" ? applyDayActivity(prevProfile) : prevProfile;
        const nextProfile: UserProfile = {
          ...withStreak,
          xp: withStreak.xp + earned,
          level: getLevelFromXP(withStreak.xp + earned),
          totalSubmissions: withStreak.totalSubmissions + 1,
          totalProblemsSolved: wasSolved
            ? withStreak.totalProblemsSolved
            : status === "solved"
              ? withStreak.totalProblemsSolved + 1
              : withStreak.totalProblemsSolved,
        };
        db.saveUserProfile(nextProfile);
        return nextProfile;
      });

      setProgress((prev) => {
        const existing = prev[problemId];
        const next: Record<string, StudentProgress> = {
          ...prev,
          [problemId]: {
            problemId,
            status,
            attempts: (existing?.attempts ?? 0) + 1,
            completedAt:
              status === "solved"
                ? existing?.completedAt ?? Date.now()
                : existing?.completedAt,
            lastAttemptCode: code ?? existing?.lastAttemptCode,
            language: lang ?? existing?.language,
          },
        };
        db.saveProgress(next);

        if (status === "solved") {
          db.addActivity({
            type: "solved",
            label: problems.find((p) => p.id === problemId)?.title ?? problemId,
            detail: `+${problems.find((p) => p.id === problemId)?.xpReward ?? 0} XP`,
          });
          setRecentActivity(db.getActivity());
        }
        return next;
      });
    },
    [progress, problems, applyDayActivity]
  );

  useEffect(() => {
    if (!isLoaded) return;
    const next = checkAchievements(
      achievements,
      profile,
      progress,
      derivedWorlds,
      solvedChallenges
    );
    if (JSON.stringify(next) !== JSON.stringify(achievements)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAchievements(next);
      db.saveAchievements(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, profile, progress, derivedWorlds, solvedChallenges]);

  const setLanguage = useCallback((lang: LanguageId) => {
    setLanguageState(lang);
    db.saveLanguage(lang);
  }, []);

  const setUsername = useCallback((username: string) => {
    setProfile((prev) => {
      const next = { ...prev, username: username.trim() || "Learner" };
      db.saveUserProfile(next);
      return next;
    });
  }, []);

  const updateDailyGoal = useCallback((goal: number) => {
    setProfile((prev) => {
      const next = { ...prev, dailyGoal: [3, 5, 10].includes(goal) ? goal : 5 };
      db.saveUserProfile(next);
      return next;
    });
  }, []);

  const markChallengeSolved = useCallback((challengeId: string) => {
    db.markChallengeSolved(challengeId);
    setSolvedChallenges(db.getSolvedChallenges());
    db.addActivity({
      type: "challenge",
      label: "Weekly challenge completed",
      detail: challengeId,
    });
    setRecentActivity(db.getActivity());
  }, []);

  const refreshData = useCallback(() => {
    setProfile(db.getUserProfile());
    setProgress(db.getProgress());
    setSolvedChallenges(db.getSolvedChallenges());
    setRecentActivity(db.getActivity());
    const savedLang = db.getSavedLanguage();
    if (savedLang && isSupportedLanguage(savedLang)) {
      setLanguageState(savedLang as LanguageId);
    }
    const loaded = db.getAchievements();
    setAchievements(loaded.length > 0 ? loaded : defaultAchievements);
  }, []);

  const resetAllData = useCallback(() => {
    db.clearAllData();
    setProfile({
      username: "Learner",
      xp: 0,
      level: 1,
      streak: 0,
      lastActiveDay: getDayKey(),
      joinedAt: Date.now(),
      totalProblemsSolved: 0,
      totalSubmissions: 0,
      dailyGoal: 5,
    });
    setProgress({});
    setAchievements(defaultAchievements);
    setSolvedChallenges([]);
    setRecentActivity([]);
    setLanguageState(DEFAULT_LANGUAGE);
  }, []);

  const exportData = useCallback((): ExportBundle => db.exportAllData(), []);
  const importData = useCallback(
    (input: unknown): { ok: boolean; error?: string } => {
      const result = db.importAllData(input);
      if (result.ok) refreshData();
      return result;
    },
    [refreshData]
  );

  const value: AppContextType = {
    profile,
    progress,
    achievements,
    worlds: derivedWorlds,
    problems: orderedProblems,
    language,
    solvedChallenges,
    isLoaded,
    todaySolved,
    dailyGoalComplete,
    solvedCount,
    level,
    xpIntoLevel,
    xpToNextLevel,
    recentActivity,
    setLanguage,
    setUsername,
    updateProgress,
    updateDailyGoal,
    markChallengeSolved,
    refreshData,
    resetAllData,
    exportData,
    importData,
    isUnlocked,
    nextProblem,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}

export { LANGUAGES_ORDER };