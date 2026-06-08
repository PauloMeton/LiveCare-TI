// @ts-nocheck - Edge Function Deno
// livecare-send-push: envia Web Push pra todas as subscriptions de um user.
//
// Body: { userId: string, title: string, body: string, url?: string, tag?: string }
// Header: x-livecare-secret
//
// Envs: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
//       LIVECARE_NOTIFY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "npm:web-push@^3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  const expectedSecret = Deno.env.get("LIVECARE_NOTIFY_SECRET");
  if (!expectedSecret || req.headers.get("x-livecare-secret") !== expectedSecret) {
    return json(401, { error: "unauthorized" });
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
  if (!vapidPublic || !vapidPrivate) return json(500, { error: "VAPID nao configurado" });

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid JSON" });
  }

  const { userId, title, body: text, url, tag } = body;
  if (!userId || !title || !text) return json(400, { error: "userId, title, body obrigatorios" });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: subs, error } = await sb.rpc("livecare_get_user_push_subs", { p_user_id: userId });
  if (error) return json(500, { error: `subs query: ${error.message}` });
  if (!subs || subs.length === 0) return json(200, { ok: true, sent: 0 });

  const payload = JSON.stringify({ title, body: text, url: url ?? "/dashboard", tag });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  );

  let sent = 0;
  const expired = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") sent++;
    else if ([404, 410].includes(r.reason?.statusCode ?? 0)) expired.push(subs[i].endpoint);
  }

  if (expired.length > 0) {
    await sb.from("livecare_push_subscriptions").delete().in("endpoint", expired);
  }

  return json(200, { ok: true, sent, expired: expired.length });
});
