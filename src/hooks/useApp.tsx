"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { worlds, problems } from "@/data/problems";
import { achievements as defaultAchievements, checkAchievements } from "@/data/achievements";
import type { UserProfile, StudentProgress, Achievement, ProblemStatus } from "@/types";
import * as db from "@/lib/database";
import { Icon } from "@/components/ui/icon";
import { DEFAULT_LANGUAGE, isSupportedLanguage, LANGUAGES, LanguageId } from "@/lib/languages";

interface AppContextType {
  profile: UserProfile;
  progress: Record<string, StudentProgress>;
  achievements: Achievement[];
  worlds: typeof worlds;
  problems: typeof problems;
  isLoaded: boolean;
  language: LanguageId;
  setLanguage: (language: LanguageId) => void;
  updateProgress: (problemId: string, status: ProblemStatus, code?: string) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  checkStreak: () => Promise<void>;
  updateDailyGoal: (goal: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActive: Date.now(),
  joinedAt: Date.now(),
  totalProblemsSolved: 0,
  totalSubmissions: 0,
  dailyGoal: 5,
  dailyGoalCompleted: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const LANGUAGE_KEY = "codora_selected_language";

function loadSavedLanguage(): LanguageId {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored && isSupportedLanguage(stored)) {
      return stored as LanguageId;
    }
  } catch {}
  return DEFAULT_LANGUAGE;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [progress, setProgress] = useState<Record<string, StudentProgress>>({});
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
  const [isLoaded, setIsLoaded] = useState(false);
  const [language, setLanguageState] = useState<LanguageId>(DEFAULT_LANGUAGE);

  const setLanguage = useCallback((next: LanguageId) => {
    setLanguageState(next);
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
    } catch {}
  }, []);

  useEffect(() => {
    setLanguageState(loadSavedLanguage());
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const savedProfile = await db.getUserProfile();
      if (savedProfile) {
        setProfile(savedProfile);
      } else {
        await db.saveUserProfile(defaultProfile);
        setProfile(defaultProfile);
      }

      const allProgress = await db.getAllProgress();
      const progressMap: Record<string, StudentProgress> = {};
      allProgress.forEach((p) => {
        progressMap[p.problemId] = p;
      });
      setProgress(progressMap);

      const savedAchievements = await db.getAchievements() as Achievement[];
      if (savedAchievements.length > 0) {
        setAchievements(savedAchievements);
      } else {
        await db.saveAchievements(defaultAchievements);
        setAchievements(defaultAchievements);
      }

      const activeProfile = savedProfile ?? defaultProfile;
      const synced = checkAchievements(defaultAchievements, activeProfile, progressMap);
      await db.saveAchievements(synced);
      setAchievements(synced);

      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load data:", error);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateProgress = useCallback(async (problemId: string, status: ProblemStatus, code?: string) => {
    const existingProgress = progress[problemId];
    const wasSolved = existingProgress?.status === "solved";
    const newProgress: StudentProgress = {
      problemId,
      status,
      attempts: (existingProgress?.attempts || 0) + 1,
      completedAt: status === "solved" ? Date.now() : existingProgress?.completedAt,
      lastAttemptCode: code,
    };

    try {
      await db.saveProgress(newProgress);
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
    const mergedProgress = {
      ...progress,
      [problemId]: newProgress,
    };
    setProgress(mergedProgress);

    let nextProfile: UserProfile = profile;

    if (status === "solved" && !wasSolved) {
      const problem = problems.find((p) => p.id === problemId);
      if (problem) {
        const newXP = nextProfile.xp + problem.xpReward;
        nextProfile = {
          ...nextProfile,
          xp: newXP,
          level: Math.floor(newXP / 100) + 1,
          totalProblemsSolved: nextProfile.totalProblemsSolved + 1,
          totalSubmissions: nextProfile.totalSubmissions + 1,
          lastActive: Date.now(),
        };
        setProfile(nextProfile);
        try {
          await db.saveUserProfile(nextProfile);
        } catch (error) {
          console.error("Failed to save profile:", error);
        }
      }
    } else if (status !== "solved") {
      nextProfile = {
        ...nextProfile,
        totalSubmissions: nextProfile.totalSubmissions + 1,
      };
      setProfile(nextProfile);
      try {
        await db.saveUserProfile(nextProfile);
      } catch (error) {
        console.error("Failed to save profile:", error);
      }
    }

    const synced = checkAchievements(defaultAchievements, nextProfile, mergedProgress);
    setAchievements(synced);
    try {
      await db.saveAchievements(synced);
    } catch (error) {
      console.error("Failed to sync achievements:", error);
    }
  }, [progress, profile, problems]);

  const addXP = useCallback(async (amount: number) => {
    setProfile((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      const updatedProfile = {
        ...prev,
        xp: newXP,
        level: newLevel,
        lastActive: Date.now(),
      };
      db.saveUserProfile(updatedProfile).catch(console.error);
      return updatedProfile;
    });
  }, []);

  const checkStreak = useCallback(async () => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    setProfile((prev) => {
      const lastActiveDay = Math.floor(prev.lastActive / dayInMs);
      const nowDay = Math.floor(now / dayInMs);
      let updatedProfile = prev;
      if (nowDay > lastActiveDay + 1) {
        updatedProfile = { ...prev, streak: 0, lastActive: now };
      } else if (nowDay > lastActiveDay) {
        updatedProfile = { ...prev, streak: prev.streak + 1, lastActive: now };
      }
      if (updatedProfile !== prev) {
        db.saveUserProfile(updatedProfile).catch(console.error);
      }
      return updatedProfile;
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      checkStreak();
    }
  }, [isLoaded, checkStreak]);

  const updateDailyGoal = useCallback(async (goal: number) => {
    setProfile((prev) => {
      const updatedProfile = { ...prev, dailyGoal: goal };
      db.saveUserProfile(updatedProfile).catch(console.error);
      return updatedProfile;
    });
  }, []);

  const contextValue: AppContextType = {
    profile,
    progress,
    achievements,
    worlds,
    problems,
    isLoaded,
    language,
    setLanguage,
    updateProgress,
    addXP,
    checkStreak,
    updateDailyGoal,
    refreshData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {!isLoaded ? (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
              <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/codoralogo.png" alt="Codora" width={64} height={64} className="object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-700">
              codora <span className="text-primary font-light">{LANGUAGES[language].label}</span>
            </h1>
            <p className="text-slate-400 mt-1 text-xs">Loading your journey...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}