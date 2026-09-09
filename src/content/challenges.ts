import type { Challenge } from "@/types";

export const challenges: Challenge[] = [
  {
    id: "challenge-001",
    title: "Largest of Five",
    topic: "conditions",
    difficulty: "medium",
    description:
      "Write a program that reads 5 numbers and prints the largest one. This looks easy — but reading them one by one and comparing carefully is the real test.",
    example: { input: "4 9 2 7 5", output: "9" },
    starterCode: `#include <iostream>

int main() {

//start your program here

}`,
    hints: [
      {
        level: 1,
        title: "Track the maximum",
        content: "Keep one variable holding the biggest number you've seen so far.",
      },
      {
        level: 2,
        title: "Update it",
        content: "After reading each number, compare it to your current largest. If it's bigger, replace it.",
      },
      {
        level: 3,
        title: "Compare with if",
        content: "Use an if statement like: if (num > largest) largest = num;",
      },
    ],
    xpReward: 30,
    active: true,
    label: "This Week",
  },
  {
    id: "challenge-002",
    title: "Count to Ten the Loop Way",
    topic: "for-loops",
    difficulty: "easy",
    description:
      "Can you print the numbers from 1 to 10 using a loop — not ten cout lines? Any loop type is fine.",
    example: { input: "", output: "1 2 3 4 5 6 7 8 9 10" },
    starterCode: `#include <iostream>

int main() {

//start your program here

}`,
    hints: [
      {
        level: 1,
        title: "A loop repeats",
        content: "A for loop runs its body once per count value.",
      },
      {
        level: 2,
        title: "Print each count",
        content: "Inside the loop, print the counter, then add a space.",
      },
      {
        level: 3,
        title: "Range",
        content: "for (int i = 1; i <= 10; i++) prints exactly 1 through 10.",
      },
    ],
    xpReward: 20,
    active: false,
    label: "Coming Soon",
  },
];

export function currentChallenge(): Challenge | undefined {
  return challenges.find((c) => c.active) ?? challenges[0];
}