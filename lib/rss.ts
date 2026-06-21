import { XMLParser } from "fast-xml-parser";
import { ARTICLE_CONTENT_LIMIT, RSS_SOURCES } from "@/lib/constants";
import { isWithinRange } from "@/lib/date";
import { fetchXml } from "@/lib/rssHttp";
import { cleanText, truncateText } from "@/lib/text";
import type { Article, SourceFailure } from "@/lib/types";

type RssSource = (typeof RSS_SOURCES)[number];

type ParsedFeed = Readonly<{
  rss?: Readonly<{ channel?: Readonly<{ item?: unknown }> }>;
  feed?: Readonly<{ entry?: unknown }>;
}>;

type FetchResult =
  | Readonly<{ ok: true; articles: readonly Article[] }>
  | Readonly<{ ok: false; failure: SourceFailure }>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

export async function fetchArticlesForRange(
  range: Readonly<{ start: Date; end: Date }>,
): Promise<Readonly<{ articles: readonly Article[]; failures: readonly SourceFailure[] }>> {
  const results = await Promise.all(
    RSS_SOURCES.map((source) => fetchSourceArticles(source, range)),
  );

  return {
    articles: results.flatMap((result) => (result.ok ? result.articles : [])),
    failures: results.flatMap((result) => (result.ok ? [] : [result.failure])),
  };
}

async function fetchSourceArticles(
  source: RssSource,
  range: Readonly<{ start: Date; end: Date }>,
): Promise<FetchResult> {
  try {
    const xml = await fetchXml(source.url);
    const feed = parser.parse(xml) as ParsedFeed;
    const entries = extractEntries(feed);
    const articles = entries
      .map((entry) => parseEntry(entry, source))
      .filter((article): article is Article => article !== undefined)
      .filter((article) => isWithinRange(new Date(article.publishedAt), range));

    return { ok: true, articles };
  } catch (error) {
    return {
      ok: false,
      failure: {
        source: source.name,
        reason: formatFetchError(error),
      },
    };
  }
}

function extractEntries(feed: ParsedFeed): readonly unknown[] {
  const rssItems = feed.rss?.channel?.item;
  const atomEntries = feed.feed?.entry;
  return normalizeArray(rssItems ?? atomEntries);
}

function parseEntry(entry: unknown, source: RssSource): Article | undefined {
  if (!isRecord(entry)) {
    return undefined;
  }

  const title = cleanText(readText(entry.title));
  const link = cleanText(readLink(entry.link));
  const publishedAt = parsePublishedAt(entry);
  const content = truncateText(cleanText(readContent(entry)), ARTICLE_CONTENT_LIMIT);

  if (!title || !link || !publishedAt) {
    return undefined;
  }

  return { title, link, source: source.name, publishedAt, content };
}

function parsePublishedAt(entry: Readonly<Record<string, unknown>>): string | undefined {
  const rawDate = readText(entry.pubDate ?? entry.published ?? entry.updated ?? entry["dc:date"]);
  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function readContent(entry: Readonly<Record<string, unknown>>): string {
  return readText(
    entry["content:encoded"] ?? entry.content ?? entry.summary ?? entry.description,
  );
}

function readLink(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const alternate = value.find((item) => readLinkRel(item) === "alternate");
    return readLink(alternate ?? value[0]);
  }

  if (!isRecord(value)) {
    return "";
  }

  return readText(value["@_href"] ?? value.href ?? value["#text"]);
}

function readLinkRel(value: unknown): string {
  if (!isRecord(value)) {
    return "";
  }

  return readText(value["@_rel"] ?? value.rel);
}

function readText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (!isRecord(value)) {
    return "";
  }

  return readText(value["#text"]);
}

function normalizeArray(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined ? [] : [value];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function formatFetchError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "未知抓取错误";
  }

  const cause = readErrorCause(error);

  if (!cause) {
    return error.message;
  }

  return `${error.message}：${cause}`;
}

function readErrorCause(error: Error): string {
  const cause = (error as Readonly<{ cause?: unknown }>).cause;

  if (cause instanceof Error) {
    return cause.message;
  }

  return typeof cause === "string" ? cause : "";
}
