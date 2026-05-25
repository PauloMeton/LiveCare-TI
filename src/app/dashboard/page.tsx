import { getCurrentUser } from "@/lib/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { FuncDashboard } from "@/components/dashboards/FuncDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUser();
  const supabase = await createClient();

  // RLS já filtra (funcionário vê só os próprios, admin vê todos)
  const { data: tickets } = await supabase
    .from("livecare_tickets")
    .select(
      "id, autor_id, classe, titulo, campos, observacao, status, prioridade, unidade_id, created_at, updated_at, concluido_em, concluido_por"
    )
    .order("created_at", { ascending: false });

  // Pra admin: trazer nome do autor de cada ticket
  let autores: Record<string, { nome: string | null; cargo: string | null }> = {};
  let unidades: Record<number, string> = {};
  if (profile.role === "admin" && tickets && tickets.length > 0) {
    const autorIds = Array.from(new Set(tickets.map((t) => t.autor_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nome, cargo")
      .in("id", autorIds);
    profs?.forEach((p) => (autores[p.id] = { nome: p.nome, cargo: p.cargo }));

    const unidadeIds = Array.from(
      new Set(tickets.map((t) => t.unidade_id).filter((x): x is number => x !== null))
    );
    if (unidadeIds.length) {
      const { data: us } = await supabase.from("unidades").select("id, nome").in("id", unidadeIds);
      us?.forEach((u) => (unidades[u.id] = u.nome));
    }
  } else if (tickets && tickets.length > 0) {
    // Func: só busca nomes de unidades pros próprios tickets
    const unidadeIds = Array.from(
      new Set(tickets.map((t) => t.unidade_id).filter((x): x is number => x !== null))
    );
    if (unidadeIds.length) {
      const { data: us } = await supabase.from("unidades").select("id, nome").in("id", unidadeIds);
      us?.forEach((u) => (unidades[u.id] = u.nome));
    }
  }

  if (profile.role === "admin") {
    return (
      <AdminDashboard
        profile={profile}
        tickets={tickets ?? []}
        autores={autores}
        unidades={unidades}
      />
    );
  }

  return <FuncDashboard profile={profile} tickets={tickets ?? []} unidades={unidades} />;
}
