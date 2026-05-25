import { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  accent?: string; // cor da borda esquerda (CSS color)
};

export function Card({ children, accent, className = "", style, ...rest }: Props) {
  return (
    <div
      className={`bg-white border border-graphite-200 rounded-lg p-5 shadow-sm ${className}`}
      style={{
        ...(accent ? { borderLeft: `4px solid ${accent}` } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
