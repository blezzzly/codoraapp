"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { LanguageId } from "@/lib/languages";

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

const languageIcons: Record<LanguageId, string> = {
  cpp: "Code",
  java: "Coffee",
  python: "Terminal",
};

const languageColors: Record<LanguageId, string> = {
  cpp: "#00599C",
  java: "#E67300",
  python: "#306998",
};

const languageGradients: Record<LanguageId, string> = {
  cpp: "from-blue-600 to-blue-800",
  java: "from-orange-600 to-orange-800",
  python: "from-yellow-500 via-yellow-600 to-blue-700",
};

const languageAccents: Record<LanguageId, string> = {
  cpp: "bg-blue-500",
  java: "bg-orange-500",
  python: "bg-yellow-500",
};

const languageProgressBars: Record<LanguageId, string> = {
  cpp: "bg-blue-500",
  java: "bg-orange-500",
  python: "bg-yellow-500",
};

export function LanguageCourseCard({
  language,
  title,
  description,
  currentLesson,
  progress,
  completedLessons,
  totalLessons,
  href,
}: LanguageCourseData) {
  const languageColor = languageColors[language];
  const gradient = languageGradients[language];
  const accentClass = languageAccents[language];
  const progressBarClass = languageProgressBars[language];

  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-3xl transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-2xl",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        `focus:ring-${language === "cpp" ? "blue" : language === "java" ? "orange" : "yellow"}-500`
      )}
      style={{
        background: `linear-gradient(145deg, ${languageColor}12 0%, ${languageColor}08 100%)`,
        border: `1px solid ${languageColor}1a`,
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: languageColor + "25" }} />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: languageColor + "15" }} />
      </div>

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-foreground truncate">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="BookOpen" size={12} />
              <span>{currentLesson}</span>
            </div>

            <div className="mt-3">
              <ProgressBar
                value={progress}
                indicatorClassName={progressBarClass}
              />
              <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                {completedLessons} / {totalLessons} lessons · {progress}% complete
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <span
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                accentClass
              )}
            >
              <Icon name="ArrowRight" size={20} className="text-white" />
            </span>
          </div>
        </div>

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1 transition-opacity duration-300",
            `group-hover:opacity-100 opacity-40 ${gradient}`
          )}
        />
      </div>
    </Link>
  );
}