import Link from "next/link";
import { DocsDescription, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/shadverse/components/breadcrumb";
import PantryApp from "@/components/tools/channel-pantry/PantryApp";

export const metadata: Metadata = {
  title: "Channel Pantry",
  description:
    "Analyze a YouTube cooking channel to see what ingredients they use most.",
  openGraph: {
    title: "Channel Pantry | testy.cool",
    description:
      "Analyze a YouTube cooking channel to see what ingredients they use most.",
  },
};

export default function ChannelPantryPage() {
  return (
    <>
      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left bg-zinc-50/50 dark:bg-zinc-900/50">
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
                <BreadcrumbPage>Channel Pantry</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DocsTitle className="dark:text-white">
            Channel Pantry
          </DocsTitle>
          <DocsDescription className="mt-3 dark:text-gray-300 mb-0">
            Analyze a YouTube cooking channel to see what ingredients they use most.
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <PantryApp />
      </section>
    </>
  );
}
