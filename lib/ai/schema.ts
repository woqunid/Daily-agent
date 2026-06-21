import { CATEGORY_NAMES, MAX_ITEMS_PER_CATEGORY } from "@/lib/constants";
import type { DailyCategory, DailyItem } from "@/lib/types";

type RawAiReport = Readonly<{
  categories?: unknown;
}>;

const TYPE_TAGS = ["产品发布", "教程/实践"] as const;
const IMPORTANCE_LEVELS = ["重大事件", "一般动态"] as const;

export function parseDailyCategories(content: string): readonly DailyCategory[] {
  const parsed = parseJson(content) as RawAiReport;

  if (!Array.isArray(parsed.categories)) {
    throw new Error("AI 返回内容缺少 categories 数组");
  }

  return orderCategories(parsed.categories.map(parseCategory));
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(stripCodeFence(content));
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知 JSON 错误";
    throw new Error(`AI 返回内容不是合法 JSON：${message}`);
  }
}

function parseCategory(value: unknown): DailyCategory {
  const record = assertRecord(value, "分类项必须是对象");
  const name = parseEnum(record.name, CATEGORY_NAMES, "分类名称非法");

  if (!Array.isArray(record.items)) {
    throw new Error(`分类 ${name} 缺少 items 数组`);
  }

  return {
    name,
    items: record.items.slice(0, MAX_ITEMS_PER_CATEGORY).map(parseItem),
  };
}

function parseItem(value: unknown): DailyItem {
  const record = assertRecord(value, "日报条目必须是对象");

  return {
    title: parseRequiredString(record.title, "条目缺少 title"),
    summary: parseRequiredString(record.summary, "条目缺少 summary"),
    link: parseRequiredString(record.link, "条目缺少 link"),
    source: parseRequiredString(record.source, "条目缺少 source"),
    typeTag: parseEnum(record.typeTag, TYPE_TAGS, "typeTag 非法"),
    importance: parseEnum(record.importance, IMPORTANCE_LEVELS, "importance 非法"),
  };
}

function orderCategories(categories: readonly DailyCategory[]): readonly DailyCategory[] {
  const categoryByName = new Map<string, DailyCategory>();

  categories.forEach((category) => {
    if (categoryByName.has(category.name)) {
      throw new Error(`AI 返回重复分类：${category.name}`);
    }

    categoryByName.set(category.name, category);
  });

  return CATEGORY_NAMES.map((name) => {
    const category = categoryByName.get(name);

    if (!category) {
      throw new Error(`AI 返回内容缺少分类：${name}`);
    }

    return category;
  });
}

function parseRequiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
}

function parseEnum<T extends string>(
  value: unknown,
  choices: readonly T[],
  message: string,
): T {
  if (typeof value === "string" && choices.includes(value as T)) {
    return value as T;
  }

  throw new Error(message);
}

function assertRecord(
  value: unknown,
  message: string,
): Readonly<Record<string, unknown>> {
  if (typeof value === "object" && value !== null) {
    return value as Readonly<Record<string, unknown>>;
  }

  throw new Error(message);
}

function stripCodeFence(content: string): string {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}
