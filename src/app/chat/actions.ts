"use server";

import { createClient } from "@/lib/supabase/server";
import {
  SendMessageSchema,
  MessageIdSchema,
  UuidSchema,
  firstZodMessage,
  type SendMessageInput,
} from "@/lib/schemas";

/* ============================================================
   ENVIAR MENSAGEM
   ============================================================ */
export async function sendMessage(input: SendMessageInput) {
  const parsed = SendMessageSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("livecare_messages").insert({
    conversa_id: parsed.data.conversaId,
    autor_id: user.id,
    conteudo: parsed.data.conteudo,
  });

  if (error) return { error: error.message };
  // Sem revalidate — o Realtime cuida da atualização ao vivo
  return { ok: true };
}

/* ============================================================
   MARCAR CONVERSA COMO LIDA
   (marca read_at em todas as mensagens da OUTRA parte na conversa)
   ============================================================ */
export async function markConversationRead(conversaId: string) {
  const parsed = UuidSchema.safeParse(conversaId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("livecare_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversa_id", parsed.data)
    .neq("autor_id", user.id)
    .is("read_at", null)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  return { ok: true };
}

/* ============================================================
   EXCLUIR PRÓPRIA MENSAGEM (soft delete)
   ============================================================ */
export async function deleteOwnMessage(messageId: number) {
  const parsed = MessageIdSchema.safeParse(messageId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Só permite deletar a própria mensagem (RLS + checagem dupla aqui)
  const { error } = await supabase
    .from("livecare_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("autor_id", user.id);

  if (error) return { error: error.message };
  return { ok: true };
}
