export type AiProvider = "openai" | "anthropic" | "gemini";

export type Article = Readonly<{
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  content: string;
}>;

export type DailyItem = Readonly<{
  title: string;
  summary: string;
  link: string;
  source: string;
  typeTag: "产品发布" | "教程/实践";
  importance: "重大事件" | "一般动态";
}>;

export type DailyCategory = Readonly<{
  name: string;
  items: readonly DailyItem[];
}>;

export type DailyReport = Readonly<{
  date: string;
  categories: readonly DailyCategory[];
  skippedSources: readonly SourceFailure[];
}>;

export type SourceFailure = Readonly<{
  source: string;
  reason: string;
}>;

export type StreamEvent =
  | Readonly<{ type: "status"; message: string; progress: number }>
  | Readonly<{ type: "source-error"; source: string; reason: string }>
  | Readonly<{ type: "complete"; report: DailyReport }>
  | Readonly<{ type: "error"; message: string }>;
