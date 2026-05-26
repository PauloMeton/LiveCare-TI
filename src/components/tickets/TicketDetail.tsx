"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Ticket, TicketEvent, TicketEventTipo } from "@/lib/types";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Field, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import {
  concluirTicket,
  setEmAndamento,
  cancelTicket,
  reopenTicket,
  rejectTicket,
} from "@/app/chamados/actions";

type Props = {
  ticket: Ticket;
  events: TicketEvent[];
  profiles: Record<string, { nome: string | null; cargo: string | null }>;
  unidadeNome: string | null;
  currentUserId: string;
  isAdmin: boolean;
};

const prioridadeLabel: Record<Ticket["prioridade"], string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};
const prioridadeTone: Record<Ticket["prioridade"], "neutral" | "warn" | "danger"> = {
  baixa: "neutral",
  media: "warn",
  alta: "danger",
};

const eventoConfig: Record<TicketEventTipo, { label: string; color: string }> = {
  aberto:     { label: "Chamado aberto",       color: "var(--gold-500)" },
  editado:    { label: "Editado pelo autor",   color: "var(--graphite-400)" },
  andamento:  { label: "Em andamento",         color: "var(--graphite-700)" },
  concluido:  { label: "Concluído",            color: "#0e8a4a" },
  reaberto:   { label: "Reaberto",             color: "var(--gold-600)" },
  rejeitado:  { label: "Rejeitado",            color: "#b8392c" },
  cancelado:  { label: "Cancelado pelo autor", color: "var(--graphite-500)" },
  comentario: { label: "Comentário",           color: "var(--graphite-400)" },
};

export function TicketDetail({
  ticket,
  events,
  profiles,
  unidadeNome,
  currentUserId,
  isAdmin,
}: Props) {
  const isAutor = ticket.autor_id === currentUserId;
  const isOpen = ticket.status === "aberto";
  const isClosed =
    ticket.status === "concluido" ||
    ticket.status === "cancelado" ||
    ticket.status === "rejeitado";

  const autor = profiles[ticket.autor_id];

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [motivo, setMotivo] = useState("");

  function runAction(fn: () => Promise<{ error?: string; ok?: boolean } | undefined>, confirmMsg?: string) {
    setError(null);
    if (confirmMsg && !confirm(confirmMsg)) return;
    startTransition(async () => {
      const r = await fn();
      if (r?.error) setError(r.error);
    });
  }

  function submitReject() {
    setError(null);
    if (motivo.trim().length < 5) {
      setError("Informe um motivo com pelo menos 5 caracteres.");
      return;
    }
    startTransition(async () => {
      const r = await rejectTicket({ ticketId: ticket.id, motivo });
      if (r?.error) {
        setError(r.error);
        return;
      }
      setShowRejectModal(false);
      setMotivo("");
    });
  }

  const dateOpts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      {/* Realtime — escuta mudanças neste ticket e nos eventos dele */}
      <RealtimeRefresher
        subs={[
          {
            channel: `ticket-${ticket.id}`,
            table: "livecare_tickets",
            filter: `id=eq.${ticket.id}`,
          },
          {
            channel: `ticket-events-${ticket.id}`,
            table: "livecare_ticket_events",
            filter: `ticket_id=eq.${ticket.id}`,
          },
        ]}
      />

      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-graphite-900 text-xl leading-none">←</Link>
        <BrandLockup size={28} />
        <span className="ml-2 text-sm font-semibold text-graphite-700">Detalhe do chamado</span>
      </header>

      <main className="px-4 py-6 max-w-3xl mx-auto">
        {/* Header card */}
        <Card className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <ClassBadge classe={ticket.classe} />
              <StatusPill status={ticket.status} />
              <Pill tone={prioridadeTone[ticket.prioridade]}>
                Prioridade {prioridadeLabel[ticket.prioridade]}
              </Pill>
            </div>
            <div className="text-xs text-graphite-500 font-mono">#{ticket.id.slice(0, 8)}</div>
          </div>

          <h1 className="text-xl font-bold text-graphite-900 leading-tight mb-3">{ticket.titulo}</h1>

          <div className="flex items-center gap-3 pt-3 border-t border-graphite-100">
            <Avatar name={autor?.nome ?? "?"} size={36} color="var(--gold-100, #fff3b0)" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-graphite-900 truncate">{autor?.nome ?? "—"}</div>
              <div className="text-xs text-graphite-500 truncate">
                {[autor?.cargo, unidadeNome].filter(Boolean).join(" · ") || "Sem informações adicionais"}
              </div>
            </div>
          </div>
        </Card>

        {/* Campos */}
        <Card className="mb-4">
          <h2 className="text-sm font-semibold text-graphite-900 mb-3">Informações do chamado</h2>
          <dl className="bg-graphite-50 rounded-md p-3 text-[13px] grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
            {Object.entries(ticket.campos).map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-graphite-500 text-[11px] uppercase tracking-wide">{k}</dt>
                <dd className="text-graphite-900">{v || "—"}</dd>
              </div>
            ))}
          </dl>

          {ticket.observacao && (
            <div className="mt-4 pt-4 border-t border-graphite-100">
              <div className="text-[11px] text-graphite-500 uppercase tracking-wide mb-1">Observação</div>
              <div className="text-sm text-graphite-700 whitespace-pre-wrap">{ticket.observacao}</div>
            </div>
          )}
        </Card>

        {/* Linha do tempo */}
        <Card className="mb-4">
          <h2 className="text-sm font-semibold text-graphite-900 mb-3">Linha do tempo</h2>
          {events.length === 0 ? (
            <div className="text-sm text-graphite-500">Sem eventos registrados.</div>
          ) : (
            <ul className="text-[13px] text-graphite-700 space-y-3">
              {events.map((ev) => {
                const cfg = eventoConfig[ev.tipo];
                const ator = ev.ator_id ? profiles[ev.ator_id] : null;
                const motivoEv = (ev.detalhes as Record<string, unknown>)?.motivo as string | undefined;
                return (
                  <li key={ev.id} className="flex items-start gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: cfg.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-graphite-900">
                        {cfg.label}
                        {ator?.nome ? ` · ${ator.nome}` : ""}
                      </div>
                      <div className="text-graphite-500 text-xs">
                        {new Date(ev.created_at).toLocaleString("pt-BR", dateOpts)}
                      </div>
                      {motivoEv && (
                        <div className="mt-1 text-[13px] text-graphite-700 bg-danger-50 border border-danger-50 rounded-md px-2.5 py-1.5">
                          <span className="text-danger-700 font-medium">Motivo:</span> {motivoEv}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {error && (
          <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Ações do funcionário (autor) */}
        {isAutor && isOpen && (
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="danger"
              onClick={() => runAction(() => cancelTicket(ticket.id), "Cancelar este chamado? Esta ação não pode ser desfeita.")}
              disabled={pending}
            >
              Cancelar chamado
            </Button>
            <Link href={`/chamados/${ticket.id}/editar`}>
              <Button variant="secondary">Editar</Button>
            </Link>
          </div>
        )}

        {/* Ações do admin */}
        {isAdmin && !isClosed && (
          <div className="flex flex-wrap gap-2 justify-end">
            {ticket.status === "aberto" && (
              <Button variant="secondary" onClick={() => runAction(() => setEmAndamento(ticket.id))} disabled={pending}>
                Marcar em andamento
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => {
                setMotivo("");
                setError(null);
                setShowRejectModal(true);
              }}
              disabled={pending}
            >
              Rejeitar
            </Button>
            <Button
              variant="success"
              onClick={() => runAction(() => concluirTicket(ticket.id), "Marcar este chamado como concluído?")}
              disabled={pending}
            >
              {pending ? "Salvando…" : "✓ Concluído"}
            </Button>
          </div>
        )}

        {/* Reabrir (admin, ticket fechado) */}
        {isAdmin && isClosed && (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => runAction(() => reopenTicket(ticket.id), "Reabrir este chamado?")}
              disabled={pending}
            >
              Reabrir chamado
            </Button>
          </div>
        )}

        {/* Funcionário sem ações disponíveis */}
        {isAutor && !isOpen && !isAdmin && (
          <div className="text-xs text-graphite-500 text-center mt-2">
            Este chamado não pode mais ser alterado.
          </div>
        )}
      </main>

      {/* Modal de rejeição */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Rejeitar chamado"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-graphite-600">
            Informe o motivo da rejeição. Ele será registrado no histórico do chamado.
          </p>
          <Field label="Motivo" required>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              placeholder="Ex.: Duplicado, fora de escopo, falta de informações…"
            />
          </Field>
          {error && (
            <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={submitReject} disabled={pending}>
              {pending ? "Rejeitando…" : "Rejeitar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
