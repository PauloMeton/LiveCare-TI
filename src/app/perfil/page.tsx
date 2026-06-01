import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { PerfilForm } from "@/components/profile/PerfilForm";
import { normalizeTheme, THEME_COOKIE } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const [{ user, profile }, c] = await Promise.all([
    getCurrentUser(),
    cookies(),
  ]);

  const initialTheme = normalizeTheme(c.get(THEME_COOKIE)?.value);

  return (
    <PerfilForm
      profile={profile}
      email={user.email ?? ""}
      initialTheme={initialTheme}
    />
  );
}
