"use client";
import Link from "next/link";

type Tab = "home" | "perfil" | "novo" | "chat";
type Props = { active: Tab };

const items: Array<{ id: Tab; label: string; href: string; icon: string }> = [
  { id: "perfil", label: "Perfil",  href: "/perfil",         icon: "👤" },
  { id: "home",   label: "Início",  href: "/dashboard",      icon: "🏠" },
  { id: "novo",   label: "Chamado", href: "/chamados/novo",  icon: "➕" },
  { id: "chat",   label: "Chat TI", href: "/chat",           icon: "💬" },
];

export function MobileBottomNav({ active }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-graphite-200 px-4 py-2 flex justify-around z-10">
      {items.map((i) => {
        const isActive = active === i.id;
        return (
          <Link
            key={i.id}
            href={i.href}
            prefetch={true}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium ${
              isActive ? "text-graphite-900" : "text-graphite-500"
            }`}
          >
            <span className="text-lg leading-none">{i.icon}</span>
            <span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
