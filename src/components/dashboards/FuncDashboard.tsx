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
    aberto:    tickets.filter((t) => t.status === "aberto").length,
    andamento: tickets.filter((t) => t.status === "andamento").length,
    concluido: tickets.filter((t) => t.status === "concluido").length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-graphite-50 pb-20">
      {/* Topbar */}
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center justify-between">
        <BrandLockup size={32} />
        <form action="/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">Sair</Button>
        </form>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl w-full mx-auto">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gold-600 mb-1">
          Painel do funcionário
        </div>
        <h1 className="text-2xl font-bold text-graphite-900 tracking-tight">Meus chamados</h1>
        <p className="text-sm text-graphite-500 mt-1 mb-5">
          Olá, {profile.nome?.split(" ")[0] ?? "colaborador"} — acompanhe seus pedidos.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <MiniStat label="Abertos"      value={stats.aberto}    tone="warn" />
          <MiniStat label="Em andamento" value={stats.andamento} tone="info" />
          <MiniStat label="Concluídos"   value={stats.concluido} tone="success" />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {filtros.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${
                filter === f.id
                  ? "bg-graphite-900 text-white border-graphite-900"
                  : "bg-white text-graphite-700 border-graphite-200 hover:border-graphite-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-graphite-400 text-3xl mb-2">📋</div>
              <div className="font-semibold text-graphite-900 mb-1">Nenhum chamado por aqui</div>
              <div className="text-sm text-graphite-500 mb-4">
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

function MiniStat({ label, value, tone }: { label: string; value: number; tone: "warn" | "info" | "success" }) {
  const toneClasses = {
    warn:    "text-gold-700 bg-gold-50",
    info:    "text-graphite-700 bg-graphite-100",
    success: "text-emerald-700 bg-emerald-50",
  };
  return (
    <div className={`rounded-lg p-3 ${toneClasses[tone]}`}>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-[11px] font-medium mt-1">{label}</div>
    </div>
  );
}

function TicketCard({ ticket, unidades }: { ticket: Ticket; unidades: Record<number, string> }) {
  return (
    <Link href={`/chamados/${ticket.id}`} className="block">
      <Card className="hover:border-graphite-300 transition-colors cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <ClassBadge classe={ticket.classe} />
          <StatusPill status={ticket.status} />
        </div>
        <div className="font-semibold text-graphite-900 mb-1">{ticket.titulo}</div>
        {ticket.unidade_id && unidades[ticket.unidade_id] && (
          <div className="text-xs text-graphite-500 mb-2">{unidades[ticket.unidade_id]}</div>
        )}
        <div className="bg-graphite-50 rounded-md p-3 text-[13px] text-graphite-700 space-y-0.5">
          {Object.entries(ticket.campos).slice(0, 3).map(([k, v]) => (
            <div key={k}>
              <span className="text-graphite-500 inline-block w-32">{k}:</span> {v}
            </div>
          ))}
        </div>
        <div className="text-xs text-graphite-400 mt-2">
          Aberto em {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
        </div>
      </Card>
    </Link>
  );
}
