"use client";

import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { useState, useEffect } from "react";

function getDifficultyColor(difficulty: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    beginner: { bg: "bg-background", text: "text-foreground" },
    easy: { bg: "bg-background", text: "text-foreground" },
    medium: { bg: "bg-amber-50", text: "text-amber-600" },
    hard: { bg: "bg-orange-50", text: "text-orange-600" },
    challenge: { bg: "bg-rose-50", text: "text-rose-600" },
  };
  return colors[difficulty] || colors.beginner;
}

export default function LearnPage() {
  const { worlds, problems, progress } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
            <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
              <Icon name="GraduationCap" size={28} className="text-foreground" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Loading path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white sticky top-0 md:top-16 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="GraduationCap" size={22} className="text-accent" />
            <h1 className="text-xl font-bold text-slate-700">Learning Path</h1>
          </div>
          <p className="text-sm text-slate-400">Your journey from zero to c++ hero</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10">
        {worlds.map((world, worldIdx) => {
          const worldProblems = problems.filter(p => p.world === world.id);
          const solvedInWorld = worldProblems.filter(p => progress[p.id]?.status === "solved").length;
          const totalInWorld = worldProblems.length;
          const progressPercent = totalInWorld > 0 ? Math.round((solvedInWorld / totalInWorld) * 100) : 0;
          const isUnlocked = world.unlocked;
          const worldTitleColor = worldIdx === 0 ? "text-foreground" : worldIdx === 1 ? "text-foreground" : "text-violet-600";

          return (
            <div key={world.id} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${worldIdx * 0.15}s`, animationFillMode: "forwards" }}>
              {/* World Header */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110 hover:rotate-3"
                    style={{ backgroundColor: `${world.color}20` }}
                  >
                    <Icon name={world.icon} size={24} className="text-foreground" />
                  </div>
                  <div className="text-left">
                    <h2 className={`text-2xl font-bold ${worldTitleColor}`}>
                      {world.title}
                    </h2>
                  </div>
                </div>
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-3">{world.description}</p>
                {totalInWorld > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative w-36 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-secondary rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                      <div 
                        className="absolute inset-y-0 left-0 w-4 bg-white/30 rounded-full blur-sm transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground tabular-nums">{progressPercent}%</span>
                  </div>
                )}
              </div>

              {/* Lesson Path - Connected Nodes */}
              <div className="relative pl-12">
                {worldProblems.map((problem, index) => {
                  const problemProgress = progress[problem.id];
                  const isSolved = problemProgress?.status === "solved";
                  const isInProgress = problemProgress?.status === "in-progress";
                  const isLocked = !isUnlocked && index > 0;
                  const isLast = index === worldProblems.length - 1;
                  const isCurrent = !isSolved && (index === solvedInWorld);
                  const difficultyStyle = getDifficultyColor(problem.difficulty);

                  return (
                    <div 
                      key={problem.id} 
                      className="relative pb-8 last:pb-0"
                      style={{ animationDelay: `${0.3 + index * 0.08}s` }}
                    >
                      {/* Connection Line */}
                      {!isLast && (
                        <div 
                          className={`absolute left-[22px] top-14 w-0.5 h-12 transition-all duration-500 ${
                            isSolved ? "bg-secondary" : "bg-primary"
                          }`} 
                        />
                      )}

                      {/* Lesson Card */}
                      <Link
                        href={isLocked ? "#" : `/practice/${problem.id}`}
                        className={`block ${isLocked ? "pointer-events-none" : ""}`}
                      >
                        <div 
                          className={`relative bg-white rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                            isCurrent
                              ? "shadow-lg shadow-primary/50 ring-2 ring-primary"
                              : isSolved
                              ? ""
                              : isLocked
                              ? "opacity-50"
                              : ""
                          } ${!isLocked ? "hover:shadow-md hover:-translate-y-0.5" : ""}`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Status Icon */}
                            <div className="absolute -left-12 top-1/2 -translate-y-1/2">
                              {isLocked ? (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-300">
                                  <Icon name="Lock" size={18} className="text-slate-400" />
                                </div>
                              ) : isSolved ? (
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary transition-all duration-300 hover:scale-110">
                                  <Icon name="CheckCircle" size={22} className="text-foreground" />
                                </div>
                              ) : isInProgress ? (
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center transition-transform duration-300 hover:scale-110 animate-pulse-soft">
                                  <Icon name="PlayCircle" size={18} className="text-amber-600" />
                                </div>
                              ) : isCurrent ? (
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-md shadow-primary transition-transform duration-300 hover:scale-110 animate-pulse-soft">
                                  <span className="text-base font-bold text-foreground">{problem.lessonOrder}</span>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center transition-transform duration-300 hover:scale-110">
                                  <span className="text-base font-bold text-foreground">{problem.lessonOrder}</span>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pl-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Lesson {String(problem.lessonOrder).padStart(2, "0")}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${difficultyStyle.bg} ${difficultyStyle.text}`}>
                                  {problem.difficulty}
                                </span>
                              </div>
                              <h3 className="font-bold text-slate-700 mb-0.5">{problem.title}</h3>
                              <p className="text-xs text-slate-400 line-clamp-1">
                                {problem.description.split(".")[0]}
                              </p>
                            </div>

                            {/* XP & Arrow */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                  <Icon name="Zap" size={10} />
                                  +{problem.xpReward}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold">XP</p>
                              </div>
                              {!isLocked && (
                                <Icon name="ChevronRight" size={18} className="text-slate-300 transition-transform duration-300 group-hover:translate-x-1" />
                              )}
                            </div>
                          </div>

                          {/* Current Lesson Glow */}
                          {isCurrent && (
                            <div className="absolute -inset-0.5 bg-secondary rounded-2xl opacity-20 blur-lg -z-10 animate-pulse-soft" />
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Locked Worlds Section */}
        {worlds.some(w => !w.unlocked) && (
          <div className="text-center py-8 animate-fade-in-up opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
              <Icon name="Lock" size={16} />
              <span>More worlds unlock as you progress</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}