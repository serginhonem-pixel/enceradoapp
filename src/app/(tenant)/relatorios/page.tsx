"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { getFechamentos, getAtendimentosPorPeriodo } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FechamentoDia, AtendimentoOS } from "@/types";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function RelatoriosPage() {
  const { tenant } = useTenant();
  const [mes, setMes] = useState(format(new Date(), "yyyy-MM"));
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [atendimentos, setAtendimentos] = useState<AtendimentoOS[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    setLoading(true);
    const inicio = startOfMonth(new Date(mes + "-01T12:00:00"));
    const fim = endOfMonth(new Date(mes + "-01T12:00:00"));
    Promise.all([
      getFechamentos(tenant.id),
      getAtendimentosPorPeriodo(tenant.id, inicio, fim),
    ]).then(([fechs, atends]) => {
      setFechamentos(fechs);
      setAtendimentos(atends);
      setLoading(false);
    });
  }, [tenant, mes]);

  const doMes = fechamentos.filter(f => f.data.startsWith(mes));
  const concluidos = atendimentos.filter(a => a.status === "concluido");

  const totalAtend   = doMes.reduce((s, f) => s + f.totalAtendimentos, 0);
  const totalBruto   = doMes.reduce((s, f) => s + f.totalBruto, 0);
  const totalLiquido = doMes.reduce((s, f) => s + f.totalLiquido, 0);
  const totalLucro   = doMes.reduce((s, f) => s + f.lucroEstimado, 0);
  const ticketMedio  = totalAtend > 0 ? totalLiquido / totalAtend : 0;

  const melhorDia = doMes.length > 0
    ? doMes.reduce((a, b) => a.totalLiquido > b.totalLiquido ? a : b)
    : null;

  // Serviços mais vendidos
  const servicoMap = new Map<string, { nome: string; qtd: number; receita: number }>();
  for (const a of concluidos) {
    for (const item of a.itens) {
      const entry = servicoMap.get(item.servicoId) ?? { nome: item.servicoNome, qtd: 0, receita: 0 };
      entry.qtd += 1;
      entry.receita += item.preco;
      servicoMap.set(item.servicoId, entry);
    }
  }
  const topServicos = Array.from(servicoMap.values()).sort((a, b) => b.qtd - a.qtd).slice(0, 8);

  // Formas de pagamento
  const pagMap = new Map<string, { qtd: number; total: number }>();
  for (const a of concluidos) {
    const key = a.formaPagamento || "Não informado";
    const entry = pagMap.get(key) ?? { qtd: 0, total: 0 };
    entry.qtd += 1;
    entry.total += a.totalFinal;
    pagMap.set(key, entry);
  }
  const pagamentos = Array.from(pagMap.entries())
    .map(([forma, v]) => ({ forma, ...v }))
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <Topbar title="Relatórios" />
      <div className="p-6 max-w-4xl">
        {/* Seletor mês */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs font-semibold text-muted">Mês</label>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand transition" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Atendimentos",      value: totalAtend.toString() },
            { label: "Faturamento Bruto", value: fmt(totalBruto) },
            { label: "Receita Líquida",   value: fmt(totalLiquido) },
            { label: "Lucro Estimado",    value: fmt(totalLucro) },
            { label: "Ticket Médio",      value: fmt(ticketMedio) },
            { label: "Dias Trabalhados",  value: doMes.length.toString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide mb-1">{label}</p>
              <p className="font-heading font-bold text-xl text-ink">{loading ? "—" : value}</p>
            </div>
          ))}
        </div>

        {/* Melhor dia */}
        {melhorDia && (
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-semibold text-sm text-ink">
                Melhor dia do mês: {format(new Date(melhorDia.data + "T12:00:00"), "dd/MM (EEEE)", { locale: ptBR })}
              </p>
              <p className="text-xs text-muted">{melhorDia.totalAtendimentos} atendimentos · {fmt(melhorDia.totalLiquido)} de receita</p>
            </div>
          </div>
        )}

        {/* Serviços + Pagamentos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Serviços mais vendidos */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-muted uppercase tracking-wide">
              Serviços mais vendidos
            </div>
            {loading ? (
              <p className="p-6 text-center text-muted text-sm">Carregando...</p>
            ) : topServicos.length === 0 ? (
              <p className="p-6 text-center text-muted text-sm">Nenhum atendimento concluído este mês.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {topServicos.map((s, i) => {
                  const maxQtd = topServicos[0].qtd;
                  return (
                    <div key={s.nome} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink flex items-center gap-2">
                          <span className="text-muted text-xs w-4">{i + 1}.</span>
                          {s.nome}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-ink">{s.qtd}x</span>
                          <span className="text-xs text-muted ml-2">{fmt(s.receita)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all"
                          style={{ width: `${(s.qtd / maxQtd) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formas de pagamento */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-muted uppercase tracking-wide">
              Formas de pagamento
            </div>
            {loading ? (
              <p className="p-6 text-center text-muted text-sm">Carregando...</p>
            ) : pagamentos.length === 0 ? (
              <p className="p-6 text-center text-muted text-sm">Nenhum atendimento concluído este mês.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pagamentos.map(p => {
                  const pct = concluidos.length > 0 ? Math.round((p.qtd / concluidos.length) * 100) : 0;
                  return (
                    <div key={p.forma} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink capitalize">{p.forma}</span>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-ink">{pct}%</span>
                          <span className="text-xs text-muted ml-2">{fmt(p.total)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tabela diária */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-muted uppercase tracking-wide">
            Detalhe por dia — {format(new Date(mes + "-01"), "MMMM yyyy", { locale: ptBR })}
          </div>
          {doMes.length === 0 ? (
            <p className="p-8 text-center text-muted text-sm">
              {loading ? "Carregando..." : "Nenhum fechamento registrado neste mês."}
            </p>
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
                    <td className="px-4 py-3 text-amber-600">− {fmt(f.totalDescontos)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(f.totalLiquido)}</td>
                    <td className={`px-4 py-3 font-semibold ${f.lucroEstimado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmt(f.lucroEstimado)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                  <td className="px-5 py-3 text-ink">Total</td>
                  <td className="px-4 py-3 text-ink">{totalAtend}</td>
                  <td className="px-4 py-3 text-ink">{fmt(totalBruto)}</td>
                  <td className="px-4 py-3 text-amber-600">− {fmt(doMes.reduce((s, f) => s + f.totalDescontos, 0))}</td>
                  <td className="px-4 py-3 text-emerald-700">{fmt(totalLiquido)}</td>
                  <td className={`px-4 py-3 ${totalLucro >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(totalLucro)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
