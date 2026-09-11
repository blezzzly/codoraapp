"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "beginner", label: "Beginner" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
];

const DIFF_STYLE: Record<string, string> = {
  beginner: "bg-secondary text-foreground",
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

export default function PracticePage() {
  const { problems, progress, isUnlocked, solvedCount, isLoaded } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<string>(
    (searchParams.get("filter") as string) || "all"
  );
  const [lockedProblem, setLockedProblem] = useState<string | null>(null);

  useEffect(() => {
    const f = searchParams.get("filter") as string | null;
    if (f && FILTERS.some((x) => x.id === f)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilter(f);
    }
  }, [searchParams]);

  if (!isLoaded) return <LoadingState label="Loading practice problems..." />;

  const filtered = problems.filter(
    (p) => filter === "all" || p.difficulty === filter
  );
  const lockedTarget = problems.find((p) => p.id === lockedProblem);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PageHeader
        icon="Target"
        title="Practice"
        subtitle={`${solvedCount} of ${problems.length} problems solved`}
      />

      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
              filter === f.id
                ? "bg-primary text-foreground shadow-md shadow-black/10"
                : "bg-white text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((problem) => {
          const unlocked = isUnlocked(problem.id);
          const st = progress[problem.id];
          const solved = st?.status === "solved";
          const inProgress = !solved && (st?.attempts ?? 0) > 0;

          return (
            <button
              key={problem.id}
              onClick={() => {
                if (!unlocked) {
                  setLockedProblem(problem.id);
                  return;
                }
                router.push(`/practice/${problem.id}`);
              }}
              className={cn(
                "w-full rounded-2xl p-4 text-left transition-all",
                unlocked
                  ? "bg-white shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-white/50 opacity-70"
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    solved
                      ? "bg-emerald-100 text-emerald-600"
                      : inProgress
                        ? "bg-primary text-foreground"
                        : "bg-secondary text-foreground"
                  )}
                >
                  <Icon
                    name={solved ? "CheckCircle" : unlocked ? "Play" : "Lock"}
                    size={20}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-foreground">
                      {problem.title}
                    </h3>
                    <Badge variant="secondary" className={DIFF_STYLE[problem.difficulty]}>
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
                  <p className="text-[11px] text-muted-foreground">
                    Lesson {problem.lessonOrder}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Modal
        open={!!lockedProblem}
        onClose={() => setLockedProblem(null)}
        title="This problem is locked"
        description={
          lockedTarget
            ? `Complete the previous lesson first, then this one will unlock automatically.`
            : undefined
        }
      >
        <p className="text-sm text-muted-foreground">
          Codora opens problems one at a time so you build solid foundations
          before moving on.{" "}
          {lockedTarget &&
            `Ask on the Community page if you feel stuck — but you've got this.`}
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={() => setLockedProblem(null)}
            className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground"
          >
            Close
          </button>
          {lockedTarget && (
            <Link
              href={`/learn/${lockedTarget.id}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-foreground shadow-md"
            >
              <Icon name="BookOpen" size={16} /> Go to lesson
            </Link>
          )}
        </div>
      </Modal>
    </div>
  );
}