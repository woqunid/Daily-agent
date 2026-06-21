import { formatDateFileName, getYesterdayRange } from "@/lib/date";
import { generateLocalCategories } from "@/lib/localCategorizer";
import { fetchArticlesForRange } from "@/lib/rss";
import type { DailyReport, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const encoder = new TextEncoder();

export async function POST(): Promise<Response> {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      await runDailyJob(controller);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function runDailyJob(controller: ReadableStreamDefaultController): Promise<void> {
  try {
    const range = getYesterdayRange(new Date());
    writeEvent(controller, { type: "status", message: "正在抓取信息源", progress: 15 });

    const { articles, failures } = await fetchArticlesForRange(range);
    failures.forEach((failure) => writeEvent(controller, { type: "source-error", ...failure }));

    writeEvent(controller, {
      type: "status",
      message: `抓取完成，获得 ${articles.length} 篇文章，正在分类`,
      progress: 55,
    });

    assertArticlesAvailable(articles.length);
    const categories = generateLocalCategories(articles);

    writeEvent(controller, { type: "status", message: "正在生成日报", progress: 90 });
    writeEvent(controller, {
      type: "complete",
      report: buildReport(range.start, categories, failures),
    });
  } catch (error) {
    writeEvent(controller, {
      type: "error",
      message: error instanceof Error ? error.message : "未知错误",
    });
  }
}

function assertArticlesAvailable(articleCount: number): void {
  if (articleCount > 0) {
    return;
  }

  throw new Error("信息源抓取结果为空，无法生成包含四个分类的日报");
}

function buildReport(
  date: Date,
  categories: DailyReport["categories"],
  skippedSources: DailyReport["skippedSources"],
): DailyReport {
  return {
    date: formatDateFileName(date),
    categories,
    skippedSources,
  };
}

function writeEvent(
  controller: ReadableStreamDefaultController,
  event: StreamEvent,
): void {
  controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}
