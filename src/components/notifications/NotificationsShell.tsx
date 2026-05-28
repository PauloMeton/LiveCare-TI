// Server component: tenta detectar user autenticado SEM redirecionar (diferente
// do getCurrentUser), e só monta o Toaster + Listener pra usuários logados.
//
// Roda no layout root, então não pode fazer redirect — páginas públicas
// (/login, /cadastro) também passam por aqui.

import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/notifications/Toaster";
import { NotificationListener } from "@/components/notifications/NotificationListener";

export async function NotificationsShell() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Não logado → nada a notificar
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, suspenso")
    .eq("id", user.id)
    .maybeSingle<{ role: "user" | "admin"; suspenso: boolean }>();

  // Suspensos serão redirecionados ao acessar páginas autenticadas — não
  // mostramos notificações pra eles aqui.
  if (profile?.suspenso) return null;

  const isAdmin = profile?.role === "admin";

  return (
    <>
      <Toaster />
      <NotificationListener currentUserId={user.id} isAdmin={isAdmin} />
    </>
  );
}
