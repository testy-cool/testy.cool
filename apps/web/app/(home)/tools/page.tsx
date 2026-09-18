import { createMetadata } from "@/lib/metadata";
import { allTools, getToolUrl } from "@/lib/tools";
import { MetaPill, SitePageHeader } from "@/components/site";
import { ToolsDirectory } from "@/components/tools/ToolsDirectory";

export const metadata = createMetadata({
  title: "Tools",
  description:
    "Curated workbenches, interactive calculators, browser extensions, and technical tutorials.",
  path: "/tools",
  image: "/tools-og/index/image.png",
});

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
    "Curated workbenches, interactive calculators, browser extensions, and technical tutorials.",
  url: "https://testy.cool/tools",
  itemListElement: allTools.map((tool, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: tool.title,
    url: `https://testy.cool${getToolUrl(tool)}`,
  })),
};

export default function ToolsIndex() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SitePageHeader
        title={pageTitle}
        description="Curated workbenches, interactive calculators, browser extensions, and technical tutorials."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: pageTitle }]}
      >
        <div className="flex flex-wrap gap-2">
          <MetaPill>{toolCount} workbenches</MetaPill>
          <MetaPill>{extensionCount} extensions</MetaPill>
          <MetaPill>{tutorialCount} tutorial</MetaPill>
        </div>
      </SitePageHeader>
      <section className="container px-4 py-8 lg:px-6 lg:py-12">
        <ToolsDirectory tools={allTools} />
      </section>
    </>
  );
}
