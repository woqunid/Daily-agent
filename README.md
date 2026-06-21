# AI 日报 Agent

Next.js + TypeScript 实现的 AI 日报网页应用，可部署到 Vercel。

## 本地运行

```bash
npm install
npm run dev
```

## Vercel 环境变量

至少配置以下变量：

| 变量名 | 示例 |
| --- | --- |
| `AI_PROVIDER` | `openai` / `anthropic` / `gemini` |
| `AI_API_KEY` | 对应服务商 API Key |
| `AI_MODEL` | `gpt-4o` / `claude-sonnet-4-20250514` / `gemini-pro` |
| `AI_BASE_URL` | 可选，自定义兼容接口地址 |
| `RSS_PROXY_URL` | 可选，RSS 抓取代理，例如 `http://127.0.0.1:7890` |

## RSS 源说明

当前启用的 RSS 源在 [lib/constants.ts](lib/constants.ts) 中维护。Anthropic Blog 和 Meta AI Blog 当前未提供可稳定访问的官方 RSS 地址，因此没有放入自动抓取列表。

Google AI Blog、Hugging Face Blog 等源在部分网络环境下可能出现 `ECONNRESET` 或连接超时。服务端会对可恢复的网络错误重试；如部署环境无法直连这些站点，请显式配置 `RSS_PROXY_URL`，失败仍会在页面展示具体原因。

## 部署

1. 将本目录推送到 GitHub。
2. 在 Vercel 新建项目并选择该仓库。
3. 在 Vercel Project Settings 中配置环境变量。
4. 部署后打开站点，点击“抓取今日内容”。
# Daily-agent
