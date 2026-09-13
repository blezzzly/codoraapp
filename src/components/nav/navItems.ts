export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

/**
 * Primary destinations — mobile-first design. Same items on desktop and mobile
 * for consistency. No secondary nav - everything reachable from Home and Profile.
 */
export const primaryNavItems: NavItem[] = [
  { href: "/home", icon: "Home", label: "Home" },
  { href: "/learn", icon: "BookOpen", label: "Learn" },
  { href: "/practice", icon: "Target", label: "Practice" },
  { href: "/ide", icon: "Terminal", label: "Code" },
  { href: "/profile", icon: "User", label: "Profile" },
];

// Empty - we use primaryNavItems everywhere for mobile-first consistency
export const secondaryNavItems: NavItem[] = [];

export const allNavItems: NavItem[] = [
  ...primaryNavItems,
  ...secondaryNavItems,
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}