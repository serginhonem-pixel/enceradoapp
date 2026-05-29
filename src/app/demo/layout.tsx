"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard, ClipboardList, Users, Wrench,
  Package, DollarSign, BarChart2, History, Settings, Calendar,
} from "lucide-react";

const nav = [
  { label: "Dashboard",    href: "/demo/dashboard",    icon: LayoutDashboard },
  { label: "Agenda",       href: "/demo/agenda",        icon: Calendar        },
  { label: "Atendimentos", href: "/demo/atendimentos",  icon: ClipboardList   },
  { label: "Clientes",     href: "/demo/clientes",      icon: Users           },
  { label: "Serviços",     href: "/demo/servicos",      icon: Wrench          },
  { label: "Produtos",     href: "/demo/produtos",      icon: Package         },
  { label: "Custos Fixos", href: "/demo/custos",        icon: DollarSign      },
  { label: "Fechamento",   href: "/demo/fechamento",    icon: BarChart2       },
  { label: "Relatórios",   href: "/demo/relatorios",    icon: History         },
  { label: "Configurações",href: "/demo/configuracoes", icon: Settings        },
];

function loadNome() {
  if (typeof window === "undefined") return "Sopinha Lava-Jato";
  try {
    const raw = localStorage.getItem("lavaapp_config");
    return raw ? JSON.parse(raw).nome ?? "Sopinha Lava-Jato" : "Sopinha Lava-Jato";
  } catch { return "Sopinha Lava-Jato"; }
}
function loadLogo() {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("lavaapp_config");
    return raw ? JSON.parse(raw).logoUrl ?? "" : "";
  } catch { return ""; }
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [nome, setNome] = useState("Sopinha Lava-Jato");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    setNome(loadNome());
    setLogoUrl(loadLogo());

    // Atualiza quando configurações forem salvas
    function onConfigChanged(e: Event) {
      const detail = (e as CustomEvent).detail;
      setNome(detail.nome ?? "Sopinha Lava-Jato");
      setLogoUrl(detail.logoUrl ?? "");
    }
    window.addEventListener("lavaapp-config-changed", onConfigChanged);
    return () => window.removeEventListener("lavaapp-config-changed", onConfigChanged);
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      {/* Faixa demo */}
      <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-1.5 px-4 sticky top-0 z-50">
        🚧 Modo Demo — dados salvos no navegador · <a href="/login" className="underline">Entrar com conta real</a>
      </div>

      <div className="flex min-h-[calc(100vh-28px)] bg-slate-50">
        {/* Sidebar desktop */}
        <aside className="w-56 bg-[#0a0f1e] hidden md:flex flex-col sticky top-7 h-[calc(100vh-28px)] overflow-y-auto shrink-0">
          <div className="p-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0057ff] flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover rounded-lg" />
                  : <span className="text-base">🚗</span>
                }
              </div>
              <span className="font-bold text-white text-[1rem] truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {nome}
              </span>
            </div>
            <p className="text-[0.62rem] text-white/25 mt-1 text-center uppercase tracking-widest font-semibold">
              {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
            </p>
          </div>

          <nav className="flex-1 p-2 space-y-0.5">
            <p className="text-[0.6rem] uppercase tracking-widest text-white/20 font-semibold px-2 pt-3 pb-1">Menu</p>
            {nav.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[0.8rem] font-medium transition-all ${
                    active ? "bg-[#0057ff]/20 text-white" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                  }`}>
                  <Icon size={14} className={active ? "opacity-100" : "opacity-60"} />
                  {label}
                  {active && <span className="ml-auto w-1 h-1 rounded-full bg-[#0057ff]" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/[0.07] text-[0.62rem] text-white/20 text-center">
            Demo · LavaApp
          </div>
        </aside>

        {/* Nav mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0f1e] border-t border-white/10 flex overflow-x-auto">
          {nav.slice(0, 6).map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-1 px-3 py-2 text-[0.58rem] font-medium min-w-[60px] transition-all ${active ? "text-[#0057ff]" : "text-white/40"}`}>
                <Icon size={16} />
                {label.split(" ")[0]}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </>
  );
}
