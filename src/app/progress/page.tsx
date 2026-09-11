"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress";
import { LoadingState } from "@/components/ui/states";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const LEVEL_TITLES = [
  "Rookie",
  "Learner",
  "Apprentice",
  "Competent",
  "Skilled",
  "Advanced",
  "Expert",
  "Master",
];

export default function ProgressPage() {
  const {
    profile,
    progress,
    achievements,
    worlds,
    problems,
    solvedCount,
    solvedChallenges,
    xpIntoLevel,
    xpToNextLevel,
    isLoaded,
  } = useApp();

  const stats = useMemo(() => {
    const attempts = Object.values(progress).reduce(
      (acc, p) => acc + (p.attempts ?? 0),
      0
    );
    const accuracy =
      attempts === 0 ? null : Math.round((solvedCount / Math.max(attempts, 1)) * 100);
    return { attempts, accuracy };
  }, [progress, solvedCount]);

  const week = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = Object.values(progress).filter(
        (p) =>
          p.status === "solved" && p.completedAt
            ? new Date(p.completedAt).toISOString().slice(0, 10) === key
            : false
      ).length;
      days.push({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
        count,
      });
    }
    return days;
  }, [progress]);

  const maxDay = Math.max(1, ...week.map((d) => d.count));
  const levelProgress = xpToNextLevel > 0
    ? Math.round((xpIntoLevel / xpToNextLevel) * 100)
    : 100;
  const levelTitle =
    LEVEL_TITLES[Math.min(profile.level - 1, LEVEL_TITLES.length - 1)] ?? "Learner";

  if (!isLoaded) return <LoadingState label="Loading your progress..." />;

  const solvedLessons = problems.filter((p) => progress[p.id]?.status === "solved");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <PageHeader icon="TrendingUp" title="Your progress" subtitle="Everything you've learned, in one place" />

      {/* Level + XP card */}
      <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/10 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-black/10">
            <Icon name="Zap" size={30} className="text-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-extrabold text-foreground tabular-nums">
              {profile.xp}
              <span className="text-sm font-bold text-muted-foreground"> XP</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Level {profile.level} · {levelTitle}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold text-muted-foreground">
              {xpToNextLevel > 0
                ? `Lv ${profile.level + 1} in ${xpToNextLevel - xpIntoLevel} XP`
                : "Max level"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={levelProgress} label={`Level ${profile.level} progress`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "CheckCircle", label: "Solved", value: String(solvedCount), bg: "bg-emerald-100", fg: "text-emerald-600" },
          { icon: "Flame", label: "Streak", value: String(profile.streak), bg: "bg-amber-100", fg: "text-amber-600" },
          { icon: "Trophy", label: "Challenges", value: String(solvedChallenges.length), bg: "bg-secondary", fg: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 text-center shadow-md shadow-black/5">
            <span className={cn("mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl", s.bg)}>
              <Icon name={s.icon} size={19} className={s.fg} />
            </span>
            <p className="text-2xl font-extrabold text-foreground tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly activity */}
      <section>
        <SectionHeader icon="CalendarDays" title="Solved over the last 7 days" />
        <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
          <div className="flex items-end justify-between gap-2">
            {week.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="flex h-24 w-full items-end justify-center overflow-hidden rounded-xl bg-background/60">
                  <div
                    className={cn(
                      "w-2/3 rounded-t-md",
                      d.count > 0 ? "bg-primary" : "bg-border"
                    )}
                    style={{
                      height: `${Math.max(d.count > 0 ? 14 : 4, (d.count / maxDay) * 88)}%`,
                    }}
                    title={`${d.count} solved on ${d.day}`}
                  />
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
          {stats.accuracy !== null && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Check accuracy:{" "}
              <span className="font-bold text-foreground">{stats.accuracy}%</span>{" "}
              ({solvedCount} solved across {stats.attempts} attempts)
            </p>
          )}
        </div>
      </section>

      {/* Worlds */}
      <section>
        <SectionHeader icon="Map" title="Course mastery" action={
          <Link href="/learn" className="text-xs font-bold text-accent">
            View path
          </Link>
        } />
        <div className="space-y-3">
          {worlds.map((world) => (
            <div key={world.id} className="rounded-2xl bg-white p-4 shadow-md shadow-black/5">
              <div className="mb-2 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: world.color }}
                >
                  <Icon
                    name={world.icon}
                    size={20}
                    className={world.id === "world-3" ? "text-primary" : "text-foreground"}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    World {world.order}: {world.title}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-foreground tabular-nums">
                  {world.mastery}%
                </span>
              </div>
              <ProgressBar value={world.mastery} />
            </div>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <SectionHeader icon="Award" title="Achievements" action={
          <span className="text-xs font-bold text-muted-foreground">
            {achievements.filter((a) => a.unlocked).length}/{achievements.length}
          </span>
        } />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl p-4 text-center transition-all",
                a.unlocked ? "bg-white shadow-md shadow-black/5" : "bg-white/50 opacity-60"
              )}
              title={a.description}
            >
              <span
                className={cn(
                  "mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl",
                  a.unlocked ? "bg-primary text-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                <Icon name={a.unlocked ? a.icon : "Lock"} size={22} />
              </span>
              <p className="text-xs font-bold text-foreground">{a.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {a.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Solved lessons */}
      <section>
        <SectionHeader icon="BookOpen" title="Completed lessons" />
        {solvedLessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/60 p-6 text-center">
            <p className="text-sm font-semibold text-muted-foreground">
              Solve a lesson to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {solvedLessons.map((p) => {
              const st = progress[p.id];
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-black/5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Icon name="Check" size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Lesson {p.lessonOrder}
                      {st?.completedAt ? ` · ${formatDate(st.completedAt)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-accent tabular-nums">
                    +{p.xpReward} XP
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}