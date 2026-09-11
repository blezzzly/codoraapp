"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { codeExamples } from "@/content";
import { setDraft } from "@/lib/ideDraft";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const CAT_SEPARATOR: Record<string, string> = {
  "input-output": "Input & Output",
  variables: "Variables",
  "data-types": "Data types",
  operators: "Operators",
  conditions: "Conditions",
  switch: "Switch",
  "for-loops": "For loops",
  "while-loops": "While loops",
  functions: "Functions",
  arrays: "Arrays",
  strings: "Strings",
  pointers: "Pointers",
  oop: "Classes & objects",
};

export default function LibraryPage() {
  const { language } = useApp();
  const router = useRouter();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map: Record<string, typeof codeExamples> = {};
    for (const ex of codeExamples) {
      if (category !== "all" && ex.category !== category) continue;
      const q = query.trim().toLowerCase();
      if (q && !ex.title.toLowerCase().includes(q) && !ex.description.toLowerCase().includes(q)) continue;
      (map[ex.category] ??= []).push(ex);
    }
    return map;
  }, [query, category]);

  const categories = useMemo(
    () => [...new Set(codeExamples.map((e) => e.category))],
    []
  );

  const openInIde = (ex: (typeof codeExamples)[number]) => {
    setDraft(ex.code, language);
    show({
      title: `Draft loaded: "${ex.title}"`,
      description: "It's ready in the IDE — just press Run.",
      variant: "success",
    });
    router.push("/ide");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PageHeader
        icon="Library"
        title="Code Library"
        subtitle="Copy-paste runnable C++ examples"
        action={
          <Link
            href="/ide"
            className="hidden items-center gap-2 sm:inline-flex sm:h-10 sm:rounded-xl sm:bg-primary sm:px-4 sm:text-xs sm:font-bold sm:text-foreground sm:shadow-md"
          >
            <Icon name="Terminal" size={15} /> Open IDE
          </Link>
        }
      />

      <div className="mt-5 space-y-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon name="Search" size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search examples..."
            aria-label="Search examples"
            className="h-12 w-full rounded-2xl border border-border bg-white pl-10 pr-4 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
              category === "all"
                ? "bg-primary text-foreground shadow-md shadow-black/10"
                : "bg-white text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                category === c
                  ? "bg-primary text-foreground shadow-md shadow-black/10"
                  : "bg-white text-muted-foreground hover:text-foreground"
              )}
            >
              {CAT_SEPARATOR[c] ?? c.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(groups).length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-white/60 p-10 text-center">
          <p className="text-sm font-bold text-foreground">No examples found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {Object.entries(groups).map(([cat, examples]) => (
            <section key={cat}>
              <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                {CAT_SEPARATOR[cat] ?? cat.replace(/-/g, " ")}
              </h2>
              <div className="space-y-3">
                {examples.map((ex) => {
                  const isOpen = expanded === ex.id;
                  return (
                    <div
                      key={ex.id}
                      className="overflow-hidden rounded-2xl bg-white shadow-md shadow-black/5"
                    >
                      <button
                        onClick={() => setExpanded(isOpen ? null : ex.id)}
                        className="flex w-full items-start gap-3 p-4 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent">
                          <Icon name="FileCode" size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-bold text-foreground">
                              {ex.title}
                            </h3>
                            {ex.language && (
                              <Badge variant="outline">{ex.language}</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {ex.description}
                          </p>
                        </div>
                        <Icon
                          name="ChevronDown"
                          size={17}
                          className={cn(
                            "mt-1 shrink-0 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 animate-fade-in-up">
                          <p className="mb-2 rounded-xl bg-background p-3 text-sm text-muted-foreground">
                            <span className="font-bold text-foreground">Why:</span>{" "}
                            {ex.explanation}
                          </p>
                          <CodeBlock
                            code={ex.code}
                            language="cpp"
                            title={`Copy this · output: ${ex.output}`}
                            onCopy={() =>
                              show({ title: "Code copied to clipboard", variant: "success" })
                            }
                          />
                          <button
                            onClick={() => openInIde(ex)}
                            className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-xs font-bold text-foreground"
                          >
                            <Icon name="Terminal" size={15} /> Open in IDE
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        All snippets are C++ and work in the Codora editor.
      </p>
    </div>
  );
}