import { Skeleton, SkeletonLine, SkeletonCircle } from "@/components/ui/Skeleton";

export default function PerfilLoading() {
  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Skeleton width={20} height={20} />
        <Skeleton width={32} height={32} rounded="md" />
        <SkeletonLine width={100} height={12} />
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-4">
        {/* Identidade */}
        <div className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <SkeletonCircle size={72} />
          <div className="flex-1">
            <SkeletonLine width="60%" height={18} className="mb-2" />
            <SkeletonLine width="80%" height={12} className="mb-3" />
            <Skeleton width={140} height={22} rounded="full" />
          </div>
        </div>

        {/* Dados pessoais */}
        <div className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm">
          <SkeletonLine width={120} height={13} className="mb-4" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <SkeletonLine width={60} height={11} className="mb-1.5" />
                <Skeleton height={40} rounded="md" />
              </div>
            ))}
            <div className="flex justify-end">
              <Skeleton width={140} height={36} rounded="md" />
            </div>
          </div>
        </div>

        {/* Senha */}
        <div className="bg-white border border-graphite-200 rounded-lg p-5 shadow-sm">
          <SkeletonLine width={100} height={13} className="mb-4" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <SkeletonLine width={120} height={11} className="mb-1.5" />
                <Skeleton height={40} rounded="md" />
              </div>
            ))}
            <div className="flex justify-end">
              <Skeleton width={120} height={36} rounded="md" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
