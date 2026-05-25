import { getCurrentUser } from "@/lib/getCurrentUser";
import { PerfilForm } from "@/components/profile/PerfilForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const { user, profile } = await getCurrentUser();

  return (
    <PerfilForm
      profile={profile}
      email={user.email ?? ""}
    />
  );
}
