import type { Achievement } from "@/types";
import { problemTopic } from "@/content";

export const achievements: Achievement[] = [
  {
    id: "first-step",
    title: "First Step",
    description: "Complete your first problem",
    icon: "Check",
    unlocked: false,
    criteria: "complete-1-problem",
  },
  {
    id: "three-in-a-row",
    title: "On a Roll",
    description: "Complete 3 problems in a row",
    icon: "Flame",
    unlocked: false,
    criteria: "complete-3-consecutive",
  },
  {
    id: "week-streak",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "Zap",
    unlocked: false,
    criteria: "streak-7-days",
  },
  {
    id: "world-1-master",
    title: "C++ Basics Master",
    description: "Complete all problems in C++ Basics world",
    icon: "GraduationCap",
    unlocked: false,
    criteria: "complete-world-1",
  },
  {
    id: "loop-logic",
    title: "Loop Logic",
    description: "Complete your first loop problem",
    icon: "RotateCw",
    unlocked: false,
    criteria: "complete-loop-problem",
  },
  {
    id: "loop-master",
    title: "Loop Master",
    description: "Complete all beginner loop exercises",
    icon: "RotateCw",
    unlocked: false,
    criteria: "complete-all-beginner-loops",
  },
  {
    id: "ten-solved",
    title: "Decade of C++",
    description: "Solve 10 problems",
    icon: "Trophy",
    unlocked: false,
    criteria: "solve-10-problems",
  },
  {
    id: "hundred-xp",
    title: "XP Hunter",
    description: "Earn 100 XP",
    icon: "Sparkles",
    unlocked: false,
    criteria: "earn-100-xp",
  },
  {
    id: "hint-free",
    title: "Self-Learner",
    description: "Solve a problem without using any hints",
    icon: "Brain",
    unlocked: false,
    criteria: "no-hints-solve",
  },
  {
    id: "debugger",
    title: "Bug Hunter",
    description: "Successfully debug a failing test",
    icon: "Target",
    unlocked: false,
    criteria: "debug-test",
  },
  {
    id: "c-seed",
    title: "C++ Seed",
    description: "Begin your C++ journey",
    icon: "Leaf",
    unlocked: true,
    unlockedAt: Date.now(),
    criteria: "start-app",
  },
  {
    id: "world-explorer",
    title: "World Explorer",
    description: "Unlock your first new world",
    icon: "Map",
    unlocked: false,
    criteria: "unlock-world",
  },
  {
    id: "c-master",
    title: "C++ Master",
    description: "Solve problems from every world",
    icon: "Award",
    unlocked: false,
    criteria: "solve-every-world",
  },
];

export function checkAchievements(
  achievementList: Achievement[],
  profile: {
    xp: number;
    streak: number;
    totalProblemsSolved: number;
    totalSubmissions: number;
  },
  progress: Record<string, { status: string }>
): Achievement[] {
  return achievementList.map((achievement) => {
    if (achievement.unlocked) return achievement;

    let shouldUnlock = false;

    const loopProblems = Object.keys(problemTopic).filter((id) => {
      const t = problemTopic[id];
      return t === "for-loops" || t === "while-loops" || t === "do-while-loops";
    });
    const loopSolvedCount = loopProblems.filter((id) => progress[id]?.status === "solved").length;

    switch (achievement.criteria) {
      case "complete-1-problem":
        shouldUnlock = profile.totalProblemsSolved >= 1;
        break;
      case "solve-10-problems":
        shouldUnlock = profile.totalProblemsSolved >= 10;
        break;
      case "streak-7-days":
        shouldUnlock = profile.streak >= 7;
        break;
      case "earn-100-xp":
        shouldUnlock = profile.xp >= 100;
        break;
      case "unlock-world":
        shouldUnlock = profile.totalProblemsSolved >= 5;
        break;
      case "complete-loop-problem":
        shouldUnlock = loopSolvedCount >= 1;
        break;
      case "complete-all-beginner-loops":
        shouldUnlock = loopProblems.length > 0 && loopSolvedCount === loopProblems.length;
        break;
      case "debug-test":
        shouldUnlock = profile.totalSubmissions >= 3;
        break;
    }

    if (shouldUnlock) {
      return { ...achievement, unlocked: true, unlockedAt: Date.now() };
    }
    return achievement;
  });
}