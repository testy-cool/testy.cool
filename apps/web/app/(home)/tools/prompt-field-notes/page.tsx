import { SitePageHeader } from "@/components/site";
import { PromptFieldNotes } from "@/components/tools/PromptFieldNotes";
import { createMetadata } from "@/lib/metadata";

const description =
  "Context-specific prompting observations. What worked, when it applies, and why. Copy as markdown or XML.";

export const metadata = createMetadata({
  title: "Prompt Field Notes",
  description,
  path: "/tools/prompt-field-notes",
  image: "/tools-og/prompt-field-notes/image.png",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Prompt Field Notes",
  description,
  url: "https://testy.cool/tools/prompt-field-notes",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function PromptFieldNotesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SitePageHeader
        title="Prompt Field Notes"
        description="Things I figured out about prompting in specific situations. Not universal rules - each one has a context where it applies."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "Prompt Field Notes" },
        ]}
      />

      <section className="container px-4 py-8 lg:px-6">
        <PromptFieldNotes />
      </section>
    </>
  );
}
