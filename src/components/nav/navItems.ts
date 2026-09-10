export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export const navItems: NavItem[] = [
  { href: "/ide", icon: "Terminal", label: "Code" },
  { href: "/learn", icon: "BookOpen", label: "Learn" },
  { href: "/practice", icon: "Target", label: "Practice" },
  { href: "/challenges", icon: "Trophy", label: "Challenges" },
  { href: "/profile", icon: "User", label: "Profile" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}