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
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            This calculator compares API pricing across 30+ large language models
            from Anthropic, OpenAI, Google, and Zhipu AI. It covers input tokens,
            output tokens, prompt caching discounts, and reasoning token costs -
            all the variables that affect your actual bill.
          </p>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            There are three modes. <strong>Calculate cost</strong> shows per-call
            and total costs for a given workload, with presets for common
            scenarios like chatbots, RAG pipelines, batch processing, and code
            generation. <strong>Set budget</strong> flips the question - enter a
            dollar amount and see how many API calls each model can handle.{" "}
            <strong>Chain</strong> models multi-turn conversations where context
            accumulates, showing how prompt caching affects cost as conversations
            grow.
          </p>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            All settings are saved in the URL, so you can bookmark a
            configuration or share it with your team.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Supported models
          </h2>

          <h3 className="text-lg font-medium mb-2 mt-6 text-fd-foreground">
            Anthropic
          </h3>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            Claude Opus 4.6, Claude Sonnet 4.6, and Claude Haiku 4.5. Input
            pricing ranges from $1 to $5 per million tokens, output from $5 to
            $25. All three have 200K context windows and support prompt caching
            at 90% discount. Opus and Sonnet support extended thinking.
          </p>

          <h3 className="text-lg font-medium mb-2 mt-6 text-fd-foreground">
            OpenAI
          </h3>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            The GPT-5 series (5.4, 5.2, 5.1, 5, 5-mini, 5-nano), GPT-4.1
            (4.1, 4.1-mini, 4.1-nano), GPT-4o and 4o-mini, plus the reasoning
            models o3-pro, o3, and o4-mini. Input ranges from $0.05/MTok
            (GPT-5-nano) to $20/MTok (o3-pro). Context windows go up to 1.05M
            tokens on GPT-5.4.
          </p>

          <h3 className="text-lg font-medium mb-2 mt-6 text-fd-foreground">
            Google
          </h3>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            Gemini 3.1 Pro Preview, 3.1 Flash-Lite Preview, 3 Flash Preview,
            2.5 Pro, 2.5 Flash, 2.5 Flash-Lite, and 2.0 Flash. All have 1M
            token context windows. Input starts at $0.10/MTok. Gemini models
            support multimodal input - text, images, audio, video, and PDF.
          </p>

          <h3 className="text-lg font-medium mb-2 mt-6 text-fd-foreground">
            Zhipu AI
          </h3>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            GLM-5, GLM-5-Code, GLM-4.7, GLM-4.7-FlashX, GLM-4.5, and
            GLM-4.5-X. Text-only models with competitive pricing - GLM-4.7-FlashX
            starts at $0.07/MTok input. Context windows range from 128K to 200K
            tokens.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            How LLM API pricing works
          </h2>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            LLM APIs charge per token, where one token is roughly 0.75 English
            words. Input and output tokens are priced separately, with output
            typically costing 3-5x more than input. This asymmetry matters - a
            task that generates long responses costs significantly more than one
            that processes long inputs.
          </p>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            <strong>Prompt caching</strong> lets you reuse previously sent input
            (like system prompts or few-shot examples) at a steep discount -
            often 75-90% off the standard input rate. If your application sends
            the same prefix on every call, caching is the single biggest cost
            lever you have.
          </p>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            <strong>Reasoning tokens</strong> are internal &quot;thinking&quot;
            tokens generated by models like Claude Opus, o3, and Gemini 2.5 Pro.
            They&apos;re billed at output rates and can add substantially to the
            cost of complex tasks. Not every call triggers reasoning - simpler
            queries use fewer or no reasoning tokens.
          </p>
          <p className="text-sm leading-relaxed text-fd-muted-foreground mb-4">
            In <strong>multi-turn conversations</strong>, each API call sends the
            full conversation history as input. This means input costs grow with
            every turn. The Chain mode in this calculator models that
            accumulation, so you can see how a 10-turn conversation costs
            meaningfully more than 10 independent calls.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Tips for reducing API costs
          </h2>
          <ul className="text-sm text-fd-muted-foreground list-disc pl-5 space-y-2 mb-4">
            <li>
              <strong>Use prompt caching</strong> for repeated prefixes - system
              prompts, few-shot examples, and shared context. This alone can cut
              input costs by 75-90%.
            </li>
            <li>
              <strong>Pick the smallest model that works.</strong> GPT-5-nano at
              $0.05/MTok or Gemini 2.0 Flash at $0.10/MTok handle classification,
              extraction, and simple generation just fine.
            </li>
            <li>
              <strong>Set max output tokens</strong> to avoid paying for verbose
              responses you don&apos;t need.
            </li>
            <li>
              <strong>Batch similar requests</strong> to maximize cache hit rates
              across calls.
            </li>
            <li>
              <strong>Use Budget mode</strong> to find your break-even model
              before committing to a provider.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
