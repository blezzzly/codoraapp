"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { LoadingState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import type { Problem } from "@/types";

const DIFFICULTY_STYLE: Record<string, string> = {
  beginner: "bg-secondary text-foreground",
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

export default function LearnPage() {
  const { worlds, problems, progress, isUnlocked, solvedCount, isLoaded } = useApp();

  if (!isLoaded) return <LoadingState label="Loading your learning path..." />;

  const problemsByWorld = (worldId: string) =>
    problems.filter((p) => p.world === worldId);

  const totalSolved = solvedCount;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <PageHeader
        icon="GraduationCap"
        title="Learning Path"
        subtitle="C++ course — complete lessons in order to unlock the next"
      />

      <div className="rounded-2xl bg-white p-4 shadow-md shadow-black/5">
        <ProgressBar
          value={(totalSolved / Math.max(problems.length, 1)) * 100}
          label={
            totalSolved === 0
              ? "Your journey starts here"
              : `${totalSolved} of ${problems.length} lessons completed`
          }
        />
      </div>

      <div className="space-y-8">
        {worlds.map((world) => {
          const worldProblems = problemsByWorld(world.id);
          const solvedInWorld = worldProblems.filter(
            (p) => progress[p.id]?.status === "solved"
          ).length;
          const worldUnlocked = worldProblems.some((p) => isUnlocked(p.id));

          return (
            <section key={world.id} className="animate-fade-in-up">
              <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-md shadow-black/5">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70 blur-2xl"
                  style={{ backgroundColor: world.color }}
                />
                <div className="relative flex items-center gap-4">
                  <span
                    className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl shadow-md"
                    style={{ backgroundColor: world.color }}
                  >
                    <Icon
                      name={world.icon}
                      size={26}
                      className={world.id === "world-3" ? "text-primary" : "text-foreground"}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-foreground">
                        World {world.order}: {world.title}
                      </h2>
                      {!worldUnlocked && (
                        <Icon name="Lock" size={15} className="text-muted-foreground/50" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{world.description}</p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-foreground tabular-nums">
                    {solvedInWorld}/{worldProblems.length}
                  </span>
                </div>
                <div className="relative mt-4">
                  <ProgressBar value={world.mastery} />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {worldProblems.map((problem, index) => {
                  const unlocked = isUnlocked(problem.id);
                  const st = progress[problem.id];
                  const solved = st?.status === "solved";
                  const inProgress =
                    st && st.status !== "solved" && (st.attempts ?? 0) > 0;
                  const locked = !unlocked;

                  return (
                    <div key={problem.id}>
                      {locked && worldUnlocked && index === firstLockedIndex(worldProblems, progress, isUnlocked) && (
                        <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground">
                          <Icon name="Lock" size={13} />
                          Complete{" "}
                          <span className="text-accent">
                            {prevProblemLabel(problem, worldProblems)}
                          </span>{" "}
                          to unlock this lesson
                        </div>
                      )}

                      <Link
                        href={locked ? "/learn" : `/learn/${problem.id}`}
                        onClick={(e) => {
                          if (locked) e.preventDefault();
                        }}
                        aria-disabled={locked}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl p-4 transition-all",
                          locked
                            ? "bg-white/50 opacity-60"
                            : "bg-white shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-0.5"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold",
                            solved
                              ? "bg-emerald-100 text-emerald-600"
                              : inProgress
                                ? "bg-primary text-foreground"
                                : "bg-secondary text-foreground"
                          )}
                        >
                          {solved ? (
                            <Icon name="Check" size={20} />
                          ) : locked ? (
                            <Icon name="Lock" size={18} className="text-muted-foreground/50" />
                          ) : (
                            String(index + 1).padStart(2, "0")
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={cn(
                                "truncate text-sm font-bold",
                                locked ? "text-muted-foreground" : "text-foreground"
                              )}
                            >
                              Lesson {problem.lessonOrder} · {problem.title}
                            </h3>
                            <Badge variant="secondary" className={DIFFICULTY_STYLE[problem.difficulty]}>
                              {problem.difficulty}
                            </Badge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {problem.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-accent tabular-nums">
                            +{problem.xpReward} XP
                          </p>
                          {solved && (
                            <p className="text-[11px] font-semibold text-emerald-600">
                              Completed
                            </p>
                          )}
                          {inProgress && !solved && (
                            <p className="text-[11px] font-semibold text-accent">
                              In progress
                            </p>
                          )}
                        </div>
                        {!locked && !solved && (
                          <Icon name="ChevronRight" size={18} className="shrink-0 text-muted-foreground/50" />
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-white/60 p-4 text-center text-xs text-muted-foreground">
        Lessons are written for <span className="font-bold text-foreground">C++</span>.
        Java and Python are available in the{" "}
        <Link href="/ide" className="font-bold text-accent underline">
          IDE
        </Link>
        .
      </div>
    </div>
  );
}

function firstLockedIndex(
  worldProblems: Problem[],
  progress: Record<string, { status?: string }>,
  isUnlocked: (id: string) => boolean
): number {
  return worldProblems.findIndex((p) => !isUnlocked(p.id));
}

function prevProblemLabel(current: Problem, worldProblems: Problem[]): string {
  const idx = worldProblems.findIndex((p) => p.id === current.id);
  const prev = idx > 0 ? worldProblems[idx - 1] : worldProblems[0];
  return prev?.title ?? "the previous lesson";
}