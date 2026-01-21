import Link from "next/link";
import { DocsDescription, DocsTitle } from "fumadocs-ui/page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/shadverse/components/breadcrumb";

const toolTitle = "Hacker News Enhancement Suite";
const screenshot = "/images/tools/hnes/hnes-screenshot.webp";
const chromeWebStoreUrl =
  "https://chromewebstore.google.com/detail/hacker-news-enhancement-s/ebmjdaaabekgefdnfkcoejejhkodkepg";
const githubUrl = "https://github.com/testy-cool/hackernews-enhancement-suite";

export default function HNESPage() {
  return (
    <>
      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left bg-zinc-50/50 dark:bg-zinc-900/50">
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
                <BreadcrumbLink asChild>
                  <Link href="/tools">Tools</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{toolTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DocsTitle className="dark:text-white capitalize">
            {toolTitle}
          </DocsTitle>
          <DocsDescription className="mt-3 dark:text-gray-300 mb-0">
            A maintained Manifest V3 fork that makes Hacker News better.
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left">
        <div className="grid gap-y-6 sm:grid-cols-12 sm:gap-x-6 md:gap-x-10 items-center">
          <div className="sm:col-span-7">
            <div className="aspect-[16/9] overflow-clip rounded-lg border border-border">
              <img
                src={screenshot}
                alt="Hacker News Enhancement Suite preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="sm:col-span-5">
            <p className="text-muted-foreground">
              The original HNES stopped working after Chrome deprecated Manifest
              V2. This fork updates it to Manifest V3 and keeps it running.
            </p>
            <ul className="mt-4 list-disc pl-5 text-muted-foreground space-y-1">
              <li>Collapsible comments and inline replies</li>
              <li>Highlight new comments since last visit</li>
              <li>Keyboard shortcuts (j/k/o/l/p/c/b)</li>
              <li>User tagging and upvote tracking</li>
              <li>Cleaner visual style</li>
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={chromeWebStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center font-semibold hover:underline md:text-base"
              >
                Install from Chrome Web Store
              </a>
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center font-semibold hover:underline md:text-base"
              >
                GitHub repository
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
