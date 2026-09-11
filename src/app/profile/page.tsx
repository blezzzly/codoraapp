"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/states";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

const AVATAR_COLORS = [
  "bg-primary text-foreground",
  "bg-background text-accent",
  "bg-secondary text-foreground",
];

export default function ProfilePage() {
  const {
    profile,
    progress,
    achievements,
    solvedCount,
    xpIntoLevel,
    xpToNextLevel,
    setUsername,
    updateDailyGoal,
    isLoaded,
  } = useApp();
  const { show } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.username);
  const [goalMenu, setGoalMenu] = useState(false);

  const saveName = () => {
    const trimmed = nameDraft.trim().slice(0, 20);
    if (trimmed) {
      setUsername(trimmed);
      show({ title: "Username updated", variant: "success" });
    } else {
      setNameDraft(profile.username);
    }
    setEditingName(false);
  };

  if (!isLoaded) return <LoadingState label="Loading profile..." />;

  const level = profile.level;
  const levelTitle =
    LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Learner";
  const levelProgress =
    xpToNextLevel > 0 ? Math.round((xpIntoLevel / xpToNextLevel) * 100) : 100;
  const unlocked = achievements.filter((a) => a.unlocked);
  const initial = (profile.username.trim()[0] || "C").toUpperCase();
  const avatarColor = AVATAR_COLORS[(profile.username.length + level) % AVATAR_COLORS.length];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <PageHeader icon="User" title="Profile" subtitle="Your learner identity" />

      {/* Identity card */}
      <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/10 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-2xl font-extrabold", avatarColor)}>
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                  }}
                  autoFocus
                  maxLength={20}
                  className="h-10 flex-1 rounded-xl border border-primary bg-background px-3 text-base font-extrabold text-foreground outline-none"
                  aria-label="Edit username"
                />
                <button
                  onClick={saveName}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-foreground"
                >
                  <Icon name="Check" size={15} /> Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-extrabold text-foreground">
                  {profile.username}
                </h1>
                <button
                  onClick={() => {
                    setEditingName(true);
                    setNameDraft(profile.username);
                  }}
                  aria-label="Edit username"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <Icon name="Pencil" size={15} />
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Level {level} · {levelTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              Joined {formatDate(profile.joinedAt)}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <Icon name="Flame" size={13} className="mr-1 text-amber-500" />
            {profile.streak} day streak
          </Badge>
        </div>
        <div className="mt-4">
          <ProgressBar value={levelProgress} label={`Level ${level} · ${xpIntoLevel}/${xpToNextLevel} XP`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: "CheckCircle", label: "Solved", value: solvedCount, bg: "bg-emerald-100", fg: "text-emerald-600" },
          { icon: "Zap", label: "XP", value: profile.xp, bg: "bg-primary/40", fg: "text-foreground" },
          { icon: "Award", label: "Badges", value: unlocked.length, bg: "bg-secondary", fg: "text-accent" },
          { icon: "History", label: "Attempts", value: Object.values(progress).reduce((acc, p) => acc + (p.attempts ?? 0), 0), bg: "bg-background", fg: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 text-center shadow-md shadow-black/5">
            <span className={cn("mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl", s.bg)}>
              <Icon name={s.icon} size={19} className={s.fg} />
            </span>
            <p className="text-xl font-extrabold text-foreground tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daily goal */}
      <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/40 text-foreground">
              <Icon name="Target" size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Daily goal</p>
              <p className="text-xs text-muted-foreground">
                {profile.dailyGoal} problems per day
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setGoalMenu(!goalMenu)}
              className="rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-foreground"
              aria-haspopup="menu"
              aria-expanded={goalMenu}
            >
              Change
            </button>
            {goalMenu && (
              <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-2xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 animate-fade-in-down">
                {[3, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      updateDailyGoal(n);
                      setGoalMenu(false);
                      show({ title: `Daily goal set to ${n}`, variant: "success" });
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2 text-sm font-bold transition-colors hover:bg-background/60",
                      profile.dailyGoal === n ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {n} problems
                    {profile.dailyGoal === n && <Icon name="Check" size={14} className="text-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/progress", icon: "TrendingUp", label: "Progress report", desc: "Charts & mastery" },
          { href: "/settings", icon: "Settings", label: "Settings", desc: "Language, data, more" },
          { href: "/library", icon: "Library", label: "Code Library", desc: "Runnable examples" },
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
    </div>
  );
}