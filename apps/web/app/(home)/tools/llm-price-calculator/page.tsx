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
import { LlmPriceCalculator } from "@/components/tools/LlmPriceCalculator";

export const metadata: Metadata = {
  title: "LLM Price Calculator",
  description:
    "Calculator for checking API costs across Claude, GPT, and Gemini, including prompt caching.",
  openGraph: {
    title: "LLM Price Calculator | testy.cool",
    description:
      "Calculator for checking API costs across Claude, GPT, and Gemini, including prompt caching.",
  },
};

export default function LlmPriceCalculatorPage() {
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
                <BreadcrumbPage>LLM Price Calculator</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DocsTitle className="dark:text-white">
            LLM Price Calculator
          </DocsTitle>
          <DocsDescription className="mt-3 dark:text-gray-300 mb-0">
            Calculator for checking API costs across Claude, GPT, and Gemini,
            including prompt caching.
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <LlmPriceCalculator />
      </section>
    </>
  );
}
