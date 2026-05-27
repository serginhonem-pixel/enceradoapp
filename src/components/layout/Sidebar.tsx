"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTenant } from "@/hooks/useTenant";
import {
  LayoutDashboard, ClipboardList, Users, Wrench,
  Package, DollarSign, BarChart2, History, Settings, LogOut,
} from "lucide-react";

const nav = [
  { label: "Dashboard",     href: "/dashboard",    icon: LayoutDashboard },
  { label: "Atendimentos",  href: "/atendimentos",  icon: ClipboardList   },
  { label: "Clientes",      href: "/clientes",      icon: Users           },
  { label: "Serviços",      href: "/servicos",      icon: Wrench          },
  { label: "Produtos",      href: "/produtos",      icon: Package         },
  { label: "Custos Fixos",  href: "/custos",        icon: DollarSign      },
  { label: "Fechamento",    href: "/fechamento",    icon: BarChart2       },
  { label: "Relatórios",    href: "/relatorios",    icon: History         },
];

interface SidebarProps {
  onSignOut: () => void;
}

export function Sidebar({ onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const { tenant } = useTenant();

  return (
    <aside className="w-56 bg-ink flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          {tenant?.logoUrl ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0">
              <Image src={tenant.logoUrl} alt="logo" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white text-base shrink-0">
              🚗
            </div>
          )}
          <span className="font-heading font-bold text-white text-[1.05rem] truncate">
            {tenant?.nome ?? "LavaApp"}
          </span>
        </div>
        <p className="text-[0.65rem] text-white/25 mt-1 text-center uppercase tracking-widest font-semibold">
          {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        <p className="text-[0.6rem] uppercase tracking-widest text-white/20 font-semibold px-2 pt-3 pb-1">
          Menu
        </p>
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[0.8rem] font-medium transition-all ${
                active
                  ? "bg-brand/20 text-white"
                  : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
              }`}
            >
              <Icon size={14} className={active ? "opacity-100" : "opacity-60"} />
              {label}
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.07] space-y-1">
        <Link
          href="/configuracoes"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-white/35 hover:text-white/70 text-[0.78rem] font-medium transition-all hover:bg-white/[0.05]"
        >
          <Settings size={13} />
          Configurações
        </Link>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-white/35 hover:text-red-400 text-[0.78rem] font-medium transition-all hover:bg-white/[0.05]"
        >
          <LogOut size={13} />
          Sair
        </button>
      </div>
    </aside>
  );
}
