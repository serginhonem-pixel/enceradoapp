"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import {
  getAtendimentos, saveAtendimento, deleteAtendimento,
  getClientes, getServicos, getProdutos, getProximoNumeroOS,
} from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AtendimentoOS, Cliente, Servico, Produto, ItemOS } from "@/types";

const STATUS_LABELS: Record<AtendimentoOS["status"], { label: string; cls: string }> = {
  aguardando:   { label: "Aguardando",   cls: "bg-amber-50   text-amber-700"    },
  em_andamento: { label: "Em andamento", cls: "bg-blue-50    text-blue-700"     },
  concluido:    { label: "Concluído",    cls: "bg-emerald-50 text-emerald-700"  },
  cancelado:    { label: "Cancelado",    cls: "bg-red-50     text-red-600"      },
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AtendimentosPage() {
  const { tenant } = useTenant();
  const [atendimentos, setAtendimentos] = useState<AtendimentoOS[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<AtendimentoOS | null>(null);

  // form
  const [clienteId, setClienteId] = useState("");
  const [veiculoIdx, setVeiculoIdx] = useState(0);
  const [itens, setItens] = useState<ItemOS[]>([]);        // serviços
  const [produtoQtd, setProdutoQtd] = useState<Record<string, number>>({});
  const [desconto, setDesconto] = useState(0);
  const [pagamento, setPagamento] = useState("dinheiro");
  const [obs, setObs] = useState("");
  const [status, setStatus] = useState<AtendimentoOS["status"]>("aguardando");
  const [saving, setSaving] = useState(false);

  function load() {
    if (!tenant) return;
    getAtendimentos(tenant.id, data).then(setAtendimentos);
  }
  useEffect(load, [tenant, data]);
  useEffect(() => {
    if (!tenant) return;
    getClientes(tenant.id).then(setClientes);
    getServicos(tenant.id).then(ss => setServicos(ss.filter(s => s.ativo)));
    getProdutos(tenant.id).then(ps => setProdutos(ps.filter(p => p.ativo && (p.precoVenda ?? 0) > 0)));
  }, [tenant]);

  function openNew() {
    setEditando(null);
    setClienteId(""); setVeiculoIdx(0); setItens([]); setProdutoQtd({});
    setDesconto(0); setPagamento("dinheiro"); setObs(""); setStatus("aguardando");
    setModal(true);
  }

  function openEdit(a: AtendimentoOS) {
    setEditando(a);
    setClienteId(a.clienteId); setVeiculoIdx(0);
    setItens(a.itens.filter(i => i.tipo !== "produto"));
    const qtd: Record<string, number> = {};
    a.itens.filter(i => i.tipo === "produto").forEach(i => { qtd[i.servicoId] = i.quantidade ?? 1; });
    setProdutoQtd(qtd);
    setDesconto(a.desconto); setPagamento(a.formaPagamento); setObs(a.observacoes ?? "");
    setStatus(a.status);
    setModal(true);
  }

  const clienteSelecionado = clientes.find(c => c.id === clienteId);
  const totalServicos = itens.reduce((s, i) => s + i.preco, 0);
  const totalProdutos = produtos
    .filter(p => (produtoQtd[p.id] ?? 0) > 0)
    .reduce((s, p) => s + (p.precoVenda ?? 0) * (produtoQtd[p.id] ?? 0), 0);
  const total = totalServicos + totalProdutos;
  const totalFinal = Math.max(0, total - desconto);

  function addServico(s: Servico) {
    setItens(ii => [...ii, { servicoId: s.id, servicoNome: s.nome, preco: s.preco }]);
  }

  function removeItem(idx: number) {
    setItens(ii => ii.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!tenant || !clienteSelecionado) return;
    setSaving(true);
    try {
      const veiculo = clienteSelecionado.veiculos[veiculoIdx] ?? clienteSelecionado.veiculos[0];
      const numero = editando?.numero ?? await getProximoNumeroOS(tenant.id);
      const itensProduto: ItemOS[] = produtos
        .filter(p => (produtoQtd[p.id] ?? 0) > 0)
        .map(p => ({
          servicoId: p.id,
          servicoNome: p.nome,
          preco: p.precoVenda ?? 0,
          tipo: "produto" as const,
          quantidade: produtoQtd[p.id],
        }));
      const allItens = [...itens, ...itensProduto];

      await saveAtendimento(tenant.id, {
        numero,
        clienteId: clienteSelecionado.id,
        clienteNome: clienteSelecionado.nome,
        veiculoPlaca: veiculo?.placa ?? "-",
        veiculoModelo: veiculo?.modelo ?? "-",
        veiculoCor: veiculo?.cor ?? "-",
        itens: allItens,
        total,
        desconto,
        totalFinal,
        formaPagamento: pagamento,
        status,
        observacoes: obs.trim() || "",
        createdAt: editando?.createdAt ?? new Date(),
        updatedAt: new Date(),
        concluidoAt: status === "concluido" ? new Date() : undefined,
      }, editando?.id);
      toast.success(editando ? "OS atualizada!" : "OS aberta!");
      setModal(false);
      load();
    } catch (err) {
      console.error("Erro ao salvar OS:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg.slice(0, 120));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!tenant || !confirm("Excluir esta OS?")) return;
    await deleteAtendimento(tenant.id, id);
    toast.success("Removida");
    load();
  }

  async function handleConcluir(a: AtendimentoOS) {
    if (!tenant) return;
    await saveAtendimento(tenant.id, { ...a, status: "concluido", updatedAt: new Date(), concluidoAt: new Date() }, a.id);
    toast.success("OS concluída!");
    load();
  }

  return (
    <>
      <Topbar
        title="Atendimentos"
        actions={
          <button onClick={openNew} className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
            <Plus size={13} /> Nova OS
          </button>
        }
      />
      <div className="p-6 max-w-5xl">
        {/* Filtro data */}
        <div className="flex items-center gap-3 mb-5">
          <label className="text-xs font-semibold text-muted">Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand transition" />
          <span className="text-sm text-muted">{atendimentos.length} atendimento{atendimentos.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {atendimentos.length === 0 ? (
            <p className="p-8 text-center text-muted text-sm">Nenhum atendimento neste dia.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted border-b border-slate-100">
                  <th className="px-5 py-3">OS</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Veículo</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Pgto</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atendimentos.map(a => {
                  const { label, cls } = STATUS_LABELS[a.status];
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-xs text-muted">#{String(a.numero).padStart(4, "0")}</td>
                      <td className="px-4 py-3 font-medium text-ink">{a.clienteNome}</td>
                      <td className="px-4 py-3 text-muted text-xs">{a.veiculoPlaca} · {a.veiculoModelo} · {a.veiculoCor}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(a.totalFinal)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{a.formaPagamento}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                      </td>
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

      {/* Modal OS */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? `Editar OS #${String(editando.numero).padStart(4,"0")}` : "Nova OS"} size="lg">
        <div className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="field-label">Cliente *</label>
            <select className="field-input" value={clienteId} onChange={e => { setClienteId(e.target.value); setVeiculoIdx(0); }}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>)}
            </select>
          </div>

          {/* Veículo */}
          {clienteSelecionado && clienteSelecionado.veiculos.length > 0 && (
            <div>
              <label className="field-label">Veículo</label>
              <select className="field-input" value={veiculoIdx} onChange={e => setVeiculoIdx(Number(e.target.value))}>
                {clienteSelecionado.veiculos.map((v, i) => (
                  <option key={v.id} value={i}>{v.placa} · {v.modelo} · {v.cor}</option>
                ))}
              </select>
            </div>
          )}

          {/* Serviços */}
          <div>
            <label className="field-label">Serviços</label>
            <div className="flex flex-wrap gap-1.5">
              {servicos.map(s => (
                <button key={s.id} type="button" onClick={() => addServico(s)}
                  className="text-xs bg-brand/10 text-brand hover:bg-brand/20 px-2.5 py-1 rounded-full font-medium transition">
                  + {s.nome} ({fmt(s.preco)})
                </button>
              ))}
            </div>
          </div>

          {/* Produtos avulsos */}
          {produtos.length > 0 && (
            <div>
              <label className="field-label">Produtos avulsos</label>
              <div className="space-y-1.5">
                {produtos.map(p => {
                  const qty = produtoQtd[p.id] ?? 0;
                  return (
                    <div key={p.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 transition ${qty > 0 ? "border-brand/40 bg-brand/5" : "border-slate-200"}`}>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-ink">{p.nome}</span>
                        <span className="text-xs text-muted ml-2">{fmt(p.precoVenda ?? 0)}/{p.unidade}</span>
                        {qty > 0 && <span className="text-xs font-semibold text-brand ml-2">= {fmt((p.precoVenda ?? 0) * qty)}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setProdutoQtd(q => ({ ...q, [p.id]: Math.max(0, (q[p.id] ?? 0) - 1) }))}
                          className="w-6 h-6 rounded-full border border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-500 text-sm font-bold flex items-center justify-center transition">−</button>
                        <span className="w-5 text-center text-sm font-semibold text-ink">{qty}</span>
                        <button type="button" onClick={() => setProdutoQtd(q => ({ ...q, [p.id]: (q[p.id] ?? 0) + 1 }))}
                          className="w-6 h-6 rounded-full border border-slate-300 text-slate-500 hover:border-brand hover:text-brand text-sm font-bold flex items-center justify-center transition">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumo de itens */}
          {(itens.length > 0 || Object.values(produtoQtd).some(q => q > 0)) && (
            <div className="bg-slate-50 rounded-lg p-2 space-y-1">
              {itens.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm px-2">
                  <span className="text-ink">{item.servicoNome}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-700">{fmt(item.preco)}</span>
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                </div>
              ))}
              {produtos.filter(p => (produtoQtd[p.id] ?? 0) > 0).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm px-2">
                  <span className="text-ink">{p.nome} ×{produtoQtd[p.id]}</span>
                  <span className="font-semibold text-emerald-700">{fmt((p.precoVenda ?? 0) * produtoQtd[p.id])}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-1 px-2 flex justify-between font-semibold text-sm">
                <span>Subtotal</span><span>{fmt(total)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">Desconto (R$)</label>
              <input className="field-input" type="number" min="0" step="0.01" value={desconto} onChange={e => setDesconto(Number(e.target.value))} />
            </div>
            <div>
              <label className="field-label">Pagamento</label>
              <select className="field-input" value={pagamento} onChange={e => setPagamento(e.target.value)}>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="field-input" value={status} onChange={e => setStatus(e.target.value as AtendimentoOS["status"])}>
                <option value="aguardando">Aguardando</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Observações</label>
            <textarea className="field-input resize-none h-16" value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional..." />
          </div>

          {/* Total final */}
          <div className="bg-brand/5 border border-brand/20 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-sm text-ink">Total Final</span>
            <span className="font-heading font-bold text-xl text-brand">{fmt(totalFinal)}</span>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !clienteId || (itens.length === 0 && !Object.values(produtoQtd).some(q => q > 0))} className="flex-1 bg-brand text-white text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar OS"}
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
