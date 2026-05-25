import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { FormOperacoes } from "./FormOperacoes";

export const dynamic = "force-dynamic";

export default async function NovoOperacoesPage() {
  await getCurrentUser();
  const supabase = await createClient();
  const { data: unidades } = await supabase
    .from("unidades")
    .select("id, nome")
    .eq("ativa", true)
    .order("nome");
  return <FormOperacoes unidades={unidades ?? []} />;
}
