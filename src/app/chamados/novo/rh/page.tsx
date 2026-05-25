import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { FormRH } from "./FormRH";

export const dynamic = "force-dynamic";

export default async function NovoRHPage() {
  await getCurrentUser();
  const supabase = await createClient();
  const { data: unidades } = await supabase
    .from("unidades")
    .select("id, nome")
    .eq("ativa", true)
    .order("nome");
  return <FormRH unidades={unidades ?? []} />;
}
