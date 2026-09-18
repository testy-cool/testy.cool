import { SitePageHeader } from "@/components/site";
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
  path: "/tools/llm-price-calculator",
  image: "/tools-og/llm-price-calculator/image.png",
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

      <SitePageHeader
        title="LLM Price Calculator"
        description={description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "LLM Price Calculator" },
        ]}
      />

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <LlmPriceCalculator />
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-3 text-fd-foreground">
            What this calculator does
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            This calculator compares live API pricing across 200+ large language
            models from Anthropic, OpenAI, Google, DeepSeek, xAI, Mistral, Meta,
            Qwen, and Zhipu AI. It covers input tokens, output tokens, prompt
            caching discounts, and reasoning token costs - all the variables
            that affect your actual bill.
          </p>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            There are three modes. <strong>Calculate cost</strong> shows
            per-call and total costs for a given workload, with presets for
            common scenarios. <strong>Set budget</strong> flips the question -
            enter a dollar amount and see how many API calls each model can
            handle. <strong>Chain</strong> models multi-turn conversations where
            context accumulates. All settings are saved in the URL for
            bookmarking and sharing.
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
            Input and output tokens are priced separately. Output typically
            costs 3-5x more - a task generating long responses is significantly
            more expensive than one processing long inputs.
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
            Pricing is pulled live from OpenRouter across 200+ models from
            Anthropic, OpenAI, Google, DeepSeek, xAI, Mistral, Meta, Qwen, and
            Zhipu AI, with automatic background revalidation. All calculator
            settings save to the URL - bookmark a comparison or share it with
            your team.
          </p>
        </div>
      </section>
    </>
  );
}
