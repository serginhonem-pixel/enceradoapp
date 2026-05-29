"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { getAgendamentos, saveAgendamento, deleteAgendamento, getClientes, getServicos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, ChevronLeft, ChevronRight, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Agendamento, Cliente, Servico } from "@/types";

const STATUS_COLORS: Record<Agendamento["status"], string> = {
  agendado:   "bg-blue-100 text-blue-700 border-blue-200",
  confirmado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelado:  "bg-red-100 text-red-500 border-red-200",
  convertido: "bg-slate-100 text-slate-500 border-slate-200",
};

const HORARIOS = ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];

export default function AgendaPage() {
  const { tenant } = useTenant();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Agendamento | null>(null);
  const [saving, setSaving] = useState(false);

  // form
  const [clienteId, setClienteId] = useState("");
  const [veiculoIdx, setVeiculoIdx] = useState(0);
  const [servicoIds, setServicoIds] = useState<string[]>([]);
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hora, setHora] = useState("08:00");
  const [obs, setObs] = useState("");
  const [status, setStatus] = useState<Agendamento["status"]>("agendado");

  const mes = format(mesAtual, "yyyy-MM");

  function load() {
    if (!tenant) return;
    getAgendamentos(tenant.id, mes).then(setAgendamentos);
  }

  useEffect(load, [tenant, mes]);
  useEffect(() => {
    if (!tenant) return;
    getClientes(tenant.id).then(setClientes);
    getServicos(tenant.id).then(ss => setServicos(ss.filter(s => s.ativo)));
  }, [tenant]);

  function openNew(dataSelecionada?: string) {
    setEditando(null);
    setClienteId(""); setVeiculoIdx(0); setServicoIds([]);
    setData(dataSelecionada ?? diaSelecionado);
    setHora("08:00"); setObs(""); setStatus("agendado");
    setModal(true);
  }

  function openEdit(a: Agendamento) {
    setEditando(a);
    setClienteId(a.clienteId); setVeiculoIdx(0);
    setServicoIds(a.servicoIds); setData(a.data);
    setHora(a.hora); setObs(a.observacoes ?? ""); setStatus(a.status);
    setModal(true);
  }

  const clienteSel = clientes.find(c => c.id === clienteId);
  const servicosSel = servicos.filter(s => servicoIds.includes(s.id));
  const totalEstimado = servicosSel.reduce((s, x) => s + x.preco, 0);

  function toggleServico(id: string) {
    setServicoIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  async function handleSave() {
    if (!tenant || !clienteSel) { toast.error("Selecione o cliente"); return; }
    if (servicoIds.length === 0) { toast.error("Selecione ao menos um serviço"); return; }
    setSaving(true);
    try {
      const veiculo = clienteSel.veiculos[veiculoIdx] ?? clienteSel.veiculos[0];
      await saveAgendamento(tenant.id, {
        clienteId: clienteSel.id,
        clienteNome: clienteSel.nome,
        clienteTelefone: clienteSel.telefone,
        veiculoPlaca: veiculo?.placa ?? "-",
        veiculoModelo: veiculo?.modelo ?? "-",
        veiculoCor: veiculo?.cor ?? "-",
        servicoIds,
        servicoNomes: servicosSel.map(s => s.nome),
        totalEstimado,
        data, hora,
        observacoes: obs.trim() || "",
        status,
        createdAt: editando?.createdAt ?? new Date(),
      }, editando?.id);
      toast.success(editando ? "Agendamento atualizado!" : "Agendamento criado!");
      setModal(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!tenant || !confirm("Excluir este agendamento?")) return;
    await deleteAgendamento(tenant.id, id);
    toast.success("Removido");
    load();
  }

  async function handleConfirmar(a: Agendamento) {
    if (!tenant) return;
    await saveAgendamento(tenant.id, { ...a, status: "confirmado" }, a.id);
    toast.success("Confirmado!");
    load();
  }

  // Calendário
  const diasDoMes = eachDayOfInterval({ start: startOfMonth(mesAtual), end: endOfMonth(mesAtual) });
  const primeiroDiaSemana = startOfMonth(mesAtual).getDay();
  const agendaPorDia = (dia: string) => agendamentos.filter(a => a.data === dia && a.status !== "cancelado");
  const agendaDoDia = agendamentos.filter(a => a.data === diaSelecionado).sort((a, b) => a.hora.localeCompare(b.hora));

  return (
    <>
      <Topbar title="Agenda" actions={
        <button onClick={() => openNew()} className="flex items-center gap-1.5 bg-brand text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
          <Plus size={13} /> Novo Agendamento
        </button>
      } />

      <div className="p-4 max-w-5xl">
        <div className="grid md:grid-cols-[1fr_320px] gap-4">

          {/* Calendário */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header mês */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <button onClick={() => setMesAtual(m => subMonths(m, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                <ChevronLeft size={16} />
              </button>
              <span className="font-heading font-semibold text-sm capitalize">
                {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
              </span>
              <button onClick={() => setMesAtual(m => addMonths(m, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
                <div key={d} className="text-center text-[0.65rem] font-semibold text-muted py-2">{d}</div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7">
              {[...Array(primeiroDiaSemana)].map((_, i) => <div key={`e-${i}`} />)}
              {diasDoMes.map(dia => {
                const diaStr = format(dia, "yyyy-MM-dd");
                const ags = agendaPorDia(diaStr);
                const selecionado = diaStr === diaSelecionado;
                const hoje = isToday(dia);
                return (
                  <button
                    key={diaStr}
                    onClick={() => setDiaSelecionado(diaStr)}
                    className={`min-h-[60px] p-1.5 border border-slate-50 text-left transition hover:bg-slate-50 ${selecionado ? "bg-brand/10 border-brand/30" : ""}`}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${hoje ? "bg-brand text-black" : selecionado ? "text-brand" : "text-ink-3"}`}>
                      {format(dia, "d")}
                    </span>
                    <div className="space-y-0.5">
                      {ags.slice(0, 2).map(a => (
                        <div key={a.id} className={`text-[0.55rem] font-medium px-1 rounded truncate border ${STATUS_COLORS[a.status]}`}>
                          {a.hora} {a.clienteNome.split(" ")[0]}
                        </div>
                      ))}
                      {ags.length > 2 && <div className="text-[0.55rem] text-muted">+{ags.length - 2} mais</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel do dia selecionado */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-heading font-semibold text-sm text-ink capitalize">
                  {format(parseISO(diaSelecionado), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted">{agendaDoDia.length} agendamento{agendaDoDia.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => openNew(diaSelecionado)} className="p-1.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg transition">
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {agendaDoDia.length === 0 ? (
                <p className="text-center text-muted text-sm py-8">Nenhum agendamento</p>
              ) : (
                agendaDoDia.map(a => (
                  <div key={a.id} className={`rounded-xl border p-3 ${STATUS_COLORS[a.status]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{a.hora}</span>
                          <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[a.status]}`}>
                            {a.status}
                          </span>
                        </div>
                        <p className="font-semibold text-sm mt-0.5 truncate">{a.clienteNome}</p>
                        <p className="text-xs opacity-70 truncate">{a.veiculoPlaca} · {a.veiculoModelo}</p>
                        <p className="text-xs opacity-70 truncate">{a.servicoNomes.join(", ")}</p>
                        <p className="text-xs font-semibold mt-1">R$ {a.totalEstimado.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {a.status === "agendado" && (
                          <button onClick={() => handleConfirmar(a)} className="p-1 hover:bg-white/50 rounded transition" title="Confirmar">
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button onClick={() => openEdit(a)} className="p-1 hover:bg-white/50 rounded transition text-[0.6rem] font-bold">✏️</button>
                        <button onClick={() => handleDelete(a.id)} className="p-1 hover:bg-white/50 rounded transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Agendamento" : "Novo Agendamento"} size="lg">
        <div className="space-y-4">
          {/* Data e hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Data *</label>
              <input type="date" className="field-input" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Horário *</label>
              <select className="field-input" value={hora} onChange={e => setHora(e.target.value)}>
                {HORARIOS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="field-label">Cliente *</label>
            <select className="field-input" value={clienteId} onChange={e => { setClienteId(e.target.value); setVeiculoIdx(0); }}>
              <option value="">Selecione o cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>)}
            </select>
          </div>

          {/* Veículo */}
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

          {/* Serviços */}
          <div>
            <label className="field-label">Serviços *</label>
            <div className="grid grid-cols-2 gap-2">
              {servicos.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleServico(s.id)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition ${
                    servicoIds.includes(s.id)
                      ? "bg-brand/10 border-brand text-brand font-semibold"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <p className="font-medium">{s.nome}</p>
                  <p className="text-[0.65rem] opacity-70">R$ {s.preco.toFixed(2)} · {s.duracaoMin}min</p>
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          {totalEstimado > 0 && (
            <div className="bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2 text-xs font-semibold flex justify-between">
              <span>Total estimado</span>
              <span>R$ {totalEstimado.toFixed(2)}</span>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="field-label">Status</label>
            <select className="field-input" value={status} onChange={e => setStatus(e.target.value as Agendamento["status"])}>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="field-label">Observações</label>
            <textarea className="field-input resize-none h-16" value={obs} onChange={e => setObs(e.target.value)} placeholder="Alguma observação..." />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand text-black text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <style jsx global>{`
          .field-label{display:block;font-size:.7rem;font-weight:600;color:#3d4f63;margin-bottom:.35rem}
          .field-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}
          .field-input:focus{border-color:#00ff88;box-shadow:0 0 0 3px rgba(0,255,136,.08)}
        `}</style>
      </Modal>
    </>
  );
}
