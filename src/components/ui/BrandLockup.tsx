// Logo LiveCare TI — Variante B (amarelo sobre preto)
export function BrandLockup({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: "var(--gold-400)",
          color: "var(--graphite-900)",
        }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      </div>
      <div className="leading-none">
        <div className="text-[15px] font-bold text-graphite-900">LiveCare</div>
        <div className="text-[10px] uppercase tracking-wider text-gold-600 font-semibold">Suporte TI</div>
      </div>
    </div>
  );
}
