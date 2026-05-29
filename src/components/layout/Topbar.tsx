"use client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { getAgendamentos } from "@/lib/firestore";
import { Menu, Bell } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { Agendamento } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

export function Topbar({ title, onMenuClick, actions }: TopbarProps) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [notifs, setNotifs] = useState<Agendamento[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function getLidas(): string[] {
    try { return JSON.parse(localStorage.getItem("notifs_lidas") ?? "[]"); } catch { return []; }
  }

  useEffect(() => {
    if (!tenant) return;
    async function carregar() {
      if (!tenant) return;
      const mesAtual = format(new Date(), "yyyy-MM");
      const mesProximo = format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM");
      const [ags1, ags2] = await Promise.all([
        getAgendamentos(tenant.id, mesAtual),
        getAgendamentos(tenant.id, mesProximo),
      ]);
      const todos = [...ags1, ...ags2];
      const lidas = getLidas();
      const novos = todos.filter(a => a.status === "agendado" && a.clienteId === "" && !lidas.includes(a.id));
      setNotifs(novos);
    }
    carregar();
    const interval = setInterval(carregar, 30000);
    return () => clearInterval(interval);
  }, [tenant]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 h-14 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button onClick={onMenuClick} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 md:hidden">
            <Menu size={18} />
          </button>
        )}
        <h1 className="font-heading font-semibold text-[0.95rem] text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {/* Sininho */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition text-slate-500"
          >
            <Bell size={18} />
            {notifs.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[0.55rem] font-bold rounded-full flex items-center justify-center">
                {notifs.length > 9 ? "9+" : notifs.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="font-semibold text-sm text-ink">Novos agendamentos</p>
                <div className="flex items-center gap-2">
                  {notifs.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">{notifs.length}</span>
                  )}
                  {notifs.length > 0 && (
                    <button
                      onClick={() => {
                        const lidas = getLidas();
                        const novasLidas = Array.from(new Set([...lidas, ...notifs.map(n => n.id)]));
                        localStorage.setItem("notifs_lidas", JSON.stringify(novasLidas));
                        setNotifs([]);
                      }}
                      className="text-xs text-muted hover:text-slate-600 transition"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifs.length === 0 ? (
                  <p className="text-center text-muted text-sm py-6">Nenhum agendamento novo</p>
                ) : (
                  notifs.map(a => (
                    <div key={a.id} className="px-4 py-3 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-ink truncate">{a.clienteNome}</p>
                          <p className="text-xs text-muted">{a.servicoNomes.join(", ")}</p>
                          <p className="text-xs text-brand font-semibold mt-0.5">
                            {a.data && format(parseISO(a.data), "d 'de' MMM", { locale: ptBR })} às {a.hora}
                          </p>
                          {a.clienteTelefone && (
                            <a
                              href={`https://wa.me/55${a.clienteTelefone.replace(/\D/g, "")}?text=Olá ${a.clienteNome}! Seu agendamento de ${a.servicoNomes[0]} para ${a.data && format(parseISO(a.data), "d/MM")} às ${a.hora} foi confirmado! 🚗`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[0.65rem] text-green-600 font-semibold hover:underline mt-1"
                              onClick={e => e.stopPropagation()}
                            >
                              💬 Confirmar via WhatsApp
                            </a>
                          )}
                        </div>
                        <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full shrink-0">novo</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100">
                <Link href="/agenda" onClick={() => setOpen(false)} className="text-xs text-brand font-semibold hover:underline">
                  Ver toda a agenda →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold uppercase">
          {user?.email?.[0] ?? user?.phoneNumber?.[3] ?? "U"}
        </div>
      </div>
    </header>
  );
}
