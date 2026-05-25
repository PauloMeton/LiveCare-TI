"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  RejectTicketSchema,
  UuidSchema,
  firstZodMessage,
  type CreateTicketInput,
  type UpdateTicketInput,
  type RejectTicketInput,
} from "@/lib/schemas";
import type { TicketEventTipo } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

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

  if (error) return { error: error.message };

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

  const { error } = await supabase
    .from("livecare_tickets")
    .update({ status: "cancelado" })
    .eq("id", parsed.data);

  if (error) return { error: error.message };

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

  const { error } = await supabase
    .from("livecare_tickets")
    .update({ status: "andamento" })
    .eq("id", parsed.data);

  if (error) return { error: error.message };

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

  const { error } = await supabase
    .from("livecare_tickets")
    .update({
      status: "concluido",
      concluido_em: new Date().toISOString(),
      concluido_por: user.id,
    })
    .eq("id", parsed.data);

  if (error) return { error: error.message };

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

  const { error } = await supabase
    .from("livecare_tickets")
    .update({
      status: "aberto",
      concluido_em: null,
      concluido_por: null,
    })
    .eq("id", parsed.data);

  if (error) return { error: error.message };

  await insertEvent(supabase, parsed.data, user.id, "reaberto");

  revalidatePath("/dashboard");
  revalidatePath(`/chamados/${parsed.data}`);
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
  const { error } = await supabase
    .from("livecare_tickets")
    .update({ status: "rejeitado" })
    .eq("id", v.ticketId);

  if (error) return { error: error.message };

  await insertEvent(supabase, v.ticketId, user.id, "rejeitado", { motivo: v.motivo });

  revalidatePath("/dashboard");
  revalidatePath(`/chamados/${v.ticketId}`);
  return { ok: true };
}
