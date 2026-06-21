import type { DailyCategory } from "@/lib/types";

export const RSS_SOURCES = [
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/" },
  { name: "机器之心", url: "https://www.jiqizhixin.com/rss" },
  { name: "量子位", url: "https://www.qbitai.com/feed" },
  { name: "36kr", url: "https://36kr.com/feed" },
] as const;

export const CATEGORY_NAMES = [
  "大模型",
  "图像生成",
  "AI 编程",
  "AI 软件技术及知识",
] as const satisfies readonly DailyCategory["name"][];

export const MAX_ITEMS_PER_CATEGORY = 15;
export const ARTICLE_CONTENT_LIMIT = 1800;
export const AI_INPUT_ARTICLE_LIMIT = 40;
export const AI_CATEGORY_SEED_LIMIT = 6;
export const SUPPLEMENT_SUMMARY_LIMIT = 180;
export const FETCH_TIMEOUT_MS = 12000;
export const FETCH_RETRY_COUNT = 2;
export const FETCH_RETRY_DELAY_MS = 800;
export const AI_MAX_OUTPUT_TOKENS = 4096;
export const ONE_DAY_MS = 86_400_000;
