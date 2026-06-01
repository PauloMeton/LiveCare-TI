"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Card } from "@/components/ui/Card";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import type { Profile } from "@/lib/types";
import type { AnalyticsData } from "@/lib/analyticsTypes";

type Props = {
  profile: Profile;
  periodo: number;
  data: AnalyticsData | null;
};

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  rejeitado: "Rejeitado",
};
const STATUS_COLOR: Record<string, string> = {
  aberto: "#ffcc00",
  andamento: "#3266ad",
  concluido: "#0e8a4a",
  cancelado: "#9a9a9a",
  rejeitado: "#b8392c",
};

const CLASSE_COLOR: Record<string, string> = {
  RH: "#7C3AED",
  Financeiro: "#0E8A4A",
  Operacoes: "#C79B00",
};

export function AnalyticsDashboard({ profile, periodo, data }: Props) {
  const router = useRouter();

  function setPeriodo(d: number) {
    router.push(`/admin/analytics?d=${d}`);
  }

  const kpis = data?.kpis;
  const porStatus = (data?.por_status ?? []).map((x) => ({
    ...x,
    label: STATUS_LABEL[x.status] ?? x.status,
    color: STATUS_COLOR[x.status] ?? "#888",
  }));
  const porClasse = (data?.por_classe ?? []).map((x) => ({
    ...x,
    color: CLASSE_COLOR[x.classe] ?? "#888",
  }));
  const porMes = data?.por_mes ?? [];
  const topUnidades = data?.top_unidades ?? [];
  const topAutores = data?.top_autores ?? [];

  return (
    <div className="min-h-screen bg-graphite-50">
      {/* Realtime: refresh em qualquer mudança de ticket */}
      <RealtimeRefresher
        subs={[
          {
            channel: "analytics-tickets",
            table: "livecare_tickets",
          },
        ]}
      />

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-graphite-200 flex flex-col flex-shrink-0">
          <div className="px-5 py-4 border-b border-graphite-100">
            <BrandLockup size={32} />
          </div>
          <nav className="flex-1 p-3 space-y-1 text-sm">
            <SidebarItem label="Chamados" href="/dashboard" />
            <SidebarItem label="Usuários" href="/admin/usuarios" />
            <SidebarItem label="Chat" href="/admin/chat" />
            <SidebarItem active label="Analytics" href="/admin/analytics" />
            <SidebarItem label="Meu perfil" href="/perfil" />
          </nav>
          <div className="px-5 py-3 border-t border-graphite-100 text-[11px] text-graphite-500">
            {profile.nome ?? "Admin"}
            {profile.lider && (
              <span className="ml-2 inline-block bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded">
                líder
              </span>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-graphite-900">Analytics</h1>
                <div className="text-sm text-graphite-500 mt-0.5">
                  Visão geral dos chamados nos últimos {periodo} dias
                </div>
              </div>
              <div className="flex gap-2">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPeriodo(d)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                      periodo === d
                        ? "bg-graphite-900 text-white border-graphite-900"
                        : "bg-white text-graphite-700 border-graphite-200 hover:border-graphite-400"
                    }`}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
            </div>

            {!data || !kpis ? (
              <Card>
                <div className="text-sm text-graphite-500 py-8 text-center">
                  Sem dados disponíveis pra esse período.
                </div>
              </Card>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <KpiCard label="Total" value={kpis.total} tone="info" />
                  <KpiCard label="Abertos" value={kpis.abertos} tone="warn" />
                  <KpiCard label="Em andamento" value={kpis.em_andamento} tone="info" />
                  <KpiCard label="Concluídos" value={kpis.concluidos} tone="success" />
                  <KpiCard
                    label="Tempo médio de resolução"
                    value={
                      kpis.tempo_medio_horas !== null
                        ? `${kpis.tempo_medio_horas}h`
                        : "—"
                    }
                    tone="info"
                  />
                  <KpiCard
                    label="SLA 24h"
                    value={
                      kpis.sla_24h_pct !== null ? `${kpis.sla_24h_pct}%` : "—"
                    }
                    tone={
                      kpis.sla_24h_pct !== null && kpis.sla_24h_pct >= 80
                        ? "success"
                        : "warn"
                    }
                  />
                  <KpiCard label="Cancelados" value={kpis.cancelados} tone="neutral" />
                  <KpiCard label="Rejeitados" value={kpis.rejeitados} tone="danger" />
                </div>

                {/* Linha do tempo: chamados por mês */}
                <Card className="mb-4">
                  <div className="text-sm font-semibold text-graphite-900 mb-3">
                    Chamados por mês (últimos 6 meses)
                  </div>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={porMes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          name="Total abertos"
                          stroke="#1a1a1a"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="concluidos"
                          name="Concluídos"
                          stroke="#0e8a4a"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Donut por status */}
                  <Card>
                    <div className="text-sm font-semibold text-graphite-900 mb-3">
                      Por status
                    </div>
                    {porStatus.length === 0 ? (
                      <div className="text-sm text-graphite-500 py-12 text-center">
                        Sem dados.
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: 240 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={porStatus}
                              dataKey="total"
                              nameKey="label"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                            >
                              {porStatus.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card>

                  {/* Bar por classe */}
                  <Card>
                    <div className="text-sm font-semibold text-graphite-900 mb-3">
                      Por classe
                    </div>
                    {porClasse.length === 0 ? (
                      <div className="text-sm text-graphite-500 py-12 text-center">
                        Sem dados.
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: 240 }}>
                        <ResponsiveContainer>
                          <BarChart data={porClasse}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="classe" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="total" name="Chamados">
                              {porClasse.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top unidades */}
                  <Card>
                    <div className="text-sm font-semibold text-graphite-900 mb-3">
                      Top 5 unidades
                    </div>
                    {topUnidades.length === 0 ? (
                      <div className="text-sm text-graphite-500 py-6 text-center">
                        Sem dados.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {topUnidades.map((u) => (
                          <li
                            key={u.unidade}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-graphite-700 truncate flex-1 mr-2">
                              {u.unidade}
                            </span>
                            <span className="font-semibold text-graphite-900">
                              {u.total}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>

                  {/* Top autores */}
                  <Card>
                    <div className="text-sm font-semibold text-graphite-900 mb-3">
                      Top 5 solicitantes
                    </div>
                    {topAutores.length === 0 ? (
                      <div className="text-sm text-graphite-500 py-6 text-center">
                        Sem dados.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {topAutores.map((a) => (
                          <li
                            key={a.nome}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-graphite-700 truncate flex-1 mr-2">
                              {a.nome}
                            </span>
                            <span className="font-semibold text-graphite-900">
                              {a.total}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Componentes auxiliares ---------- */

function SidebarItem({
  active,
  label,
  href,
}: {
  active?: boolean;
  label: string;
  href: string;
}) {
  const cls = `flex items-center justify-between px-3 py-2 rounded-md ${
    active
      ? "bg-graphite-100 text-graphite-900 font-medium"
      : "text-graphite-700 hover:bg-graphite-100"
  }`;
  return (
    <Link href={href} prefetch={true} className={cls}>
      <span>{label}</span>
    </Link>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "info" | "warn" | "success" | "danger" | "neutral";
}) {
  const toneClasses: Record<typeof tone, string> = {
    info: "bg-white border-graphite-200 text-graphite-900",
    warn: "bg-gold-50 border-gold-200 text-gold-900",
    success: "bg-emerald-50 border-emerald-100 text-emerald-900",
    danger: "bg-red-50 border-red-100 text-red-900",
    neutral: "bg-graphite-50 border-graphite-200 text-graphite-900",
  };
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div className="text-[11px] uppercase tracking-wide font-semibold text-graphite-600">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 leading-none">{value}</div>
    </div>
  );
}
