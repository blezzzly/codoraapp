"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";

import { ProgressBar } from "@/components/ui/progress";
import { InstallPrompt } from "@/components/InstallPrompt";
import { formatRelativeTime } from "@/lib/utils";
import { LanguageCourseCard } from "@/components/LanguageCourseCard";
import { getLanguageCourses } from "@/data/languageCourses";

export default function HomePage() {
  const { profile, worlds, progress, todaySolved, dailyGoalComplete, recentActivity } = useApp();

  const languageCourses = getLanguageCourses(progress);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Greeting */}
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">
              Hi, {profile.username || 'Learner'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {dailyGoalComplete
                ? "Daily goal reached — amazing focus!"
                : "Let's keep the momentum going"}
            </p>
          </div>
          <Link
            href="/profile"
            aria-label="View profile"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <Icon name="User" size={20} />
          </Link>
        </div>
      </div>

      {/* Continue Learning - Language Course Cards */}
      <section className="animate-fade-in-up stagger-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Continue Learning</h2>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {languageCourses.map((course) => (
            <LanguageCourseCard
              key={course.language}
              language={course.language}
              title={course.title}
              description={course.description}
              currentLesson={course.currentLesson}
              progress={course.progress}
              completedLessons={course.completedLessons}
              totalLessons={course.totalLessons}
              href={course.href}
            />
          ))}
        </div>
      </section>

      {/* Daily goal */}
      <div
        className={`animate-fade-in-up stagger-2 rounded-2xl p-4 shadow-lg ${
          dailyGoalComplete
            ? "bg-emerald-50 shadow-emerald-900/5"
            : "bg-white shadow-black/5"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                dailyGoalComplete ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
              }`}
            >
              <Icon name={dailyGoalComplete ? "CheckCircle" : "Target"} size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {dailyGoalComplete ? "Daily goal complete" : "Daily goal"}
              </p>
              <p className="text-xs text-muted-foreground">
                {todaySolved} of {profile.dailyGoal} problems today
              </p>
            </div>
          </div>
          <span className="text-xl font-extrabold text-foreground tabular-nums">
            {Math.min(100, Math.round((todaySolved / Math.max(profile.dailyGoal, 1)) * 100))}%
          </span>
        </div>
        <div className="mt-2.5">
          <ProgressBar
            value={(todaySolved / Math.max(profile.dailyGoal, 1)) * 100}
            indicatorClassName={dailyGoalComplete ? "bg-emerald-500" : undefined}
            className="h-1.5"
          />
        </div>
        {dailyGoalComplete && (
          <p className="mt-1.5 text-xs font-medium text-emerald-700">
            Come back tomorrow for a fresh daily goal.
          </p>
        )}
      </div>

      {/* Learning Path */}
      <section className="animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="Map" size={16} className="text-accent" />
            <h2 className="text-base font-bold text-foreground">Learning Path</h2>
          </div>
          <Link href="/learn" className="text-xs font-bold text-accent">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {worlds.map((world) => (
            <Link
              key={world.id}
              href="/learn"
              className="group flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm shadow-black/5 transition-all hover:shadow-md active:scale-[0.99]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: world.color }}
              >
                <Icon
                  name={world.icon}
                  size={20}
                  className={world.id === "world-3" ? "text-primary" : "text-foreground"}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {world.title}
                  </h3>
                  <span className="shrink-0 text-xs font-bold text-muted-foreground tabular-nums">
                    {world.mastery}%
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={world.mastery} className="h-1.5" />
                </div>
              </div>
              {world.unlocked ? (
                <Icon name="ChevronRight" size={16} className="shrink-0 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
              ) : (
                <Icon name="Lock" size={16} className="shrink-0 text-muted-foreground/40" />
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="animate-fade-in-up stagger-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="Compass" size={16} className="text-accent" />
            <h2 className="text-base font-bold text-foreground">Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/ide", icon: "Terminal", label: "Open IDE", desc: "Free-form editor" },
            { href: "/library", icon: "Library", label: "Code Library", desc: "Copy & learn" },
            { href: "/practice", icon: "Target", label: "Practice", desc: "More problems" },
            { href: "/challenges", icon: "Trophy", label: "Challenges", desc: "Weekly tasks" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm shadow-black/5 transition-all hover:shadow-md active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent">
                <Icon name={item.icon} size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="animate-fade-in-up stagger-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="History" size={16} className="text-accent" />
            <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white/60 p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No activity yet. Solve your first problem to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentActivity.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm shadow-black/5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    entry.type === "solved"
                      ? "bg-emerald-100 text-emerald-600"
                      : entry.type === "challenge"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-primary/60 text-foreground"
                  }`}
                >
                  <Icon
                    name={entry.type === "solved" ? "CheckCircle" : entry.type === "challenge" ? "Trophy" : "Zap"}
                    size={15}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{entry.label}</p>
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