"use client";

import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { getLevelFromXP, getXPForNextLevel, formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const { profile, progress, achievements } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const solvedCount = Object.values(progress).filter(p => p.status === "solved").length;
  const level = getLevelFromXP(profile.xp);
  const xpIntoLevel = profile.xp % 100;
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
            <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
              <Icon name="User" size={28} className="text-foreground" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="relative bg-white rounded-3xl p-6 shadow-lg shadow-black/15 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-background rounded-full blur-3xl -z-0" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-black/20">
              <Icon name="User" size={26} className="text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-700">Profile</h1>
              <p className="text-sm text-slate-400">The student behind the code</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Identity Card */}
        <div className="animate-fade-in-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="relative bg-white rounded-3xl p-6 text-foreground shadow-xl shadow-black/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center shadow-lg overflow-hidden">
                  <img src="/codoralogo.png" alt="Codora" width={64} height={64} className="object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold">codora c++ Learner</h2>
                  <p className="text-foreground/70 text-sm">Member since {formatDate(profile.joinedAt)}</p>
                </div>
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <p className="text-[10px] text-foreground/70 uppercase tracking-wider">Level</p>
                    <p className="text-2xl font-bold">{level}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums">{profile.streak}</p>
                  <p className="text-[10px] text-foreground/70 uppercase tracking-wider font-semibold">Day Streak</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums">{profile.xp}</p>
                  <p className="text-[10px] text-foreground/70 uppercase tracking-wider font-semibold">Total XP</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums">{profile.totalSubmissions}</p>
                  <p className="text-[10px] text-foreground/70 uppercase tracking-wider font-semibold">Submissions</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-foreground/70">Level {level + 1} in {getXPForNextLevel(profile.xp)} XP</span>
                <span className="font-semibold tabular-nums">{xpIntoLevel} / 100 XP</span>
              </div>
              <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-secondary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${xpIntoLevel}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 w-8 bg-white/30 rounded-full blur-sm"
                  style={{ width: `${xpIntoLevel}%`, transition: "width 1s ease-out" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up opacity-0" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Icon name="Trophy" size={20} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{solvedCount}</p>
            <p className="text-xs text-slate-400 font-medium">Solved</p>
          </div>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up opacity-0" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
            <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Icon name="Award" size={20} className="text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{unlockedAchievements.length}</p>
            <p className="text-xs text-slate-400 font-medium">Badges</p>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/15 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Target" size={16} className="text-accent" />
                <h3 className="font-bold text-slate-700">Daily Goal</h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${profile.dailyGoalCompleted ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                {profile.dailyGoalCompleted ? "Completed" : `${solvedCount} / ${profile.dailyGoal} today`}
              </span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Icon name="Sparkles" size={16} className="text-accent" />
              Achievements
            </h3>
            <span className="text-xs text-slate-400 tabular-nums">
              {unlockedAchievements.length} / {achievements.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {unlockedAchievements.slice(0, 6).map((achievement, idx) => (
              <div
                key={achievement.id}
                className="group bg-background rounded-2xl p-3 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
              >
                <Icon name={achievement.icon} size={24} className="mx-auto mb-1 text-accent group-hover:scale-110 transition-transform duration-300" />
                <p className="text-[10px] font-bold text-foreground leading-tight">{achievement.title}</p>
              </div>
            ))}
            {unlockedAchievements.length === 0 && (
              <div className="col-span-3 bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-slate-400">No badges yet. Keep solving!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Link
              href="/home"
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-white shadow-lg shadow-black/15 text-sm font-semibold text-slate-600 hover:text-foreground hover:shadow-md transition-all duration-300"
            >
              <Icon name="Home" size={16} />
              Home
            </Link>
            <Link
              href="/community"
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-white shadow-lg shadow-black/15 text-sm font-semibold text-slate-600 hover:text-foreground hover:shadow-md transition-all duration-300"
            >
              <Icon name="MessagesSquare" size={16} />
              Community
            </Link>
            <Link
              href="/progress"
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-white shadow-lg shadow-black/15 text-sm font-semibold text-slate-600 hover:text-foreground hover:shadow-md transition-all duration-300"
            >
              <Icon name="TrendingUp" size={16} />
              Progress
            </Link>
          </div>
          <Link
            href="/settings"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-white shadow-lg shadow-black/15 text-sm font-semibold text-slate-600 hover:text-foreground hover:shadow-md transition-all duration-300"
          >
            <Icon name="Settings" size={16} />
            Manage Settings
          </Link>
        </div>
      </div>
    </div>
  );
}