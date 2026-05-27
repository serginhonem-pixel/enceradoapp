"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { getAtendimentos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, Users, DollarSign, TrendingUp } from "lucide-react";
import type { AtendimentoOS } from "@/types";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [atendimentos, setAtendimentos] = useState<AtendimentoOS[]>([]);
  const [loading, setLoading] = useState(true);

  const hoje = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!tenant) return;
    getAtendimentos(tenant.id, hoje).then((data) => {
      setAtendimentos(data);
      setLoading(false);
    });
  }, [tenant, hoje]);

  const concluidos = atendimentos.filter(a => a.status === "concluido");
  const emAndamento = atendimentos.filter(a => a.status === "em_andamento");
  const totalBruto = concluidos.reduce((s, a) => s + a.totalFinal, 0);

  const stats = [
    { label: "Atendimentos Hoje",    value: atendimentos.length.toString(), icon: ClipboardList, color: "text-blue-600",    bg: "bg-blue-50"    },
    { label: "Em Andamento",         value: emAndamento.length.toString(),  icon: Users,          color: "text-amber-600",   bg: "bg-amber-50"   },
    { label: "Concluídos",           value: concluidos.length.toString(),   icon: TrendingUp,     color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Faturamento do Dia",   value: fmt(totalBruto),                icon: DollarSign,     color: "text-purple-600",  bg: "bg-purple-50"  },
  ];

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-6 max-w-5xl">
        {/* Saudação */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-xl text-ink">
            Bom dia! 👋
          </h2>
          <p className="text-muted text-sm mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide mb-1">{label}</p>
              <p className="font-heading font-bold text-xl text-ink">{loading ? "—" : value}</p>
            </div>
          ))}
        </div>

        {/* Últimos atendimentos do dia */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm text-ink">Atendimentos de Hoje</h3>
            <a href="/atendimentos" className="text-xs text-brand hover:underline font-medium">Ver todos →</a>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted text-sm">Carregando...</div>
          ) : atendimentos.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">Nenhum atendimento hoje ainda.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {atendimentos.slice(0, 8).map(a => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{a.clienteNome}</p>
                    <p className="text-xs text-muted">{a.veiculoPlaca} · {a.veiculoModelo} · {a.veiculoCor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{fmt(a.totalFinal)}</p>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: AtendimentoOS["status"] }) {
  const map = {
    aguardando:   { label: "Aguardando",    cls: "bg-amber-50 text-amber-700"   },
    em_andamento: { label: "Em andamento",  cls: "bg-blue-50 text-blue-700"     },
    concluido:    { label: "Concluído",     cls: "bg-emerald-50 text-emerald-700" },
    cancelado:    { label: "Cancelado",     cls: "bg-red-50 text-red-600"       },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}
