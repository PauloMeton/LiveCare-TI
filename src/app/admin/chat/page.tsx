import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { AdminChat } from "@/components/admin/AdminChat";
import type { ConversaListItem, Message } from "@/lib/types";

export const dynamic = "force-dynamic";

// UUID válido pra usar como filtro
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { user, profile } = await getCurrentUser();
  if (profile.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { c } = await searchParams;

  // Lista de conversas (admin only — RPC já valida)
  const { data: conversasData } = await supabase.rpc("livecare_list_conversas");
  const conversas = (conversasData ?? []) as ConversaListItem[];

  // Conversa selecionada — usa ?c=<uuid> ou primeira da lista
  const selectedId =
    c && UUID_RE.test(c)
      ? c
      : conversas[0]?.conversa_id ?? null;

  // Mensagens da conversa selecionada
  let initialMessages: Message[] = [];
  if (selectedId) {
    const { data } = await supabase
      .from("livecare_messages")
      .select("id, conversa_id, autor_id, conteudo, read_at, deleted_at, created_at")
      .eq("conversa_id", selectedId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    initialMessages = ((data ?? []) as Message[]).slice().reverse();
  }

  return (
    <AdminChat
      profile={profile}
      currentUserId={user.id}
      conversas={conversas}
      selectedId={selectedId}
      initialMessages={initialMessages}
    />
  );
}
