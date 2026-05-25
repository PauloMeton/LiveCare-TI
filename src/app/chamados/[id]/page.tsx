import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { TicketDetail } from "@/components/tickets/TicketDetail";
import type { Ticket, TicketEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChamadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) notFound();

  const { user, profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("livecare_tickets")
    .select(
      "id, autor_id, classe, titulo, campos, observacao, status, prioridade, unidade_id, created_at, updated_at, concluido_em, concluido_por"
    )
    .eq("id", id)
    .maybeSingle<Ticket>();

  if (!ticket) notFound();

  // Eventos do chamado (timeline)
  const { data: events } = await supabase
    .from("livecare_ticket_events")
    .select("id, ticket_id, ator_id, tipo, detalhes, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  // Profiles de todos os atores envolvidos (autor + atores dos events)
  const actorIds = Array.from(
    new Set([ticket.autor_id, ...(events ?? []).map((e) => e.ator_id).filter(Boolean) as string[]])
  );
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, nome, cargo")
    .in("id", actorIds);
  const profilesMap: Record<string, { nome: string | null; cargo: string | null }> = {};
  profs?.forEach((p) => (profilesMap[p.id] = { nome: p.nome, cargo: p.cargo }));

  // Unidade
  let unidadeNome: string | null = null;
  if (ticket.unidade_id) {
    const { data: u } = await supabase
      .from("unidades")
      .select("nome")
      .eq("id", ticket.unidade_id)
      .maybeSingle();
    unidadeNome = u?.nome ?? null;
  }

  return (
    <TicketDetail
      ticket={ticket}
      events={(events ?? []) as TicketEvent[]}
      profiles={profilesMap}
      unidadeNome={unidadeNome}
      currentUserId={user.id}
      isAdmin={profile.role === "admin"}
    />
  );
}
