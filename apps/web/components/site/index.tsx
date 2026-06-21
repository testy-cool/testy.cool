import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@repo/shadverse/lib/utils";
import { GridBackground } from "@repo/ui/components/grid-background";

export interface SiteBreadcrumbItem {
  label: string;
  href?: string;
}

interface SitePageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: SiteBreadcrumbItem[];
  children?: ReactNode;
  className?: string;
}

export function SitePageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  children,
  className,
}: SitePageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-fd-border/70 bg-fd-muted/35",
        className,
      )}
    >
      <GridBackground maxWidthClass="container" />
      <div className="container relative px-4 py-10 lg:px-6 lg:py-14">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-sm text-fd-muted-foreground"
          >
            {breadcrumbs.map((item, index) => (
              <span
                key={`${item.label}-${index}`}
                className="inline-flex items-center gap-2"
              >
                {index > 0 ? (
                  <span aria-hidden="true" className="text-fd-foreground/30">
                    /
                  </span>
                ) : null}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-fd-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-fd-foreground/70">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-fd-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-fd-foreground md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-base leading-7 text-fd-foreground/66 md:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
  className,
  eyebrowClassName,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl space-y-2">
        {eyebrow ? (
          <p
            className={cn(
              "text-[13px] font-semibold uppercase tracking-[0.22em] text-fd-muted-foreground",
              eyebrowClassName,
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "text-balance text-2xl font-semibold tracking-tight text-fd-foreground md:text-3xl",
            titleClassName,
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-6 text-fd-foreground/66 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {href && hrefLabel ? (
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-medium text-fd-foreground transition-colors hover:text-fd-muted-foreground"
        >
          {hrefLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

interface SiteSurfaceProps {
  children: ReactNode;
  variant?: "card" | "muted" | "plain";
  className?: string;
}

const surfaceVariants = {
  card: "rounded-3xl border border-fd-border bg-fd-card p-5 shadow-sm sm:p-6",
  muted: "rounded-3xl border border-fd-border bg-fd-muted/45 p-5 sm:p-6",
  plain:
    "rounded-3xl border border-fd-border/80 bg-fd-background/75 p-5 sm:p-6",
};

export function SiteSurface({
  children,
  variant = "card",
  className,
}: SiteSurfaceProps) {
  return (
    <section className={cn(surfaceVariants[variant], className)}>
      {children}
    </section>
  );
}

interface PillProps {
  children: ReactNode;
  className?: string;
}

export function MetaPill({ children, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-fd-border bg-fd-background/85 px-2.5 py-1 text-[13px] font-medium uppercase tracking-[0.12em] text-fd-foreground/72",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TagPill({ children, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-fd-muted px-2.5 py-1 text-[13px] font-medium text-fd-foreground/78",
        className,
      )}
    >
      {children}
    </span>
  );
}
