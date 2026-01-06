import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DocsTitle, DocsDescription } from "fumadocs-ui/page";

interface Tool {
  slug: string;
  title: string;
  description: string;
  screenshot?: string;
  tags?: string[];
}

const tools: Tool[] = [
  {
    slug: "clamp-calculator",
    title: "Clamp Calculator",
    description: "Generate fluid responsive CSS clamp() values from your Figma designs. Supports both mobile+desktop and desktop-only workflows.",
    screenshot: "/images/tools/clamp-calculator.png",
    tags: ["CSS", "Responsive", "Figma"],
  },
];

export default function ToolsIndex() {
  return (
    <>
      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="text-center">
          <DocsTitle className="dark:text-white capitalize">Tools</DocsTitle>
          <DocsDescription className="mt-3 dark:text-gray-300 mb-0">
            Dev tools and calculators. Mostly for frontend work.
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left">
        <div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
          {tools.map((tool) => (
            <div
              key={tool.slug}
              className="order-last border-0 bg-transparent shadow-none sm:order-first sm:col-span-12 lg:col-span-10 lg:col-start-2"
            >
              <div className="grid gap-y-6 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:gap-x-12">
                <div className="sm:col-span-5">
                  <div className="mb-4 md:mb-6">
                    <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wider text-muted-foreground md:gap-5 lg:gap-6">
                      {tool.tags?.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold md:text-2xl lg:text-3xl text-left">
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="hover:underline cursor-pointer"
                    >
                      {tool.title}
                    </Link>
                  </h3>
                  <p className="mt-4 text-muted-foreground md:mt-5 text-left">
                    {tool.description}
                  </p>
                  <div className="mt-6 flex items-center space-x-2 md:mt-8">
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="inline-flex items-center font-semibold hover:underline md:text-base"
                    >
                      <span>Open tool</span>
                      <ArrowRight className="ml-2 size-4 transition-transform" />
                    </Link>
                  </div>
                </div>
                <div className="order-first sm:order-last sm:col-span-5">
                  <Link href={`/tools/${tool.slug}`} className="block">
                    <div className="aspect-[16/9] overflow-clip rounded-lg border border-border">
                      {tool.screenshot ? (
                        <img
                          src={tool.screenshot}
                          alt={tool.title}
                          className="h-full w-full object-cover transition-opacity duration-200 fade-in hover:opacity-70"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                          Preview
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
