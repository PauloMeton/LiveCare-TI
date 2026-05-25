import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { EditTicketForm } from "@/components/tickets/EditTicketForm";
import type { Ticket } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) notFound();

  const { user } = await getCurrentUser();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("livecare_tickets")
    .select(
      "id, autor_id, classe, titulo, campos, observacao, status, prioridade, unidade_id, created_at, updated_at, concluido_em, concluido_por"
    )
    .eq("id", id)
    .maybeSingle<Ticket>();

  if (!ticket) notFound();

  // Só o próprio autor edita, e só enquanto está aberto
  if (ticket.autor_id !== user.id || ticket.status !== "aberto") {
    redirect(`/chamados/${id}`);
  }

  const { data: unidades } = await supabase
    .from("unidades")
    .select("id, nome")
    .eq("ativa", true)
    .order("nome");

  return <EditTicketForm ticket={ticket} unidades={unidades ?? []} />;
}
