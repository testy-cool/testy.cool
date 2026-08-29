import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { SitePageHeader } from "@/components/site";

export const metadata = {
  title: "Page not found",
};

const places = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/tools", label: "Tools" },
];

export default function NotFound() {
  return (
    <SiteShell>
      <SitePageHeader
        title="Page not found"
        description="That URL does not exist here. It may have moved when the site was rebuilt."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "404" }]}
      />
      <section className="container px-4 py-8 lg:px-6 lg:py-12">
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
          {places.map((place) => (
            <li key={place.href}>
              <Link
                href={place.href}
                className="inline-flex items-center gap-2 text-fd-primary transition-colors hover:text-fd-primary/80"
              >
                {place.label}
                <ArrowRight className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SiteShell>
  );
}
