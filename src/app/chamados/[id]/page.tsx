import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { TicketDetail } from "@/components/tickets/TicketDetail";
import type { Ticket, TicketEvent, TicketAttachment } from "@/lib/types";
import { attachTicketSignedUrls } from "@/lib/ticketAttachments";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ChamadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // Auth + supabase em paralelo
  const [{ user, profile }, supabase] = await Promise.all([
    getCurrentUser(),
    createClient(),
  ]);

  // Ticket + events + attachments em paralelo
  const [ticketRes, eventsRes, attsRes] = await Promise.all([
    supabase
      .from("livecare_tickets")
      .select(
        "id, autor_id, classe, titulo, campos, observacao, status, prioridade, unidade_id, created_at, updated_at, concluido_em, concluido_por"
      )
      .eq("id", id)
      .maybeSingle<Ticket>(),
    supabase
      .from("livecare_ticket_events")
      .select("id, ticket_id, ator_id, tipo, detalhes, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("livecare_ticket_attachments")
      .select("id, ticket_id, autor_id, path, type, size, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const ticket = ticketRes.data;
  if (!ticket) notFound();

  const events = (eventsRes.data ?? []) as TicketEvent[];
  const attsRaw = (attsRes.data ?? []) as TicketAttachment[];

  // Profiles + unidade + signed URLs em paralelo
  const actorIds = Array.from(
    new Set([
      ticket.autor_id,
      ...(events.map((e) => e.ator_id).filter(Boolean) as string[]),
    ])
  );

  const [profsRes, unidadeRes, attachments] = await Promise.all([
    supabase.from("profiles").select("id, nome, cargo").in("id", actorIds),
    ticket.unidade_id
      ? supabase
          .from("unidades")
          .select("nome")
          .eq("id", ticket.unidade_id)
          .maybeSingle<{ nome: string }>()
      : Promise.resolve({ data: null }),
    attachTicketSignedUrls(supabase, attsRaw),
  ]);

  const profilesMap: Record<string, { nome: string | null; cargo: string | null }> = {};
  profsRes.data?.forEach(
    (p: { id: string; nome: string | null; cargo: string | null }) => {
      profilesMap[p.id] = { nome: p.nome, cargo: p.cargo };
    }
  );

  const unidadeNome = unidadeRes.data?.nome ?? null;

  return (
    <TicketDetail
      ticket={ticket}
      events={events}
      attachments={attachments}
      profiles={profilesMap}
      unidadeNome={unidadeNome}
      currentUserId={user.id}
      isAdmin={profile.role === "admin"}
    />
  );
}
