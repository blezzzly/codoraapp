"use client";

import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { getLevelFromXP, getXPForNextLevel } from "@/lib/utils";
import { useEffect, useState } from "react";
import { currentChallenge, latestAnnouncements } from "@/content";

export default function HomePage() {
  const { profile, progress, worlds, problems, achievements } = useApp();
  const [mounted, setMounted] = useState(false);
  const [animatedXP, setAnimatedXP] = useState(0);
  const [animatedSolved, setAnimatedSolved] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const solvedCount = Object.values(progress).filter(p => p.status === "solved").length;
  const totalProblems = problems.length;
  const level = getLevelFromXP(profile.xp);
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  useEffect(() => {
    if (!mounted) return;
    const duration = 1200;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress_anim = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress_anim, 3);
      setAnimatedXP(Math.floor(profile.xp * easeOut));
      setAnimatedSolved(Math.floor(solvedCount * easeOut));
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedXP(profile.xp);
        setAnimatedSolved(solvedCount);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [mounted, profile.xp, solvedCount]);

  const getCurrentLesson = () => {
    for (const world of worlds) {
      const worldProblems = problems.filter(p => p.world === world.id);
      for (const problem of worldProblems) {
        if (progress[problem.id]?.status !== "solved") {
          return problem;
        }
      }
    }
    return problems[0];
  };

  const currentLesson = getCurrentLesson();

  const daySeed = Math.floor(Date.now() / 86400000);
  const todayPractice = problems[daySeed % problems.length];

  const recentCodes = Object.values(progress)
    .filter((p) => p.lastAttemptCode)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 3);

  const updates = latestAnnouncements(3);
  const challenge = currentChallenge();

  if (!mounted) {
    return null;
  }

return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Card */}
        <div className="animate-fade-in-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="relative bg-white rounded-3xl p-6 shadow-lg shadow-black/20 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-background rounded-full blur-3xl -z-0" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/30 blur-md animate-pulse-soft" />
                  <div className="relative w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <p className="text-[9px] text-foreground/70 uppercase tracking-wider font-bold leading-none">Lv</p>
                      <p className="text-xl font-bold text-foreground leading-none mt-0.5 tabular-nums">{level}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-700">Welcome back!</h2>
                  <p className="text-sm text-slate-400">Continue your C++ journey</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">{profile.xp % 100} / 100 XP</span>
                  <span className="text-foreground font-semibold">Level {level + 1} in {getXPForNextLevel(profile.xp)} XP</span>
                </div>
                <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-secondary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${profile.xp % 100}%` }}
                  />
                  <div 
                    className="absolute inset-y-0 left-0 w-8 bg-white/30 rounded-full blur-sm"
                    style={{ width: `${profile.xp % 100}%`, transition: "width 1s ease-out" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up stagger-1 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Icon name="Trophy" size={20} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{animatedSolved}</p>
            <p className="text-xs text-slate-400 font-medium">Solved</p>
          </div>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up stagger-2 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Icon name="Sparkles" size={20} className="text-accent" />
            </div>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{animatedXP}</p>
            <p className="text-xs text-slate-400 font-medium">Total XP</p>
          </div>
          <div className="group bg-white rounded-2xl p-4 shadow-lg shadow-black/15 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up stagger-3 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Icon name="Award" size={20} className="text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{unlockedAchievements}</p>
            <p className="text-xs text-slate-400 font-medium">Badges</p>
          </div>
        </div>

        {/* Continue Learning */}
        {currentLesson && (
          <div className="animate-fade-in-up stagger-4 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                <Icon name="Play" size={18} className="text-accent" />
                Continue Learning
              </h2>
            </div>
            <Link href={`/practice/${currentLesson.id}`} className="block group">
              <div className="relative bg-secondary rounded-3xl p-6 text-foreground shadow-xl shadow-black/20 overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:scale-[1.01] group-hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-all duration-700 group-hover:scale-150" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Continue</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/40 backdrop-blur-sm text-xs font-bold flex items-center gap-1">
                      <Icon name="Zap" size={12} />
                      +{currentLesson.xpReward} XP
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{currentLesson.title}</h3>
                  <p className="text-foreground/80 text-sm mb-4 line-clamp-2">{currentLesson.description}</p>
                  <div className="inline-flex items-center gap-2">
                    <div className="px-5 py-2 rounded-full bg-white text-foreground text-sm font-bold flex items-center gap-1 shadow-lg transition-all duration-300 group-hover:gap-2">
                      Start
                      <Icon name="ChevronRight" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Today's Practice */}
        {todayPractice && (
          <div className="animate-fade-in-up stagger-5 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                <Icon name="Target" size={18} className="text-accent" />
                Today's Practice
              </h2>
              <Link href="/practice" className="text-sm text-foreground font-semibold hover:text-foreground flex items-center gap-1 transition-all">
                All Problems
                <Icon name="ChevronRight" size={14} />
              </Link>
            </div>
            <Link href={`/practice/${todayPractice.id}`} className="block group">
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/15 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-background rounded-full blur-2xl -z-0" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-background text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {todayPractice.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                      <Icon name="Zap" size={10} />
                      +{todayPractice.xpReward} XP
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">{todayPractice.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-1 mt-0.5">{todayPractice.description}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary text-foreground text-xs font-bold shadow-lg transition-all duration-300 group-hover:gap-2.5">
                    Start Practice
                    <Icon name="ChevronRight" size={14} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Daily Challenge */}
        {challenge && (
          <div className="animate-fade-in-up stagger-6 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                <Icon name="Trophy" size={18} className="text-accent" />
                Daily Challenge
              </h2>
            </div>
            <Link href="/challenges" className="block group">
              <div className="relative bg-secondary rounded-3xl p-5 text-foreground shadow-xl shadow-black/20 overflow-hidden transition-all duration-500 group-hover:scale-[1.01] group-hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="Star" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">{challenge.label || "Weekly Challenge"}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-white/40 text-[10px] font-bold">{challenge.difficulty}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight">{challenge.title}</h3>
                    <p className="text-foreground/80 text-xs line-clamp-1 mt-0.5">{challenge.description}</p>
                  </div>
                  <Icon name="ChevronRight" size={20} className="shrink-0 text-foreground transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Learning Path */}
        <div className="animate-fade-in-up stagger-5 opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <Icon name="Brain" size={18} className="text-accent" />
              Learning Path
            </h2>
            <Link href="/learn" className="text-sm text-foreground font-semibold hover:text-foreground flex items-center gap-1 hover:gap-1.5 transition-all">
              View All
              <Icon name="ChevronRight" size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {worlds.slice(0, 2).map((world, worldIdx) => {
              const worldProblems = problems.filter(p => p.world === world.id);
              const solvedInWorld = worldProblems.filter(p => progress[p.id]?.status === "solved").length;
              const progressPercent = worldProblems.length > 0 ? Math.round((solvedInWorld / worldProblems.length) * 100) : 0;

              return (
                <div 
                  key={world.id} 
                  className="animate-fade-in-up opacity-0" 
                  style={{ animationDelay: `${0.5 + worldIdx * 0.1}s`, animationFillMode: "forwards" }}
                >
                  <Link href="/learn" className="block group">
                    <div className="relative bg-white rounded-2xl p-4 shadow-lg shadow-black/15 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5">
                      <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                            style={{ backgroundColor: `${world.color}20` }}
                          >
                            <Icon name={world.icon} size={22} className="text-foreground" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-700">{world.title}</h3>
                            <p className="text-xs text-slate-400">{world.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground tabular-nums">{progressPercent}%</div>
                            <p className="text-xs text-slate-400 tabular-nums">{solvedInWorld}/{worldProblems.length}</p>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Codes */}
        {recentCodes.length > 0 && (
          <div className="animate-fade-in-up stagger-7 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                <Icon name="Clock" size={18} className="text-accent" />
                Recent Codes
              </h2>
            </div>
            <div className="space-y-2">
              {recentCodes.map((item) => {
                const prob = problems.find((p) => p.id === item.problemId);
                return (
                  <Link key={item.problemId} href={`/practice/${item.problemId}`} className="block group">
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-lg shadow-black/15 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${item.status === "solved" ? "bg-secondary" : "bg-amber-50"}`}>
                        <Icon name={item.status === "solved" ? "CheckCheck" : "PlayCircle"} size={16} className={item.status === "solved" ? "text-foreground" : "text-amber-600"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-700 truncate">{prob?.title || item.problemId}</h3>
                        <p className="text-xs text-slate-400">
                          {item.status === "solved" ? "Submitted" : "In progress"} · {item.attempts} attempt{item.attempts === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Updates */}
        {updates.length > 0 && (
          <div className="animate-fade-in-up stagger-8 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                <Icon name="Sparkles" size={18} className="text-accent" />
                What's New
              </h2>
            </div>
            <div className="space-y-2">
              {updates.map((u) => {
                const typeIcon = u.type === "lesson" ? "BookOpen" : u.type === "challenge" ? "Trophy" : u.type === "update" ? "Zap" : u.type === "new" ? "Star" : "Info";
                const typeLabel = u.type === "lesson" ? "NEW LESSON" : u.type === "challenge" ? "CHALLENGE" : u.type === "update" ? "UPDATE" : u.type === "new" ? "NEW" : "INFO";
                return (
                  <div key={u.id} className="bg-white rounded-2xl px-4 py-3 shadow-lg shadow-black/15 flex items-start gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-background flex items-center justify-center">
                      <Icon name={typeIcon} size={16} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-foreground">{typeLabel}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">{u.title}</h3>
                      <p className="text-xs text-slate-400">{u.body}</p>
                      {u.link && (
                        <Link href={u.link.href} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:gap-1.5 transition-all">
                          {u.link.label}
                          <Icon name="ChevronRight" size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-6 opacity-0" style={{ animationFillMode: "forwards" }}>
          <Link href="/practice" className="group">
            <div className="relative bg-white rounded-2xl p-5 shadow-lg shadow-black/15 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
              <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Icon name="Code" size={22} className="text-accent" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">Practice</h3>
                <p className="text-xs text-slate-400">Solve problems</p>
              </div>
            </div>
          </Link>
          <Link href="/progress" className="group">
            <div className="relative bg-white rounded-2xl p-5 shadow-lg shadow-black/15 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
              <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Icon name="TrendingUp" size={22} className="text-accent" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">Progress</h3>
                <p className="text-xs text-slate-400">View stats</p>
              </div>
            </div>
          </Link>
          <Link href="/challenges" className="group">
            <div className="relative bg-white rounded-2xl p-5 shadow-lg shadow-black/15 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
              <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Icon name="Trophy" size={22} className="text-accent" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">Challenges</h3>
                <p className="text-xs text-slate-400">Weekly quests</p>
              </div>
            </div>
          </Link>
          <Link href="/library" className="group">
            <div className="relative bg-white rounded-2xl p-5 shadow-lg shadow-black/15 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
              <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Icon name="Layers" size={22} className="text-accent" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">Code Library</h3>
                <p className="text-xs text-slate-400">Study examples</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}