"use client";

import * as LucideIcons from "lucide-react";

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Sparkles: LucideIcons.Sparkles,
  GitBranch: LucideIcons.GitBranch,
  RotateCw: LucideIcons.RotateCw,
  RotateCcw: LucideIcons.RotateCcw,
  Leaf: LucideIcons.Leaf,
  Code: LucideIcons.Code,
  Code2: LucideIcons.Code2,
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
  ChevronUp: LucideIcons.ChevronUp,
  ChevronDown: LucideIcons.ChevronDown,
  Lock: LucideIcons.Lock,
  Unlock: LucideIcons.Unlock,
  Zap: LucideIcons.Zap,
  Trophy: LucideIcons.Trophy,
  Star: LucideIcons.Star,
  Award: LucideIcons.Award,
  Medal: LucideIcons.Medal,
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
  Database: LucideIcons.Database,
  Wifi: LucideIcons.Wifi,
  WifiOff: LucideIcons.WifiOff,
  Smartphone: LucideIcons.Smartphone,
  Trash2: LucideIcons.Trash2,
  Heart: LucideIcons.Heart,
  Info: LucideIcons.Info,
  AlertTriangle: LucideIcons.AlertTriangle,
  CheckCircle: LucideIcons.CheckCircle,
  Circle: LucideIcons.Circle,
  CircleHelp: LucideIcons.CircleHelp,
  XCircle: LucideIcons.XCircle,
  PlayCircle: LucideIcons.PlayCircle,
  Map: LucideIcons.Map,
  MapPin: LucideIcons.MapPin,
  User: LucideIcons.User,
  Users: LucideIcons.Users,
  MessagesSquare: LucideIcons.MessagesSquare,
  MessageSquare: LucideIcons.MessageSquare,
  MessageCircle: LucideIcons.MessageCircle,
  Coffee: LucideIcons.Coffee,
  Clock: LucideIcons.Clock,
  Search: LucideIcons.Search,
  Library: LucideIcons.Library,
  Gauge: LucideIcons.Gauge,
  BookMarked: LucideIcons.BookMarked,
  Bookmark: LucideIcons.Bookmark,
  Languages: LucideIcons.Languages,
  Timer: LucideIcons.Timer,
  FileCode: LucideIcons.FileCode,
  FileText: LucideIcons.FileText,
  CalendarDays: LucideIcons.CalendarDays,
  Download: LucideIcons.Download,
  Upload: LucideIcons.Upload,
  CloudDownload: LucideIcons.CloudDownload,
  Pencil: LucideIcons.Pencil,
  NotebookPen: LucideIcons.NotebookPen,
  RefreshCw: LucideIcons.RefreshCw,
  Crown: LucideIcons.Crown,
  List: LucideIcons.List,
  Save: LucideIcons.Save,
  FolderOpen: LucideIcons.FolderOpen,
  FilePlus2: LucideIcons.FilePlus2,
  Eraser: LucideIcons.Eraser,
  CornerUpLeft: LucideIcons.CornerUpLeft,
  ExternalLink: LucideIcons.ExternalLink,
  Keyboard: LucideIcons.Keyboard,
  Gift: LucideIcons.Gift,
  Compass: LucideIcons.Compass,
  Puzzle: LucideIcons.Puzzle,
  Swords: LucideIcons.Swords,
  Share2: LucideIcons.Share2,
  Palette: LucideIcons.Palette,
  LogOut: LucideIcons.LogOut,
  MoreHorizontal: LucideIcons.MoreHorizontal,
  History: LucideIcons.History,
  Mail: LucideIcons.Mail,
  Rocket: LucideIcons.Rocket,
  SlidersHorizontal: LucideIcons.SlidersHorizontal,
  ListChecks: LucideIcons.ListChecks,
  Bug: LucideIcons.Bug,
  PlaySquare: LucideIcons.SquarePlay,
  CircleDot: LucideIcons.CircleDot,
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
    return (
      <LucideIcons.Circle
        aria-hidden="true"
        className={className}
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  return (
    <IconComponent
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, ...style }}
    />
  );
}

export function hasIcon(name: string): boolean {
  return name in iconMap;
}