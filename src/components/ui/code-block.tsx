"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  language,
  title,
  onRun,
  running,
  onCopy,
  className,
  showLineNumbers = true,
}: {
  code: string;
  language?: string;
  title?: string;
  onRun?: () => void;
  running?: boolean;
  onCopy?: (code: string) => void;
  className?: string;
  showLineNumbers?: boolean;
}) {
  const lines = code.replace(/\n$/, "").split("\n");
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    if (onCopy) {
      onCopy(code);
    } else {
      navigator.clipboard?.writeText(code).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-[#2d2438] shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <Icon name="Code2" size={13} className="text-primary/70" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary/80">
            {title ?? language ?? "code"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onRun && (
            <button
              onClick={onRun}
              disabled={running}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-white transition-colors disabled:opacity-60",
                running ? "bg-primary/40" : "bg-primary hover:bg-primary/80"
              )}
            >
              <Icon name={running ? "RotateCw" : "Play"} size={12} className={running ? "animate-spin" : ""} />
              {running ? "Running" : "Run"}
            </button>
          )}
          <button
            onClick={copy}
            aria-label="Copy code"
            className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-primary/80 transition-colors hover:bg-white/10"
          >
            <Icon name={copied ? "Check" : "Copy"} size={12} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono">
          {lines.map((line, i) => (
            <span key={i} className="block whitespace-pre">
              {showLineNumbers && (
                <span className="mr-4 inline-block w-6 select-none text-right text-white/25 tabular-nums">
                  {i + 1}
                </span>
              )}
              <span className="text-[#fce4ec]">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}