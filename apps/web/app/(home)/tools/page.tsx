import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { allTools, getToolUrl } from "@/lib/tools";
import type { Tool } from "@/lib/tools";
import {
  MetaPill,
  SectionHeading,
  SitePageHeader,
  TagPill,
} from "@/components/site";

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
const toolCount = allTools.filter((tool) => tool.type === "Tool").length;
const tutorialCount = allTools.filter(
  (tool) => tool.type === "Tutorial",
).length;
const extensionCount = allTools.filter(
  (tool) => tool.type === "Extension",
).length;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Tools",
  description:
    "Tools, a few tool-backed tutorials, and some browser extensions.",
  url: "https://testy.cool/tools",
  itemListElement: allTools.map((tool, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: tool.title,
    url: `https://testy.cool${getToolUrl(tool)}`,
  })),
};

function ToolCard({ tool }: { tool: Tool }) {
  const url = getToolUrl(tool);

  return (
    <Link
      href={url}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/30"
    >
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-fd-border bg-fd-card shadow-sm transition-colors hover:border-fd-primary/40">
        {tool.screenshot && (
          <div className="aspect-[16/9] overflow-hidden border-b border-fd-border">
            <img
              src={tool.screenshot}
              alt={`${tool.title} screenshot`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <MetaPill>{tool.type}</MetaPill>
          </div>
          <h3 className="text-lg font-semibold leading-tight tracking-tight text-fd-foreground transition-colors group-hover:text-fd-primary md:text-xl">
            {tool.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-fd-foreground/66">
            {tool.description}
          </p>
          {tool.tags && tool.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
          )}
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-fd-foreground transition-colors group-hover:text-fd-primary">
            Open
            <ArrowRight className="size-4" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function ToolsIndex() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SitePageHeader
        title={pageTitle}
        eyebrow="Directory"
        description="Tools, a few tool-backed tutorials, and some browser extensions."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: pageTitle }]}
      >
        <div className="flex flex-wrap gap-2">
          <MetaPill>{toolCount} tools</MetaPill>
          <MetaPill>{tutorialCount} tutorial</MetaPill>
          <MetaPill>{extensionCount} extensions</MetaPill>
        </div>
      </SitePageHeader>
      <section className="container px-4 py-8 lg:px-6 lg:py-12">
        <SectionHeading
          eyebrow="Index"
          title="Utilities with a little context"
          description="Standalone tools live next to tutorial-backed tools, so the useful thing is always one click away."
          eyebrowClassName="text-fd-primary"
        />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {allTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </>
  );
}
