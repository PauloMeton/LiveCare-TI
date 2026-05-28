import { getCurrentUser } from "@/lib/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { FuncDashboard } from "@/components/dashboards/FuncDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Auth + supabase em paralelo
  const [{ profile }, supabase] = await Promise.all([
    getCurrentUser(),
    createClient(),
  ]);

  // RLS ja filtra (funcionario ve so os proprios, admin ve todos)
  const { data: tickets } = await supabase
    .from("livecare_tickets")
    .select(
      "id, autor_id, classe, titulo, campos, observacao, status, prioridade, unidade_id, created_at, updated_at, concluido_em, concluido_por"
    )
    .order("created_at", { ascending: false });

  const ts = tickets ?? [];
  const isAdmin = profile.role === "admin";

  // Coleta IDs unicos
  const autorIds = isAdmin ? Array.from(new Set(ts.map((t) => t.autor_id))) : [];
  const unidadeIds = Array.from(
    new Set(ts.map((t) => t.unidade_id).filter((x): x is number => x !== null))
  );

  // Profiles + unidades em paralelo
  const [profsRes, unidadesRes] = await Promise.all([
    autorIds.length
      ? supabase.from("profiles").select("id, nome, cargo").in("id", autorIds)
      : Promise.resolve({ data: null }),
    unidadeIds.length
      ? supabase.from("unidades").select("id, nome").in("id", unidadeIds)
      : Promise.resolve({ data: null }),
  ]);

  const autores: Record<string, { nome: string | null; cargo: string | null }> = {};
  profsRes.data?.forEach(
    (p: { id: string; nome: string | null; cargo: string | null }) => {
      autores[p.id] = { nome: p.nome, cargo: p.cargo };
    }
  );

  const unidades: Record<number, string> = {};
  unidadesRes.data?.forEach((u: { id: number; nome: string }) => {
    unidades[u.id] = u.nome;
  });

  if (isAdmin) {
    return (
      <AdminDashboard
        profile={profile}
        tickets={ts}
        autores={autores}
        unidades={unidades}
      />
    );
  }

  return <FuncDashboard profile={profile} tickets={ts} unidades={unidades} />;
}
