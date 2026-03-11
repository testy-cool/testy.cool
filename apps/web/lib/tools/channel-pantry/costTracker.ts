import type { CostAccumulator } from './types';

const INPUT_COST_PER_M = 0.15;
const OUTPUT_COST_PER_M = 0.60;

export function createCostTracker(): {
  track: (promptTokens: number, outputTokens: number) => void;
  get: () => CostAccumulator;
} {
  let acc: CostAccumulator = { promptTokens: 0, outputTokens: 0, totalCost: 0 };

  return {
    track(promptTokens: number, outputTokens: number) {
      acc.promptTokens += promptTokens;
      acc.outputTokens += outputTokens;
      acc.totalCost =
        (acc.promptTokens / 1_000_000) * INPUT_COST_PER_M +
        (acc.outputTokens / 1_000_000) * OUTPUT_COST_PER_M;
    },
    get() {
      return { ...acc };
    },
  };
}

export function trackGeminiResponse(
  tracker: ReturnType<typeof createCostTracker>,
  response: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }
) {
  const prompt = response.usageMetadata?.promptTokenCount ?? 0;
  const output = response.usageMetadata?.candidatesTokenCount ?? 0;
  tracker.track(prompt, output);
}
