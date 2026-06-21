import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "AI 日报 Agent",
  description: "抓取 AI 博客 RSS 并生成中文日报",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
