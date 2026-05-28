import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { MessagesThread } from "@/components/chat/MessagesThread";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import type { Message } from "@/lib/types";
import { attachSignedUrls } from "@/lib/chatAttachments";

export const dynamic = "force-dynamic";

export default async function ChatFuncionarioPage() {
  // Auth + supabase em paralelo
  const [{ user }, supabase] = await Promise.all([
    getCurrentUser(),
    createClient(),
  ]);

  // Funcionario: conversa_id = seu proprio user.id
  const { data: rows } = await supabase
    .from("livecare_messages")
    .select(
      "id, conversa_id, autor_id, conteudo, read_at, deleted_at, created_at, attachment_path, attachment_type, attachment_size"
    )
    .eq("conversa_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const ordered = ((rows ?? []) as Message[]).slice().reverse();
  const initialMessages = await attachSignedUrls(supabase, ordered);

  return (
    <div className="h-screen flex flex-col bg-graphite-50">
      <header className="bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link
          href="/dashboard"
          prefetch={true}
          className="text-graphite-900 text-xl leading-none"
          aria-label="Voltar"
        >
          {"←"}
        </Link>
        <BrandLockup size={28} />
        <div className="ml-1 flex flex-col leading-tight">
          <div className="text-sm font-semibold text-graphite-900">Suporte TI</div>
          <div className="text-[11px] text-emerald-600">Online</div>
        </div>
      </header>

      <div className="flex-1 min-h-0 pb-16">
        <MessagesThread
          conversaId={user.id}
          currentUserId={user.id}
          initialMessages={initialMessages}
          emptyHint="Mande sua primeira mensagem pro suporte TI"
        />
      </div>

      <MobileBottomNav active="chat" />
    </div>
  );
}
