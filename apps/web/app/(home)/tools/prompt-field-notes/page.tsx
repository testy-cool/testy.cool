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
import { PromptFieldNotes } from "@/components/tools/PromptFieldNotes";
import { createMetadata } from "@/lib/metadata";

const description =
  "Context-specific prompting observations. What worked, when it applies, and why. Copy as markdown or XML.";

export const metadata = createMetadata({
  title: "Prompt Field Notes",
  description,
  openGraph: {
    title: "Prompt Field Notes | testy.cool",
    description,
  },
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
                <BreadcrumbLink asChild>
                  <Link href="/tools">Tools</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Prompt Field Notes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DocsTitle>Prompt Field Notes</DocsTitle>
          <DocsDescription className="mt-2">
            Things I figured out about prompting in specific situations. Not
            universal rules - each one has a context where it applies.
          </DocsDescription>
        </div>
      </section>

      <section className="container px-4 py-8 lg:px-6">
        <PromptFieldNotes />
      </section>
    </>
  );
}
