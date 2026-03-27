import Link from "next/link";
import { DocsDescription, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/shadverse/components/breadcrumb";

export const metadata: Metadata = {
  title: "ChatGPT Conversation Exporter",
  description:
    "Browser extension for exporting one ChatGPT conversation to Markdown or HTML. Everything stays in the browser.",
  openGraph: {
    title: "ChatGPT Conversation Exporter | testy.cool",
    description:
      "Browser extension for exporting one ChatGPT conversation to Markdown or HTML. Everything stays in the browser.",
  },
};

const toolTitle = "ChatGPT Conversation Exporter";
const screenshot =
  "/images/tools/chatgpt-conversation-exporter/export-chatgpt-conversation-markdown-html.webp";
const githubUrl = "https://github.com/testy-cool/export-chatgpt-conversation";
const privacyUrl = "/privacy#chatgpt-conversation-exporter";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ChatGPT Conversation Exporter",
  description:
    "Browser extension for exporting one ChatGPT conversation to Markdown or HTML. Everything stays in the browser.",
  url: "https://testy.cool/tools/chatgpt-conversation-exporter",
  applicationCategory: "BrowserExtension",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function ChatGPTConversationExporterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            Browser extension for exporting one ChatGPT conversation to Markdown
            or HTML.
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left">
        <div className="grid gap-y-6 sm:grid-cols-12 sm:gap-x-6 md:gap-x-10 items-center">
          <div className="sm:col-span-7">
            <div className="aspect-[16/9] overflow-clip rounded-lg border border-border">
              <img
                src={screenshot}
                alt="ChatGPT conversation export preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="sm:col-span-5">
            <p className="text-muted-foreground">
              Built to export a single ChatGPT conversation to Markdown or HTML.
              Everything stays in the browser.
            </p>
            <ul className="mt-4 list-disc pl-5 text-muted-foreground space-y-1">
              <li>Export to Markdown or HTML</li>
              <li>Keeps code blocks, tables, and links intact</li>
              <li>No data leaves the browser</li>
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center font-semibold hover:underline md:text-base"
              >
                GitHub repository
              </a>
              <Link
                href={privacyUrl}
                className="inline-flex items-center font-semibold hover:underline md:text-base"
              >
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
