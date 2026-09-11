"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PLANNED = [
  {
    icon: "MessageSquare",
    title: "Discussions",
    description:
      "Ask questions about lessons, get help with problems, and share solutions.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: "Users",
    title: "Study groups",
    description:
      "Form groups around a topic, compare notes, and debug together.",
    color: "bg-secondary text-accent",
  },
  {
    icon: "Trophy",
    title: "Leaderboards",
    description:
      "See how you rank among other learners and stay motivated.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: "Lightbulb",
    title: "Code tips",
    description:
      "Share the small tricks that make your code cleaner and faster.",
    color: "bg-emerald-100 text-emerald-600",
  },
];

export default function CommunityPage() {
  const { show } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onJoinWaitlist = () => {
    setSent(true);
    setEmail("");
    show({
      title: "You're on the list",
      description: "We'll let you know when the community opens.",
      variant: "success",
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <PageHeader
        icon="Users"
        title="Community"
        subtitle="Connect with other learners — coming soon"
      />

      {/* Coming soon banner */}
      <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/10 animate-fade-in-up">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-foreground shadow-lg shadow-black/10">
            <Icon name="Users" size={30} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">
              The community is on its way
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Right now Codora focuses on your solo practice. We want to add a
              friendly place to share and discuss — here&apos;s what&apos;s in store.
            </p>
          </div>
        </div>
      </div>

      {/* Planned features */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLANNED.map((f, i) => (
          <div
            key={f.title}
            className={cn(
              "rounded-2xl bg-white p-4 shadow-md shadow-black/5 animate-fade-in-up",
              `stagger-${i + 1}`
            )}
          >
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", f.color)}>
              <Icon name={f.icon} size={20} />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">{f.title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      {/* Waitlist */}
      <div className="rounded-3xl border border-primary/40 bg-white p-5 shadow-md shadow-black/5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/40 text-foreground">
            <Icon name="Mail" size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Get notified</p>
            <p className="text-xs text-muted-foreground">
              Leave your email and we&apos;ll ping you when community features open.
            </p>
          </div>
        </div>
        {sent ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
            <Icon name="CheckCircle" size={18} /> You&apos;re on the waitlist!
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) onJoinWaitlist();
            }}
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email for the community waitlist"
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-foreground shadow-md"
            >
              <Icon name="Rocket" size={16} /> Join waitlist
            </button>
          </form>
        )}
      </div>
    </div>
  );
}