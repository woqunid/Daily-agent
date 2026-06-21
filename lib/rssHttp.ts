import { ProxyAgent, type Dispatcher } from "undici";
import {
  FETCH_RETRY_COUNT,
  FETCH_RETRY_DELAY_MS,
  FETCH_TIMEOUT_MS,
} from "@/lib/constants";

type FetchOptions = Readonly<{
  dispatcher?: Dispatcher;
}>;

type NodeRequestInit = RequestInit & Readonly<{
  dispatcher?: Dispatcher;
}>;

const RSS_ACCEPT_HEADER = "application/rss+xml, application/atom+xml, text/xml, */*";
const RSS_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const RETRYABLE_ERROR_CODES = new Set([
  "AbortError",
  "ECONNRESET",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
]);

export async function fetchXml(url: string): Promise<string> {
  const options = readFetchOptions(process.env);
  let lastError: unknown;

  for (let attempt = 0; attempt <= FETCH_RETRY_COUNT; attempt += 1) {
    try {
      return await fetchXmlOnce(url, options);
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      await wait(FETCH_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
}

function readFetchOptions(env: NodeJS.ProcessEnv): FetchOptions {
  const proxyUrl = env.RSS_PROXY_URL?.trim();

  if (!proxyUrl) {
    return {};
  }

  return { dispatcher: new ProxyAgent(proxyUrl) };
}

async function fetchXmlOnce(url: string, options: FetchOptions): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const requestInit: NodeRequestInit = {
      signal: controller.signal,
      dispatcher: options.dispatcher,
      headers: {
        accept: RSS_ACCEPT_HEADER,
        "user-agent": RSS_USER_AGENT,
      },
      cache: "no-store",
    };
    const response = await fetch(url, requestInit);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function shouldRetry(error: unknown, attempt: number): boolean {
  if (attempt >= FETCH_RETRY_COUNT) {
    return false;
  }

  return readErrorSignals(error).some((signal) => RETRYABLE_ERROR_CODES.has(signal));
}

function readErrorSignals(error: unknown): readonly string[] {
  if (!isErrorRecord(error)) {
    return [];
  }

  const cause = error.cause;
  const signals = [error.code, error.name].filter(isString);

  if (!isErrorRecord(cause)) {
    return signals;
  }

  return [...signals, cause.code, cause.name].filter(isString);
}

function isErrorRecord(value: unknown): value is Readonly<{
  cause?: unknown;
  code?: unknown;
  name?: unknown;
}> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
