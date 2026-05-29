"use client";
import { useState, useEffect } from "react";
import { lsGetProdutos, lsSaveProduto, lsDeleteProduto } from "@/lib/local-store";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import type { Produto } from "@/types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const EMPTY: Omit<Produto, "id" | "tenantId"> = { nome: "", unidade: "un", estoque: 0, estoqueMinimo: 1, precoCusto: 0, ativo: true };

export default function DemoProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  function load() { setProdutos(lsGetProdutos()); }
  useEffect(load, []);

  function openEdit(p: Produto) {
    setEditando(p); setForm({ nome: p.nome, unidade: p.unidade, estoque: p.estoque, estoqueMinimo: p.estoqueMinimo, precoCusto: p.precoCusto, ativo: p.ativo });
    setModal(true);
  }
  function handleSave() {
    lsSaveProduto({ ...form, nome: form.nome.trim() }, editando?.id);
    toast.success(editando ? "Produto atualizado!" : "Produto criado!"); setModal(false); load();
  }
  function handleDelete(id: string) {
    if (!confirm("Excluir?")) return;
    lsDeleteProduto(id); toast.success("Removido"); load();
  }

  const emBaixa = produtos.filter(p => p.estoque <= p.estoqueMinimo && p.ativo);

  return (
    <>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-xl text-ink">Produtos / Estoque</h2>
          <button onClick={() => { setEditando(null); setForm({ ...EMPTY }); setModal(true); }}
            className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
            <Plus size={13} /> Novo Produto
          </button>
        </div>
        {emBaixa.length > 0 && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-amber-800 text-sm">
            <AlertTriangle size={16} className="shrink-0 text-amber-500" />
            <span><strong>{emBaixa.length}</strong> produto{emBaixa.length > 1 ? "s" : ""} com estoque baixo: {emBaixa.map(p => p.nome).join(", ")}</span>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {produtos.length === 0 ? (
            <p className="p-8 text-center text-muted text-sm">Nenhum produto cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted border-b border-slate-100">
                  <th className="px-5 py-2.5">Produto</th><th className="px-4 py-2.5">Und.</th><th className="px-4 py-2.5">Estoque</th><th className="px-4 py-2.5">Mínimo</th><th className="px-4 py-2.5">Custo</th><th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produtos.map(p => {
                  const baixo = p.estoque <= p.estoqueMinimo;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3"><p className="font-medium text-ink">{p.nome}</p><p className="text-xs text-muted">{p.ativo ? "Ativo" : "Inativo"}</p></td>
                      <td className="px-4 py-3 text-muted">{p.unidade}</td>
                      <td className="px-4 py-3"><span className={`font-semibold ${baixo ? "text-red-600" : "text-ink"}`}>{p.estoque}{baixo ? " ⚠️" : ""}</span></td>
                      <td className="px-4 py-3 text-muted">{p.estoqueMinimo}</td>
                      <td className="px-4 py-3 text-slate-600">{fmt(p.precoCusto)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand transition"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Produto" : "Novo Produto"}>
        <div className="space-y-4">
          <div><label className="field-label">Nome *</label><input className="field-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Unidade</label><select className="field-input" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}><option>un</option><option>L</option><option>ml</option><option>kg</option><option>g</option><option>cx</option></select></div>
            <div><label className="field-label">Custo (R$)</label><input className="field-input" type="number" min="0" step="0.01" value={form.precoCusto} onChange={e => setForm(f => ({ ...f, precoCusto: Number(e.target.value) }))} /></div>
            <div><label className="field-label">Estoque atual</label><input className="field-input" type="number" min="0" value={form.estoque} onChange={e => setForm(f => ({ ...f, estoque: Number(e.target.value) }))} /></div>
            <div><label className="field-label">Estoque mínimo</label><input className="field-input" type="number" min="0" value={form.estoqueMinimo} onChange={e => setForm(f => ({ ...f, estoqueMinimo: Number(e.target.value) }))} /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4 accent-brand" /><span className="text-sm font-medium text-ink-3">Ativo</span></label>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={!form.nome} className="flex-1 bg-brand text-white text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">Salvar</button>
          </div>
        </div>
      </Modal>
      <style jsx global>{`.field-label{display:block;font-size:.7rem;font-weight:600;color:#3d4f63;margin-bottom:.35rem}.field-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}.field-input:focus{border-color:#0057ff;box-shadow:0 0 0 3px rgba(0,87,255,.08)}`}</style>
    </>
  );
}
