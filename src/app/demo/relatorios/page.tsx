"use client";
import { useState, useEffect } from "react";
import { lsGetFechamentos } from "@/lib/local-store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FechamentoDia } from "@/types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DemoRelatorios() {
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [mes, setMes] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => { setFechamentos(lsGetFechamentos()); }, []);

  const doMes = fechamentos.filter(f => f.data.startsWith(mes));
  const totalAtend   = doMes.reduce((s, f) => s + f.totalAtendimentos, 0);
  const totalBruto   = doMes.reduce((s, f) => s + f.totalBruto, 0);
  const totalLiquido = doMes.reduce((s, f) => s + f.totalLiquido, 0);
  const totalLucro   = doMes.reduce((s, f) => s + f.lucroEstimado, 0);
  const ticketMedio  = totalAtend > 0 ? totalLiquido / totalAtend : 0;
  const melhorDia    = doMes.length > 0 ? doMes.reduce((a, b) => a.totalLiquido > b.totalLiquido ? a : b) : null;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-heading font-bold text-xl text-ink">Relatórios</h2>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)}
          className="ml-auto border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand transition" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Atendimentos",    value: totalAtend.toString()  },
          { label: "Fat. Bruto",      value: fmt(totalBruto)        },
          { label: "Receita Líquida", value: fmt(totalLiquido)      },
          { label: "Lucro Estimado",  value: fmt(totalLucro)        },
          { label: "Ticket Médio",    value: fmt(ticketMedio)       },
          { label: "Dias Trabalhados",value: doMes.length.toString()},
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide mb-1">{label}</p>
            <p className="font-heading font-bold text-xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      {melhorDia && (
        <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-semibold text-sm text-ink">
              Melhor dia: {format(new Date(melhorDia.data + "T12:00:00"), "dd/MM (EEEE)", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted">{melhorDia.totalAtendimentos} atendimentos · {fmt(melhorDia.totalLiquido)} de receita</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-muted uppercase tracking-wide">
          Detalhe por dia — {format(new Date(mes + "-01"), "MMMM yyyy", { locale: ptBR })}
        </div>
        {doMes.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            <p>Nenhum fechamento registrado neste mês.</p>
            <p className="text-xs mt-1">Faça atendimentos e registre o fechamento do dia.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted border-b border-slate-100">
                <th className="px-5 py-2.5">Data</th>
                <th className="px-4 py-2.5">Atend.</th>
                <th className="px-4 py-2.5">Bruto</th>
                <th className="px-4 py-2.5">Desconto</th>
                <th className="px-4 py-2.5">Líquido</th>
                <th className="px-4 py-2.5">Lucro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doMes.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-ink">
                    {format(new Date(f.data + "T12:00:00"), "dd/MM (EEE)", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-muted">{f.totalAtendimentos}</td>
                  <td className="px-4 py-3 text-slate-600">{fmt(f.totalBruto)}</td>
                  <td className="px-4 py-3 text-amber-600">−{fmt(f.totalDescontos)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(f.totalLiquido)}</td>
                  <td className={`px-4 py-3 font-semibold ${f.lucroEstimado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmt(f.lucroEstimado)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="px-5 py-3 text-ink">Total</td>
                <td className="px-4 py-3">{totalAtend}</td>
                <td className="px-4 py-3">{fmt(totalBruto)}</td>
                <td className="px-4 py-3 text-amber-600">−{fmt(doMes.reduce((s,f)=>s+f.totalDescontos,0))}</td>
                <td className="px-4 py-3 text-emerald-700">{fmt(totalLiquido)}</td>
                <td className={`px-4 py-3 ${totalLucro >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(totalLucro)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
