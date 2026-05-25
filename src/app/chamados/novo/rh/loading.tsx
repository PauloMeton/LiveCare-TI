import { Skeleton, SkeletonLine } from "@/components/ui/Skeleton";

export default function FormClasseLoading() {
  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Skeleton width={20} height={20} />
        <Skeleton width={32} height={32} rounded="md" />
        <SkeletonLine width={140} height={12} />
      </header>
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <SkeletonLine width={220} height={20} className="mb-2" />
        <SkeletonLine width={320} height={12} className="mb-5" />
        <div className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <SkeletonLine width={120} height={11} className="mb-1.5" />
              <Skeleton height={40} rounded="md" />
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-2">
            <Skeleton width={100} height={36} rounded="md" />
            <Skeleton width={140} height={36} rounded="md" />
          </div>
        </div>
      </main>
    </div>
  );
}
