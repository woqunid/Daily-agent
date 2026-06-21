import type { SVGProps } from "react";

type IconProps = Readonly<SVGProps<SVGSVGElement> & { size?: number }>;

const DEFAULT_ICON_SIZE = 18;

export function DownloadIcon({ size = DEFAULT_ICON_SIZE, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = DEFAULT_ICON_SIZE, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function NewspaperIcon({ size = DEFAULT_ICON_SIZE, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z" />
      <path d="M4 22a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}

export function PlayIcon({ size = DEFAULT_ICON_SIZE, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M6 3l14 9-14 9V3Z" />
    </svg>
  );
}

export function RotateCcwIcon({ size = DEFAULT_ICON_SIZE, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function baseProps(size: number, props: Omit<IconProps, "size">): SVGProps<SVGSVGElement> {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}
