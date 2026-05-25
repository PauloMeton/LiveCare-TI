import { Classe } from "@/lib/types";

const styles: Record<Classe, { bg: string; fg: string; border: string; dot: string }> = {
  RH:         { bg: "#fff3b0", fg: "#6e5500", border: "#ffd64d", dot: "#d9a800" },
  Financeiro: { bg: "#f7f7f5", fg: "#0a0a09", border: "#ebebe8", dot: "#0a0a09" },
  Operacoes:  { bg: "#fffbe6", fg: "#6e5500", border: "#ffe680", dot: "#a37c00" },
};

const labels: Record<Classe, string> = {
  RH: "RH",
  Financeiro: "Financeiro",
  Operacoes: "Operações",
};

export function ClassBadge({ classe }: { classe: Classe }) {
  const s = styles[classe];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border"
      style={{ background: s.bg, color: s.fg, borderColor: s.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {labels[classe]}
    </span>
  );
}
