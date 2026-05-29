"use client";
import { useState, useEffect } from "react";
import { lsGetAtendimentos, lsSaveAtendimento } from "@/lib/local-store";
import { ClipboardList, DollarSign, CheckCircle2, Play, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import type { AtendimentoOS } from "@/types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_MAP = {
  aguardando:   { label: "Aguardando",   cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  em_andamento: { label: "Em andamento", cls: "bg-blue-50 text-blue-700 border-blue-200"           },
  concluido:    { label: "Concluído",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200"  },
  cancelado:    { label: "Cancelado",    cls: "bg-red-50 text-red-600 border-red-200"              },
};

export default function DemoDashboard() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoOS[]>([]);
  const hoje = format(new Date(), "yyyy-MM-dd");

  function load() { setAtendimentos(lsGetAtendimentos(hoje)); }
  useEffect(load, [hoje]);

  function mudarStatus(a: AtendimentoOS, novoStatus: AtendimentoOS["status"]) {
    lsSaveAtendimento({
      ...a,
      status: novoStatus,
      updatedAt: new Date(),
      concluidoAt: novoStatus === "concluido" ? new Date() : a.concluidoAt,
    }, a.id);
    const msgs = {
      em_andamento: "▶️ Iniciado!",
      concluido: "✅ Concluído!",
      cancelado: "❌ Cancelado",
      aguardando: "⏳ Voltou para aguardando",
    };
    toast.success(msgs[novoStatus]);
    load();
  }

  const concluidos  = atendimentos.filter(a => a.status === "concluido");
  const emAndamento = atendimentos.filter(a => a.status === "em_andamento");
  const aguardando  = atendimentos.filter(a => a.status === "aguardando");
  const totalBruto  = concluidos.reduce((s, a) => s + a.totalFinal, 0);

  const stats = [
    { label: "Aguardando",     value: aguardando.length.toString(),  color: "text-amber-600",   bg: "bg-amber-50",   icon: ClipboardList },
    { label: "Em Andamento",   value: emAndamento.length.toString(), color: "text-blue-600",    bg: "bg-blue-50",    icon: Play          },
    { label: "Concluídos",     value: concluidos.length.toString(),  color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2  },
    { label: "Faturamento",    value: fmt(totalBruto),               color: "text-purple-600",  bg: "bg-purple-50",  icon: DollarSign    },
  ];

  // Agrupa por status para exibição
  const ordem: AtendimentoOS["status"][] = ["em_andamento", "aguardando", "concluido", "cancelado"];
  const agrupados = ordem.flatMap(s => atendimentos.filter(a => a.status === s));

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="font-heading font-bold text-xl text-ink mb-1">Bom dia! 👋</h2>
      <p className="text-muted text-sm mb-6">
        {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}><Icon size={16} className={color} /></div>
            <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide mb-1">{label}</p>
            <p className="font-heading font-bold text-xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Lista de OS com ações rápidas */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-heading font-semibold text-sm text-ink">Atendimentos de Hoje</h3>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-1.5 rounded-md text-slate-400 hover:text-brand hover:bg-slate-100 transition" title="Atualizar">
              <RefreshCw size={13} />
            </button>
            <a href="/demo/atendimentos" className="text-xs text-brand hover:underline font-medium">Nova OS →</a>
          </div>
        </div>

        {atendimentos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted text-sm mb-3">Nenhum atendimento hoje ainda.</p>
            <a href="/demo/atendimentos"
              className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition">
              + Abrir primeira OS do dia
            </a>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {agrupados.map(a => {
              const { label, cls } = STATUS_MAP[a.status];
              return (
                <div key={a.id} className="px-5 py-3.5 flex items-center gap-4">
                  {/* Número OS */}
                  <span className="text-[0.65rem] font-mono text-muted shrink-0 w-10">
                    #{String(a.numero).padStart(4, "0")}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-ink">{a.clienteNome}</p>
                      <span className={`text-[0.62rem] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
                    </div>
                    <p className="text-xs text-muted">{a.veiculoPlaca} · {a.veiculoModelo} · {a.veiculoCor}</p>
                    <p className="text-xs text-muted truncate">{a.itens.map(i => i.servicoNome).join(", ")}</p>
                  </div>

                  {/* Valor */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-ink">{fmt(a.totalFinal)}</p>
                    <p className="text-xs text-muted capitalize">{a.formaPagamento}</p>
                  </div>

                  {/* Ações rápidas */}
                  <div className="flex gap-1 shrink-0">
                    {a.status === "aguardando" && (
                      <button
                        onClick={() => mudarStatus(a, "em_andamento")}
                        className="flex items-center gap-1 text-[0.7rem] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition"
                        title="Iniciar">
                        <Play size={11} /> Iniciar
                      </button>
                    )}
                    {a.status === "em_andamento" && (
                      <button
                        onClick={() => mudarStatus(a, "concluido")}
                        className="flex items-center gap-1 text-[0.7rem] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition"
                        title="Concluir">
                        <CheckCircle2 size={11} /> Concluir
                      </button>
                    )}
                    {(a.status === "aguardando" || a.status === "em_andamento") && (
                      <button
                        onClick={() => mudarStatus(a, "cancelado")}
                        className="flex items-center gap-1 text-[0.7rem] font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1.5 rounded-lg transition"
                        title="Cancelar">
                        <X size={11} />
                      </button>
                    )}
                    {a.status === "concluido" && (
                      <span className="text-[0.68rem] text-emerald-600 font-semibold px-2">✓ Pago</span>
                    )}
                    {a.status === "cancelado" && (
                      <button
                        onClick={() => mudarStatus(a, "aguardando")}
                        className="text-[0.68rem] text-slate-400 hover:text-ink font-medium px-2 py-1 rounded transition"
                        title="Reabrir">
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
