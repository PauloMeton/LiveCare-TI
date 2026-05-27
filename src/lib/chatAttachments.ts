// Helpers de anexos do chat.
// Como o bucket é privado, geramos signed URLs com validade curta pra exibir
// imagens/vídeos no client.

import type { Message } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Duração padrão da signed URL: 6 horas (renova quando alguém recarregar a página). */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6;

const BUCKET = "livecare-chat";

/**
 * Recebe uma lista de mensagens e, pra cada uma com `attachment_path`,
 * gera uma signed URL e devolve a mesma lista com o campo `attachment_url` populado.
 *
 * Usa um único batch call (`createSignedUrls`) pra eficiência.
 */
export async function attachSignedUrls(
  supabase: SupabaseClient,
  messages: Message[]
): Promise<Message[]> {
  const paths = messages
    .map((m) => m.attachment_path)
    .filter((p): p is string => !!p);

  if (paths.length === 0) return messages;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return messages;

  const urlMap = new Map<string, string>();
  data.forEach((d) => {
    if (d.path && d.signedUrl) urlMap.set(d.path, d.signedUrl);
  });

  return messages.map((m) =>
    m.attachment_path
      ? { ...m, attachment_url: urlMap.get(m.attachment_path) ?? null }
      : m
  );
}

/**
 * Gera signed URL para um único path (usado quando uma mensagem nova chega
 * via realtime e precisa renderizar o anexo).
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export const ATTACHMENTS_BUCKET = BUCKET;
