import {
  AI_CATEGORY_SEED_LIMIT,
  AI_INPUT_ARTICLE_LIMIT,
  CATEGORY_NAMES,
  MAX_ITEMS_PER_CATEGORY,
  MIN_ITEMS_PER_CATEGORY,
} from "@/lib/constants";
import { scoreArticleForCategory } from "@/lib/categoryRules";
import type { Article } from "@/lib/types";

export function buildDailyPrompt(articles: readonly Article[], dateLabel: string): string {
  const promptArticles = selectPromptArticles(articles);
  const payload = promptArticles.map((article, index) => ({
    id: index + 1,
    title: article.title,
    source: article.source,
    link: article.link,
    publishedAt: article.publishedAt,
    content: article.content,
  }));

  return [
    `你是 AI 行业日报编辑，请基于以下 ${dateLabel} 发布的文章生成中文日报。`,
    "必须去重：同一事件来自多个来源时保留信息量最高的一条。",
    `必须按固定顺序返回这 ${CATEGORY_NAMES.length} 个分类：${CATEGORY_NAMES.join("、")}。`,
    `每个分类都必须出现，并且每个分类的 items 至少包含 ${MIN_ITEMS_PER_CATEGORY} 条真实文章。`,
    `每个分类最多 ${MAX_ITEMS_PER_CATEGORY} 条。`,
    "每条摘要用 3-5 句中文概括核心内容。",
    "typeTag 只能是：产品发布、教程/实践。",
    "importance 只能是：重大事件、一般动态。",
    "只返回严格 JSON，不要 Markdown，不要解释。",
    "JSON 结构：",
    '{"categories":[{"name":"大模型","items":[{"title":"中文标题","summary":"中文摘要","link":"原文链接","source":"来源","typeTag":"产品发布","importance":"一般动态"}]}]}',
    "文章列表：",
    JSON.stringify(payload),
  ].join("\n");
}

function selectPromptArticles(articles: readonly Article[]): readonly Article[] {
  const seededArticles = CATEGORY_NAMES.flatMap((categoryName) => {
    return articles
      .map((article) => ({
        article,
        score: scoreArticleForCategory(article, categoryName),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, AI_CATEGORY_SEED_LIMIT)
      .map((candidate) => candidate.article);
  });

  return uniqueArticles([...seededArticles, ...articles]).slice(0, AI_INPUT_ARTICLE_LIMIT);
}

function uniqueArticles(articles: readonly Article[]): readonly Article[] {
  const seenLinks = new Set<string>();

  return articles.filter((article) => {
    if (seenLinks.has(article.link)) {
      return false;
    }

    seenLinks.add(article.link);
    return true;
  });
}
