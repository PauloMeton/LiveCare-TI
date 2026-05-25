import { ReactNode } from "react";

type Tone = "neutral" | "success" | "warn" | "info" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-graphite-100 text-graphite-700",
  success: "bg-emerald-50  text-emerald-700",
  warn:    "bg-gold-50     text-gold-700",
  info:    "bg-graphite-100 text-graphite-800",
  danger:  "bg-danger-50   text-danger-700",
};

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
