"use client";
import { useState } from "react";
import Link from "next/link";
import type { Profile, Ticket } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import { SlaPill } from "@/components/tickets/SlaPill";

const filtros: Array<{ id: "todos" | "aberto" | "andamento" | "concluido"; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "aberto", label: "Abertos" },
  { id: "andamento", label: "Em andamento" },
  { id: "concluido", label: "Concluídos" },
];

export function FuncDashboard({
  profile,
  tickets,
  unidades,
}: {
  profile: Profile;
  tickets: Ticket[];
  unidades: Record<number, string>;
}) {
  const [filter, setFilter] = useState<(typeof filtros)[number]["id"]>("todos");
  const filtered = filter === "todos" ? tickets : tickets.filter((t) => t.status === filter);

  const stats = {
    aberto: tickets.filter((t) => t.status === "aberto").length,
    andamento: tickets.filter((t) => t.status === "andamento").length,
    concluido: tickets.filter((t) => t.status === "concluido").length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-graphite-50 pb-20">
      {/* Realtime — atualiza a lista quando o admin muda algum chamado seu */}
      <RealtimeRefresher
        subs={[
          {
            channel: `func-tickets-${profile.id}`,
            table: "livecare_tickets",
            filter: `autor_id=eq.${profile.id}`,
          },
          {
            channel: `func-events-${profile.id}`,
            table: "livecare_ticket_events",
          },
        ]}
      />

      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-graphite-200 bg-white px-4 py-3">
        <BrandLockup size={32} />
        <form action="/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">
            Sair
          </Button>
        </form>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gold-600">
          Painel do funcionário
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-graphite-900">Meus chamados</h1>
        <p className="mb-5 mt-1 text-sm text-graphite-500">
          Olá, {profile.nome?.split(" ")[0] ?? "colaborador"} — acompanhe seus pedidos.
        </p>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <MiniStat label="Abertos" value={stats.aberto} tone="warn" />
          <MiniStat label="Em andamento" value={stats.andamento} tone="info" />
          <MiniStat label="Concluídos" value={stats.concluido} tone="success" />
        </div>

        {/* Filter chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {filtros.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                filter === f.id
                  ? "border-graphite-900 bg-graphite-900 text-white"
                  : "border-graphite-200 bg-white text-graphite-700 hover:border-graphite-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <div className="mb-2 text-3xl text-graphite-400">📋</div>
              <div className="mb-1 font-semibold text-graphite-900">Nenhum chamado por aqui</div>
              <div className="mb-4 text-sm text-graphite-500">
                Quando você abrir um chamado, ele aparece nessa lista.
              </div>
              <Link href="/chamados/novo">
                <Button>+ Abrir chamado</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((t) => (
              <TicketCard key={t.id} ticket={t} unidades={unidades} />
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav active="home" />
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warn" | "info" | "success";
}) {
  const toneClasses = {
    warn: "text-gold-700 bg-gold-50",
    info: "text-graphite-700 bg-graphite-100",
    success: "text-emerald-700 bg-emerald-50",
  };
  return (
    <div className={`rounded-lg p-3 ${toneClasses[tone]}`}>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium">{label}</div>
    </div>
  );
}

function TicketCard({ ticket, unidades }: { ticket: Ticket; unidades: Record<number, string> }) {
  return (
    <Link href={`/chamados/${ticket.id}`} prefetch={true} className="block">
      <Card className="cursor-pointer transition-colors hover:border-graphite-300">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClassBadge classe={ticket.classe} />
            <StatusPill status={ticket.status} />
          </div>
          <SlaPill ticket={ticket} />
        </div>
        <div className="mb-1 font-semibold text-graphite-900">{ticket.titulo}</div>
        {ticket.unidade_id && unidades[ticket.unidade_id] && (
          <div className="mb-2 text-xs text-graphite-500">{unidades[ticket.unidade_id]}</div>
        )}
        <div className="space-y-0.5 rounded-md bg-graphite-50 p-3 text-[13px] text-graphite-700">
          {Object.entries(ticket.campos)
            .slice(0, 3)
            .map(([k, v]) => (
              <div key={k}>
                <span className="inline-block w-32 text-graphite-500">{k}:</span> {v}
              </div>
            ))}
        </div>
        <div className="mt-2 text-xs text-graphite-400">
          Aberto em {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
        </div>
      </Card>
    </Link>
  );
}
