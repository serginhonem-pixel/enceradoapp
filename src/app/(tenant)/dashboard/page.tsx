"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { getAtendimentos, getAgendamentos, getServicos, saveAtendimento, saveAgendamento, getProximoNumeroOS } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, Users, DollarSign, TrendingUp, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { AtendimentoOS, Agendamento, Servico, ItemOS } from "@/types";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const { tenant } = useTenant();
  const router = useRouter();
  const [atendimentos, setAtendimentos] = useState<AtendimentoOS[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertendo, setConvertendo] = useState<string | null>(null);

  const hoje = format(new Date(), "yyyy-MM-dd");

  function load() {
    if (!tenant) return;
    Promise.all([
      getAtendimentos(tenant.id, hoje),
      getAgendamentos(tenant.id, format(new Date(), "yyyy-MM")),
      getServicos(tenant.id),
    ]).then(([ats, ags, svcs]) => {
      setAtendimentos(ats);
      setAgendamentos(ags.filter(a => a.data === hoje && a.status !== "convertido" && a.status !== "cancelado"));
      setServicos(svcs.filter(s => s.ativo));
      setLoading(false);
    });
  }

  useEffect(load, [tenant]);

  async function handleConverter(a: Agendamento) {
    if (!tenant) return;
    setConvertendo(a.id);
    try {
      const servicosSel = servicos.filter(s => a.servicoIds.includes(s.id));
      const itens: ItemOS[] = servicosSel.map(s => ({
        servicoId: s.id,
        servicoNome: s.nome,
        preco: s.preco,
      }));
      const total = itens.reduce((sum, i) => sum + i.preco, 0);
      const numero = await getProximoNumeroOS(tenant.id);
      await saveAtendimento(tenant.id, {
        numero,
        clienteId: a.clienteId,
        clienteNome: a.clienteNome,
        veiculoPlaca: a.veiculoPlaca,
        veiculoModelo: a.veiculoModelo,
        veiculoCor: a.veiculoCor,
        itens,
        total,
        desconto: 0,
        totalFinal: total,
        formaPagamento: "dinheiro",
        status: "aguardando",
        observacoes: a.observacoes || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        agendadoPara: `${a.data}T${a.hora}`,
        agendadoHora: a.hora,
      });
      await saveAgendamento(tenant.id, { ...a, status: "convertido" }, a.id);
      toast.success(`OS de ${a.clienteNome} criada!`);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar OS");
    } finally {
      setConvertendo(null);
    }
  }

  const concluidos = atendimentos.filter(a => a.status === "concluido");
  const emAndamento = atendimentos.filter(a => a.status === "em_andamento");
  const totalBruto = concluidos.reduce((s, a) => s + a.totalFinal, 0);

  const tenantParam = tenant?.slug ? `?tenant=${tenant.slug}` : "";

  const stats = [
    { label: "Atendimentos Hoje",  value: atendimentos.length.toString(), icon: ClipboardList, color: "text-blue-600",    bg: "bg-blue-50"    },
    { label: "Em Andamento",       value: emAndamento.length.toString(),  icon: Users,         color: "text-amber-600",   bg: "bg-amber-50"   },
    { label: "Concluídos",         value: concluidos.length.toString(),   icon: TrendingUp,    color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Faturamento do Dia", value: fmt(totalBruto),                icon: DollarSign,    color: "text-purple-600",  bg: "bg-purple-50"  },
  ];

  const hora = format(new Date(), "HH");
  const saudacao = Number(hora) < 12 ? "Bom dia" : Number(hora) < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-6 max-w-5xl">
        {/* Saudação */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-xl text-ink">{saudacao}! 👋</h2>
          <p className="text-muted text-sm mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        {/* Agendamentos pendentes de hoje */}
        {(loading || agendamentos.length > 0) && (
          <div className="bg-white rounded-xl border border-slate-200 mb-4">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock size={14} className="text-brand" />
                <h3 className="font-heading font-semibold text-sm text-ink">Agendamentos de Hoje</h3>
                {agendamentos.length > 0 && (
                  <span className="text-[0.65rem] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                    {agendamentos.length}
                  </span>
                )}
              </div>
              <a href={`/agenda${tenantParam}`} className="text-xs text-brand hover:underline font-medium">Ver agenda →</a>
            </div>
            {loading ? (
              <div className="p-6 text-center text-muted text-sm">Carregando...</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {agendamentos.map(a => (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="text-center shrink-0 w-10">
                      <p className="text-xs font-bold text-ink">{a.hora}</p>
                      <p className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${
                        a.status === "confirmado" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      }`}>{a.status}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{a.clienteNome}</p>
                      <p className="text-xs text-muted truncate">{a.veiculoPlaca} · {a.veiculoModelo} · {a.servicoNomes.join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-semibold text-ink">{fmt(a.totalEstimado)}</p>
                      <button
                        onClick={() => handleConverter(a)}
                        disabled={convertendo === a.id}
                        className="flex items-center gap-1.5 bg-brand text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand/80 disabled:opacity-60 transition whitespace-nowrap"
                      >
                        <ClipboardList size={12} />
                        {convertendo === a.id ? "Abrindo..." : "Abrir OS"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Atendimentos do dia */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm text-ink">Atendimentos de Hoje</h3>
            <a href={`/atendimentos${tenantParam}`} className="text-xs text-brand hover:underline font-medium">Ver todos →</a>
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
    aguardando:   { label: "Aguardando",   cls: "bg-amber-50 text-amber-700"     },
    em_andamento: { label: "Em andamento", cls: "bg-blue-50 text-blue-700"       },
    concluido:    { label: "Concluído",    cls: "bg-emerald-50 text-emerald-700" },
    cancelado:    { label: "Cancelado",    cls: "bg-red-50 text-red-600"         },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}
