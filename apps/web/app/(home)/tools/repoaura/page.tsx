import { createMetadata } from "@/lib/metadata";
import { SitePageHeader } from "@/components/site";

export const metadata = createMetadata({
  title: "RepoAura",
  description:
    "Chrome extension that adds GitHub repository health context and signal overlays beside repository links.",
  path: "/tools/repoaura",
  image: "/images/tools/repoaura.webp",
});

const toolTitle = "RepoAura";
const screenshot = "/images/tools/repoaura.webp";
const githubUrl = "https://github.com/testy-cool/repoaura";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RepoAura",
  description:
    "Chrome extension that adds GitHub repository health context and signal overlays beside repository links.",
  url: "https://testy.cool/tools/repoaura",
  applicationCategory: "BrowserExtension",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function RepoAuraPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SitePageHeader
        title={toolTitle}
        description="Chrome extension that adds GitHub repository health context beside repository links."
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
                alt="RepoAura repository health preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="sm:col-span-5">
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Adds a clean, non-intrusive repository health pill right beside
              GitHub links you are reading, answering key questions at a glance
              without page takeovers.
            </p>
            <ul className="mt-4 list-disc pl-5 text-muted-foreground space-y-1.5 text-sm sm:text-base">
              <li>
                In-line stars, recent push timestamps, and activity badges
              </li>
              <li>On-demand detail card for issues, license, and languages</li>
              <li>Non-intrusive styling that adapts to the host website</li>
              <li>Granular per-domain enable/disable controls</li>
              <li>Lightweight Manifest V3 extension built with WXT</li>
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm sm:text-base font-semibold text-fd-primary hover:underline"
              >
                GitHub repository
              </a>
              <a
                href={`${githubUrl}/releases/latest`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm sm:text-base font-semibold hover:underline"
              >
                Download latest release (.zip)
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
