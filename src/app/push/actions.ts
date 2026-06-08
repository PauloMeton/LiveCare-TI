"use server";

import { createClient } from "@/lib/supabase/server";
import { PushSubscriptionSchema, firstZodMessage, type PushSubscriptionInput } from "@/lib/schemas";
import { userFacingDbError } from "@/lib/dbErrors";

/**
 * Salva uma subscription Web Push do usuario autenticado.
 * Upsert pelo endpoint (mesmo device manda a mesma subscription se reactivar).
 */
export async function savePushSubscription(input: PushSubscriptionInput) {
  const parsed = PushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const v = parsed.data;
  const { error } = await supabase.from("livecare_push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: v.endpoint,
      p256dh: v.p256dh,
      auth: v.auth,
      user_agent: v.userAgent ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: userFacingDbError(error) };
  return { ok: true };
}

/**
 * Remove uma subscription (quando o user desativa notificações no app).
 */
export async function deletePushSubscription(endpoint: string) {
  if (!endpoint || typeof endpoint !== "string") {
    return { error: "Endpoint inválido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("livecare_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) return { error: userFacingDbError(error) };
  return { ok: true };
}
