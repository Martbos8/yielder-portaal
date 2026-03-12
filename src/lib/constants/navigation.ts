/**
 * Sidebar navigation items configuration.
 * Extracted from sidebar.tsx for reuse in breadcrumbs, metadata, and tests.
 */

export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", icon: "space_dashboard", label: "Dashboard" },
  { href: "/upgrade", icon: "rocket_launch", label: "Upgrade" },
  { href: "/hardware", icon: "laptop_mac", label: "Hardware" },
  { href: "/software", icon: "key", label: "Software" },
  { href: "/tickets", icon: "confirmation_number", label: "Tickets" },
  { href: "/contracten", icon: "verified_user", label: "Contracten" },
  { href: "/supportcontracten", icon: "support_agent", label: "Support SLA" },
  { href: "/it-gezondheid", icon: "health_and_safety", label: "IT-gezondheid" },
  { href: "/prestaties", icon: "monitoring", label: "Prestaties" },
  { href: "/facturen", icon: "receipt_long", label: "Facturen" },
  { href: "/documenten", icon: "folder_open", label: "Documenten" },
  { href: "/contact", icon: "contact_support", label: "Contact" },
  { href: "/shop", icon: "storefront", label: "IT-oplossingen" },
] as const;

/** Get the nav item for a given path. */
export function getNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href);
}

/** Get the label for a given path. */
export function getPageLabel(pathname: string): string {
  return getNavItem(pathname)?.label ?? "Pagina";
}
