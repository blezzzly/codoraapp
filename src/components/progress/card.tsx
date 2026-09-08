import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
}

export function StatCard({ title, value, icon, description, className }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {icon && <div className="text-primary/50">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressCard({ 
  progress, 
  title, 
  world, 
  className 
}: { 
  progress: number; 
  title: string; 
  world: string; 
  className?: string;
}) {
  return (
    <Card className={cn("transition-all duration-300 hover:shadow-md", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{world}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-700 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StreakCard({ 
  streak, 
  lastActive, 
  className 
}: { 
  streak: number; 
  lastActive: number; 
  className?: string;
}) {
  const getStreakMessage = () => {
    if (streak === 0) return "No streak yet";
    if (streak === 1) return "Great! 1 day streak";
    if (streak < 7) return `${streak} days in a row!`;
    if (streak < 30) return "🔥 Getting hot!";
    return "🏆 Legend!";
  };

  return (
    <Card className={cn(
      "relative streak-glow transition-all duration-300", 
      streak >= 3 && "bg-orange-50",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔥</div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Day Streak</p>
            <h3 className="text-3xl font-bold text-foreground">{streak}</h3>
            <p className="text-xs text-muted-foreground mt-1">{getStreakMessage()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MasterCard({
  mastery,
  className,
}: {
  mastery: number;
  className?: string;
}) {
  const getMasteryColor = (level: number) => {
    if (level >= 90) return "bg-emerald-500";
    if (level >= 70) return "bg-secondary";
    if (level >= 50) return "bg-lime-500";
    if (level >= 30) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-md", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Mastery</CardTitle>
        <CardDescription>Overall understanding</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative inline-block">
          <div className="h-24 w-24">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${mastery * 2.827} 282.7`}
                strokeDashoffset="0"
                className="text-primary transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-foreground">{mastery}%</span>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-16 rounded-full ${getMasteryColor(mastery)}`} />
            <span className="text-xs text-muted-foreground">
              {mastery >= 90 ? "Expert" : mastery >= 70 ? "Good" : mastery >= 50 ? "Basic" : "Needs Practice"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
