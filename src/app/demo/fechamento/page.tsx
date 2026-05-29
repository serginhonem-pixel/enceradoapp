"use client";
import { useState, useEffect } from "react";
import { lsGetAtendimentos, lsGetCustos, lsGetFechamentos, lsSaveFechamento } from "@/lib/local-store";
import { CheckCircle2, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import type { AtendimentoOS, CustoFixo, FechamentoDia } from "@/types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DemoFechamento() {
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [atendimentos, setAtendimentos] = useState<AtendimentoOS[]>([]);
  const [custos, setCustos] = useState<CustoFixo[]>([]);
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);

  function loadAll() {
    setAtendimentos(lsGetAtendimentos(data));
    setCustos(lsGetCustos().filter(c => c.ativo));
    setFechamentos(lsGetFechamentos());
  }
  useEffect(loadAll, [data]);

  const concluidos    = atendimentos.filter(a => a.status === "concluido");
  const totalBruto    = concluidos.reduce((s, a) => s + a.total, 0);
  const totalDescontos= concluidos.reduce((s, a) => s + a.desconto, 0);
  const totalLiquido  = concluidos.reduce((s, a) => s + a.totalFinal, 0);
  const custoDia      = custos.reduce((s, c) => s + c.valor, 0) / 30;
  const lucro         = totalLiquido - custoDia;
  const jaFechado     = fechamentos.some(f => f.data === data);

  function handleFechar() {
    if (jaFechado && !confirm("Já existe fechamento para este dia. Atualizar?")) return;
    lsSaveFechamento({ data, totalAtendimentos: concluidos.length, totalBruto, totalDescontos, totalLiquido, totalCustos: custoDia, lucroEstimado: lucro, fechadoEm: new Date() });
    toast.success("Fechamento registrado! ✅");
    setFechamentos(lsGetFechamentos());
  }

  const cards = [
    { label: "Concluídos",       value: concluidos.length.toString(), icon: CheckCircle2, color: "text-blue-600",    bg: "bg-blue-50"    },
    { label: "Fat. Bruto",       value: fmt(totalBruto),              icon: DollarSign,   color: "text-purple-600",  bg: "bg-purple-50"  },
    { label: "Descontos",        value: fmt(totalDescontos),          icon: TrendingDown, color: "text-amber-600",   bg: "bg-amber-50"   },
    { label: "Líquido do Dia",   value: fmt(totalLiquido),            icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-heading font-bold text-xl text-ink">Fechamento do Dia</h2>
        {jaFechado && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">✓ Já fechado</span>}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label className="text-xs font-semibold text-muted">Data</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand transition" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}><Icon size={16} className={color} /></div>
            <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide mb-1">{label}</p>
            <p className="font-heading font-bold text-xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h3 className="font-heading font-semibold text-sm mb-4 text-ink">Estimativa de Resultado</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Receita líquida</span><span className="font-semibold text-ink">{fmt(totalLiquido)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Custos fixos rateados (÷30)</span><span className="font-semibold text-red-600">− {fmt(custoDia)}</span></div>
          <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold">
            <span className="text-ink">Lucro estimado</span>
            <span className={lucro >= 0 ? "text-emerald-600" : "text-red-600"}>{fmt(lucro)}</span>
          </div>
        </div>
      </div>

      <button onClick={handleFechar} disabled={concluidos.length === 0}
        className="w-full bg-ink text-white font-semibold py-3 rounded-xl hover:bg-ink-2 disabled:opacity-40 transition text-sm">
        {concluidos.length === 0 ? "Nenhum atendimento concluído hoje" : "Registrar Fechamento do Dia"}
      </button>

      {fechamentos.length > 0 && (
        <div className="mt-8">
          <h3 className="font-heading font-semibold text-sm text-ink mb-3">Histórico</h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs font-semibold text-muted border-b border-slate-100">
                <th className="px-5 py-2.5">Data</th><th className="px-4 py-2.5">Atend.</th><th className="px-4 py-2.5">Líquido</th><th className="px-4 py-2.5">Lucro</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {fechamentos.slice(0, 15).map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-ink">{format(new Date(f.data + "T12:00:00"), "dd/MM (EEE)", { locale: ptBR })}</td>
                    <td className="px-4 py-3 text-muted">{f.totalAtendimentos}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(f.totalLiquido)}</td>
                    <td className={`px-4 py-3 font-semibold ${f.lucroEstimado >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(f.lucroEstimado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
