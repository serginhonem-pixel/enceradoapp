"use client";
import { useState, useEffect } from "react";
import {
  lsGetAgendamentos, lsSaveAgendamento,
  lsDeleteAgendamento, lsGetClientes, lsGetServicos,
  lsGetProximoNumeroOS, lsSaveAtendimento,
} from "@/lib/local-store";
import { Modal } from "@/components/ui/Modal";
import {
  Plus, ChevronLeft, ChevronRight, Trash2, ArrowRight,
  Phone, CheckCircle2, Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
  isSameDay, isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Agendamento, Cliente, Servico } from "@/types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const HORAS = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00",
];

const STATUS_AG = {
  agendado:   { label: "Agendado",   cls: "bg-blue-50 text-blue-700 border-blue-200"          },
  confirmado: { label: "Confirmado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelado:  { label: "Cancelado",  cls: "bg-red-50 text-red-500 border-red-200"             },
  convertido: { label: "OS Aberta",  cls: "bg-purple-50 text-purple-700 border-purple-200"    },
};

const DOT_COLORS: Record<Agendamento["status"], string> = {
  agendado:   "bg-blue-400",
  confirmado: "bg-emerald-400",
  cancelado:  "bg-red-300",
  convertido: "bg-purple-400",
};

export default function DemoAgenda() {
  const [mesBase, setMesBase] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Agendamento | null>(null);

  // form
  const [clienteId, setClienteId] = useState("");
  const [veiculoIdx, setVeiculoIdx] = useState(0);
  const [servicosSel, setServicosSel] = useState<string[]>([]);
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hora, setHora] = useState("09:00");
  const [obs, setObs] = useState("");

  function load() { setAgendamentos(lsGetAgendamentos()); }
  useEffect(() => {
    load();
    setClientes(lsGetClientes());
    setServicos(lsGetServicos().filter(s => s.ativo));
  }, []);

  // ── Dias do calendário ──────────────────────────────────────────────────────
  const inicioCalendario = startOfWeek(startOfMonth(mesBase), { weekStartsOn: 0 });
  const fimCalendario    = endOfWeek(endOfMonth(mesBase), { weekStartsOn: 0 });
  const diasCalendario   = eachDayOfInterval({ start: inicioCalendario, end: fimCalendario });

  const diaSelecionadoStr = format(diaSelecionado, "yyyy-MM-dd");
  const agsDia = agendamentos
    .filter(a => a.data === diaSelecionadoStr)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openNew(d?: Date) {
    setEditando(null);
    setClienteId(""); setVeiculoIdx(0); setServicosSel([]);
    setData(format(d ?? diaSelecionado, "yyyy-MM-dd"));
    setHora("09:00"); setObs("");
    setModal(true);
  }

  function openEdit(ag: Agendamento) {
    setEditando(ag);
    setClienteId(ag.clienteId); setVeiculoIdx(0);
    setServicosSel(ag.servicoIds);
    setData(ag.data); setHora(ag.hora); setObs(ag.observacoes ?? "");
    setModal(true);
  }

  const clienteSel = clientes.find(c => c.id === clienteId);
  const servicosSelecionados = servicos.filter(s => servicosSel.includes(s.id));
  const totalEstimado = servicosSelecionados.reduce((s, sv) => s + sv.preco, 0);

  function toggleServico(id: string) {
    setServicosSel(ss => ss.includes(id) ? ss.filter(x => x !== id) : [...ss, id]);
  }

  function handleSave() {
    if (!clienteSel || servicosSel.length === 0) return;
    const veiculo = clienteSel.veiculos[veiculoIdx] ?? clienteSel.veiculos[0];
    lsSaveAgendamento({
      clienteId: clienteSel.id,
      clienteNome: clienteSel.nome,
      clienteTelefone: clienteSel.telefone,
      veiculoPlaca: veiculo?.placa ?? "-",
      veiculoModelo: veiculo?.modelo ?? "-",
      veiculoCor: veiculo?.cor ?? "-",
      servicoIds: servicosSel,
      servicoNomes: servicosSelecionados.map(s => s.nome),
      totalEstimado,
      data, hora, observacoes: obs || undefined,
      status: "agendado",
      createdAt: new Date(),
    }, editando?.id);
    toast.success(editando ? "Agendamento atualizado!" : "✅ Agendado!");
    setModal(false); load();
  }

  function handleConfirmar(ag: Agendamento) {
    lsSaveAgendamento({ ...ag, status: "confirmado" }, ag.id);
    toast.success("Confirmado!"); load();
  }

  function handleCancelar(ag: Agendamento) {
    if (!confirm("Cancelar este agendamento?")) return;
    lsSaveAgendamento({ ...ag, status: "cancelado" }, ag.id);
    toast.success("Agendamento cancelado"); load();
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este agendamento?")) return;
    lsDeleteAgendamento(id); toast.success("Removido"); load();
  }

  function handleConverterOS(ag: Agendamento) {
    if (!confirm(`Abrir OS para ${ag.clienteNome}?`)) return;
    const numero = lsGetProximoNumeroOS();
    const servs = servicos.filter(s => ag.servicoIds.includes(s.id));
    const total = servs.reduce((s, sv) => s + sv.preco, 0);
    const osId = lsSaveAtendimento({
      numero,
      clienteId: ag.clienteId,
      clienteNome: ag.clienteNome,
      veiculoPlaca: ag.veiculoPlaca,
      veiculoModelo: ag.veiculoModelo,
      veiculoCor: ag.veiculoCor,
      itens: servs.map(s => ({ servicoId: s.id, servicoNome: s.nome, preco: s.preco })),
      total, desconto: 0, totalFinal: total,
      formaPagamento: "dinheiro",
      status: "aguardando",
      createdAt: new Date(), updatedAt: new Date(),
      agendadoPara: ag.data + "T" + ag.hora,
      agendadoHora: ag.hora,
    });
    lsSaveAgendamento({ ...ag, status: "convertido", osId }, ag.id);
    toast.success("OS aberta! 🚗"); load();
  }

  const SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  return (
    <>
      <div className="p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-xl text-ink">Agenda</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { setMesBase(new Date()); setDiaSelecionado(new Date()); }}
              className="text-xs font-semibold text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/5 transition">
              Hoje
            </button>
            <button onClick={() => openNew()}
              className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
              <Plus size={13} /> Novo Agendamento
            </button>
          </div>
        </div>

        <div className="flex gap-5 items-start">
          {/* ── Calendário ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 min-w-0">
            {/* Cabeçalho do mês */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <button onClick={() => setMesBase(m => subMonths(m, 1))}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition">
                <ChevronLeft size={16} />
              </button>
              <span className="font-heading font-bold text-sm text-ink capitalize">
                {format(mesBase, "MMMM yyyy", { locale: ptBR })}
              </span>
              <button onClick={() => setMesBase(m => addMonths(m, 1))}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {SEMANA.map(d => (
                <div key={d} className="py-2 text-center text-[0.65rem] font-semibold text-muted uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7">
              {diasCalendario.map((dia, idx) => {
                const ds = format(dia, "yyyy-MM-dd");
                const agsAtivos = agendamentos.filter(a => a.data === ds && a.status !== "cancelado");
                const selecionado = isSameDay(dia, diaSelecionado);
                const mesAtual  = isSameMonth(dia, mesBase);
                const hoje      = isToday(dia);
                const borderTop = idx >= 7 ? "border-t border-slate-100" : "";
                const borderLeft = idx % 7 !== 0 ? "border-l border-slate-100" : "";

                return (
                  <button
                    key={ds}
                    onClick={() => {
                      setDiaSelecionado(dia);
                      if (!isSameMonth(dia, mesBase)) setMesBase(dia);
                    }}
                    className={`relative flex flex-col p-1.5 min-h-[72px] text-left transition group ${borderTop} ${borderLeft} ${
                      selecionado ? "bg-brand/5" : "hover:bg-slate-50"
                    } ${!mesAtual ? "opacity-40" : ""}`}
                  >
                    {/* Número do dia */}
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mb-1 transition ${
                      selecionado && hoje ? "bg-brand text-white" :
                      selecionado        ? "bg-brand text-white" :
                      hoje               ? "border-2 border-brand text-brand" :
                                           "text-ink group-hover:bg-slate-200"
                    }`}>
                      {format(dia, "d")}
                    </span>

                    {/* Dots de agendamentos */}
                    {agsAtivos.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 px-0.5">
                        {agsAtivos.slice(0, 3).map(ag => (
                          <span key={ag.id} className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[ag.status]}`} />
                        ))}
                        {agsAtivos.length > 3 && (
                          <span className="text-[0.55rem] text-muted font-bold">+{agsAtivos.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Preview do primeiro agendamento (células maiores) */}
                    {agsAtivos.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {agsAtivos.slice(0, 2).map(ag => (
                          <div key={ag.id}
                            className={`text-[0.6rem] font-medium px-1 py-0.5 rounded truncate leading-tight ${STATUS_AG[ag.status].cls} border`}>
                            {ag.hora} {ag.clienteNome.split(" ")[0]}
                          </div>
                        ))}
                        {agsAtivos.length > 2 && (
                          <p className="text-[0.58rem] text-muted px-1">+{agsAtivos.length - 2} mais</p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Painel do dia selecionado ──────────────────────────────────── */}
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[0.65rem] font-semibold text-muted uppercase tracking-wide">
                    {format(diaSelecionado, "EEEE", { locale: ptBR })}
                  </p>
                  <p className="font-heading font-bold text-base text-ink capitalize">
                    {format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <button onClick={() => openNew(diaSelecionado)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark transition"
                  title="Novo agendamento neste dia">
                  <Plus size={13} />
                </button>
              </div>

              {agsDia.length === 0 ? (
                <div className="p-6 text-center">
                  <Calendar size={28} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs text-muted mb-3">Nenhum agendamento.</p>
                  <button onClick={() => openNew(diaSelecionado)}
                    className="text-xs text-brand font-semibold hover:underline">
                    + Agendar aqui
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {agsDia.map(ag => {
                    const { label, cls } = STATUS_AG[ag.status];
                    return (
                      <div key={ag.id} className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className="font-mono text-[0.7rem] font-bold text-brand">{ag.hora}</span>
                              <span className={`text-[0.58rem] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>{label}</span>
                            </div>
                            <p className="font-semibold text-xs text-ink truncate">{ag.clienteNome}</p>
                            <p className="text-[0.65rem] text-muted truncate">{ag.veiculoPlaca} · {ag.veiculoModelo}</p>
                            <p className="text-[0.65rem] text-muted truncate mt-0.5">{ag.servicoNomes.join(" + ")}</p>
                          </div>
                          <p className="text-xs font-bold text-emerald-700 shrink-0">{fmt(ag.totalEstimado)}</p>
                        </div>

                        {ag.observacoes && (
                          <p className="text-[0.65rem] text-slate-400 italic mb-2 truncate">"{ag.observacoes}"</p>
                        )}

                        <a href={`https://wa.me/55${ag.clienteTelefone.replace(/\D/g, "")}`} target="_blank"
                          className="inline-flex items-center gap-1 text-[0.62rem] text-emerald-600 hover:underline mb-2">
                          <Phone size={9} /> {ag.clienteTelefone}
                        </a>

                        {/* Ações */}
                        {ag.status !== "convertido" && ag.status !== "cancelado" && (
                          <div className="flex flex-wrap gap-1">
                            {ag.status === "agendado" && (
                              <button onClick={() => handleConfirmar(ag)}
                                className="flex items-center gap-1 text-[0.65rem] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-md transition">
                                <CheckCircle2 size={10} /> Confirmar
                              </button>
                            )}
                            <button onClick={() => handleConverterOS(ag)}
                              className="flex items-center gap-1 text-[0.65rem] font-semibold bg-brand/10 text-brand hover:bg-brand/20 px-2 py-1 rounded-md transition">
                              <ArrowRight size={10} /> Abrir OS
                            </button>
                            <button onClick={() => openEdit(ag)}
                              className="text-[0.65rem] font-medium text-muted hover:text-ink px-2 py-1 rounded-md hover:bg-slate-100 transition">
                              Editar
                            </button>
                            <button onClick={() => handleCancelar(ag)}
                              className="text-[0.65rem] font-medium text-red-400 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition ml-auto">
                              Cancelar
                            </button>
                          </div>
                        )}

                        {ag.status === "convertido" && (
                          <div className="flex items-center gap-1 text-[0.65rem] text-purple-600 font-medium">
                            <CheckCircle2 size={10} />
                            <a href="/demo/atendimentos" className="underline">OS aberta · Ver atendimentos</a>
                          </div>
                        )}

                        {ag.status === "cancelado" && (
                          <div className="flex items-center justify-between">
                            <span className="text-[0.65rem] text-red-400">Cancelado</span>
                            <button onClick={() => handleDelete(ag.id)}
                              className="text-[0.65rem] text-muted hover:text-red-500 flex items-center gap-1 transition">
                              <Trash2 size={10} /> Remover
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal novo/editar agendamento ──────────────────────────────────────── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Agendamento" : "Novo Agendamento"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Data *</label>
              <input type="date" className="field-input" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Horário *</label>
              <select className="field-input" value={hora} onChange={e => setHora(e.target.value)}>
                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Cliente *</label>
            <select className="field-input" value={clienteId} onChange={e => { setClienteId(e.target.value); setVeiculoIdx(0); }}>
              <option value="">Selecione o cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>)}
            </select>
          </div>

          {clienteSel && clienteSel.veiculos.length > 0 && (
            <div>
              <label className="field-label">Veículo</label>
              <select className="field-input" value={veiculoIdx} onChange={e => setVeiculoIdx(Number(e.target.value))}>
                {clienteSel.veiculos.map((v, i) => (
                  <option key={v.id} value={i}>{v.placa} · {v.modelo} · {v.cor}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="field-label">Serviços *</label>
            <div className="grid grid-cols-2 gap-2">
              {servicos.map(s => (
                <label key={s.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                    servicosSel.includes(s.id)
                      ? "border-brand bg-brand/5 text-brand"
                      : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <input type="checkbox" className="accent-brand" checked={servicosSel.includes(s.id)}
                    onChange={() => toggleServico(s.id)} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{s.nome}</p>
                    <p className="text-[0.65rem] text-muted">{fmt(s.preco)} · {s.duracaoMin}min</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Observações</label>
            <textarea className="field-input resize-none h-16" value={obs}
              onChange={e => setObs(e.target.value)} placeholder="Ex: cliente prefere sem cera..." />
          </div>

          {totalEstimado > 0 && (
            <div className="bg-brand/5 border border-brand/20 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-ink">Total estimado</span>
              <span className="font-heading font-bold text-lg text-brand">{fmt(totalEstimado)}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)}
              className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!clienteId || servicosSel.length === 0}
              className="flex-1 bg-brand text-white text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">
              {editando ? "Salvar" : "Agendar"}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .field-label{display:block;font-size:.7rem;font-weight:600;color:#3d4f63;margin-bottom:.35rem}
        .field-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}
        .field-input:focus{border-color:#0057ff;box-shadow:0 0 0 3px rgba(0,87,255,.08)}
      `}</style>
    </>
  );
}
