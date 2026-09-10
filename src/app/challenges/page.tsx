"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { challenges, currentChallenge } from "@/content";
import { setDraft } from "@/lib/ideDraft";
import type { Challenge } from "@/types";

function getDifficultyColor(difficulty: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    beginner: { bg: "bg-secondary", text: "text-foreground" },
    easy: { bg: "bg-secondary", text: "text-foreground" },
    medium: { bg: "bg-amber-100", text: "text-amber-700" },
    hard: { bg: "bg-orange-100", text: "text-orange-700" },
    challenge: { bg: "bg-rose-100", text: "text-rose-700" },
  };
  return colors[difficulty] || colors.beginner;
}

export default function ChallengesPage() {
  const { progress, language } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = currentChallenge();
  const solvedCount = Object.values(progress).filter((p) => p.status === "solved").length;

  const startChallenge = (challenge: Challenge) => {
    setDraft(challenge.starterCode, language);
    router.push("/ide");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
          <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <Icon name="Trophy" size={28} className="text-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2 mb-1">
            <Icon name="Trophy" size={24} className="text-accent" />
            Challenges
          </h1>
          <p className="text-sm text-slate-400">Push yourself with weekly quests</p>
        </div>

        {/* Active Challenge */}
        {active && (
          <div className="animate-fade-in-up stagger-1">
            <div className="relative bg-secondary rounded-3xl p-6 text-foreground shadow-xl shadow-black/20 overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/40 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
                    {active.label || "This Week"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/40 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
                    {active.difficulty}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{active.title}</h2>
                <p className="text-foreground/80 text-sm mb-4">{active.description}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold">
                    {active.example.input ? `Input: ${active.example.input}` : "No input"}
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold">
                    Output: {active.example.output}
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1">
                    <Icon name="Zap" size={12} />
                    +{active.xpReward} XP
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => startChallenge(active)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-foreground text-sm font-bold shadow-lg transition-all duration-300 hover:gap-3 btn-press"
                  >
                    <Icon name="Code" size={16} />
                    Solve in IDE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Challenge List */}
        <div className="animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <Icon name="Star" size={18} className="text-accent" />
              All Challenges
            </h2>
          </div>
          <div className="space-y-3">
            {challenges.map((challenge) => {
              const diffStyle = getDifficultyColor(challenge.difficulty);
              return (
                <div key={challenge.id} className="bg-white rounded-2xl p-5 shadow-lg shadow-black/15">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${diffStyle.bg} ${diffStyle.text}`}>
                      {challenge.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-background text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {challenge.topic}
                    </span>
                    {challenge.active && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-700">{challenge.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{challenge.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Icon name="Zap" size={12} />
                      +{challenge.xpReward} XP
                    </span>
                    {challenge.active ? (
                      <button
                        onClick={() => startChallenge(challenge)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all bg-secondary text-foreground hover:bg-primary shadow-lg btn-press"
                      >
                        Take Challenge
                        <Icon name="ChevronRight" size={14} />
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-slate-100 text-slate-400 cursor-default">
                        {challenge.label || "Coming Soon"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-2">
          {solvedCount} problem{solvedCount === 1 ? "" : "s"} solved · keep the streak going
        </div>
      </div>
    </div>
  );
}