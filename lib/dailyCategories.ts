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
const EMPTY_CONTENT_ERROR =
  "信息源抓取结果为空，无法保证四个分类都有真实内容";

export function ensureCategoryCoverage(
  categories: readonly DailyCategory[],
  articles: readonly Article[],
): readonly DailyCategory[] {
  if (articles.length === 0) {
    throw new Error(EMPTY_CONTENT_ERROR);
  }

  const usedLinks = collectUsedLinks(categories);
  const orderedCategories = orderKnownCategories(categories);

  return orderedCategories.map((category) => {
    if (category.items.length >= MIN_ITEMS_PER_CATEGORY) {
      return limitCategoryItems(category);
    }

    const existingItems = category.items.slice(0, MAX_ITEMS_PER_CATEGORY);
    const supplements = selectSupplementArticles({
      articles,
      categoryName: category.name,
      usedLinks,
      count: MIN_ITEMS_PER_CATEGORY - existingItems.length,
    });
    supplements.forEach((article) => usedLinks.add(article.link));

    return {
      name: category.name,
      items: [
        ...existingItems,
        ...supplements.map(buildSupplementItem),
      ],
    };
  });
}

function orderKnownCategories(
  categories: readonly DailyCategory[],
): readonly DailyCategory[] {
  const byName = new Map(categories.map((category) => [category.name, category]));

  return CATEGORY_NAMES.map((name) => byName.get(name) ?? { name, items: [] });
}

function limitCategoryItems(category: DailyCategory): DailyCategory {
  return {
    name: category.name,
    items: category.items.slice(0, MAX_ITEMS_PER_CATEGORY),
  };
}

function collectUsedLinks(categories: readonly DailyCategory[]): Set<string> {
  return new Set(categories.flatMap((category) => category.items.map((item) => item.link)));
}

type SupplementSelection = Readonly<{
  articles: readonly Article[];
  categoryName: DailyCategory["name"];
  usedLinks: ReadonlySet<string>;
  count: number;
}>;

function selectSupplementArticles(config: SupplementSelection): readonly Article[] {
  if (config.count <= 0) {
    return [];
  }

  const { articles, categoryName, usedLinks } = config;
  const unusedArticles = articles.filter((article) => !usedLinks.has(article.link));
  const candidates = unusedArticles.length > 0 ? unusedArticles : articles;
  const ranked = candidates
    .map((article) => ({
      article,
      score: scoreArticleForCategory(article, categoryName),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  const selected = ranked.slice(0, config.count).map((candidate) => candidate.article);

  if (selected.length < config.count) {
    throw new Error(
      `分类 ${categoryName} 没有足够的真实文章，至少需要 ${MIN_ITEMS_PER_CATEGORY} 条`,
    );
  }

  return selected;
}

function buildSupplementItem(article: Article): DailyItem {
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
  const text = article.content || article.title;
  return truncateText(text, SUPPLEMENT_SUMMARY_LIMIT);
}
