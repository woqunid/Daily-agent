"use client";

import { useState } from "react";
import type { DailyReport, SourceFailure, StreamEvent } from "@/lib/types";

export type RunState = "idle" | "running" | "complete" | "error";

const INITIAL_PROGRESS = 0;
const COMPLETE_PROGRESS = 100;
const NDJSON_LINE_SEPARATOR = "\n";

export function useDailyRun() {
  const [state, setState] = useState<RunState>("idle");
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [status, setStatus] = useState("等待抓取");
  const [report, setReport] = useState<DailyReport | null>(null);
  const [errors, setErrors] = useState<readonly SourceFailure[]>([]);
  const [fatalError, setFatalError] = useState("");

  async function run() {
    resetRunState();
    setState("running");
    setStatus("正在连接服务端");

    try {
      const response = await fetch("/api/daily", { method: "POST" });
      const stream = readStreamResponse(response);
      await readEventStream(stream, handleStreamEvent);
    } catch (error) {
      setState("error");
      setFatalError(error instanceof Error ? error.message : "未知请求错误");
    }
  }

  function handleStreamEvent(event: StreamEvent) {
    if (event.type === "status") {
      setStatus(event.message);
      setProgress(event.progress);
      return;
    }

    if (event.type === "source-error") {
      setErrors((current) => [...current, { source: event.source, reason: event.reason }]);
      return;
    }

    handleTerminalEvent(event);
  }

  function handleTerminalEvent(event: StreamEvent) {
    if (event.type === "complete") {
      setReport(event.report);
      setProgress(COMPLETE_PROGRESS);
      setStatus("完成");
      setState("complete");
      return;
    }

    if (event.type === "error") {
      setFatalError(event.message);
      setState("error");
    }
  }

  function resetRunState() {
    setProgress(INITIAL_PROGRESS);
    setReport(null);
    setErrors([]);
    setFatalError("");
  }

  return { state, progress, status, report, errors, fatalError, run };
}

function readStreamResponse(response: Response): ReadableStream<Uint8Array> {
  if (!response.ok || !response.body) {
    throw new Error(`请求失败：HTTP ${response.status}`);
  }

  return response.body;
}

async function readEventStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(NDJSON_LINE_SEPARATOR);
    buffer = lines.pop() ?? "";
    lines.filter(Boolean).map(parseStreamEvent).forEach(onEvent);
  }

  const tail = buffer.trim();

  if (tail) {
    onEvent(parseStreamEvent(tail));
  }
}

function parseStreamEvent(line: string): StreamEvent {
  try {
    return JSON.parse(line) as StreamEvent;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "未知 JSON 解析错误";
    throw new Error(`服务端流响应不是合法 JSON：${reason}`);
  }
}
