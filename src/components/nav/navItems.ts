export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export const navItems: NavItem[] = [
  { href: "/", icon: "Home", label: "Home" },
  { href: "/learn", icon: "BookOpen", label: "Learn" },
  { href: "/practice", icon: "Code", label: "Practice" },
  { href: "/community", icon: "MessagesSquare", label: "Community" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}