// Helpers de anexos de chamados.
// Bucket privado — gera signed URLs (TTL 6h) pra exibir imagens/vídeos no client.

import type { TicketAttachment } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6;
const BUCKET = "livecare-tickets";

/**
 * Recebe uma lista de anexos e popula o campo virtual `url` com a signed URL
 * via um único batch call (`createSignedUrls`).
 */
export async function attachTicketSignedUrls(
  supabase: SupabaseClient,
  attachments: TicketAttachment[]
): Promise<TicketAttachment[]> {
  if (attachments.length === 0) return attachments;

  const paths = attachments.map((a) => a.path);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return attachments;

  const urlMap = new Map<string, string>();
  data.forEach((d) => {
    if (d.path && d.signedUrl) urlMap.set(d.path, d.signedUrl);
  });

  return attachments.map((a) => ({
    ...a,
    url: urlMap.get(a.path) ?? null,
  }));
}

export const TICKET_ATTACHMENTS_BUCKET = BUCKET;
