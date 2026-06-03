// @ts-nocheck — arquivo Deno (Edge Function), nao Node/Next
// Edge Function: livecare-send-email
// Envia e-mail via SMTP (Gmail App Password ou outro provider).
//
// Autenticacao: header `x-livecare-secret` precisa bater com env LIVECARE_NOTIFY_SECRET.
// (verify_jwt=false porque o invocador eh o Postgres via pg_net - nao tem JWT.)
//
// Body JSON: { to: string, subject: string, html: string, text?: string }
//
// Variaveis de ambiente esperadas:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//   LIVECARE_NOTIFY_SECRET

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";

type Body = { to?: string; subject?: string; html?: string; text?: string };

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  const expectedSecret = Deno.env.get("LIVECARE_NOTIFY_SECRET");
  const gotSecret = req.headers.get("x-livecare-secret");
  if (!expectedSecret || gotSecret !== expectedSecret) return json(401, { error: "unauthorized" });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json(400, { error: "invalid JSON" });
  }

  const to = body.to?.trim();
  const subject = body.subject?.trim();
  const html = body.html?.trim();
  if (!to || !subject || !html) return json(400, { error: "to, subject, html obrigatorios" });

  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const from = Deno.env.get("SMTP_FROM") ?? user;
  if (!host || !user || !pass || !from) return json(500, { error: "SMTP nao configurado" });

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password: pass },
    },
  });

  try {
    await client.send({ from, to, subject, content: body.text ?? "Veja a versao HTML", html });
  } catch (err) {
    return json(502, { error: `SMTP error: ${err instanceof Error ? err.message : String(err)}` });
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
  }

  return json(200, { ok: true });
});
