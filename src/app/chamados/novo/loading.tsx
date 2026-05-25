import { Skeleton, SkeletonLine } from "@/components/ui/Skeleton";

export default function NovoChamadoLoading() {
  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Skeleton width={20} height={20} />
        <Skeleton width={32} height={32} rounded="md" />
        <SkeletonLine width={130} height={12} />
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <SkeletonLine width={250} height={20} className="mb-2" />
        <SkeletonLine width={300} height={12} className="mb-5" />

        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm flex items-center gap-3"
            >
              <Skeleton width={40} height={40} rounded="lg" />
              <div className="flex-1">
                <SkeletonLine width="40%" height={13} className="mb-1.5" />
                <SkeletonLine width="65%" height={10} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
