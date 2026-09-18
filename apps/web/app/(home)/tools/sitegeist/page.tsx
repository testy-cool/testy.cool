import { createMetadata } from "@/lib/metadata";
import { SitePageHeader } from "@/components/site";

export const metadata = createMetadata({
  title: "Sitegeist",
  description:
    "AI assistant that lives in your browser sidebar. Automate repetitive tasks, extract data, and execute workflows with human-in-the-loop control.",
  path: "/tools/sitegeist",
  image: "/images/tools/sitegeist.webp",
});

const toolTitle = "Sitegeist";
const screenshot = "/images/tools/sitegeist.webp";
const githubUrl = "https://github.com/testy-cool/sitegeist";
const upstreamSiteUrl = "https://sitegeist.ai";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Sitegeist",
  description:
    "AI assistant that lives in your browser sidebar. Automate repetitive tasks, extract data, and execute workflows with human-in-the-loop control.",
  url: "https://testy.cool/tools/sitegeist",
  applicationCategory: "BrowserExtension",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function SitegeistPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SitePageHeader
        title={toolTitle}
        description="An AI assistant that lives in your browser sidebar. Built for collaboration, not autonomy theater."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: toolTitle },
        ]}
      />

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
                Maintained fork of badlogic/sitegeist on modern pi-agent-core
                0.84
              </li>
              <li>
                Zero telemetry: all credentials and session data stay local
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm sm:text-base font-semibold text-fd-primary hover:underline"
              >
                GitHub repository (testy-cool/sitegeist)
              </a>
              <a
                href={upstreamSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm sm:text-base font-semibold hover:underline"
              >
                Upstream project (sitegeist.ai)
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
