import type { Announcement } from "@/types";

export const announcements: Announcement[] = [
  {
    id: "ann-000",
    type: "new",
    title: "Now code in C++, Java & Python",
    body: "The workspace now supports three languages. Pick one from the top bar, write, run, and test — all in one place.",
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 0.1,
    link: { href: "/ide", label: "Open the workspace" },
  },
  {
    id: "ann-001",
    type: "update",
    title: "Smarter error explanations",
    body: "Compiler errors are now explained in plain language, so you always know what happened and what to fix.",
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    link: { href: "/practice", label: "Try the IDE" },
  },
  {
    id: "ann-002",
    type: "lesson",
    title: "Full C++ learning roadmap",
    body: "Lessons cover everything from Hello World to Classes — with examples, notes, common mistakes, and mini-quizzes.",
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    link: { href: "/learn", label: "Start learning" },
  },
  {
    id: "ann-003",
    type: "challenge",
    title: "Weekly challenge live",
    body: "Can you find the largest of 5 numbers? A new challenge opens every week with bonus XP.",
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    link: { href: "/challenges", label: "Take the challenge" },
  },
];

export function latestAnnouncements(count = 4): Announcement[] {
  return [...announcements]
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, count);
}