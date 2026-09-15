import type { LanguageId } from "@/lib/languages";
import { problems } from "@/data/problems";

export interface LanguageCourseData {
  language: LanguageId;
  title: string;
  description: string;
  currentLesson: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  href: string;
}

export function getLanguageCourses(
  progress: Record<string, { status: string }>
): LanguageCourseData[] {
  const cppProblems = problems.filter((p) => p.world.startsWith("world-"));
  const totalCppLessons = cppProblems.length;

  const solvedCpp = cppProblems.filter(
    (p) => progress[p.id]?.status === "solved"
  ).length;

  const nextCppProblem = cppProblems.find(
    (p) => progress[p.id]?.status !== "solved"
  );

  const cppCurrentLesson = nextCppProblem
    ? `World ${nextCppProblem.worldOrder} · Lesson ${nextCppProblem.lessonOrder}`
    : "Course complete";

  const courses: LanguageCourseData[] = [
    {
      language: "cpp",
      title: "C++ Fundamentals",
      description: "Learn C++ through practice — from Hello World to loops and beyond.",
      currentLesson: cppCurrentLesson,
      progress: totalCppLessons > 0 ? Math.round((solvedCpp / totalCppLessons) * 100) : 0,
      completedLessons: solvedCpp,
      totalLessons: totalCppLessons,
      href: nextCppProblem ? `/learn/${nextCppProblem.id}` : "/learn",
    },
    {
      language: "java",
      title: "Java Fundamentals",
      description: "Learn Java through practice — variables, control flow, and OOP.",
      currentLesson: "Coming soon",
      progress: 0,
      completedLessons: 0,
      totalLessons: 0,
      href: "/learn/java",
    },
    {
      language: "python",
      title: "Python Fundamentals",
      description: "Learn Python through practice — clean syntax, powerful libraries.",
      currentLesson: "Coming soon",
      progress: 0,
      completedLessons: 0,
      totalLessons: 0,
      href: "/learn/python",
    },
  ];

  return courses;
}

export function getActiveLanguageCourse(
  courses: LanguageCourseData[],
  currentLanguage: LanguageId
): LanguageCourseData | undefined {
  return courses.find((c) => c.language === currentLanguage);
}