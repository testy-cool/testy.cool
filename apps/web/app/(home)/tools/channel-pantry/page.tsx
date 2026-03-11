import Link from "next/link";
import type { Metadata } from "next";
import PantryApp from "@/components/tools/channel-pantry/PantryApp";

export const metadata: Metadata = {
  title: "Channel Pantry",
  description:
    "See what ingredients a YouTube cooking channel actually uses.",
  openGraph: {
    title: "Channel Pantry | testy.cool",
    description:
      "See what ingredients a YouTube cooking channel actually uses.",
  },
};

export default function ChannelPantryPage() {
  return (
    <div className="min-h-screen">
      <section className="max-w-2xl mx-auto px-5 pt-16 pb-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-fd-muted-foreground/60 mb-8">
          <Link href="/" className="hover:text-fd-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-fd-foreground transition-colors">Tools</Link>
          <span>/</span>
          <span className="text-fd-muted-foreground">Channel Pantry</span>
        </nav>

        {/* Hero */}
        <h1 className="text-4xl md:text-5xl font-bold text-fd-foreground tracking-tight">
          Channel Pantry
        </h1>
        <p className="mt-3 text-lg text-fd-muted-foreground">
          See what ingredients a YouTube cooking channel actually uses.
        </p>

        {/* App */}
        <div className="mt-10">
          <PantryApp />
        </div>
      </section>
    </div>
  );
}
