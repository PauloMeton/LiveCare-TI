"use client";

import { useEffect, useState } from "react";
import type { Ticket } from "@/lib/types";
import { getSlaInfo } from "@/lib/sla";

type Props = {
  ticket: Ticket;
  /** Variante visual: 'compact' (so o tempo) ou 'full' (tempo + tooltip). */
  variant?: "compact" | "full";
};

const toneClasses: Record<"success" | "warn" | "danger" | "neutral", string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30",
  warn: "bg-gold-50 text-gold-700 border-gold-200 dark:bg-gold-900/30",
  danger: "bg-danger-50 text-danger-700 border-danger-50 dark:bg-danger-50/30",
  neutral: "bg-graphite-100 text-graphite-600 border-graphite-200 dark:bg-graphite-800",
};

/**
 * Pill que mostra o estado do SLA do chamado.
 * Auto-atualiza a cada minuto pra refletir contagem regressiva ao vivo.
 */
export function SlaPill({ ticket, variant = "compact" }: Props) {
  // Re-render a cada 60s pra atualizar o contador ("Vence em 3h" -> "Vence em 2h")
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const info = getSlaInfo(ticket);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${toneClasses[info.tone]}`}
      title={
        variant === "full"
          ? `Prazo: ${info.prazoHoras}h (prioridade ${ticket.prioridade}) · Vence em ${info.venceEm.toLocaleString("pt-BR")}`
          : info.label
      }
    >
      {info.tone === "danger" && <span aria-hidden>⚠</span>}
      {info.tone === "success" && <span aria-hidden>●</span>}
      {info.tone === "warn" && <span aria-hidden>◐</span>}
      {info.tone === "neutral" && <span aria-hidden>○</span>}
      {info.label}
    </span>
  );
}
