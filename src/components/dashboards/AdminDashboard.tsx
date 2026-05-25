"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Profile, Ticket, Classe, Status } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Input, Select } from "@/components/ui/Field";

export function AdminDashboard({
  profile,
  tickets,
  autores,
  unidades,
}: {
  profile: Profile;
  tickets: Ticket[];
  autores: Record<string, { nome: string | null; cargo: string | null }>;
  unidades: Record<number, string>;
}) {
  const [filterClasse, setFilterClasse] = useState<"todas" | Classe>("todas");
  const [filterStatus, setFilterStatus] = useState<"todos" | Status>("todos");
  const [filterDate, setFilterDate] = useState<string>("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filterClasse !== "todas" && t.classe !== filterClasse) return false;
      if (filterStatus !== "todos" && t.status !== filterStatus) return false;
      if (filterDate) {
        const day = new Date(t.created_at).toISOString().slice(0, 10);
        if (day !== filterDate) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const nome = autores[t.autor_id]?.nome?.toLowerCase() ?? "";
        if (!nome.includes(q) && !t.titulo.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tickets, filterClasse, filterStatus, filterDate, query, autores]);

  const stats = {
    aberto:    tickets.filter((t) => t.status === "aberto").length,
    andamento: tickets.filter((t) => t.status === "andamento").length,
    concluido: tickets.filter((t) => t.status === "concluido").length,
  };

  return (
    <div className="min-h-screen flex bg-graphite-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-graphite-200 flex flex-col">
        <div className="px-5 py-5 border-b border-graphite-200">
          <BrandLockup size={36} />
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <SidebarItem active label="Chamados" href="/dashboard" />
          <SidebarItem label="Usuários" href="/admin/usuarios" />
          <SidebarItem label="Chat" href="/admin/chat" />
          <SidebarItem label="Meu perfil" href="/perfil" />
        </nav>
        <div className="px-3 py-3 border-t border-graphite-200">
          <div className="px-3 py-2 mb-2 text-[12px] text-graphite-600">
            <div className="font-semibold text-graphite-900">{profile.nome}</div>
            <div className="text-[11px] text-gold-700">Suporte TI · Admin</div>
          </div>
          <form action="/logout" method="POST">
            <Button variant="ghost" full size="sm" type="submit">Sair</Button>
          </form>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto p-8 max-w-[1400px]">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gold-600 mb-1">
              Suporte TI · Painel
            </div>
            <h1 className="text-3xl font-bold text-graphite-900 tracking-tight mb-1">
              Gerenciamento de chamados
            </h1>
            <p className="text-sm text-graphite-500">
              Filtre, acompanhe e marque chamados como concluídos.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => exportTicketsToCsv(filtered, autores, unidades)}
            disabled={filtered.length === 0}
            title={filtered.length === 0 ? "Sem chamados para exportar" : undefined}
          >
            Exportar CSV ({filtered.length})
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Abertos"      value={stats.aberto}    tone="warn" />
          <StatCard label="Em andamento" value={stats.andamento} tone="info" />
          <StatCard label="Concluídos"   value={stats.concluido} tone="success" />
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[12px] font-medium text-graphite-600">Data</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite-600">Classe</label>
              <Select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value as typeof filterClasse)}>
                <option value="todas">Todas</option>
                <option value="RH">RH</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Operacoes">Operações</option>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite-600">Status</label>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}>
                <option value="todos">Todos</option>
                <option value="aberto">Aberto</option>
                <option value="andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
                <option value="rejeitado">Rejeitado</option>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite-600">Busca</label>
              <Input
                type="search"
                placeholder="Nome ou título…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Lista */}
        {filtered.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-graphite-500">
              Nenhum chamado encontrado com esses filtros.
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((t) => (
              <AdminTicketCard
                key={t.id}
                ticket={t}
                autor={autores[t.autor_id]}
                unidadeNome={t.unidade_id ? unidades[t.unidade_id] : undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({
  label,
  active,
  disabled,
  hint,
  href,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  hint?: string;
  href?: string;
}) {
  const cls = `px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between ${
    active
      ? "bg-graphite-900 text-white"
      : disabled
      ? "text-graphite-400 cursor-not-allowed"
      : "text-graphite-700 hover:bg-graphite-100 cursor-pointer"
  }`;
  const content = (
    <>
      <span>{label}</span>
      {hint && <span className="text-[10px] uppercase tracking-wider">{hint}</span>}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return <div className={cls}>{content}</div>;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "warn" | "info" | "success" }) {
  const toneClasses = {
    warn:    "bg-gold-50 border-gold-200 text-gold-700",
    info:    "bg-white border-graphite-200 text-graphite-700",
    success: "bg-emerald-50 border-emerald-100 text-emerald-700",
  };
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div className="text-[11px] uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-3xl font-bold mt-2 leading-none text-graphite-900">{value}</div>
    </div>
  );
}

function AdminTicketCard({
  ticket,
  autor,
  unidadeNome,
}: {
  ticket: Ticket;
  autor?: { nome: string | null; cargo: string | null };
  unidadeNome?: string;
}) {
  return (
    <Link href={`/chamados/${ticket.id}`} className="block">
      <Card
        className={`hover:border-graphite-300 transition-colors cursor-pointer ${
          ticket.status === "concluido" || ticket.status === "cancelado" || ticket.status === "rejeitado"
            ? "opacity-60"
            : ""
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-semibold text-graphite-900">{autor?.nome ?? "—"}</div>
              <div className="text-xs text-graphite-500">
                {unidadeNome ?? "Sem unidade"} · {new Date(ticket.created_at).toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClassBadge classe={ticket.classe} />
            <StatusPill status={ticket.status} />
          </div>
        </div>

        <div className="font-semibold text-graphite-900 mb-2">{ticket.titulo}</div>

        <div className="bg-graphite-50 rounded-md p-3 text-[13px] text-graphite-700 grid grid-cols-2 gap-y-1 gap-x-4">
          {Object.entries(ticket.campos).slice(0, 4).map(([k, v]) => (
            <div key={k}>
              <span className="text-graphite-500">{k}:</span> {v}
            </div>
          ))}
        </div>

        {(ticket.status === "aberto" || ticket.status === "andamento") && (
          <div className="mt-3 text-xs text-gold-700 font-medium">
            Clique para ver detalhes e atender →
          </div>
        )}
      </Card>
    </Link>
  );
}

/* ============================================================
   EXPORTAÇÃO CSV
   ============================================================ */

const STATUS_LABEL: Record<Status, string> = {
  aberto: "Aberto",
  andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  rejeitado: "Rejeitado",
};
const CLASSE_LABEL: Record<Classe, string> = {
  RH: "RH",
  Financeiro: "Financeiro",
  Operacoes: "Operações",
};

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes(";")) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

function ticketsToCsv(
  tickets: Ticket[],
  autores: Record<string, { nome: string | null; cargo: string | null }>,
  unidades: Record<number, string>
): string {
  const headers = [
    "ID",
    "Aberto em",
    "Última atualização",
    "Classe",
    "Status",
    "Prioridade",
    "Título",
    "Autor",
    "Cargo do autor",
    "Unidade",
    "Observação",
    "Campos",
    "Concluído em",
  ];

  const rows = tickets.map((t) => {
    const autor = autores[t.autor_id];
    const unidade = t.unidade_id ? unidades[t.unidade_id] : "";
    const camposStr = Object.entries(t.campos)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
    return [
      t.id.slice(0, 8),
      new Date(t.created_at).toLocaleString("pt-BR"),
      new Date(t.updated_at).toLocaleString("pt-BR"),
      CLASSE_LABEL[t.classe],
      STATUS_LABEL[t.status],
      t.prioridade,
      t.titulo,
      autor?.nome ?? "",
      autor?.cargo ?? "",
      unidade ?? "",
      t.observacao ?? "",
      camposStr,
      t.concluido_em ? new Date(t.concluido_em).toLocaleString("pt-BR") : "",
    ]
      .map((v) => escapeCsv(String(v)))
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function exportTicketsToCsv(
  tickets: Ticket[],
  autores: Record<string, { nome: string | null; cargo: string | null }>,
  unidades: Record<number, string>
) {
  if (tickets.length === 0) return;
  const csv = ticketsToCsv(tickets, autores, unidades);
  // BOM UTF-8 — Excel reconhece acentos
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `livecare-chamados-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
