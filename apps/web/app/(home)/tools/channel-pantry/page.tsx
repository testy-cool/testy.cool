import { createMetadata } from "@/lib/metadata";
import { SitePageHeader } from "@/components/site";
import PantryApp from "@/components/tools/channel-pantry/PantryApp";

const description =
  "See what ingredients a YouTube cooking channel actually uses.";

export const metadata = createMetadata({
  title: "Channel Pantry",
  description,
  path: "/tools/channel-pantry",
  image: "/tools-og/channel-pantry/image.png",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Channel Pantry",
  description,
  url: "https://testy.cool/tools/channel-pantry",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function ChannelPantryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SitePageHeader
        title="Channel Pantry"
        description={description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "Channel Pantry" },
        ]}
      />
      <section className="container px-4 py-8 lg:px-6 lg:py-12">
        <div className="mx-auto max-w-4xl">
          <PantryApp />
        </div>
      </section>
    </>
  );
}
