import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px group/btn select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-md shadow-black/10 hover:brightness-[0.97]",
  secondary: "bg-secondary text-secondary-foreground hover:brightness-[0.97]",
  outline:
    "border border-border bg-white text-foreground hover:bg-background/60",
  ghost: "text-foreground hover:bg-background/70",
  destructive:
    "bg-rose-600 text-white shadow-md shadow-rose-900/20 hover:bg-rose-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";