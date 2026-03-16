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
import { LlmPriceCalculator } from "@/components/tools/LlmPriceCalculator";
import {
  TokenExplainer,
  InputOutputCompare,
  CachingImpact,
  ChainCostPreview,
} from "@/components/tools/LlmPricingExplainers";
import { createMetadata } from "@/lib/metadata";

const description =
  "Compare LLM API pricing across Claude, GPT, Gemini, and GLM. Calculate per-call costs, set budgets, and estimate multi-turn chain costs with prompt caching.";

export const metadata = createMetadata({
  title: "LLM Price Calculator",
  description,
  openGraph: {
    title: "LLM Price Calculator | testy.cool",
    description,
  },
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LLM Price Calculator",
  description,
  url: "https://testy.cool/tools/llm-price-calculator",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function LlmPriceCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            {description}
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <LlmPriceCalculator />
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-semibold mb-3 text-fd-foreground">
            What this calculator does
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            This calculator compares API pricing across 30+ large language models
            from Anthropic, OpenAI, Google, and Zhipu AI. It covers input tokens,
            output tokens, prompt caching discounts, and reasoning token costs -
            all the variables that affect your actual bill.
          </p>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            There are three modes. <strong>Calculate cost</strong> shows per-call
            and total costs for a given workload, with presets for common
            scenarios. <strong>Set budget</strong> flips the question - enter a
            dollar amount and see how many API calls each model can handle.{" "}
            <strong>Chain</strong> models multi-turn conversations where context
            accumulates. All settings are saved in the URL for bookmarking and
            sharing.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            How LLM API pricing works
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            LLM APIs charge per token - roughly 0.75 English words each. Type
            something below to see tokens in action.
          </p>
          <TokenExplainer />

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Input vs. output cost
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            Input and output tokens are priced separately. Output typically costs
            3-5x more - a task generating long responses is significantly more
            expensive than one processing long inputs.
          </p>
          <InputOutputCompare />

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Prompt caching
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            If your application sends the same prefix on every call (system
            prompts, few-shot examples), caching lets you reuse it at 75-90%
            off. It&apos;s the single biggest cost lever for most applications.
          </p>
          <CachingImpact />

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Multi-turn conversations
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            Each API call sends the full conversation history as input, so costs
            grow with every turn. This is why a 10-turn conversation costs more
            than 10 independent calls.
          </p>
          <ChainCostPreview />

          <p className="text-base leading-relaxed text-fd-muted-foreground mt-10">
            Pricing is pulled from OpenRouter across 30+ models from Anthropic,
            OpenAI, Google, and Zhipu AI, and updated regularly. All calculator
            settings save to the URL - bookmark a comparison or share it with
            your team.
          </p>
        </div>
      </section>
    </>
  );
}
