import { readAiConfig } from "@/lib/env";
import { buildDailyPrompt } from "@/lib/ai/prompt";
import { parseDailyCategories } from "@/lib/ai/schema";
import { AI_MAX_OUTPUT_TOKENS } from "@/lib/constants";
import { ensureCategoryCoverage } from "@/lib/dailyCategories";
import type { AiConfig } from "@/lib/env";
import type { Article, DailyCategory } from "@/lib/types";

export async function generateDailyCategories(
  articles: readonly Article[],
  dateLabel: string,
): Promise<readonly DailyCategory[]> {
  const config = readAiConfig(process.env);
  const prompt = buildDailyPrompt(articles, dateLabel);
  const content = await requestAiText(config, prompt);
  const categories = parseDailyCategories(content);

  return ensureCategoryCoverage(categories, articles);
}

async function requestAiText(config: AiConfig, prompt: string): Promise<string> {
  if (config.provider === "openai") {
    return requestOpenAi(config, prompt);
  }

  if (config.provider === "anthropic") {
    return requestAnthropic(config, prompt);
  }

  return requestGemini(config, prompt);
}

async function requestOpenAi(config: AiConfig, prompt: string): Promise<string> {
  const url = `${config.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`;
  const response = await postJson(url, {
    model: config.model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  }, {
    authorization: `Bearer ${config.apiKey}`,
  });
  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("OpenAI 返回内容缺少 choices[0].message.content");
  }

  return content;
}

async function requestAnthropic(config: AiConfig, prompt: string): Promise<string> {
  const url = `${config.baseUrl ?? "https://api.anthropic.com/v1"}/messages`;
  const response = await postJson(url, {
    model: config.model,
    max_tokens: AI_MAX_OUTPUT_TOKENS,
    messages: [{ role: "user", content: prompt }],
  }, {
    "x-api-key": config.apiKey,
    "anthropic-version": "2023-06-01",
  });
  const textBlock = response.content?.find(
    (block: unknown) => isRecord(block) && block.type === "text",
  );

  if (!isRecord(textBlock) || typeof textBlock.text !== "string") {
    throw new Error("Anthropic 返回内容缺少 text block");
  }

  return textBlock.text;
}

async function requestGemini(config: AiConfig, prompt: string): Promise<string> {
  const baseUrl = config.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
  const url = `${baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;
  const response = await postJson(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  }, {});
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    throw new Error("Gemini 返回内容缺少 candidates[0].content.parts[0].text");
  }

  return text;
}

async function postJson(
  url: string,
  body: unknown,
  headers: Readonly<Record<string, string>>,
): Promise<Record<string, any>> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`AI 请求失败：HTTP ${response.status} ${text}`);
  }

  return JSON.parse(text) as Record<string, any>;
}

function isRecord(value: unknown): value is Readonly<Record<string, any>> {
  return typeof value === "object" && value !== null;
}
