import { createMetadata } from "@/lib/metadata";
import { MetaPill, SitePageHeader } from "@/components/site";

export const metadata = createMetadata({
  title: "Sitegeist (Fork)",
  description:
    "Maintained fork of Mario Zechner's (badlogic) AI assistant that lives in your browser sidebar. Automate repetitive tasks, extract data, and execute workflows.",
  path: "/tools/sitegeist-fork",
  image: "/images/tools/sitegeist.webp",
});

const toolTitle = "Sitegeist (Fork)";
const screenshot = "/images/tools/sitegeist.webp";
const githubForkUrl = "https://github.com/testy-cool/sitegeist";
const upstreamRepoUrl = "https://github.com/badlogic/sitegeist";
const upstreamSiteUrl = "https://sitegeist.ai";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Sitegeist (Fork)",
  description:
    "Maintained fork of Mario Zechner's (badlogic) AI browser sidebar. Automate repetitive tasks, extract data, and execute workflows with human-in-the-loop control.",
  url: "https://testy.cool/tools/sitegeist-fork",
  applicationCategory: "BrowserExtension",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function SitegeistForkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SitePageHeader
        title={toolTitle}
        description="Maintained fork of Mario Zechner's (badlogic) AI browser sidebar. Built for pragmatic collaboration rather than autonomy theater."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: toolTitle },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <MetaPill>Maintained Fork</MetaPill>
          <MetaPill>Original: @badlogic</MetaPill>
          <MetaPill>Manifest V3</MetaPill>
        </div>
      </SitePageHeader>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left">
        <div className="grid gap-y-6 sm:grid-cols-12 sm:gap-x-6 md:gap-x-10 items-center">
          <div className="sm:col-span-7">
            <div className="aspect-[16/9] overflow-clip rounded-lg border border-border">
              <img
                src={screenshot}
                alt="Sitegeist AI browser sidebar preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="sm:col-span-5">
            <div className="rounded-xl border border-fd-border/80 bg-fd-muted/50 p-4 mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-fd-primary mb-1">
                Notice: Maintained Fork
              </p>
              <p className="text-xs text-fd-muted-foreground leading-relaxed">
                This project is a personal fork of{" "}
                <a
                  href={upstreamRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-fd-foreground underline hover:text-fd-primary"
                >
                  badlogic/sitegeist
                </a>{" "}
                by Mario Zechner. The upstream project is currently dormant, so
                this fork updates the core to modern{" "}
                <code className="rounded bg-fd-background px-1 py-0.5 font-mono text-xs">
                  pi-agent-core 0.84
                </code>{" "}
                and maintains browser automation workflows for research sessions.
              </p>
            </div>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              An AI assistant that lives in your browser sidebar. Built for
              pragmatic collaboration rather than autonomy theater: you guide
              the steps, it executes repetitive tasks, inspects web pages, and
              extracts structured data.
            </p>
            <ul className="mt-4 list-disc pl-5 text-muted-foreground space-y-1.5 text-sm sm:text-base">
              <li>Works across any website through a Chrome/Edge side panel</li>
              <li>
                Automates form filling, multi-page data extraction, and research
              </li>
              <li>
                BYO API key or login via Claude, ChatGPT, or GitHub Copilot
              </li>
              <li>
                Maintained fork updated to pi-agent-core 0.84
              </li>
              <li>
                Zero telemetry: all credentials and session data stay local
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={githubForkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm sm:text-base font-semibold text-fd-primary hover:underline"
              >
                GitHub Fork: testy-cool/sitegeist →
              </a>
              <a
                href={upstreamRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs sm:text-sm font-medium text-fd-muted-foreground hover:underline"
              >
                Original Upstream Repo: badlogic/sitegeist ↗
              </a>
              <a
                href={upstreamSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs sm:text-sm font-medium text-fd-muted-foreground hover:underline"
              >
                Original Project Website: sitegeist.ai ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
