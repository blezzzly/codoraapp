"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { SectionHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress";
import { InstallPrompt } from "@/components/InstallPrompt";
import { formatRelativeTime } from "@/lib/utils";

export default function HomePage() {
  const { profile, worlds, nextProblem, todaySolved, dailyGoalComplete, recentActivity } = useApp();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Greeting */}
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Hi, {profile.username || 'Learner'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {dailyGoalComplete
                ? "Daily goal reached — amazing focus! 🎉"
                : "Let's keep the momentum going"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="View profile"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-black/10"
            >
              <Icon name="User" size={22} className="text-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* Continue learning */}
      <div className="animate-fade-in-up stagger-1">
        <Link
          href={`/learn/${nextProblem.id}`}
          className="group relative block overflow-hidden rounded-3xl bg-white p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/50 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Continue learning
              </p>
              <h2 className="mt-1 truncate text-lg font-extrabold text-foreground">
                {nextProblem.title}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                World {nextProblem.worldOrder} · Lesson {nextProblem.lessonOrder}
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-md transition-transform group-hover:scale-110">
              <Icon name="ArrowRight" size={22} className="text-foreground" />
            </span>
          </div>
          <div className="relative mt-4">
            <ProgressBar value={overallMastery(worlds)} label="Course progress" />
          </div>
        </Link>
      </div>

      {/* Daily goal */}
      <div
        className={`animate-fade-in-up stagger-2 rounded-3xl p-5 shadow-lg ${
          dailyGoalComplete
            ? "bg-emerald-100 shadow-emerald-900/5"
            : "bg-white shadow-black/10"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                dailyGoalComplete ? "bg-emerald-500 text-white" : "bg-primary text-foreground"
              }`}
            >
              <Icon name={dailyGoalComplete ? "CheckCircle" : "Target"} size={22} />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">
                {dailyGoalComplete ? "Daily goal complete" : "Daily goal"}
              </p>
              <p className="text-xs text-muted-foreground">
                {todaySolved} of {profile.dailyGoal} problems today
              </p>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-foreground tabular-nums">
            {Math.min(100, Math.round((todaySolved / Math.max(profile.dailyGoal, 1)) * 100))}%
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar
            value={(todaySolved / Math.max(profile.dailyGoal, 1)) * 100}
            indicatorClassName={dailyGoalComplete ? "bg-emerald-500" : undefined}
          />
        </div>
        {dailyGoalComplete && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            Come back tomorrow to start a fresh 24-hour daily goal.
          </p>
        )}
      </div>

      {/* Worlds */}
      <section className="animate-fade-in-up stagger-3">
        <SectionHeader icon="Map" title="Learning path" action={
          <Link href="/learn" className="text-xs font-bold text-accent">
            View all
          </Link>
        } />
        <div className="space-y-3">
          {worlds.map((world) => (
            <Link
              key={world.id}
              href="/learn"
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md shadow-black/5 transition-all hover:shadow-lg active:scale-[0.99]"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: world.color }}
              >
                <Icon
                  name={world.icon}
                  size={24}
                  className={world.id === "world-3" ? "text-primary" : "text-foreground"}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-bold text-foreground">
                    {world.title}
                  </h3>
                  <span className="shrink-0 text-xs font-bold text-muted-foreground tabular-nums">
                    {world.mastery}%
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={world.mastery} />
                </div>
              </div>
              {world.unlocked ? (
                <Icon name="ChevronRight" size={18} className="shrink-0 text-muted-foreground/60" />
              ) : (
                <Icon name="Lock" size={18} className="shrink-0 text-muted-foreground/40" />
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="animate-fade-in-up stagger-4">
        <SectionHeader icon="Compass" title="Quick actions" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/ide", icon: "Terminal", label: "Open IDE", desc: "Free-form editor" },
            { href: "/library", icon: "Library", label: "Code Library", desc: "Copy & learn" },
            { href: "/practice", icon: "Target", label: "Practice", desc: "More problems" },
            { href: "/challenges", icon: "Trophy", label: "Challenges", desc: "Weekly tasks" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-md shadow-black/5 transition-all hover:shadow-lg active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent">
                <Icon name={item.icon} size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="animate-fade-in-up stagger-5">
        <SectionHeader icon="History" title="Recent activity" />
        {recentActivity.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/60 p-6 text-center">
            <p className="text-sm font-semibold text-muted-foreground">
              No activity yet. Solve your first problem and it will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-black/5"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    entry.type === "solved"
                      ? "bg-emerald-100 text-emerald-600"
                      : entry.type === "challenge"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-primary/60 text-foreground"
                  }`}
                >
                  <Icon
                    name={entry.type === "solved" ? "CheckCircle" : entry.type === "challenge" ? "Trophy" : "Zap"}
                    size={17}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{entry.label}</p>
                  {entry.detail && (
                    <p className="truncate text-xs text-muted-foreground">{entry.detail}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(entry.at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <InstallPrompt />
    </div>
  );
}

function overallMastery(worlds: { mastery?: number }[]): number {
  if (worlds.length === 0) return 0;
  return Math.round(
    worlds.reduce((acc, w) => acc + (w.mastery ?? 0), 0) / worlds.length
  );
}