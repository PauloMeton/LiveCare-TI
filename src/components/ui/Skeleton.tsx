// Placeholders animados pra loading states.
// Usados pelos loading.tsx do app router.

import { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
  style?: CSSProperties;
};

const roundedCls: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

/** Bloco genérico com pulse. */
export function Skeleton({ className = "", width, height, rounded = "md", style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`bg-graphite-200 animate-pulse ${roundedCls[rounded]} ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

/** Linha de texto. */
export function SkeletonLine({
  width = "100%",
  height = 12,
  className = "",
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return <Skeleton width={width} height={height} className={className} />;
}

/** Card com header + corpo simulado. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Skeleton width={70} height={20} rounded="full" />
        <Skeleton width={90} height={20} rounded="full" />
      </div>
      <SkeletonLine width="70%" height={16} className="mb-2" />
      <SkeletonLine width="40%" height={12} className="mb-3" />
      <div className="bg-graphite-50 rounded-md p-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} width={`${75 - i * 8}%`} height={11} />
        ))}
      </div>
    </div>
  );
}

/** Círculo (avatar). */
export function SkeletonCircle({ size = 36 }: { size?: number }) {
  return <Skeleton width={size} height={size} rounded="full" />;
}
