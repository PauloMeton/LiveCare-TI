"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SignUpSchema, firstZodMessage, type SignUpInput } from "@/lib/schemas";
import { translateAuthError } from "@/lib/authErrors";

export async function signUp(input: SignUpInput) {
  const parsed = SignUpSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();

  // Pega o origin da request pra montar o redirect do link de e-mail
  const h = await headers();
  const origin =
    h.get("origin") ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? "localhost:3000"}`;

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { nome: parsed.data.nome },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: translateAuthError(error.message) };

  return { ok: true };
}
