import { Skeleton, SkeletonLine, SkeletonCircle } from "@/components/ui/Skeleton";

export default function TicketLoading() {
  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Skeleton width={20} height={20} />
        <Skeleton width={32} height={32} rounded="md" />
        <SkeletonLine width={130} height={12} />
      </header>

      <main className="px-4 py-6 max-w-3xl mx-auto flex flex-col gap-4">
        <div className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton width={70} height={20} rounded="full" />
            <Skeleton width={90} height={20} rounded="full" />
            <Skeleton width={110} height={20} rounded="full" />
          </div>
          <SkeletonLine width="80%" height={20} className="mb-3" />
          <div className="flex items-center gap-3 pt-3 border-t border-graphite-100">
            <SkeletonCircle size={36} />
            <div className="flex-1">
              <SkeletonLine width="50%" height={12} className="mb-1" />
              <SkeletonLine width="35%" height={10} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm">
          <SkeletonLine width={150} height={12} className="mb-3" />
          <div className="bg-graphite-50 rounded-md p-3 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <SkeletonLine width={70} height={9} className="mb-1" />
                <SkeletonLine width={120} height={12} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm">
          <SkeletonLine width={120} height={12} className="mb-3" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton width={8} height={8} rounded="full" className="mt-1.5" />
                <div className="flex-1">
                  <SkeletonLine width="40%" height={11} className="mb-1" />
                  <SkeletonLine width="25%" height={9} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
