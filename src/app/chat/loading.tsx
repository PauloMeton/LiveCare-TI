import { Skeleton, SkeletonLine } from "@/components/ui/Skeleton";

export default function ChatLoading() {
  return (
    <div className="h-screen flex flex-col bg-graphite-50">
      {/* Header skeleton */}
      <header className="bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Skeleton width={20} height={20} />
        <Skeleton width={32} height={32} rounded="md" />
        <div className="ml-1 flex flex-col gap-1">
          <SkeletonLine width={70} height={12} />
          <SkeletonLine width={40} height={9} />
        </div>
      </header>

      {/* Bolhas alternadas */}
      <div className="flex-1 px-4 py-3 flex flex-col gap-2 overflow-hidden">
        <div className="flex justify-start">
          <Skeleton width={180} height={36} rounded="lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton width={220} height={48} rounded="lg" />
        </div>
        <div className="flex justify-start">
          <Skeleton width={140} height={36} rounded="lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton width={160} height={36} rounded="lg" />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-graphite-200 bg-white px-3 py-2 flex gap-2">
        <Skeleton height={40} className="flex-1" rounded="md" />
        <Skeleton width={80} height={40} rounded="md" />
      </div>
    </div>
  );
}
