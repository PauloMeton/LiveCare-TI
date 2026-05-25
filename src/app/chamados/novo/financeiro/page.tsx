import { getCurrentUser } from "@/lib/getCurrentUser";
import { FormFinanceiro } from "./FormFinanceiro";

export const dynamic = "force-dynamic";

export default async function NovoFinanceiroPage() {
  await getCurrentUser();
  return <FormFinanceiro />;
}
