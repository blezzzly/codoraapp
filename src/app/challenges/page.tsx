"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/states";
import { challenges } from "@/content";
import { currentChallenge } from "@/content/challenges";
import { setDraft } from "@/lib/ideDraft";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Challenge } from "@/types";

function daysUntilNextWeek(): number {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const daysSinceMonday = (day + 6) % 7;
  const toNextMonday = 7 - daysSinceMonday;
  return toNextMonday;
}

export default function ChallengesPage() {
  const router = useRouter();
  const { language, solvedChallenges, markChallengeSolved, solvedCount, isLoaded } = useApp();
  const { show } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const active = currentChallenge();
  const upcoming = challenges.filter((c) => c.id !== active?.id);
  const isActiveSolved = active ? solvedChallenges.includes(active.id) : false;
  const needed = Math.max(1, (active?.difficulty === "hard" ? 20 : 15) - solvedCount);

  if (!isLoaded || !mounted) {
    return <LoadingState label="Loading challenges..." />;
  }

  const begin = (challenge: Challenge) => {
    setDraft(challenge.starterCode, language);
    markChallengeSolved(challenge.id);
    router.push("/ide");
    show({
      title: "Challenge started",
      description: `Good luck! Finish it in the IDE to claim +${challenge.xpReward} XP.`,
      variant: "success",
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PageHeader
        icon="Trophy"
        title="Weekly Challenges"
        subtitle="A fresh challenge every Monday"
      />

      {active ? (
        <div className="mt-6 animate-fade-in-up">
          <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-background to-transparent px-5 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{active.label}</Badge>
                <Badge variant="outline">{active.difficulty}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground tabular-nums">
                <Icon name="Clock" size={14} className="text-accent" />
                {daysUntilNextWeek()} days left
              </div>
            </div>

            <div className="p-5">
              <h2 className="text-2xl font-extrabold text-foreground">{active.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {active.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Example input
                  </p>
                  <pre className="mt-1 rounded-lg bg-background p-2 font-mono text-sm text-foreground">
                    {active.example.input || "(none)"}
                  </pre>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Expected output
                  </p>
                  <pre className="mt-1 rounded-lg bg-background p-2 font-mono text-sm text-foreground">
                    {active.example.output}
                  </pre>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                <p className="text-xs font-bold text-amber-700">Need a boost? Open hints in the IDE.</p>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {active.hints.slice(0, 2).map((h) => (
                    <li key={h.level}>Hint {h.level}: {h.title}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => begin(active)}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-foreground shadow-lg shadow-black/10 transition-all hover:brightness-[0.97]"
                >
                  <Icon name="Play" size={17} /> Start challenge
                </button>
                {isActiveSolved && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    <Icon name="CheckCircle" size={14} /> Completed this week
                  </span>
                )}
              </div>

              {!isActiveSolved && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-background p-3 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Icon name="Trophy" size={14} className="text-amber-500" />
                    +{active.xpReward} XP on completion
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="Zap" size={14} className="text-accent" />
                    Recommended: {needed}+ lessons solved
                  </span>
                </div>
              )}

              {isActiveSolved && (
                <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                  Come back next Monday for a new challenge. Until then, keep
                  practicing on the{" "}
                  <Link href="/practice" className="underline">
                    practice page
                  </Link>
                  .
                </div>
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div className="mt-6">
            <h3 className="mb-3 text-base font-bold text-foreground">Coming up</h3>
            <div className="space-y-3">
              {upcoming.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-white/60 p-4 opacity-70"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                    <Icon name="Lock" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-bold text-muted-foreground">
                        {c.title}
                      </h4>
                      <Badge variant="outline">{c.difficulty}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.id === active?.id ? "" : c.description}
                    </p>
                  </div>
                  <Badge variant="secondary">{c.label}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-md shadow-black/5">
          <p className="font-bold text-foreground">No challenge this week</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back on Monday for a fresh one.
          </p>
        </div>
      )}
    </div>
  );
}