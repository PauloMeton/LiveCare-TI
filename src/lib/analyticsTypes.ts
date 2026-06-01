// Tipos do JSON retornado por livecare_analytics()

export type AnalyticsKpis = {
  total: number;
  abertos: number;
  em_andamento: number;
  concluidos: number;
  cancelados: number;
  rejeitados: number;
  tempo_medio_horas: number | null;
  sla_24h_pct: number | null;
  /** Chamados abertos/andamento que passaram de 50% do prazo, mas não venceram. */
  em_risco: number;
  /** Chamados abertos/andamento que já passaram do prazo. */
  vencidos: number;
};

export type StatusCount = { status: string; total: number };
export type ClasseCount = { classe: string; total: number };
export type MesPoint = { mes: string; total: number; concluidos: number };
export type UnidadeCount = { unidade: string; total: number };
export type AutorCount = { nome: string; total: number };

export type AnalyticsData = {
  periodo_dias: number;
  kpis: AnalyticsKpis;
  por_status: StatusCount[];
  por_classe: ClasseCount[];
  por_mes: MesPoint[];
  top_unidades: UnidadeCount[];
  top_autores: AutorCount[];
};
