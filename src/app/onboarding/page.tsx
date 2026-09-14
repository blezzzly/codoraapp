"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { useApp } from "@/hooks/useApp";
import * as db from "@/lib/database";
import { LANGUAGES, LanguageId } from "@/lib/languages";
import { cn } from "@/lib/utils";

const STEPS = [
  "welcome",
  "how",
  "language",
  "goal",
  "ready",
] as const;

const DAILY_GOALS = [3, 5, 10] as const;

const STEP_LABELS: Record<typeof STEPS[number], string> = {
  welcome: "Welcome",
  how: "How it works",
  language: "Language",
  goal: "Daily Goal",
  ready: "Ready",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { setLanguage, updateDailyGoal } = useApp();
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<LanguageId>("cpp");
  const [selectedGoal, setSelectedGoal] = useState<5 | 3 | 10>(5);

  useEffect(() => {
    // Keep a fresh history entry so the browser's Back never leaves onboarding.
    window.history.pushState(null, "", window.location.href);
    const trapBack = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", trapBack);
    return () => window.removeEventListener("popstate", trapBack);
  }, []);

  const current = STEPS[step];
  const totalSteps = STEPS.length;
  const progressPct = Math.round(((step + 1) / totalSteps) * 100);

  function next() {
    if (step < totalSteps - 1) setStep(step + 1);
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }
  function finish() {
    setLanguage(selectedLang);
    updateDailyGoal(selectedGoal);
    db.setOnboardingCompleted(true);
    router.replace("/home");
  }

  const primary = LANGUAGES[selectedLang];

  return (
    <div className="relative min-h-dvh bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* ---------- Step 0: Welcome ---------- */}
        {current === "welcome" && (
          <div className="flex flex-col items-center gap-6 text-center max-w-sm animate-fade-in-up">
            <div className="relative">
              <span className="absolute inset-0 rounded-3xl bg-primary animate-ping opacity-30" />
              <span className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-black/15">
                <Icon name="Sparkles" size={44} className="text-foreground" />
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">Codora</h1>
              <p className="mt-2 text-base text-muted-foreground leading-relaxed">
                Learn C++, Java, and Python through guided practice.
                No setup. Just open, code, and grow.
              </p>
            </div>
            <button
              onClick={next}
              className="inline-flex h-13 items-center gap-2 rounded-2xl bg-primary px-8 text-base font-bold text-foreground shadow-lg shadow-black/10 transition-all hover:brightness-[0.97] active:translate-y-px"
            >
              Get started <Icon name="ArrowRight" size={18} />
            </button>
          </div>
        )}

        {/* ---------- Step 1: How it works ---------- */}
        {current === "how" && (
          <div className="flex flex-col items-center gap-8 text-center max-w-sm animate-fade-in-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <Icon name="BookOpen" size={30} className="text-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">How it works</h2>
              <p className="text-sm text-muted-foreground">
                I teach programming by doing, not just reading.
              </p>
            </div>
            <div className="w-full space-y-4 text-left">
              {[
                {
                  icon: "GraduationCap",
                  title: "Learn",
                  desc: "Short lessons explain concepts with live code examples.",
                },
                {
                  icon: "Target",
                  title: "Practice",
                  desc: "Solve problems with instant code execution and feedback.",
                },
                {
                  icon: "TrendingUp",
                  title: "Progress",
                  desc: "Earn XP, keep a streak, and track what you've learned.",
                },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-black/5",
                    `animate-fade-in-up stagger-${i + 1}`
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent">
                    <Icon name={item.icon} size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={next}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-7 text-sm font-bold text-foreground shadow-lg shadow-black/10"
            >
              Continue <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}

        {/* ---------- Step 2: Language selection ---------- */}
        {current === "language" && (
          <div className="flex flex-col items-center gap-7 text-center max-w-sm animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Choose your primary language
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You can always switch later in Settings.
              </p>
            </div>
            <div className="w-full space-y-3">
              {(Object.keys(LANGUAGES) as LanguageId[]).map((id, i) => {
                const lang = LANGUAGES[id];
                const active = selectedLang === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedLang(id)}
                    className={cn(
                      "w-full rounded-2xl p-4 text-left transition-all duration-300 animate-fade-in-up",
                      `stagger-${i + 1}`,
                      active
                        ? "ring-2 ring-primary bg-white shadow-lg scale-[1.02]"
                        : "bg-white shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl",
                          active ? "bg-primary" : "bg-secondary"
                        )}
                      >
                        <Icon
                          name={lang.icon}
                          size={22}
                          className="text-foreground"
                        />
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{lang.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {id === "cpp"
                            ? "Best for learning fundamentals — full offline support"
                            : id === "java"
                            ? "Industry standard — offline via TeaVM"
                            : "Great for beginners — full offline support"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2",
                          active
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {active && <Icon name="Check" size={14} className="text-foreground" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={next}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-7 text-sm font-bold text-foreground shadow-lg shadow-black/10"
            >
              Continue <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}

        {/* ---------- Step 3: Daily goal ---------- */}
        {current === "goal" && (
          <div className="flex flex-col items-center gap-7 text-center max-w-sm animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Set a daily goal
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                How many problems do you want to solve per day?
              </p>
            </div>
            <div className="flex gap-4">
              {DAILY_GOALS.map((n, i) => {
                const active = selectedGoal === n;
                return (
                  <button
                    key={n}
                    onClick={() => setSelectedGoal(n)}
                    className={cn(
                      "relative flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 animate-fade-in-up",
                      `stagger-${i + 1}`,
                      active
                        ? "bg-primary text-foreground shadow-lg shadow-black/15 scale-105"
                        : "bg-white text-muted-foreground shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-0.5"
                    )}
                  >
                    <span className="text-3xl font-extrabold tabular-nums">{n}</span>
                    <span className="text-[11px] font-semibold">problems</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={next}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-7 text-sm font-bold text-foreground shadow-lg shadow-black/10"
            >
              Continue <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}

        {/* ---------- Step 4: Ready ---------- */}
        {current === "ready" && (
          <div className="flex flex-col items-center gap-7 text-center max-w-sm animate-fade-in-up">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-black/10">
              <Icon name="GraduationCap" size={38} className="text-foreground" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                You&apos;re all set
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                You chose{" "}
                <span className="font-bold text-foreground">{primary.label}</span>{" "}
                and a goal of{" "}
                <span className="font-bold text-foreground">
                  {selectedGoal} problems/day
                </span>
                .{" "}
                You can change these anytime in Settings.
              </p>
            </div>
            <div className="w-full rounded-2xl bg-white p-4 shadow-md shadow-black/5 text-left">
              <p className="text-xs font-bold text-foreground mb-2">Quick tips</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  Start with the first lesson in Learn
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  Run code examples to see how they work
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  Your progress saves automatically
                </li>
              </ul>
            </div>
            <button
              onClick={finish}
              className="inline-flex h-13 items-center gap-2 rounded-2xl bg-primary px-8 text-base font-bold text-foreground shadow-lg shadow-black/10 transition-all hover:brightness-[0.97]"
            >
              Start learning <Icon name="Play" size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      {step > 0 && current !== "ready" && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-6 pb-safe bg-background/80 backdrop-blur-sm border-t border-border/50 pt-3">
          <span className="flex items-center text-xs font-semibold text-muted-foreground tabular-nums">
            {STEP_LABELS[current]}
          </span>
        </div>
      )}
    </div>
  );
}