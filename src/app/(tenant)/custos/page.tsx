"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { getCustosFixos, saveCustoFixo, deleteCustoFixo } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { CustoFixo } from "@/types";

const EMPTY: Omit<CustoFixo, "id" | "tenantId"> = {
  descricao: "", valor: 0, vencimentoDia: 1, ativo: true,
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CustosPage() {
  const { tenant } = useTenant();
  const [custos, setCustos] = useState<CustoFixo[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<CustoFixo | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  function load() { if (!tenant) return; getCustosFixos(tenant.id).then(setCustos); }
  useEffect(load, [tenant]);

  function openNew() { setEditando(null); setForm({ ...EMPTY }); setModal(true); }
  function openEdit(c: CustoFixo) {
    setEditando(c);
    setForm({ descricao: c.descricao, valor: c.valor, vencimentoDia: c.vencimentoDia, ativo: c.ativo });
    setModal(true);
  }

  async function handleSave() {
    if (!tenant) return;
    setSaving(true);
    try {
      await saveCustoFixo(tenant.id, { ...form, descricao: form.descricao.trim() }, editando?.id);
      toast.success(editando ? "Custo atualizado!" : "Custo adicionado!");
      setModal(false); load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!tenant || !confirm("Excluir este custo?")) return;
    await deleteCustoFixo(tenant.id, id);
    toast.success("Removido"); load();
  }

  const totalMensal = custos.filter(c => c.ativo).reduce((s, c) => s + c.valor, 0);

  return (
    <>
      <Topbar
        title="Custos Fixos"
        actions={
          <button onClick={openNew} className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
            <Plus size={13} /> Novo Custo
          </button>
        }
      />
      <div className="p-6 max-w-3xl">
        {/* Resumo */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Total mensal estimado</p>
            <p className="font-heading font-bold text-2xl text-ink mt-1">{fmt(totalMensal)}</p>
          </div>
          <div className="text-4xl opacity-20">📋</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {custos.length === 0 ? (
            <p className="p-8 text-center text-muted text-sm">Nenhum custo fixo cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted border-b border-slate-100">
                  <th className="px-5 py-2.5">Descrição</th>
                  <th className="px-4 py-2.5">Vencimento</th>
                  <th className="px-4 py-2.5">Valor</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {custos.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-ink">{c.descricao}</td>
                    <td className="px-4 py-3 text-muted">Dia {c.vencimentoDia}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{fmt(c.valor)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${c.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand transition"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Custo" : "Novo Custo Fixo"}>
        <div className="space-y-4">
          <div>
            <label className="field-label">Descrição *</label>
            <input className="field-input" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Aluguel, Água, Internet..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Valor (R$) *</label>
              <input className="field-input" type="number" min="0" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Vencimento (dia do mês)</label>
              <input className="field-input" type="number" min="1" max="31" value={form.vencimentoDia} onChange={e => setForm(f => ({ ...f, vencimentoDia: Number(e.target.value) }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4 accent-brand" />
            <span className="text-sm text-ink-3 font-medium">Custo ativo</span>
          </label>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.descricao} className="flex-1 bg-brand text-white text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
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
