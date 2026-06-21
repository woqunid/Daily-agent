import { ONE_DAY_MS } from "@/lib/constants";

export function getYesterdayRange(now: Date): Readonly<{ start: Date; end: Date }> {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setTime(start.getTime() - ONE_DAY_MS);

  const end = new Date(start);
  end.setTime(start.getTime() + ONE_DAY_MS);

  return { start, end };
}

export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateFileName(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isWithinRange(
  value: Date,
  range: Readonly<{ start: Date; end: Date }>,
): boolean {
  return value >= range.start && value < range.end;
}
