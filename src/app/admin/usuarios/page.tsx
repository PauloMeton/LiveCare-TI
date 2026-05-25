import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { listUsers } from "./actions";
import { UsuariosList } from "@/components/admin/UsuariosList";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const { profile } = await getCurrentUser();

  // Apenas admin acessa essa página
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const result = await listUsers();

  return (
    <UsuariosList
      currentUserId={profile.id}
      currentUserIsLider={profile.lider}
      users={result.ok ? result.users : []}
      loadError={result.ok ? null : result.error}
    />
  );
}
