import type { ContentSource, DailyCategory } from "@/lib/types";

export const CONTENT_SOURCES = [
  { kind: "rss", name: "机器之心", url: "https://www.jiqizhixin.com/rss" },
  { kind: "rss", name: "量子位", url: "https://www.qbitai.com/feed" },
  { kind: "rss", name: "36kr", url: "https://36kr.com/feed" },
  { kind: "html", name: "雷峰网 AI", url: "https://www.leiphone.com/category/ai" },
  { kind: "html", name: "InfoQ AI 大模型", url: "https://www.infoq.cn/topic/AI" },
  {
    kind: "html",
    name: "Qwen 官方博客",
    url: "https://qwenlm.github.io/blog/",
    categoryHint: "大模型",
  },
  {
    kind: "html",
    name: "DeepSeek API 文档",
    url: "https://api-docs.deepseek.com/",
    categoryHint: "大模型",
  },
  {
    kind: "html",
    name: "智谱开放平台",
    url: "https://open.bigmodel.cn/dev/api",
    categoryHint: "大模型",
  },
  {
    kind: "html",
    name: "Qwen 图像生成",
    url: "https://qwenlm.github.io/blog/qwen-image/",
    categoryHint: "图像生成",
  },
  {
    kind: "html",
    name: "ModelScope AIGC",
    url: "https://modelscope.cn/aigc",
    categoryHint: "图像生成",
  },
  {
    kind: "html",
    name: "Kimi API 文档",
    url: "https://platform.kimi.com/docs/overview",
    categoryHint: "AI 编程",
  },
  {
    kind: "html",
    name: "DeepSeek API 指南",
    url: "https://api-docs.deepseek.com/zh-cn/",
    categoryHint: "AI 编程",
  },
  {
    kind: "html",
    name: "ModelScope 文档",
    url: "https://modelscope.cn/docs",
    categoryHint: "AI 软件技术及知识",
  },
  {
    kind: "html",
    name: "阿里云百炼文档",
    url: "https://help.aliyun.com/zh/model-studio/",
    categoryHint: "AI 软件技术及知识",
  },
  {
    kind: "html",
    name: "飞桨文档",
    url: "https://www.paddlepaddle.org.cn/documentation/docs/zh/guides/index_cn.html",
    categoryHint: "AI 软件技术及知识",
  },
  {
    kind: "seed",
    name: "国内 AI 种子源",
    url: "local://china-ai-seeds",
    items: [
      {
        title: "通义千问 Qwen 官方博客：模型发布与技术更新",
        link: "https://qwenlm.github.io/blog/",
        categoryHint: "大模型",
        content: "Qwen 官方博客持续发布通义千问模型、多模态模型、推理模型和开源模型更新。",
      },
      {
        title: "DeepSeek API 文档：模型能力与接入指南",
        link: "https://api-docs.deepseek.com/zh-cn/",
        categoryHint: "大模型",
        content: "DeepSeek API 文档覆盖模型列表、推理能力、上下文、价格和开发接入说明。",
      },
      {
        title: "智谱开放平台：GLM 系列模型与应用接口",
        link: "https://open.bigmodel.cn/dev/api",
        categoryHint: "大模型",
        content: "智谱开放平台提供 GLM 系列大模型 API、工具调用、多模态和智能体能力文档。",
      },
      {
        title: "Kimi 开放平台：长上下文模型与应用开发",
        link: "https://platform.kimi.com/docs/overview",
        categoryHint: "大模型",
        content: "Kimi 开放平台说明长上下文模型、文件理解、API 调用和应用开发能力。",
      },
      {
        title: "Qwen-Image：通义图像生成模型发布",
        link: "https://qwenlm.github.io/blog/qwen-image/",
        categoryHint: "图像生成",
        content: "Qwen-Image 聚焦中文文字渲染、图像生成、图像编辑和视觉创作能力。",
      },
      {
        title: "ModelScope AIGC：图像与视频生成模型集合",
        link: "https://modelscope.cn/aigc",
        categoryHint: "图像生成",
        content: "ModelScope AIGC 汇集图像生成、视频生成、语音生成和多模态创作模型。",
      },
      {
        title: "阿里云百炼：视觉生成模型与多模态服务",
        link: "https://help.aliyun.com/zh/model-studio/",
        categoryHint: "图像生成",
        content: "阿里云百炼文档覆盖多模态、视觉理解、图像生成和模型服务调用说明。",
      },
      {
        title: "百度飞桨：生成式 AI 与视觉模型实践",
        link: "https://www.paddlepaddle.org.cn/documentation/docs/zh/guides/index_cn.html",
        categoryHint: "图像生成",
        content: "飞桨文档提供视觉模型、生成式 AI、训练部署和产业实践相关技术内容。",
      },
      {
        title: "Kimi API 文档：模型调用与应用开发",
        link: "https://platform.kimi.com/docs/overview",
        categoryHint: "AI 编程",
        content: "Kimi API 文档提供鉴权、模型调用、文件上传、错误码和应用开发示例。",
      },
      {
        title: "DeepSeek API 指南：兼容 OpenAI SDK 的开发接入",
        link: "https://api-docs.deepseek.com/zh-cn/",
        categoryHint: "AI 编程",
        content: "DeepSeek API 指南说明 SDK 接入、对话补全、流式输出和开发参数配置。",
      },
      {
        title: "智谱开放平台 API：GLM 应用开发接口",
        link: "https://open.bigmodel.cn/dev/api",
        categoryHint: "AI 编程",
        content: "智谱开放平台 API 文档提供模型调用、工具调用、知识库和应用集成指南。",
      },
      {
        title: "ModelScope 文档：模型下载、推理和应用开发",
        link: "https://modelscope.cn/docs",
        categoryHint: "AI 编程",
        content: "ModelScope 文档覆盖模型调用、推理管线、SDK 使用和开发者工具链。",
      },
      {
        title: "ModelScope 文档：模型训练、部署与服务化",
        link: "https://modelscope.cn/docs",
        categoryHint: "AI 软件技术及知识",
        content: "ModelScope 文档提供模型训练、评测、部署、推理服务和应用集成技术说明。",
      },
      {
        title: "阿里云百炼文档：大模型应用工程化",
        link: "https://help.aliyun.com/zh/model-studio/",
        categoryHint: "AI 软件技术及知识",
        content: "百炼文档覆盖模型服务、应用构建、提示词、知识库、插件和企业级工程实践。",
      },
      {
        title: "飞桨文档：深度学习框架与模型部署",
        link: "https://www.paddlepaddle.org.cn/documentation/docs/zh/guides/index_cn.html",
        categoryHint: "AI 软件技术及知识",
        content: "飞桨文档提供深度学习框架、训练推理、模型部署和工程优化指南。",
      },
      {
        title: "InfoQ AI 大模型：AI 工程化与架构实践",
        link: "https://www.infoq.cn/topic/AI",
        categoryHint: "AI 软件技术及知识",
        content: "InfoQ AI 大模型专题关注生成式 AI、AI 工程化、架构、平台和研发实践。",
      },
    ],
  },
] as const satisfies readonly ContentSource[];

export const CATEGORY_NAMES = [
  "大模型",
  "图像生成",
  "AI 编程",
  "AI 软件技术及知识",
] as const satisfies readonly DailyCategory["name"][];

export const MAX_ITEMS_PER_CATEGORY = 15;
export const MIN_ITEMS_PER_CATEGORY = 4;
export const ARTICLE_CONTENT_LIMIT = 1800;
export const AI_INPUT_ARTICLE_LIMIT = 80;
export const AI_CATEGORY_SEED_LIMIT = 12;
export const SUPPLEMENT_SUMMARY_LIMIT = 180;
export const HTML_SOURCE_ITEM_LIMIT = 24;
export const FETCH_TIMEOUT_MS = 12000;
export const FETCH_RETRY_COUNT = 2;
export const FETCH_RETRY_DELAY_MS = 800;
export const AI_MAX_OUTPUT_TOKENS = 4096;
export const ONE_DAY_MS = 86_400_000;
