import {
  CATEGORY_NAMES,
  MAX_ITEMS_PER_CATEGORY,
  MIN_ITEMS_PER_CATEGORY,
  SUPPLEMENT_SUMMARY_LIMIT,
} from "@/lib/constants";
import { scoreArticleForCategory } from "@/lib/categoryRules";
import { truncateText } from "@/lib/text";
import type { Article, DailyCategory, DailyItem } from "@/lib/types";

const DEFAULT_TYPE_TAG: DailyItem["typeTag"] = "产品发布";
const DEFAULT_IMPORTANCE: DailyItem["importance"] = "一般动态";
const SUMMARY_TARGET_LENGTH = 140;

export function generateLocalCategories(
  articles: readonly Article[],
): readonly DailyCategory[] {
  const usedArticleKeys = new Set<string>();

  return CATEGORY_NAMES.map((categoryName) => {
    const items = selectCategoryArticles({
      articles,
      categoryName,
      usedArticleKeys,
    }).map(buildDailyItem);

    return { name: categoryName, items };
  });
}

type CategorySelection = Readonly<{
  articles: readonly Article[];
  categoryName: DailyCategory["name"];
  usedArticleKeys: Set<string>;
}>;

function selectCategoryArticles(config: CategorySelection): readonly Article[] {
  const ranked = rankArticles(config.articles, config.categoryName);
  const selected = takeUnusedArticles(ranked, config.usedArticleKeys);

  if (selected.length < MIN_ITEMS_PER_CATEGORY) {
    throw new Error(
      `分类 ${config.categoryName} 没有足够的真实文章，至少需要 ${MIN_ITEMS_PER_CATEGORY} 条`,
    );
  }

  selected.forEach((article) => config.usedArticleKeys.add(buildArticleKey(article)));
  return selected;
}

function rankArticles(
  articles: readonly Article[],
  categoryName: DailyCategory["name"],
): readonly Article[] {
  return articles
    .map((article) => ({
      article,
      score: scoreArticleForCategory(article, categoryName),
    }))
    .filter((candidate) => isEligibleArticle(candidate.article, categoryName))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((candidate) => candidate.article);
}

function takeUnusedArticles(
  articles: readonly Article[],
  usedArticleKeys: ReadonlySet<string>,
): readonly Article[] {
  return articles
    .filter((article) => !usedArticleKeys.has(buildArticleKey(article)))
    .slice(0, MAX_ITEMS_PER_CATEGORY);
}

function isEligibleArticle(
  article: Article,
  categoryName: DailyCategory["name"],
): boolean {
  return !article.categoryHint || article.categoryHint === categoryName;
}

function buildArticleKey(article: Article): string {
  return `${article.title}\n${article.link}`;
}

function buildDailyItem(article: Article): DailyItem {
  return {
    title: article.title,
    summary: buildSummary(article),
    link: article.link,
    source: article.source,
    typeTag: DEFAULT_TYPE_TAG,
    importance: DEFAULT_IMPORTANCE,
  };
}

function buildSummary(article: Article): string {
  const content = normalizeSummarySource(article.content, article.title);

  return truncateText(content, SUPPLEMENT_SUMMARY_LIMIT);
}

function normalizeSummarySource(content: string, title: string): string {
  const text = content.trim();

  if (!text || text === title) {
    return "当前信息源只提供标题级信息，完整背景、更新范围和技术细节需要进入原文查看。";
  }

  return truncateText(text, SUMMARY_TARGET_LENGTH);
}
