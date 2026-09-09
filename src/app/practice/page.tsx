"use client";

import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { useState, useEffect } from "react";

function getDifficultyColor(difficulty: string): { bg: string; text: string; dot: string } {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    beginner: { bg: "bg-background", text: "text-foreground", dot: "bg-secondary" },
    easy: { bg: "bg-background", text: "text-foreground", dot: "bg-secondary" },
    medium: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
    hard: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
    challenge: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500" },
  };
  return colors[difficulty] || colors.beginner;
}

export default function PracticePage() {
  const { problems, progress, worlds } = useApp();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const solvedCount = Object.values(progress).filter(p => p.status === "solved").length;
  const totalXP = Object.values(progress)
    .filter(p => p.status === "solved")
    .reduce((sum, p) => {
      const problem = problems.find(pr => pr.id === p.problemId);
      return sum + (problem?.xpReward || 0);
    }, 0);

  const filteredProblems = filter === "all" 
    ? problems 
    : problems.filter(p => {
        if (filter === "unsolved") return progress[p.id]?.status !== "solved";
        if (filter === "solved") return progress[p.id]?.status === "solved";
        return true;
      });

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
            <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
              <Icon name="Code" size={28} className="text-foreground" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Loading problems...</p>
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
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-black/20">
                <Icon name="Code" size={26} className="text-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-700">Practice</h1>
                <p className="text-sm text-slate-400 tabular-nums truncate">
                  {solvedCount} of {problems.length} completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 shrink-0">
              <Icon name="Zap" size={16} className="text-accent" />
              <span className="text-sm font-bold text-amber-600 tabular-nums">{totalXP}</span>
              <span className="text-xs text-amber-500">XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all", label: "All", count: problems.length },
            { id: "unsolved", label: "To Do", count: problems.length - solvedCount },
            { id: "solved", label: "Completed", count: solvedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 btn-press flex items-center gap-1.5 ${
                filter === tab.id
                  ? "bg-secondary text-foreground shadow-md shadow-black/20"
                  : "bg-white text-slate-600 hover:text-foreground hover:shadow-sm"
              }`}
            >
              {tab.label}
              <span className={`text-xs tabular-nums ${filter === tab.id ? "text-foreground/70" : "text-slate-400"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Problem Cards */}
        <div className="space-y-3">
          {filteredProblems.map((problem, index) => {
            const problemProgress = progress[problem.id];
            const isSolved = problemProgress?.status === "solved";
            const isInProgress = problemProgress?.status === "in-progress";
            const difficultyStyle = getDifficultyColor(problem.difficulty);
            const world = worlds.find(w => w.id === problem.world);

            return (
              <Link
                key={problem.id}
                href={`/practice/${problem.id}`}
                className="block group animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 0.06}s`, animationFillMode: "forwards" }}
              >
                <div className={`relative bg-white rounded-2xl p-5 shadow-lg shadow-black/15 transition-all duration-300 overflow-hidden group-hover:shadow-lg group-hover:-translate-y-1`}>
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div className="relative">
                    <div className="flex items-start gap-4">
                      {/* Status */}
                      <div className="flex-shrink-0 pt-1">
{isSolved ? (
                           <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md shadow-black/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                             <Icon name="CheckCircle" size={20} className="text-foreground" />
                           </div>
                         ) : isInProgress ? (
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 animate-pulse-soft">
                            <Icon name="PlayCircle" size={16} className="text-amber-600" />
                          </div>
) : (
                           <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary">
                             <span className="text-sm font-bold text-foreground">#{problem.lessonOrder}</span>
                           </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${difficultyStyle.bg} ${difficultyStyle.text}`}>
                            {problem.difficulty}
                          </span>
                          {world && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Icon name={world.icon} size={12} />
                              {world.title}
                            </span>
                          )}
                        </div>
                        <h3 className={`font-bold text-lg mb-1 transition-colors duration-300 ${isSolved ? "text-foreground" : "text-slate-700 group-hover:text-foreground"}`}>
                          {problem.title}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {problem.description}
                        </p>
                      </div>

                      {/* XP & Arrow */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Icon name="Zap" size={14} />
                          <span className="text-sm tabular-nums">+{problem.xpReward}</span>
                        </div>
                        <Icon name="ChevronRight" size={20} className="text-slate-300 transition-all duration-300 group-hover:text-accent group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Example Preview */}
                    {problem.example.input && (
                      <div className="mt-4 pt-4 border-t border-primary">
                        <div className="bg-background rounded-xl p-3 font-mono text-xs">
                          <div className="flex items-start gap-3">
                            <span className="text-slate-400 min-w-[50px]">Input:</span>
                            <span className="text-slate-700">{problem.example.input}</span>
                          </div>
                          <div className="flex items-start gap-3 mt-1">
                            <span className="text-slate-400 min-w-[50px]">Output:</span>
                            <span className="text-foreground font-semibold">{problem.example.output}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

{filteredProblems.length === 0 && (
              <div className="text-center py-12 animate-fade-in-up">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
                  <Icon name="CheckCircle" size={32} className="text-accent" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">All done!</h3>
                <p className="text-sm text-slate-400">No problems match your filter</p>
              </div>
            )}
      </div>
    </div>
  );
}