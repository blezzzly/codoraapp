import type { Announcement } from "@/types";

export const announcements: Announcement[] = [
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
    body: "Lessons now cover everything from Hello World to Classes — with examples, notes, common mistakes, and mini-quizzes.",
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
  {
    id: "ann-004",
    type: "new",
    title: "C++ Code Library",
    body: "Browse ready-to-study examples by topic, run them, or open them straight in the IDE.",
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    link: { href: "/library", label: "Open the library" },
  },
];

export function latestAnnouncements(count = 4): Announcement[] {
  return [...announcements]
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, count);
}