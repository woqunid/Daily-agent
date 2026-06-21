"use client";

import { useMemo } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  NewspaperIcon,
  PlayIcon,
  RotateCcwIcon,
} from "@/app/icons";
import { useDailyRun } from "@/app/useDailyRun";
import { buildMarkdown } from "@/lib/markdown";
import type { DailyCategory, DailyReport, SourceFailure } from "@/lib/types";

export default function Home() {
  const { state, progress, status, report, errors, fatalError, run } = useDailyRun();
  const dateTitle = useMemo(() => formatDisplayDate(report?.date), [report?.date]);

  return (
    <main className="page-shell">
      <section className="toolbar" aria-label="日报操作">
        <div className="title-block">
          <div className="app-mark">
            <NewspaperIcon size={22} aria-hidden="true" />
          </div>
          <div>
            <h1>AI 日报{dateTitle ? ` - ${dateTitle}` : ""}</h1>
            <p>{status}</p>
          </div>
        </div>
        <div className="actions">
          <button className="primary" disabled={state === "running"} onClick={run}>
            {state === "running" ? (
              <RotateCcwIcon size={18} aria-hidden="true" />
            ) : (
              <PlayIcon size={18} aria-hidden="true" />
            )}
            抓取今日内容
          </button>
          <button disabled={!report} onClick={() => report && downloadMarkdown(report)}>
            <DownloadIcon size={18} aria-hidden="true" />
            导出 MD
          </button>
        </div>
      </section>

      {state === "running" && (
        <div className="progress-track" aria-label="抓取进度">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {fatalError && <ErrorPanel message={fatalError} />}
      {!report && errors.length > 0 && <SourceErrors errors={errors} />}

      {!report && !fatalError && (
        <section className="empty-state">
          <h2>等待生成日报</h2>
          <p>点击抓取后会读取前一天 RSS 内容，并按分类生成中文摘要。</p>
        </section>
      )}

      {report && <ReportView categories={report.categories} />}
    </main>
  );
}

function ReportView({ categories }: Readonly<{ categories: readonly DailyCategory[] }>) {
  if (categories.length === 0) {
    return (
      <section className="empty-state">
        <h2>前一天没有可展示内容</h2>
        <p>所有 RSS 源都没有匹配日期的文章，或文章未进入分类结果。</p>
      </section>
    );
  }

  return (
    <section className="report-list">
      {categories.map((category) => (
        <article className="category-section" key={category.name}>
          <h2>{category.name}</h2>
          <div className="divider" />
          <div className="article-list">
            {category.items.map((item) => (
              <section className="article-item" key={`${category.name}-${item.link}`}>
                <div className="article-meta">
                  <span>{item.source}</span>
                  <span>{item.typeTag}</span>
                  <span>{item.importance}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <a href={item.link} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon size={16} aria-hidden="true" />
                  原文链接
                </a>
              </section>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function ErrorPanel({ message }: Readonly<{ message: string }>) {
  return (
    <section className="notice error">
      <h2>处理失败</h2>
      <p>{message}</p>
    </section>
  );
}

function SourceErrors({ errors }: Readonly<{ errors: readonly SourceFailure[] }>) {
  return (
    <section className="notice warning">
      <h2>部分信息源抓取失败</h2>
      <ul>
        {errors.map((error) => (
          <li key={`${error.source}-${error.reason}`}>
            <strong>{error.source}</strong>：{error.reason}
          </li>
        ))}
      </ul>
    </section>
  );
}

function downloadMarkdown(report: DailyReport) {
  const markdown = buildMarkdown(report);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.date}-ai-daily.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDisplayDate(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
