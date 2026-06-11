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
 *
 * Importante — hidratacao: o estado inicial usa `ticket.created_at` como
 * "agora" (deterministico, igual em server e client) pra evitar React error
 * #418 (hydration mismatch). Apos o mount, useEffect substitui pelo Date()
 * real do browser e re-renderiza.
 */
export function SlaPill({ ticket, variant = "compact" }: Props) {
  // Estado inicial deterministico: usa created_at como now.
  // Resultado: no SSR e no primeiro render do client, o pill mostra
  // "Vence em <prazoHoras>" (porque now == created_at, restante == prazo).
  // Apos hidratacao, useEffect atualiza pra now real.
  const [info, setInfo] = useState(() => getSlaInfo(ticket, new Date(ticket.created_at)));

  useEffect(() => {
    // Atualiza imediatamente apos mount com now real
    setInfo(getSlaInfo(ticket, new Date()));
    // E continua atualizando a cada minuto pra contagem regressiva ao vivo
    const id = window.setInterval(() => {
      setInfo(getSlaInfo(ticket, new Date()));
    }, 60_000);
    return () => window.clearInterval(id);
  }, [ticket]);

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
