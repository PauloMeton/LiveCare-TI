import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { AdminChat } from "@/components/admin/AdminChat";
import type { ConversaListItem, Message } from "@/lib/types";
import { attachSignedUrls } from "@/lib/chatAttachments";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  // Auth + supabase + searchParams em paralelo
  const [{ user, profile }, supabase, sp] = await Promise.all([
    getCurrentUser(),
    createClient(),
    searchParams,
  ]);

  if (profile.role !== "admin") redirect("/dashboard");

  const { c } = sp;

  const { data: conversasData } = await supabase.rpc("livecare_list_conversas");
  const conversas = (conversasData ?? []) as ConversaListItem[];

  const selectedId =
    c && UUID_RE.test(c) ? c : conversas[0]?.conversa_id ?? null;

  let initialMessages: Message[] = [];
  if (selectedId) {
    const { data } = await supabase
      .from("livecare_messages")
      .select(
        "id, conversa_id, autor_id, conteudo, read_at, deleted_at, created_at, attachment_path, attachment_type, attachment_size"
      )
      .eq("conversa_id", selectedId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    const ordered = ((data ?? []) as Message[]).slice().reverse();
    initialMessages = await attachSignedUrls(supabase, ordered);
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
