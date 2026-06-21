const HTML_ENTITY_MAP: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return decodeHtmlEntities(stripHtml(value))
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength).trim();
}

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#?\w+);/g, (entity, key: string) => {
    if (key.startsWith("#x")) {
      return decodeCodePoint(entity, Number.parseInt(key.slice(2), 16));
    }

    if (key.startsWith("#")) {
      return decodeCodePoint(entity, Number.parseInt(key.slice(1), 10));
    }

    return HTML_ENTITY_MAP[key] ?? entity;
  });
}

function decodeCodePoint(entity: string, codePoint: number): string {
  if (!Number.isFinite(codePoint)) {
    return entity;
  }

  return String.fromCodePoint(codePoint);
}
