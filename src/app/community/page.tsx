import { Icon } from "@/components/ui/icon";

const communityCards = [
  {
    icon: "Lightbulb",
    title: "Code Tips",
    description: "Share the small tricks that make C++ code cleaner and faster.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: "Users",
    title: "Study Groups",
    description: "Find classmates and form groups for a subject or a topic.",
    color: "bg-secondary text-foreground",
  },
  {
    icon: "Award",
    title: "CITCS Challenges",
    description: "Weekly mini-contests built around your current lessons.",
    color: "bg-rose-100 text-rose-600",
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="relative bg-white rounded-3xl p-6 shadow-lg shadow-black/15 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-background rounded-full blur-3xl -z-0" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-black/20">
              <Icon name="MessagesSquare" size={26} className="text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                Community
                <span className="rounded-full bg-background px-2.5 py-0.5 text-[10px] font-bold text-foreground">
                  SOON
                </span>
              </h1>
              <p className="text-sm text-slate-400">Learn together. Grow together.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div
          className="animate-fade-in-up opacity-0 rounded-3xl bg-background p-6"
          style={{ animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
              <Icon name="MessagesSquare" size={22} />
            </span>
            <div>
              <h2 className="font-bold text-foreground">Community is on the way</h2>
              <p className="text-sm text-foreground/70">
                The place where CITCS students talk code.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/80">
            Soon you&apos;ll be able to discuss problems, share solutions, form study groups,
            and join weekly C++ challenges with your classmates. While we build it,
            keep grinding on your lessons and practice sets.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {communityCards.map((card) => (
            <div
              key={card.title}
              className="animate-fade-in-up opacity-0 rounded-3xl bg-white p-5 shadow-lg shadow-black/15"
              style={{ animationFillMode: "forwards", animationDelay: "100ms" }}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}
              >
                <Icon name={card.icon} size={20} />
              </span>
              <h3 className="mt-3 font-bold text-slate-700">{card.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}