"use client";
import { useState, useEffect } from "react";
import { lsGetServicos, lsSaveServico, lsDeleteServico, lsGetProdutos } from "@/lib/local-store";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import toast from "react-hot-toast";
import type { Servico, ConsumívelServico, Produto } from "@/types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) => v.toFixed(1) + "%";

const EMPTY_CONSUMIVEL: ConsumívelServico = { nome: "", quantidade: 0, unidade: "un", custoUnitario: 0 };
const EMPTY: Omit<Servico, "id" | "tenantId"> = {
  nome: "", descricao: "", preco: 0, duracaoMin: 30, ativo: true,
  custoMaoObra: 0, consumiveis: [],
};

function calcCustos(form: typeof EMPTY) {
  const custoInsumos = (form.consumiveis ?? []).reduce((s, c) => s + c.quantidade * c.custoUnitario, 0);
  const custoTotal   = (form.custoMaoObra ?? 0) + custoInsumos;
  const margem       = form.preco > 0 ? ((form.preco - custoTotal) / form.preco) * 100 : 0;
  const lucro        = form.preco - custoTotal;
  return { custoInsumos, custoTotal, margem, lucro };
}

export default function DemoServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY, consumiveis: [] });
  const [abaModal, setAbaModal] = useState<"basico" | "custos">("basico");

  function load() { setServicos(lsGetServicos()); }
  useEffect(() => {
    load();
    setProdutos(lsGetProdutos().filter(p => p.ativo));
  }, []);

  function openNew() {
    setEditando(null);
    setForm({ ...EMPTY, consumiveis: [] });
    setAbaModal("basico");
    setModal(true);
  }
  function openEdit(s: Servico) {
    setEditando(s);
    setForm({
      nome: s.nome, descricao: s.descricao ?? "", preco: s.preco,
      duracaoMin: s.duracaoMin, ativo: s.ativo,
      custoMaoObra: s.custoMaoObra ?? 0,
      consumiveis: s.consumiveis ?? [],
    });
    setAbaModal("basico");
    setModal(true);
  }
  function handleSave() {
    lsSaveServico({ ...form, nome: form.nome.trim() }, editando?.id);
    toast.success(editando ? "Serviço atualizado!" : "Serviço criado!");
    setModal(false); load();
  }
  function handleDelete(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    lsDeleteServico(id); toast.success("Removido"); load();
  }

  function addConsumivel() {
    setForm(f => ({ ...f, consumiveis: [...(f.consumiveis ?? []), { ...EMPTY_CONSUMIVEL }] }));
  }
  function updateConsumivel(i: number, field: keyof ConsumívelServico, val: string | number) {
    setForm(f => ({
      ...f,
      consumiveis: (f.consumiveis ?? []).map((c, ii) => ii === i ? { ...c, [field]: val } : c),
    }));
  }
  function removeConsumivel(i: number) {
    setForm(f => ({ ...f, consumiveis: (f.consumiveis ?? []).filter((_, ii) => ii !== i) }));
  }

  const { custoTotal, margem, lucro } = calcCustos(form);
  const ativos   = servicos.filter(s => s.ativo);
  const inativos = servicos.filter(s => !s.ativo);

  return (
    <>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-xl text-ink">Serviços</h2>
          <button onClick={openNew}
            className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
            <Plus size={13} /> Novo Serviço
          </button>
        </div>

        {[{ title: "Ativos", list: ativos }, { title: "Inativos", list: inativos }].map(({ title, list }) =>
          list.length > 0 && (
            <div key={title} className="mb-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-muted uppercase tracking-wide">
                {title} ({list.length})
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted border-b border-slate-100">
                    <th className="px-5 py-2.5">Nome</th>
                    <th className="px-4 py-2.5">Preço</th>
                    <th className="px-4 py-2.5">Custo</th>
                    <th className="px-4 py-2.5">Lucro</th>
                    <th className="px-4 py-2.5">Margem</th>
                    <th className="px-4 py-2.5">Duração</th>
                    <th className="px-4 py-2.5 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map(s => {
                    const c = calcCustos({
                      ...s, custoMaoObra: s.custoMaoObra ?? 0,
                      consumiveis: s.consumiveis ?? [], descricao: s.descricao ?? "",
                    });
                    const margemColor = c.margem >= 50 ? "text-emerald-600" : c.margem >= 25 ? "text-amber-600" : "text-red-600";
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink">{s.nome}</p>
                          {s.descricao && <p className="text-xs text-muted truncate max-w-xs">{s.descricao}</p>}
                          {(s.consumiveis ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.consumiveis!.map((c, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-[0.6rem] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                                  <Package size={8} /> {c.nome}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(s.preco)}</td>
                        <td className="px-4 py-3 text-red-500">{c.custoTotal > 0 ? fmt(c.custoTotal) : <span className="text-muted">—</span>}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{c.custoTotal > 0 ? fmt(c.lucro) : <span className="text-muted">—</span>}</td>
                        <td className="px-4 py-3">
                          {c.custoTotal > 0
                            ? <span className={`font-semibold ${margemColor}`}>{pct(c.margem)}</span>
                            : <span className="text-muted text-xs">não definido</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-muted">{s.duracaoMin} min</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand transition"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
        {servicos.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-muted text-sm">
            Nenhum serviço. Clique em "Novo Serviço" para começar.
          </div>
        )}
      </div>

      {/* Modal com abas */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Serviço" : "Novo Serviço"} size="lg">
        {/* Abas */}
        <div className="flex gap-1 mb-5 border-b border-slate-100 pb-0 -mt-1">
          {(["basico", "custos"] as const).map(aba => (
            <button key={aba} onClick={() => setAbaModal(aba)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-md transition -mb-px ${
                abaModal === aba
                  ? "text-brand border-b-2 border-brand"
                  : "text-muted hover:text-ink"
              }`}>
              {aba === "basico" ? "📋 Básico" : "💰 Custos & Consumíveis"}
            </button>
          ))}
        </div>

        {/* Aba Básico */}
        {abaModal === "basico" && (
          <div className="space-y-4">
            <div>
              <label className="field-label">Nome *</label>
              <input className="field-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Lavagem completa" />
            </div>
            <div>
              <label className="field-label">Descrição</label>
              <textarea className="field-input resize-none h-20" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="O que inclui o serviço..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Preço de Venda (R$) *</label>
                <input className="field-input" type="number" min="0" step="0.01" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="field-label">Duração estimada (min)</label>
                <input className="field-input" type="number" min="5" step="5" value={form.duracaoMin} onChange={e => setForm(f => ({ ...f, duracaoMin: Number(e.target.value) }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4 accent-brand" />
              <span className="text-sm text-ink-3 font-medium">Serviço ativo</span>
            </label>
          </div>
        )}

        {/* Aba Custos */}
        {abaModal === "custos" && (
          <div className="space-y-5">
            {/* Mão de obra */}
            <div>
              <label className="field-label">Custo de Mão de Obra (R$)</label>
              <input className="field-input" type="number" min="0" step="0.01" value={form.custoMaoObra}
                onChange={e => setForm(f => ({ ...f, custoMaoObra: Number(e.target.value) }))}
                placeholder="Ex: 15.00" />
              <p className="text-xs text-muted mt-1">Valor pago ao funcionário por este serviço</p>
            </div>

            {/* Consumíveis */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="field-label mb-0">Consumíveis / Insumos</label>
                <button onClick={addConsumivel} type="button"
                  className="text-xs text-brand font-semibold hover:underline flex items-center gap-1">
                  <Plus size={11} /> Adicionar
                </button>
              </div>
              {produtos.length === 0 && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                  ⚠️ Nenhum produto cadastrado. <a href="/demo/produtos" className="underline font-semibold">Cadastre produtos</a> para vinculá-los aqui.
                </div>
              )}
              {(form.consumiveis ?? []).length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center text-xs text-muted">
                  Nenhum consumível. Clique em "Adicionar" para incluir produtos usados neste serviço.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-1.5 text-[0.65rem] font-semibold text-muted uppercase tracking-wide px-1">
                    <span className="col-span-4">Produto</span>
                    <span className="col-span-2">Qtd</span>
                    <span className="col-span-2">Unid.</span>
                    <span className="col-span-3">Custo unit.</span>
                    <span className="col-span-1" />
                  </div>
                  {(form.consumiveis ?? []).map((c, i) => (
                    <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                      {/* Select produto cadastrado */}
                      <select
                        className="field-input col-span-4"
                        value={c.nome}
                        onChange={e => {
                          const prod = produtos.find(p => p.nome === e.target.value);
                          if (prod) {
                            updateConsumivel(i, "nome", prod.nome);
                            updateConsumivel(i, "unidade", prod.unidade);
                            updateConsumivel(i, "custoUnitario", prod.precoCusto);
                          } else {
                            updateConsumivel(i, "nome", e.target.value);
                          }
                        }}
                      >
                        <option value="">Selecione...</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.nome}>
                            {p.nome} ({p.unidade}) — {fmt(p.precoCusto)}
                          </option>
                        ))}
                      </select>
                      <input className="field-input col-span-2" type="number" min="0" step="0.01" placeholder="0"
                        value={c.quantidade} onChange={e => updateConsumivel(i, "quantidade", Number(e.target.value))} />
                      {/* Unidade (readonly se veio do produto) */}
                      <div className="col-span-2 field-input bg-slate-50 text-muted text-center cursor-default select-none">
                        {c.unidade || "—"}
                      </div>
                      {/* Custo unitário (editável mas pré-preenchido) */}
                      <input className="field-input col-span-3" type="number" min="0" step="0.01" placeholder="0,00"
                        value={c.custoUnitario} onChange={e => updateConsumivel(i, "custoUnitario", Number(e.target.value))} />
                      <button onClick={() => removeConsumivel(i)} className="col-span-1 text-red-400 hover:text-red-600 text-center text-sm">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo de margem */}
            {form.preco > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
                <p className="font-semibold text-xs text-muted uppercase tracking-wide mb-3">Resumo do serviço</p>
                <div className="flex justify-between"><span className="text-muted">Preço de venda</span><span className="font-semibold text-emerald-700">{fmt(form.preco)}</span></div>
                {(form.custoMaoObra ?? 0) > 0 && <div className="flex justify-between"><span className="text-muted">Mão de obra</span><span className="text-red-500">− {fmt(form.custoMaoObra ?? 0)}</span></div>}
                {(form.consumiveis ?? []).length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Insumos</span>
                    <span className="text-red-500">− {fmt((form.consumiveis ?? []).reduce((s, c) => s + c.quantidade * c.custoUnitario, 0))}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                  <span>Lucro estimado</span>
                  <span className={lucro >= 0 ? "text-emerald-600" : "text-red-600"}>{fmt(lucro)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Margem de lucro</span>
                  <span className={`font-bold ${margem >= 50 ? "text-emerald-600" : margem >= 25 ? "text-amber-500" : "text-red-600"}`}>
                    {pct(margem)}
                    {margem < 25 && " ⚠️ margem baixa"}
                    {margem >= 50 && " ✅ margem boa"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
          <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
          <button onClick={handleSave} disabled={!form.nome || form.preco <= 0}
            className="flex-1 bg-brand text-white text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">
            Salvar Serviço
          </button>
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
