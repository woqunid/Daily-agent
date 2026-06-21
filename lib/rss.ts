import { XMLParser } from "fast-xml-parser";
import {
  ARTICLE_CONTENT_LIMIT,
  CONTENT_SOURCES,
  HTML_SOURCE_ITEM_LIMIT,
} from "@/lib/constants";
import { isWithinRange } from "@/lib/date";
import { fetchHtml, fetchXml } from "@/lib/rssHttp";
import { cleanText, truncateText } from "@/lib/text";
import type { Article, ContentSource, SourceFailure } from "@/lib/types";

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
    CONTENT_SOURCES.map((source) => fetchSourceArticles(source, range)),
  );

  return {
    articles: results.flatMap((result) => (result.ok ? result.articles : [])),
    failures: results.flatMap((result) => (result.ok ? [] : [result.failure])),
  };
}

async function fetchSourceArticles(
  source: ContentSource,
  range: Readonly<{ start: Date; end: Date }>,
): Promise<FetchResult> {
  try {
    const articles = await fetchSourceByKind(source, range);

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

async function fetchSourceByKind(
  source: ContentSource,
  range: Readonly<{ start: Date; end: Date }>,
): Promise<readonly Article[]> {
  if (source.kind === "rss") {
    return fetchRssArticles(source, range);
  }

  if (source.kind === "html") {
    return fetchHtmlArticles(source, range.start);
  }

  return source.items.map((item) => ({
    title: item.title,
    link: item.link,
    source: source.name,
    publishedAt: range.start.toISOString(),
    content: item.content,
    categoryHint: item.categoryHint,
  }));
}

async function fetchRssArticles(
  source: ContentSource,
  range: Readonly<{ start: Date; end: Date }>,
): Promise<readonly Article[]> {
  const xml = await fetchXml(source.url);
  const feed = parser.parse(xml) as ParsedFeed;
  const entries = extractEntries(feed);

  return entries
    .map((entry) => parseEntry(entry, source))
    .filter((article): article is Article => article !== undefined)
    .filter((article) => isWithinRange(new Date(article.publishedAt), range));
}

async function fetchHtmlArticles(
  source: ContentSource,
  date: Date,
): Promise<readonly Article[]> {
  const html = await fetchHtml(source.url);
  const links = extractHtmlLinks(html, source.url);

  return uniqueLinks(links)
    .slice(0, HTML_SOURCE_ITEM_LIMIT)
    .map((link) => buildHtmlArticle(link, source, date));
}

function extractEntries(feed: ParsedFeed): readonly unknown[] {
  const rssItems = feed.rss?.channel?.item;
  const atomEntries = feed.feed?.entry;
  return normalizeArray(rssItems ?? atomEntries);
}

function parseEntry(entry: unknown, source: ContentSource): Article | undefined {
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

  return {
    title,
    link,
    source: source.name,
    publishedAt,
    content,
    categoryHint: readCategoryHint(source),
  };
}

type HtmlLink = Readonly<{
  title: string;
  link: string;
  content: string;
}>;

function extractHtmlLinks(html: string, baseUrl: string): readonly HtmlLink[] {
  const matches = html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  const pageSummary = extractPageSummary(html);

  return Array.from(matches)
    .map((match) => parseHtmlLink({ match, baseUrl, pageSummary }))
    .filter((link): link is HtmlLink => link !== undefined);
}

type HtmlLinkParseConfig = Readonly<{
  match: RegExpMatchArray;
  baseUrl: string;
  pageSummary: string;
}>;

function parseHtmlLink(config: HtmlLinkParseConfig): HtmlLink | undefined {
  const { match, baseUrl, pageSummary } = config;
  const href = match[1];
  const title = cleanText(match[2] ?? "");

  if (!href || !isUsefulHref(href) || !isUsefulTitle(title)) {
    return undefined;
  }

  return {
    title,
    link: new URL(href, baseUrl).toString(),
    content: readLinkContext(match, pageSummary),
  };
}

function uniqueLinks(links: readonly HtmlLink[]): readonly HtmlLink[] {
  const seen = new Set<string>();

  return links.filter((item) => {
    if (seen.has(item.link)) {
      return false;
    }

    seen.add(item.link);
    return true;
  });
}

function buildHtmlArticle(
  item: HtmlLink,
  source: ContentSource,
  date: Date,
): Article {
  return {
    title: item.title,
    link: item.link,
    source: source.name,
    publishedAt: date.toISOString(),
    content: item.content || item.title,
    categoryHint: readCategoryHint(source),
  };
}

function extractPageSummary(html: string): string {
  const meta = html.match(
    /<meta\b[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  );

  if (meta?.[1]) {
    return cleanText(meta[1]);
  }

  const paragraphs = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => cleanText(match[1] ?? ""))
    .filter((text) => text.length >= 20);

  return truncateText(paragraphs.join(" "), ARTICLE_CONTENT_LIMIT);
}

function readLinkContext(match: RegExpMatchArray, pageSummary: string): string {
  const rawContext = match.input?.slice(match.index ?? 0, (match.index ?? 0) + 1200) ?? "";
  const context = cleanText(rawContext);

  if (context.length >= 20) {
    return truncateText(context, ARTICLE_CONTENT_LIMIT);
  }

  return pageSummary;
}

function isUsefulTitle(title: string): boolean {
  const ignoredTitle = /^(首页|登录|注册|更多|关于|下载|文档|搜索|菜单|上一页|下一页)$/i;

  return title.length >= 6 && !ignoredTitle.test(title);
}

function isUsefulHref(href: string): boolean {
  if (/^(#|javascript:|mailto:|tel:)/i.test(href)) {
    return false;
  }

  return !/\.(png|jpe?g|gif|svg|webp|pdf|zip)$/i.test(href);
}

function readCategoryHint(source: ContentSource): Article["categoryHint"] {
  return "categoryHint" in source ? source.categoryHint : undefined;
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
