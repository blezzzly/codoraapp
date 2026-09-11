import type { Achievement, StudentProgress, UserProfile, World } from "@/types";
import { problemTopic } from "@/content";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: string;
}

export const achievementList: AchievementDefinition[] = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Complete your first problem",
    icon: "Check",
    criteria: "first-problem",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Complete 3 problems",
    icon: "Flame",
    criteria: "solve-3",
  },
  {
    id: "problem-solver",
    title: "Problem Solver",
    description: "Complete 10 problems",
    icon: "Trophy",
    criteria: "solve-10",
  },
  {
    id: "streak-keeper",
    title: "Streak Keeper",
    description: "Keep a 3-day streak",
    icon: "Clock",
    criteria: "streak-3",
  },
  {
    id: "week-warrior",
    title: "Week Warrior",
    description: "Keep a 7-day streak",
    icon: "CalendarDays",
    criteria: "streak-7",
  },
  {
    id: "cpp-master",
    title: "C++ Master",
    description: "Complete the C++ Basics world",
    icon: "Code",
    criteria: "world-1",
  },
  {
    id: "decision-maker",
    title: "Decision Maker",
    description: "Complete the Decisions world",
    icon: "GitBranch",
    criteria: "world-2",
  },
  {
    id: "loop-master",
    title: "Loop Master",
    description: "Complete the Loops world",
    icon: "RotateCw",
    criteria: "world-3",
  },
  {
    id: "polyglot",
    title: "Polyglot",
    description: "Solve problems in 2 or more languages",
    icon: "Languages",
    criteria: "polyglot",
  },
  {
    id: "challenge-champion",
    title: "Challenge Champion",
    description: "Complete your first weekly challenge",
    icon: "Award",
    criteria: "first-challenge",
  },
  {
    id: "loop-logic",
    title: "Loop Logic",
    description: "Complete your first loop problem",
    icon: "RotateCw",
    criteria: "first-loop-problem",
  },
  {
    id: "hundred-xp",
    title: "XP Hunter",
    description: "Earn 100 XP",
    icon: "Zap",
    criteria: "xp-100",
  },
  {
    id: "three-hundred-xp",
    title: "XP Collector",
    description: "Earn 300 XP",
    icon: "Sparkles",
    criteria: "xp-300",
  },
  {
    id: "thousand-xp",
    title: "XP Legend",
    description: "Earn 1,000 XP",
    icon: "Trophy",
    criteria: "xp-1000",
  },
];

interface AchievementContext {
  profile: UserProfile;
  progress: Record<string, StudentProgress>;
  worlds: World[];
  solvedChallenges: string[];
}

function criteriaSolved(
  ctx: AchievementContext,
  predicate: (problemId: string) => boolean
): boolean {
  return Object.values(ctx.progress).some(
    (p) => p.status === "solved" && predicate(p.problemId)
  );
}

function criteriaSolvedCount(
  ctx: AchievementContext,
  predicate: (problemId: string) => boolean
): number {
  return Object.values(ctx.progress).filter(
    (p) => p.status === "solved" && predicate(p.problemId)
  ).length;
}

function isWorldComplete(ctx: AchievementContext, worldId: string): boolean {
  const world = ctx.worlds.find((w) => w.id === worldId);
  if (!world) return false;
  return world.lessons.every((lessonId) => {
    const problem = Object.values(ctx.progress).find(
      (p) => p.problemId === lessonId && p.status === "solved"
    );
    return !!problem;
  });
}

const LOOP_TOPICS = new Set(["for-loops", "while-loops", "do-while-loops"]);

function isLoopProblem(problemId: string): boolean {
  const topic = problemTopic[problemId];
  return topic ? LOOP_TOPICS.has(topic) : false;
}

function isCriteriaMet(criteria: string, ctx: AchievementContext): boolean {
  const solved = criteriaSolvedCount(ctx, () => true);
  const distinctLanguages = new Set<string>();
  Object.values(ctx.progress).forEach((p) => {
    if (p.status === "solved" && p.language) {
      distinctLanguages.add(p.language);
    }
  });

  switch (criteria) {
    case "first-problem":
      return solved >= 1;
    case "solve-3":
      return solved >= 3;
    case "solve-10":
      return solved >= 10;
    case "streak-3":
      return ctx.profile.streak >= 3;
    case "streak-7":
      return ctx.profile.streak >= 7;
    case "world-1":
      return isWorldComplete(ctx, "world-1");
    case "world-2":
      return isWorldComplete(ctx, "world-2");
    case "world-3":
      return isWorldComplete(ctx, "world-3");
    case "polyglot":
      return distinctLanguages.size >= 2;
    case "first-challenge":
      return ctx.solvedChallenges.length >= 1;
    case "first-loop-problem":
      return criteriaSolved(ctx, isLoopProblem);
    case "xp-100":
      return ctx.profile.xp >= 100;
    case "xp-300":
      return ctx.profile.xp >= 300;
    case "xp-1000":
      return ctx.profile.xp >= 1000;
    default:
      return false;
  }
}

/**
 * Returns the achievements list with icon lookup resolved and updated unlock
 * states. Already-unlocked achievements keep their unlock date.
 */
export function checkAchievements(
  existing: Achievement[],
  profile: UserProfile,
  progress: Record<string, StudentProgress>,
  worlds: World[],
  solvedChallenges: string[]
): Achievement[] {
  const existingMap = new Map(existing.map((a) => [a.id, a]));
  const ctx: AchievementContext = { profile, progress, worlds, solvedChallenges };
  return achievementList.map((def) => {
    const prev = existingMap.get(def.id);
    if (prev?.unlocked) {
      return prev;
    }
    const unlocked = isCriteriaMet(def.criteria, ctx);
    return {
      ...def,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined,
    };
  });
}

export function withAchievementIcons(
  achievements: Achievement[]
): { id: string; title: string; description: string; icon: string; unlocked: boolean; unlockedAt?: number; criteria: string }[] {
  return achievements;
}