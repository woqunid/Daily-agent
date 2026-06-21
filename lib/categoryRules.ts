import { CATEGORY_NAMES } from "@/lib/constants";
import type { Article, DailyCategory } from "@/lib/types";

type CategoryName = (typeof CATEGORY_NAMES)[number];

const CATEGORY_KEYWORDS: Readonly<Record<CategoryName, readonly string[]>> = {
  大模型: [
    "大模型",
    "模型",
    "语言模型",
    "基础模型",
    "多模态",
    "推理模型",
    "人工智能",
    "生成式",
    "llm",
    "large language model",
    "foundation model",
    "gpt",
    "claude",
    "gemini",
    "llama",
    "qwen",
    "通义千问",
    "deepseek",
    "kimi",
    "智谱",
    "豆包",
    "文心",
    "百川",
    "mistral",
  ],
  图像生成: [
    "图像",
    "图片",
    "视觉",
    "视频",
    "视频生成",
    "文生图",
    "生图",
    "扩散模型",
    "视觉生成",
    "image generation",
    "text-to-image",
    "diffusion",
    "stable diffusion",
    "midjourney",
    "dall-e",
    "sora",
    "veo",
    "imagen",
    "qwen-image",
    "可灵",
    "即梦",
    "混元",
    "flux",
  ],
  "AI 编程": [
    "编程",
    "代码",
    "开发者",
    "程序员",
    "软件工程",
    "代码生成",
    "coding",
    "programming",
    "developer",
    "software engineering",
    "github",
    "copilot",
    "codex",
    "cursor",
    "claude code",
    "ide",
    "api",
    "sdk",
    "开发",
    "开发工具",
    "代码助手",
  ],
  "AI 软件技术及知识": [
    "教程",
    "实践",
    "技术",
    "框架",
    "部署",
    "推理",
    "训练",
    "微调",
    "评测",
    "检索",
    "向量",
    "agent",
    "rag",
    "inference",
    "fine-tuning",
    "benchmark",
    "workflow",
    "embedding",
    "vector",
    "framework",
    "文档",
    "开源",
    "模型部署",
    "模型服务",
    "提示词",
    "知识库",
  ],
};

const TITLE_WEIGHT = 3;
const CONTENT_WEIGHT = 1;

export function scoreArticleForCategory(
  article: Article,
  categoryName: DailyCategory["name"],
): number {
  const keywords = readCategoryKeywords(categoryName);
  const hintScore = article.categoryHint === categoryName ? TITLE_WEIGHT * 2 : 0;
  const title = article.title.toLocaleLowerCase();
  const content = article.content.toLocaleLowerCase();

  return keywords.reduce((score, keyword) => {
    const token = keyword.toLocaleLowerCase();
    const titleScore = title.includes(token) ? TITLE_WEIGHT : 0;
    const contentScore = content.includes(token) ? CONTENT_WEIGHT : 0;

    return score + titleScore + contentScore;
  }, hintScore);
}

export function readCategoryKeywords(
  categoryName: DailyCategory["name"],
): readonly string[] {
  if (isCategoryName(categoryName)) {
    return CATEGORY_KEYWORDS[categoryName];
  }

  return [];
}

function isCategoryName(value: string): value is CategoryName {
  return CATEGORY_NAMES.includes(value as CategoryName);
}
