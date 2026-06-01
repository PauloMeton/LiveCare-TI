import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import type { AnalyticsData } from "@/lib/analyticsTypes";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  // Auth + supabase + searchParams em paralelo
  const [{ profile }, supabase, sp] = await Promise.all([
    getCurrentUser(),
    createClient(),
    searchParams,
  ]);

  if (profile.role !== "admin") redirect("/dashboard");

  // Periodo configuravel via ?d=7|30|90 (default 30)
  const dParam = parseInt(sp.d ?? "30", 10);
  const periodo = [7, 30, 90].includes(dParam) ? dParam : 30;

  const { data } = await supabase.rpc("livecare_analytics", { p_dias: periodo });

  return (
    <AnalyticsDashboard
      profile={profile}
      periodo={periodo}
      data={(data ?? null) as AnalyticsData | null}
    />
  );
}
