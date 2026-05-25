"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { BrandLockup } from "@/components/ui/BrandLockup";

export function TicketFormShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Link href="/chamados/novo" className="text-graphite-900 text-xl">←</Link>
        <BrandLockup size={28} />
        <span className="ml-2 text-sm font-semibold text-graphite-700">{title}</span>
      </header>
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-graphite-900 mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-graphite-500 mb-5">{subtitle}</p>}
        {children}
      </main>
    </div>
  );
}
