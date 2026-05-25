"use client";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[13px] gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-[15px] gap-2",
};

// Variante B — Editorial: primary = amarelo Live sobre preto
const variantClasses: Record<Variant, string> = {
  primary:   "bg-gold-400 text-graphite-900 border border-gold-400 hover:bg-gold-500 hover:border-gold-500",
  secondary: "bg-white text-graphite-900 border border-graphite-200 hover:border-graphite-300",
  ghost:     "bg-transparent text-graphite-600 border border-transparent hover:bg-graphite-100",
  success:   "bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700",
  danger:    "bg-danger-600 text-white border border-danger-600 hover:bg-danger-700",
  outline:   "bg-transparent text-graphite-900 border border-graphite-300 hover:border-graphite-400",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", icon, iconRight, full, className = "", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
        full ? "w-full" : ""
      } ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
});
