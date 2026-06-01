// SLA tracking — prazos por prioridade e helpers de calculo.
//
// Decisao de design: por enquanto SLA acompanha apenas RESOLUCAO (created_at -> concluido_em),
// nao primeira resposta. Prazos sao em horas corridas (24/7, sem desconto de finais
// de semana ou feriados) pra simplicidade. Se quiser horas uteis no futuro, da pra
// criar uma versao 2 do calculo sem mudar nada do consumidor.

import type { Ticket, Prioridade } from "@/lib/types";

/** Prazo de resolucao em horas, por prioridade. */
export const SLA_HORAS: Record<Prioridade, number> = {
  alta: 24, // 1 dia
  media: 72, // 3 dias
  baixa: 168, // 7 dias
};

export type SlaStatus =
  | "no_prazo" // mais de 50% do tempo restante
  | "atencao" // menos de 50% restante, mas ainda nao venceu
  | "vencido" // passou do prazo
  | "concluido_no_prazo" // foi concluido antes de vencer
  | "concluido_atrasado"; // foi concluido depois de vencer

export type SlaInfo = {
  /** Prazo total em horas (depende da prioridade). */
  prazoHoras: number;
  /** Data limite (created_at + prazo). */
  venceEm: Date;
  /** Horas restantes ate vencer (negativo = atrasado). Pra concluidos: tempo gasto. */
  restanteHoras: number;
  status: SlaStatus;
  /** Texto curto pra exibir no pill ("Vence em 8h", "Atrasado 2h"). */
  label: string;
  /** Tom visual: success / warn / danger / neutral. */
  tone: "success" | "warn" | "danger" | "neutral";
};

/** Formata horas em string compacta — "8h", "2d 4h", "45min" pra <1h. */
function formatHoras(h: number): string {
  const abs = Math.abs(h);
  if (abs < 1) return `${Math.round(abs * 60)}min`;
  if (abs < 24) return `${Math.round(abs)}h`;
  const dias = Math.floor(abs / 24);
  const horas = Math.round(abs % 24);
  return horas > 0 ? `${dias}d ${horas}h` : `${dias}d`;
}

/**
 * Calcula o estado atual de SLA pra um ticket.
 *
 * Regras:
 * - Status `cancelado` ou `rejeitado`: SLA "neutro" (nao se aplica).
 * - Status `concluido`: usa concluido_em vs venceEm pra dizer se foi no prazo.
 * - Status aberto/andamento: calcula tempo restante a partir de "now".
 */
export function getSlaInfo(ticket: Ticket, now: Date = new Date()): SlaInfo {
  const prazoHoras = SLA_HORAS[ticket.prioridade];
  const created = new Date(ticket.created_at);
  const venceEm = new Date(created.getTime() + prazoHoras * 3600 * 1000);

  // Cancelado / rejeitado — SLA nao se aplica
  if (ticket.status === "cancelado" || ticket.status === "rejeitado") {
    return {
      prazoHoras,
      venceEm,
      restanteHoras: 0,
      status: "no_prazo",
      label: "SLA não se aplica",
      tone: "neutral",
    };
  }

  // Concluido — verifica se foi antes ou depois do prazo
  if (ticket.status === "concluido" && ticket.concluido_em) {
    const concluido = new Date(ticket.concluido_em);
    const gastoHoras = (concluido.getTime() - created.getTime()) / 3600 / 1000;
    const atrasado = concluido.getTime() > venceEm.getTime();
    return {
      prazoHoras,
      venceEm,
      restanteHoras: gastoHoras,
      status: atrasado ? "concluido_atrasado" : "concluido_no_prazo",
      label: atrasado
        ? `Concluído com ${formatHoras(gastoHoras - prazoHoras)} de atraso`
        : `Concluído em ${formatHoras(gastoHoras)}`,
      tone: atrasado ? "warn" : "success",
    };
  }

  // Aberto ou em andamento — calcula tempo restante
  const restanteMs = venceEm.getTime() - now.getTime();
  const restanteHoras = restanteMs / 3600 / 1000;

  if (restanteHoras < 0) {
    return {
      prazoHoras,
      venceEm,
      restanteHoras,
      status: "vencido",
      label: `Atrasado ${formatHoras(restanteHoras)}`,
      tone: "danger",
    };
  }

  const metade = prazoHoras / 2;
  if (restanteHoras < metade) {
    return {
      prazoHoras,
      venceEm,
      restanteHoras,
      status: "atencao",
      label: `Vence em ${formatHoras(restanteHoras)}`,
      tone: "warn",
    };
  }

  return {
    prazoHoras,
    venceEm,
    restanteHoras,
    status: "no_prazo",
    label: `Vence em ${formatHoras(restanteHoras)}`,
    tone: "success",
  };
}

/** Comparator pra ordenar tickets por urgencia (vencidos primeiro, depois proximos do prazo). */
export function compareBySla(a: Ticket, b: Ticket): number {
  const sa = getSlaInfo(a);
  const sb = getSlaInfo(b);

  // Concluidos/cancelados vao pro fim
  const aClosed = a.status === "concluido" || a.status === "cancelado" || a.status === "rejeitado";
  const bClosed = b.status === "concluido" || b.status === "cancelado" || b.status === "rejeitado";
  if (aClosed && !bClosed) return 1;
  if (bClosed && !aClosed) return -1;
  if (aClosed && bClosed) return 0;

  // Quanto menor restanteHoras (mais negativo = mais atrasado), mais alto na lista
  return sa.restanteHoras - sb.restanteHoras;
}
