"use client";

import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { getLevelFromXP, formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function ProgressPage() {
  const { profile, progress, achievements, worlds, problems } = useApp();
  const [mounted, setMounted] = useState(false);
  const [animatedXP, setAnimatedXP] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress_anim = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress_anim, 3);
      setAnimatedXP(Math.floor(profile.xp * easeOut));
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedXP(profile.xp);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [mounted, profile.xp]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
            <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
              <Icon name="TrendingUp" size={28} className="text-foreground" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Loading progress...</p>
        </div>
      </div>
    );
  }

  const solvedProblems = Object.values(progress).filter(p => p.status === "solved");
  const totalProblems = problems.length;
  const completionRate = totalProblems > 0 ? Math.round((solvedProblems.length / totalProblems) * 100) : 0;
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);
  const level = getLevelFromXP(profile.xp);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white sticky top-14 md:top-16 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2">
            <Icon name="TrendingUp" size={22} className="text-accent" />
            <h1 className="text-xl font-bold text-slate-700">Your Progress</h1>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">Watch yourself grow, day by day</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="animate-fade-in-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="bg-white rounded-3xl p-6 text-foreground shadow-xl shadow-black/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <p className="text-[10px] text-foreground/70 uppercase tracking-wider">Level</p>
                    <p className="text-2xl font-bold">{level}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">codora c++ Learner</h2>
                  <p className="text-foreground/70 text-sm">Member since {formatDate(profile.joinedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Icon name="Flame" size={16} className="text-orange-300" />
                  <span className="font-semibold">{profile.streak} day streak</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in-up opacity-0" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Icon name="Trophy" size={20} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{solvedProblems.length}</p>
            <p className="text-xs text-slate-400">Solved</p>
          </div>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Icon name="Zap" size={20} className="text-accent" />
            </div>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{animatedXP}</p>
            <p className="text-xs text-slate-400">Total XP</p>
          </div>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Icon name="Award" size={20} className="text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{unlockedAchievements.length}</p>
            <p className="text-xs text-slate-400">Badges</p>
          </div>
        </div>

        {/* Mastery */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/15 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-700">Overall Mastery</h3>
                <p className="text-xs text-slate-400">Your c++ knowledge level</p>
              </div>
              <div className="text-3xl font-bold text-accent tabular-nums">{completionRate}%</div>
            </div>
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-secondary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${completionRate}%` }}
              />
              <div 
                className="absolute inset-y-0 left-0 w-8 bg-white/30 rounded-full blur-sm"
                style={{ width: `${completionRate}%`, transition: "width 1s ease-out" }}
              />
            </div>
          </div>
        </div>

        {/* World Progress */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Icon name="Star" size={16} className="text-accent" />
            World Progress
          </h3>
          <div className="space-y-2">
            {worlds.map((world, idx) => {
              const worldProblems = problems.filter(p => p.world === world.id);
              const solvedInWorld = worldProblems.filter(p => progress[p.id]?.status === "solved").length;
              const progressPercent = worldProblems.length > 0 ? Math.round((solvedInWorld / worldProblems.length) * 100) : 0;

              return (
                <div 
                  key={world.id} 
                  className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                      style={{ backgroundColor: `${world.color}20` }}
                    >
                      <Icon name={world.icon} size={24} className="text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-700 text-sm">{world.title}</span>
                        <span className="text-xs text-foreground font-bold tabular-nums">{progressPercent}%</span>
                      </div>
                      <p className="text-xs text-slate-400 tabular-nums">{solvedInWorld} of {worldProblems.length} problems</p>
                    </div>
                  </div>
                  <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 h-full bg-secondary rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
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
                style={{ animationDelay: `${0.6 + idx * 0.05}s` }}
              >
                <Icon name={achievement.icon} size={24} className="mx-auto mb-1 text-accent group-hover:scale-110 transition-transform duration-300" />
                <p className="text-[10px] font-bold text-foreground leading-tight">{achievement.title}</p>
              </div>
            ))}
            {lockedAchievements.slice(0, 3).map((achievement, idx) => (
              <div
                key={achievement.id}
                className="bg-slate-50 rounded-2xl p-3 text-center animate-scale-in"
                style={{ animationDelay: `${0.6 + idx * 0.05}s` }}
              >
                <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-slate-200 flex items-center justify-center">
                  <Icon name="Lock" size={12} className="text-slate-400" />
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-tight">{achievement.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Journey Stats */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}>
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/15 hover:shadow-lg transition-shadow duration-300">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Icon name="Info" size={16} className="text-accent" />
              Journey Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-primary">
                <span className="text-sm text-slate-400">Member Since</span>
                <span className="font-semibold text-slate-700">{formatDate(profile.joinedAt)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary">
                <span className="text-sm text-slate-400">Current Level</span>
                <span className="font-semibold text-foreground">Level {level}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary">
                <span className="text-sm text-slate-400">Longest Streak</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Icon name="Flame" size={16} className="text-orange-500" />
                  {profile.streak} days
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-400">Total Submissions</span>
                <span className="font-semibold text-slate-700 tabular-nums">{profile.totalSubmissions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}