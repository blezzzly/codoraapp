"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { codeExamplesByCategory } from "@/content";
import { setDraft } from "@/lib/ideDraft";

function CodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block mt-3">
      <div className="code-header">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-accent" />
          </div>
          <span className="text-xs text-gray-400 ml-2">CPP</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <Icon name={copied ? "CheckCheck" : "Copy"} size={14} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="code-content">
        {lines.map((line, i) => (
          <div key={i} className="code-line">
            <span className="code-line-number">{i + 1}</span>
            <span className="text-gray-200 whitespace-pre">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const groups = codeExamplesByCategory();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [output, setOutput] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const firstGroup = Object.keys(groups)[0];
    if (firstGroup && groups[firstGroup][0]) {
      setExpanded(groups[firstGroup][0].id);
    }
  }, [groups]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
          <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <Icon name="Layers" size={28} className="text-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const runExample = async (id: string, code: string) => {
    setRunning(id);
    setOutput((prev) => ({ ...prev, [id]: "Running..." }));
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "cpp" }),
      });
      const result = await res.json();
      setOutput((prev) => ({ ...prev, [id]: result.output || "(no output)" }));
    } catch {
      setOutput((prev) => ({ ...prev, [id]: "Error running example" }));
    } finally {
      setRunning(null);
    }
  };

  const openInIde = (code: string) => {
    setDraft(code);
    router.push("/ide");
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2 mb-1">
            <Icon name="Layers" size={24} className="text-accent" />
            Code Library
          </h1>
          <p className="text-sm text-slate-400">Study examples in any topic — run them or open them in the IDE.</p>
        </div>

        {Object.entries(groups).map(([category, examples], groupIdx) => (
          <section key={category} className="animate-fade-in-up stagger-1" style={{ animationDelay: `${groupIdx * 0.05}s` }}>
            <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Icon name="Hash" size={16} className="text-accent" />
              {category}
            </h2>
            <div className="space-y-3">
              {examples.map((example) => {
                const isOpen = expanded === example.id;
                return (
                  <div key={example.id} className="bg-white rounded-2xl shadow-lg shadow-black/15 overflow-hidden">
                    <button
                      onClick={() => setExpanded(isOpen ? null : example.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-700 text-sm">{example.title}</h3>
                        <p className="text-xs text-slate-400 truncate">{example.description}</p>
                      </div>
                      <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={18} className="text-slate-300 transition-transform" />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-slate-500">{example.explanation}</p>
                        <CodeDisplay code={example.code} />

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => runExample(example.id, example.code)}
                            disabled={running === example.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-60 shadow-lg"
                          >
                            <Icon name="Play" size={14} />
                            {running === example.id ? "Running..." : "Run Code"}
                          </button>
                          <button
                            onClick={() => openInIde(example.code)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary text-foreground text-xs font-bold hover:bg-primary transition-colors shadow-lg"
                          >
                            <Icon name="Terminal" size={14} />
                            Open in IDE
                          </button>
                          <span className="text-xs text-slate-400 font-mono ml-auto">
                            Output: {example.output}
                          </span>
                        </div>

                        {output[example.id] && (
                          <div className="mt-3 bg-[#181825] text-gray-300 rounded-xl p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                            {output[example.id]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="text-center pt-2">
          <Link href="/practice" className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground">
            <Icon name="Code" size={16} />
            Ready to practice?
            <Icon name="ChevronRight" size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}