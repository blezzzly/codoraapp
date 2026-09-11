export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

/**
 * Primary destinations. Mobile bottom navigation shows only the top five for
 * comfortable tap targets; the rest is reachable from Home and Profile.
 */
export const primaryNavItems: NavItem[] = [
  { href: "/home", icon: "Home", label: "Home" },
  { href: "/learn", icon: "BookOpen", label: "Learn" },
  { href: "/practice", icon: "Target", label: "Practice" },
  { href: "/ide", icon: "Terminal", label: "Code" },
  { href: "/profile", icon: "User", label: "Profile" },
];

/** Secondary destinations available on the desktop navigation. */
export const secondaryNavItems: NavItem[] = [
  { href: "/challenges", icon: "Trophy", label: "Challenges" },
  { href: "/library", icon: "Library", label: "Library" },
  { href: "/progress", icon: "TrendingUp", label: "Progress" },
  { href: "/settings", icon: "Settings", label: "Settings" },
  { href: "/community", icon: "Users", label: "Community" },
];

export const allNavItems: NavItem[] = [
  ...primaryNavItems,
  ...secondaryNavItems,
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}