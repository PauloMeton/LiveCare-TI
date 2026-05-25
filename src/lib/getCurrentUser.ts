// Server-only: pega user + profile do request atual.
// Se o profile estiver suspenso, faz signOut e redireciona pro login com mensagem.
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, cargo, role, suspenso, lider")
    .eq("id", user.id)
    .maybeSingle();

  // Sem profile (caso bizarro) — segue com valores padrão
  const p: Profile = (profile ?? {
    id: user.id,
    nome: (user.user_metadata?.nome as string) ?? user.email ?? "Usuário",
    cargo: null,
    role: "user",
    suspenso: false,
    lider: false,
  }) as Profile;

  // Bloqueia acesso de conta suspensa
  if (p.suspenso) {
    await supabase.auth.signOut();
    redirect("/login?erro=" + encodeURIComponent("Sua conta foi suspensa. Fale com o suporte TI."));
  }

  return { user, profile: p };
}
