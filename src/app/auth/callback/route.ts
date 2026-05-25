// Recebe o redirect do link enviado por e-mail (signup, recovery, magic link).
// Troca o `code` por uma sessão e redireciona para `next`.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  // Sanitiza `next` pra evitar open redirect — só aceita rota interna
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!code) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("erro", "Link inválido. Solicite um novo.");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("erro", "Não foi possível validar o link. Solicite um novo.");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
