"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  RejectTicketSchema,
  UuidSchema,
  AddTicketAttachmentSchema,
  TicketAttachmentIdSchema,
  firstZodMessage,
  type CreateTicketInput,
  type UpdateTicketInput,
  type RejectTicketInput,
  type AddTicketAttachmentInput,
} from "@/lib/schemas";
import type { TicketEventTipo } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TICKET_ATTACHMENTS_BUCKET } from "@/lib/ticketAttachments";
import { userFacingDbError } from "@/lib/dbErrors";

/** Insere um event de auditoria. */
async function insertEvent(
  supabase: SupabaseClient,
  ticketId: string,
  atorId: string,
  tipo: TicketEventTipo,
  detalhes: Record<string, unknown> = {}
) {
  await supabase.from("livecare_ticket_events").insert({
    ticket_id: ticketId,
    ator_id: atorId,
    tipo,
    detalhes,
  });
}

/** Cria um novo chamado em nome do usuário autenticado. */
export async function createTicket(input: CreateTicketInput) {
  const parsed = CreateTicketSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const v = parsed.data;
  const { data: created, error } = await supabase
    .from("livecare_tickets")
    .insert({
      autor_id: user.id,
      classe: v.classe,
      titulo: v.titulo,
      campos: v.campos,
      observacao: v.observacao,
      unidade_id: v.unidade_id,
      prioridade: v.prioridade,
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Falha ao criar chamado." };

  await insertEvent(supabase, created.id, user.id, "aberto", { classe: v.classe });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Edita o chamado pelo próprio autor enquanto está aberto. */
export async function updateTicket(input: UpdateTicketInput) {
  const parsed = UpdateTicketSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const v = parsed.data;
  const { error } = await supabase
    .from("livecare_tickets")
    .update({
      titulo: v.titulo,
      campos: v.campos,
      observacao: v.observacao,
      unidade_id: v.unidade_id,
      prioridade: v.prioridade,
    })
    .eq("id", v.ticketId);

  if (error) return { error: userFacingDbError(error) };

  await insertEvent(supabase, v.ticketId, user.id, "editado");

  revalidatePath("/dashboard");
  revalidatePath(`/chamados/${v.ticketId}`);
  return { ok: true };
}

/** Funcionário cancela o próprio chamado enquanto está aberto. */
export async function cancelTicket(ticketId: string) {
  const parsed = UuidSchema.safeParse(ticketId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Guard: só permite cancelar se ainda está aberto (impede race)
  const { data, error } = await supabase
    .from("livecare_tickets")
    .update({ status: "cancelado" })
    .eq("id", parsed.data)
    .eq("status", "aberto")
    .select("id")
    .maybeSingle();

  if (error) return { error: userFacingDbError(error) };
  if (!data) return { error: "Chamado não pode mais ser cancelado (estado mudou)." };

  await insertEvent(supabase, parsed.data, user.id, "cancelado");

  revalidatePath("/dashboard");
  revalidatePath(`/chamados/${parsed.data}`);
  return { ok: true };
}

/** Admin coloca em andamento. */
export async function setEmAndamento(ticketId: string) {
  const parsed = UuidSchema.safeParse(ticketId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Guard: só sai de 'aberto' pra 'andamento'
  const { data, error } = await supabase
    .from("livecare_tickets")
    .update({ status: "andamento" })
    .eq("id", parsed.data)
    .eq("status", "aberto")
    .select("id")
    .maybeSingle();

  if (error) return { error: userFacingDbError(error) };
  if (!data) return { error: "Status do chamado mudou — recarregue a página." };

  await insertEvent(supabase, parsed.data, user.id, "andamento");

  revalidatePath("/dashboard");
  revalidatePath(`/chamados/${parsed.data}`);
  return { ok: true };
}

/** Admin marca como concluído. */
export async function concluirTicket(ticketId: string) {
  const parsed = UuidSchema.safeParse(ticketId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Guard: só conclui de 'aberto' ou 'andamento'
  const { data, error } = await supabase
    .from("livecare_tickets")
    .update({
      status: "concluido",
      concluido_em: new Date().toISOString(),
      concluido_por: user.id,
    })
    .eq("id", parsed.data)
    .in("status", ["aberto", "andamento"])
    .select("id")
    .maybeSingle();

  if (error) return { error: userFacingDbError(error) };
  if (!data) return { error: "Chamado já está fechado — recarregue a página." };

  await insertEvent(supabase, parsed.data, user.id, "concluido");

  revalidatePath("/dashboard");
  revalidatePath(`/chamados/${parsed.data}`);
  return { ok: true };
}

/** Admin reabre um chamado fechado (concluído/rejeitado/cancelado). */
export async function reopenTicket(ticketId: string) {
  const parsed = UuidSchema.safeParse(ticketId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Guard: só reabre se estava fechado
  const { data, error } = await supabase
    .from("livecare_tickets")
    .update({
      status: "aberto",
      concluido_em: null,
      concluido_por: null,
    })
    .eq("id", parsed.data)
    .in("status", ["concluido", "cancelado", "rejeitado"])
    .select("id")
    .maybeSingle();

  if (error) return { error: userFacingDbError(error) };
  if (!data) return { error: "Chamado já está aberto — recarregue a página." };

  await insertEvent(supabase, parsed.data, user.id, "reaberto");

  revalidatePath("/dashboard");
  revalidatePath(`/chamados/${parsed.data}`);
  return { ok: true };
}

/* ============================================================
   ANEXOS DE CHAMADOS
   ============================================================ */

/**
 * Registra um anexo de chamado. Pré-requisito: o arquivo já foi feito upload
 * pelo client no bucket `livecare-tickets` em `<ticketId>/<uuid>.<ext>`.
 *
 * RLS já garante que só o autor do chamado (ou admin) consegue inserir.
 */
export async function addTicketAttachment(input: AddTicketAttachmentInput) {
  const parsed = AddTicketAttachmentSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const v = parsed.data;
  const { error } = await supabase.from("livecare_ticket_attachments").insert({
    ticket_id: v.ticketId,
    autor_id: user.id,
    path: v.path,
    type: v.type,
    size: v.size,
  });

  if (error) return { error: userFacingDbError(error) };

  revalidatePath(`/chamados/${v.ticketId}`);
  return { ok: true };
}

/** Remove um anexo (apenas o próprio autor do anexo ou admin — RLS valida). */
export async function removeTicketAttachment(attachmentId: number) {
  const parsed = TicketAttachmentIdSchema.safeParse(attachmentId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Pega o registro primeiro pra saber o path (pra limpar do Storage depois)
  const { data: att, error: selErr } = await supabase
    .from("livecare_ticket_attachments")
    .select("id, ticket_id, path")
    .eq("id", parsed.data)
    .maybeSingle<{ id: number; ticket_id: string; path: string }>();

  if (selErr) return { error: selErr.message };
  if (!att) return { error: "Anexo não encontrado." };

  // Apaga o registro (RLS garante permissão)
  const { error: delErr } = await supabase
    .from("livecare_ticket_attachments")
    .delete()
    .eq("id", parsed.data);

  if (delErr) return { error: delErr.message };

  // Best-effort: remove o arquivo do Storage
  await supabase.storage.from(TICKET_ATTACHMENTS_BUCKET).remove([att.path]);

  revalidatePath(`/chamados/${att.ticket_id}`);
  return { ok: true };
}

/** Admin rejeita um chamado com motivo obrigatório. */
export async function rejectTicket(input: RejectTicketInput) {
  const parsed = RejectTicketSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const v = parsed.data;
  // Guard: só rejeita se ainda está em aberto/andamento
  const { data, error } = await supabase
    .from("livecare_tickets")
    .update({ status: "rejeitado" })
    .eq("id", v.ticketId)
    .in("status", ["aberto", "andamento"])
    .select("id")
    .maybeSingle();

  if (error) return { error: userFacingDbError(error) };
  if (!data) return { error: "Chamado já está fechado — recarregue a página." };

  await insertEvent(supabase, v.ticketId, user.id, "rejeitado", { motivo: v.motivo });

  revalidatePath("/dashboard");
  revalidatePath(`/chamados/${v.ticketId}`);
  return { ok: true };
}
