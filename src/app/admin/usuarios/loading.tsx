import { Skeleton, SkeletonLine, SkeletonCircle } from "@/components/ui/Skeleton";

export default function UsuariosLoading() {
  return (
    <div className="min-h-screen flex bg-graphite-50">
      <aside className="w-64 bg-white border-r border-graphite-200 p-5">
        <Skeleton width={120} height={40} className="mb-6" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={36} rounded="md" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-8">
        <SkeletonLine width={180} height={11} className="mb-2" />
        <SkeletonLine width={280} height={26} className="mb-2" />
        <SkeletonLine width={380} height={12} className="mb-6" />

        <div className="bg-white border border-graphite-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-graphite-200 grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLine key={i} width={80} height={10} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="px-5 py-3 border-b border-graphite-100 grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-3 items-center"
            >
              <div className="flex items-center gap-2">
                <SkeletonCircle size={28} />
                <SkeletonLine width="70%" height={12} />
              </div>
              <SkeletonLine width="80%" height={12} />
              <Skeleton width={60} height={20} rounded="full" />
              <Skeleton width={70} height={20} rounded="full" />
              <Skeleton width={120} height={28} rounded="md" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
