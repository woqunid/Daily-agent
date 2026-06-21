import type { DailyReport } from "@/lib/types";

export function buildMarkdown(report: DailyReport): string {
  const sections = report.categories.map((category) => {
    const items = category.items.map((item) => {
      return [
        `### ${item.title}`,
        "",
        item.summary,
        "",
        `- 来源：${item.source}`,
        `- 标签：${item.typeTag} / ${item.importance}`,
        `- 原文链接：${item.link}`,
      ].join("\n");
    });

    return [`## ${category.name}`, "", items.join("\n\n")].join("\n");
  });

  return [`# AI 日报 - ${report.date}`, "", sections.join("\n\n")].join("\n");
}
