"use client";
import { useState, useEffect } from "react";
import { lsGetAtendimentos, lsSaveAtendimento, lsDeleteAtendimento, lsGetClientes, lsGetServicos, lsGetProximoNumeroOS } from "@/lib/local-store";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { AtendimentoOS, Cliente, Servico, ItemOS } from "@/types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS_MAP = {
  aguardando:   { label: "Aguardando",   cls: "bg-amber-50 text-amber-700"     },
  em_andamento: { label: "Em andamento", cls: "bg-blue-50 text-blue-700"       },
  concluido:    { label: "Concluído",    cls: "bg-emerald-50 text-emerald-700" },
  cancelado:    { label: "Cancelado",    cls: "bg-red-50 text-red-600"         },
};

export default function DemoAtendimentos() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoOS[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<AtendimentoOS | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [veiculoIdx, setVeiculoIdx] = useState(0);
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [pagamento, setPagamento] = useState("dinheiro");
  const [obs, setObs] = useState("");
  const [status, setStatus] = useState<AtendimentoOS["status"]>("aguardando");

  function load() { setAtendimentos(lsGetAtendimentos(data)); }
  useEffect(load, [data]);
  useEffect(() => {
    setClientes(lsGetClientes());
    setServicos(lsGetServicos().filter(s => s.ativo));
  }, []);

  function openNew() {
    setEditando(null); setClienteId(""); setVeiculoIdx(0); setItens([]);
    setDesconto(0); setPagamento("dinheiro"); setObs(""); setStatus("aguardando");
    setModal(true);
  }
  function openEdit(a: AtendimentoOS) {
    setEditando(a); setClienteId(a.clienteId); setVeiculoIdx(0); setItens(a.itens);
    setDesconto(a.desconto); setPagamento(a.formaPagamento); setObs(a.observacoes ?? ""); setStatus(a.status);
    setModal(true);
  }

  const clienteSel = clientes.find(c => c.id === clienteId);
  const total = itens.reduce((s, i) => s + i.preco, 0);
  const totalFinal = Math.max(0, total - desconto);

  function handleSave() {
    if (!clienteSel) return;
    const veiculo = clienteSel.veiculos[veiculoIdx] ?? clienteSel.veiculos[0];
    const numero = editando?.numero ?? lsGetProximoNumeroOS();
    lsSaveAtendimento({
      numero, clienteId: clienteSel.id, clienteNome: clienteSel.nome,
      veiculoPlaca: veiculo?.placa ?? "-", veiculoModelo: veiculo?.modelo ?? "-", veiculoCor: veiculo?.cor ?? "-",
      itens, total, desconto, totalFinal, formaPagamento: pagamento, status, observacoes: obs || undefined,
      createdAt: editando?.createdAt ?? new Date(), updatedAt: new Date(),
      concluidoAt: status === "concluido" ? new Date() : undefined,
    }, editando?.id);
    toast.success(editando ? "OS atualizada!" : "OS aberta!"); setModal(false); load();
  }

  function handleConcluir(a: AtendimentoOS) {
    lsSaveAtendimento({ ...a, status: "concluido", updatedAt: new Date(), concluidoAt: new Date() }, a.id);
    toast.success("OS concluída! ✅"); load();
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir esta OS?")) return;
    lsDeleteAtendimento(id); toast.success("Removida"); load();
  }

  return (
    <>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-xl text-ink">Atendimentos</h2>
          <button onClick={openNew} className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
            <Plus size={13} /> Nova OS
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <label className="text-xs font-semibold text-muted">Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand transition" />
          <span className="text-sm text-muted">{atendimentos.length} atendimento{atendimentos.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {atendimentos.length === 0 ? (
            <p className="p-8 text-center text-muted text-sm">Nenhum atendimento neste dia. Clique em "Nova OS" para criar.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted border-b border-slate-100">
                  <th className="px-5 py-3">OS</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Veículo</th>
                  <th className="px-4 py-3">Total</th><th className="px-4 py-3">Pgto</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atendimentos.map(a => {
                  const { label, cls } = STATUS_MAP[a.status];
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-xs text-muted">#{String(a.numero).padStart(4, "0")}</td>
                      <td className="px-4 py-3 font-medium text-ink">{a.clienteNome}</td>
                      <td className="px-4 py-3 text-xs text-muted">{a.veiculoPlaca} · {a.veiculoModelo} · {a.veiculoCor}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(a.totalFinal)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{a.formaPagamento}</td>
                      <td className="px-4 py-3"><span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          {a.status !== "concluido" && a.status !== "cancelado" && (
                            <button onClick={() => handleConcluir(a)} className="p-1.5 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition" title="Concluir">
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand transition"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? `Editar OS #${String(editando.numero).padStart(4,"0")}` : "Nova OS"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="field-label">Cliente *</label>
            <select className="field-input" value={clienteId} onChange={e => { setClienteId(e.target.value); setVeiculoIdx(0); }}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>)}
            </select>
          </div>
          {clienteSel && clienteSel.veiculos.length > 0 && (
            <div>
              <label className="field-label">Veículo</label>
              <select className="field-input" value={veiculoIdx} onChange={e => setVeiculoIdx(Number(e.target.value))}>
                {clienteSel.veiculos.map((v, i) => <option key={v.id} value={i}>{v.placa} · {v.modelo} · {v.cor}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="field-label">Serviços</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {servicos.map(s => (
                <button key={s.id} type="button"
                  onClick={() => setItens(ii => [...ii, { servicoId: s.id, servicoNome: s.nome, preco: s.preco }])}
                  className="text-xs bg-brand/10 text-brand hover:bg-brand/20 px-2.5 py-1 rounded-full font-medium transition">
                  + {s.nome} ({fmt(s.preco)})
                </button>
              ))}
            </div>
            {itens.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                {itens.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-2">
                    <span>{item.servicoNome}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-700">{fmt(item.preco)}</span>
                      <button onClick={() => setItens(ii => ii.filter((_, ii2) => ii2 !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-1 px-2 flex justify-between font-semibold text-sm">
                  <span>Subtotal</span><span>{fmt(total)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="field-label">Desconto (R$)</label><input className="field-input" type="number" min="0" step="0.01" value={desconto} onChange={e => setDesconto(Number(e.target.value))} /></div>
            <div>
              <label className="field-label">Pagamento</label>
              <select className="field-input" value={pagamento} onChange={e => setPagamento(e.target.value)}>
                <option value="dinheiro">Dinheiro</option><option value="pix">PIX</option>
                <option value="debito">Débito</option><option value="credito">Crédito</option>
              </select>
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="field-input" value={status} onChange={e => setStatus(e.target.value as AtendimentoOS["status"])}>
                <option value="aguardando">Aguardando</option><option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option><option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <div><label className="field-label">Observações</label><textarea className="field-input resize-none h-16" value={obs} onChange={e => setObs(e.target.value)} /></div>
          <div className="bg-brand/5 border border-brand/20 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-sm text-ink">Total Final</span>
            <span className="font-heading font-bold text-xl text-brand">{fmt(totalFinal)}</span>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={!clienteId || itens.length === 0} className="flex-1 bg-brand text-white text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">Salvar OS</button>
          </div>
        </div>
      </Modal>
      <style jsx global>{`.field-label{display:block;font-size:.7rem;font-weight:600;color:#3d4f63;margin-bottom:.35rem}.field-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}.field-input:focus{border-color:#0057ff;box-shadow:0 0 0 3px rgba(0,87,255,.08)}`}</style>
    </>
  );
}
