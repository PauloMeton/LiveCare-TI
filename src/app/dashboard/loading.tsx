// Skeleton genérico do dashboard. Como não sabemos ainda se o user é admin ou func,
// usamos um layout simples que cabe nos dois (lista de cards).
import { Skeleton, SkeletonLine, SkeletonCard } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton width={32} height={32} rounded="md" />
          <div className="flex flex-col gap-1">
            <SkeletonLine width={80} height={10} />
            <SkeletonLine width={50} height={8} />
          </div>
        </div>
        <Skeleton width={50} height={28} rounded="md" />
      </header>

      <main className="px-4 py-6 max-w-3xl w-full mx-auto">
        <SkeletonLine width={120} height={10} className="mb-2" />
        <SkeletonLine width={200} height={22} className="mb-2" />
        <SkeletonLine width={260} height={12} className="mb-5" />

        <div className="grid grid-cols-3 gap-3 mb-5">
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
          <Skeleton height={70} rounded="lg" />
        </div>

        <div className="flex gap-2 mb-4">
          <Skeleton width={70} height={28} rounded="full" />
          <Skeleton width={80} height={28} rounded="full" />
          <Skeleton width={100} height={28} rounded="full" />
        </div>

        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
    </div>
  );
}
