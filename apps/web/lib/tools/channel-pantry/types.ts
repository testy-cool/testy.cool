export interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
}

export interface ExtractedIngredient {
  name: string;
  category: FoodCategory;
  quantity?: string;
}

export type FoodCategory =
  | 'Proteins'
  | 'Dairy & Eggs'
  | 'Vegetables'
  | 'Fruits'
  | 'Grains & Starches'
  | 'Spices & Seasonings'
  | 'Oils & Fats'
  | 'Sauces & Condiments'
  | 'Other';

export const FOOD_CATEGORIES: { name: FoodCategory; emoji: string }[] = [
  { name: 'Proteins', emoji: '🥩' },
  { name: 'Dairy & Eggs', emoji: '🥛' },
  { name: 'Vegetables', emoji: '🥬' },
  { name: 'Fruits', emoji: '🍎' },
  { name: 'Grains & Starches', emoji: '🌾' },
  { name: 'Spices & Seasonings', emoji: '🧂' },
  { name: 'Oils & Fats', emoji: '🫒' },
  { name: 'Sauces & Condiments', emoji: '🫙' },
  { name: 'Other', emoji: '📦' },
];

export type VideoExtractionStatus =
  | 'pending'
  | 'extracting_description'
  | 'fetching_transcript'
  | 'extracting_transcript'
  | 'done'
  | 'skipped'
  | 'error';

export interface VideoProgress {
  videoId: string;
  title: string;
  publishedAt?: string;
  status: VideoExtractionStatus;
  tier?: 'description' | 'transcript' | 'skipped';
  ingredients: ExtractedIngredient[];
}

export interface IngredientFrequency {
  name: string;
  category: FoodCategory;
  count: number;
  videoIds: string[];
  quantities?: string[];
}

export interface ChannelAnalysisResult {
  channelId: string;
  channelTitle: string;
  videoCount: number;
  videosAnalyzed: number;
  videosWithIngredients: number;
  ingredients: IngredientFrequency[];
  totalCost: number;
  elapsedMs: number;
  timestamp: number;
}

export interface CostAccumulator {
  promptTokens: number;
  outputTokens: number;
  totalCost: number;
}
