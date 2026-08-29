"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  House,
  Layers3,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { allTools, getToolUrl } from "@/lib/tools";

type NavigationItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  exact?: boolean;
};

const exploreItems: NavigationItem[] = [
  { label: "Home", href: "/", icon: House, exact: true },
  { label: "Blog", href: "/blog", icon: FileText },
  { label: "Tools", href: "/tools", icon: Wrench },
  { label: "Stack", href: "/stack", icon: Layers3, exact: true },
  { label: "About", href: "/about", icon: UserRound, exact: true },
];

const toolItems: NavigationItem[] = allTools.map((tool) => ({
  label: tool.title,
  href: getToolUrl(tool),
  exact: true,
}));

function NavigationSection({
  label,
  items,
}: {
  label: string;
  items: NavigationItem[];
}) {
  const pathname = usePathname();

  return (
    <div>
      <h2 className="mb-2 px-2 text-[13px] font-medium text-fd-muted-foreground">
        {label}
      </h2>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={`flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary ${
                  active
                    ? "bg-fd-primary/10 font-medium text-fd-primary"
                    : "text-fd-foreground/70 hover:bg-fd-muted hover:text-fd-foreground"
                }`}
              >
                {Icon ? (
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                ) : null}
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Plain link, so a server component can hand these across the boundary. */
export type SidebarLink = { label: string; href: string };

export function SiteSidebar({
  writingItems = [],
}: {
  writingItems?: SidebarLink[];
}) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] overflow-y-auto border-r border-fd-border bg-fd-background px-3 py-6 lg:block">
      <nav aria-label="Site navigation" className="space-y-7">
        <NavigationSection label="Explore" items={exploreItems} />
        {writingItems.length > 0 ? (
          <NavigationSection label="Writing" items={writingItems} />
        ) : null}
        <NavigationSection label="Tools" items={toolItems} />
      </nav>
    </aside>
  );
}
