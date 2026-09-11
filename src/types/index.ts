export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "challenge";

export type ProblemStatus = "locked" | "available" | "in-progress" | "solved" | "failed";

export type WorldStatus = "locked" | "available" | "completed";

export interface Hint {
  level: 1 | 2 | 3 | 4;
  title: string;
  content: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  world: string;
  worldOrder: number;
  lessonOrder: number;
  description: string;
  filename: string;
  input: string;
  output: string;
  example: {
    input: string;
    output: string;
  };
  constraints: string[];
  hints: Hint[];
  concepts: string[];
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  hiddenTests: TestCase[];
  xpReward: number;
  timeLimit?: number;
}

export interface Lesson {
  id: string;
  title: string;
  world: string;
  worldOrder: number;
  order: number;
  description: string;
  difficulty: Difficulty;
  content: LessonContent;
  problemId: string;
}

export interface LessonContent {
  whatIsThis: string;
  whyDoWeUseIt: string;
  howToThinkAboutIt: string;
  whenToUseIt: string;
  keyConcepts: KeyConcept[];
  example: ExampleBlock;
  studentTask: string;
  notes: string[];
  commonMistakes: { mistake: string; fix: string }[];
  quiz: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface KeyConcept {
  title: string;
  explanation: string;
  code?: string;
}

export interface ExampleBlock {
  explanation: string;
  code: string;
  output?: string;
}

export interface World {
  id: string;
  title: string;
  description: string;
  order: number;
  icon: string;
  color: string;
  lessons: string[];
  unlocked: boolean;
  mastery: number;
}

export interface StudentProgress {
  problemId: string;
  status: ProblemStatus;
  attempts: number;
  bestTime?: string;
  completedAt?: number;
  lastAttemptCode?: string;
  language?: string;
}

export interface UserProfile {
  username: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDay: string;
  joinedAt: number;
  totalProblemsSolved: number;
  totalSubmissions: number;
  dailyGoal: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  criteria: string;
}

export interface Submission {
  problemId: string;
  code: string;
  status: "accepted" | "wrong-answer" | "time-limit" | "runtime-error" | "compilation-error";
  runtime: number;
  testResults: TestResult[];
  submittedAt: number;
  attemptNumber: number;
}

export interface TestResult {
  testIndex: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
}

export interface Mastery {
  concept: string;
  level: number;
  progress: number;
}

export interface AppState {
  profile: UserProfile;
  progress: Record<string, StudentProgress>;
  achievements: Achievement[];
  submissions: Submission[];
  settings: UserSettings;
}

export interface UserSettings {
  id?: string;
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  autoRun: boolean;
  showHints: boolean;
}

export type Topic =
  | "introduction"
  | "variables"
  | "data-types"
  | "input-output"
  | "operators"
  | "conditions"
  | "switch"
  | "for-loops"
  | "while-loops"
  | "do-while-loops"
  | "functions"
  | "arrays"
  | "strings"
  | "pointers"
  | "structures"
  | "oop"
  | "classes";

export interface Announcement {
  id: string;
  type: "new" | "lesson" | "challenge" | "update" | "info";
  title: string;
  body: string;
  publishedAt: number;
  link?: { href: string; label: string };
}

export interface Challenge {
  id: string;
  title: string;
  topic: Topic;
  difficulty: Difficulty;
  description: string;
  example: { input: string; output: string };
  starterCode: string;
  hints: Hint[];
  xpReward: number;
  active: boolean;
  label?: string;
}

export interface CodeExample {
  id: string;
  category: Topic;
  title: string;
  description: string;
  code: string;
  explanation: string;
  output: string;
  language?: "cpp" | "java" | "python";
}

export type TabType = "dashboard" | "learn" | "practice" | "progress" | "settings";