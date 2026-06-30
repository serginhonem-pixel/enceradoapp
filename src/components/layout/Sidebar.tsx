"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTenant } from "@/hooks/useTenant";
import {
  LayoutDashboard, ClipboardList, Users, Wrench,
  Package, DollarSign, BarChart2, History, Settings, LogOut, CalendarDays,
} from "lucide-react";

const nav = [
  { label: "Dashboard",     href: "/dashboard",    icon: LayoutDashboard, tour: "nav-dashboard"     },
  { label: "Agenda",        href: "/agenda",        icon: CalendarDays,    tour: "nav-agenda"        },
  { label: "Atendimentos",  href: "/atendimentos",  icon: ClipboardList,   tour: "nav-atendimentos"  },
  { label: "Clientes",      href: "/clientes",      icon: Users,           tour: "nav-clientes"      },
  { label: "Serviços",      href: "/servicos",      icon: Wrench,          tour: "nav-servicos"      },
  { label: "Produtos",      href: "/produtos",      icon: Package,         tour: undefined           },
  { label: "Custos Fixos",  href: "/custos",        icon: DollarSign,      tour: undefined           },
  { label: "Fechamento",    href: "/fechamento",    icon: BarChart2,       tour: "nav-fechamento"    },
  { label: "Relatórios",    href: "/relatorios",    icon: History,         tour: "nav-relatorios"    },
];

interface SidebarProps {
  onSignOut: () => void;
}

function useIsSubdomain() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host.endsWith(".vercel.app") || host === "localhost" || host === "127.0.0.1") return false;
  return host.split(".").length >= 3;
}

export function Sidebar({ onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const isSub = useIsSubdomain();
  const tenantParam = !isSub && tenant?.slug ? `?tenant=${tenant.slug}` : "";
  const href = (path: string) => `${path}${tenantParam}`;

  return (
    <aside className="w-56 bg-ink flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-white/[0.07] flex flex-col items-center">
        <div className="w-32 h-32 rounded-xl overflow-hidden">
          <Image src={tenant?.logoUrl || "/logo.jpeg"} alt="logo" width={128} height={128} className="object-cover w-full h-full" />
        </div>
        <p className="text-[0.65rem] text-white/25 mt-2 uppercase tracking-widest font-semibold">
          {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        <p className="text-[0.6rem] uppercase tracking-widest text-white/20 font-semibold px-2 pt-3 pb-1">
          Menu
        </p>
        {nav.map(({ label, href: path, icon: Icon, tour }) => {
          const active = pathname === path || pathname.startsWith(path + "/");
          return (
            <Link
              key={path}
              href={href(path)}
              data-tour={tour}
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
          href={href("/configuracoes")}
          data-tour="nav-config"
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
