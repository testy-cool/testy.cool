import Link from "next/link";
import { DocsTitle, DocsDescription } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { allTools, getToolUrl } from "@/lib/tools";
import type { Tool } from "@/lib/tools";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/shadverse/components/breadcrumb";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Tools, a few tool-backed tutorials, and some browser extensions.",
  openGraph: {
    title: "Tools | testy.cool",
    description:
      "Tools, a few tool-backed tutorials, and some browser extensions.",
  },
};

const pageTitle = "Tools";

function ToolCard({ tool }: { tool: Tool }) {
  const url = getToolUrl(tool);

  return (
    <Link href={url} className="group block">
      <article className="h-full rounded-xl border border-fd-border bg-fd-card overflow-hidden transition-colors hover:border-fd-primary/40">
        {tool.screenshot && (
          <div className="aspect-[16/9] overflow-hidden border-b border-fd-border">
            <img
              src={tool.screenshot}
              alt={tool.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-fd-muted-foreground">
              {tool.type}
            </span>
          </div>
          <h3 className="text-sm font-semibold leading-snug group-hover:text-fd-primary transition-colors">
            {tool.title}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-fd-muted-foreground line-clamp-2">
            {tool.description}
          </p>
          {tool.tags && tool.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tool.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] font-medium text-fd-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

export default function ToolsIndex() {
  return (
    <>
      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left bg-fd-muted/50">
        <div className="text-center">
          <Breadcrumb className="mb-4 flex justify-center">
            <BreadcrumbList className="justify-center">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DocsTitle className="dark:text-white capitalize">
            {pageTitle}
          </DocsTitle>
          <DocsDescription className="mt-3 dark:text-gray-300 mb-0">
            Tools, a few tool-backed tutorials, and some browser extensions.
          </DocsDescription>
        </div>
      </section>
      <section className="container px-4 py-8 lg:py-12 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </>
  );
}
