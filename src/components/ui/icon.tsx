"use client";

import * as LucideIcons from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Sparkles: LucideIcons.Sparkles,
  GitBranch: LucideIcons.GitBranch,
  RotateCw: LucideIcons.RotateCw,
  Leaf: LucideIcons.Leaf,
  Code: LucideIcons.Code,
  Binary: LucideIcons.Binary,
  Box: LucideIcons.Box,
  Layers: LucideIcons.Layers,
  Cpu: LucideIcons.Cpu,
  Terminal: LucideIcons.Terminal,
  Variable: LucideIcons.Variable,
  Hash: LucideIcons.Hash,
  Type: LucideIcons.Type,
  Calculator: LucideIcons.Calculator,
  Percent: LucideIcons.Percent,
  Equal: LucideIcons.Equal,
  ArrowRight: LucideIcons.ArrowRight,
  ArrowDown: LucideIcons.ArrowDown,
  Check: LucideIcons.Check,
  X: LucideIcons.X,
  Play: LucideIcons.Play,
  ChevronRight: LucideIcons.ChevronRight,
  ChevronLeft: LucideIcons.ChevronLeft,
  Lock: LucideIcons.Lock,
  Unlock: LucideIcons.Unlock,
  Zap: LucideIcons.Zap,
  Trophy: LucideIcons.Trophy,
  Star: LucideIcons.Star,
  Award: LucideIcons.Award,
  Flame: LucideIcons.Flame,
  Target: LucideIcons.Target,
  TrendingUp: LucideIcons.TrendingUp,
  BookOpen: LucideIcons.BookOpen,
  GraduationCap: LucideIcons.GraduationCap,
  Brain: LucideIcons.Brain,
  Lightbulb: LucideIcons.Lightbulb,
  Settings: LucideIcons.Settings,
  Home: LucideIcons.Home,
  BarChart3: LucideIcons.BarChart3,
  Copy: LucideIcons.Copy,
  CheckCheck: LucideIcons.CheckCheck,
  Code2: LucideIcons.Code2,
  Database: LucideIcons.Database,
  Wifi: LucideIcons.Wifi,
  Smartphone: LucideIcons.Smartphone,
  RotateCcw: LucideIcons.RotateCcw,
  Trash2: LucideIcons.Trash2,
  Heart: LucideIcons.Heart,
  Info: LucideIcons.Info,
  AlertTriangle: LucideIcons.AlertTriangle,
  CheckCircle: LucideIcons.CheckCircle,
  Circle: LucideIcons.Circle,
  PlayCircle: LucideIcons.PlayCircle,
  Map: LucideIcons.Map,
  User: LucideIcons.User,
  Users: LucideIcons.Users,
  MessagesSquare: LucideIcons.MessagesSquare,
  MessageSquare: LucideIcons.MessageSquare,
  ChevronUp: LucideIcons.ChevronUp,
  ChevronDown: LucideIcons.ChevronDown,
  Coffee: LucideIcons.Coffee,
  Clock: LucideIcons.Clock,
  Search: LucideIcons.Search,
};

interface IconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

export function Icon({ name, className, style, size = 20 }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    return <LucideIcons.Circle className={className} style={style} />;
  }
  
  return <IconComponent className={className} style={{ width: size, height: size, ...style }} />;
}
