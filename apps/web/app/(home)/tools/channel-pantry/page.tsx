import Link from "next/link";
import type { Metadata } from "next";
import PantryApp from "@/components/tools/channel-pantry/PantryApp";

const description =
  "See what ingredients a YouTube cooking channel actually uses.";

export const metadata: Metadata = {
  title: "Channel Pantry",
  description,
  openGraph: {
    title: "Channel Pantry | testy.cool",
    description,
  },
};

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
      <div className="min-h-screen">
      <section className="max-w-3xl lg:max-w-4xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-fd-muted-foreground/60 mb-8">
          <Link href="/" className="hover:text-fd-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-fd-foreground transition-colors">Tools</Link>
          <span>/</span>
          <span className="text-fd-muted-foreground">Channel Pantry</span>
        </nav>

        {/* Hero */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-fd-foreground tracking-tight">
          Channel Pantry
        </h1>
        <p className="mt-3 text-base sm:text-lg text-fd-muted-foreground max-w-lg">
          See what ingredients a YouTube cooking channel actually uses.
        </p>

        {/* App */}
        <div className="mt-8 sm:mt-10">
          <PantryApp />
        </div>
      </section>
    </div>
    </>
  );
}
