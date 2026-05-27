"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { getServicos, saveServico, deleteServico } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Servico } from "@/types";

const EMPTY: Omit<Servico, "id" | "tenantId"> = {
  nome: "", descricao: "", preco: 0, duracaoMin: 30, ativo: true,
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ServicosPage() {
  const { tenant } = useTenant();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  function load() {
    if (!tenant) return;
    getServicos(tenant.id).then(setServicos);
  }
  useEffect(load, [tenant]);

  function openNew() {
    setEditando(null);
    setForm({ ...EMPTY });
    setModal(true);
  }

  function openEdit(s: Servico) {
    setEditando(s);
    setForm({ nome: s.nome, descricao: s.descricao ?? "", preco: s.preco, duracaoMin: s.duracaoMin, ativo: s.ativo });
    setModal(true);
  }

  async function handleSave() {
    if (!tenant) return;
    setSaving(true);
    try {
      await saveServico(tenant.id, { ...form, nome: form.nome.trim() }, editando?.id);
      toast.success(editando ? "Serviço atualizado!" : "Serviço criado!");
      setModal(false);
      load();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!tenant || !confirm("Excluir este serviço?")) return;
    await deleteServico(tenant.id, id);
    toast.success("Removido");
    load();
  }

  const ativos = servicos.filter(s => s.ativo);
  const inativos = servicos.filter(s => !s.ativo);

  return (
    <>
      <Topbar
        title="Serviços"
        actions={
          <button onClick={openNew} className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
            <Plus size={13} /> Novo Serviço
          </button>
        }
      />
      <div className="p-6 max-w-4xl">
        <ServicosTable title="Ativos" servicos={ativos} onEdit={openEdit} onDelete={handleDelete} />
        {inativos.length > 0 && (
          <div className="mt-4">
            <ServicosTable title="Inativos" servicos={inativos} onEdit={openEdit} onDelete={handleDelete} />
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Serviço" : "Novo Serviço"}>
        <div className="space-y-4">
          <div>
            <label className="field-label">Nome *</label>
            <input className="field-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Lavagem completa" />
          </div>
          <div>
            <label className="field-label">Descrição</label>
            <textarea className="field-input resize-none h-20" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do serviço..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Preço (R$) *</label>
              <input className="field-input" type="number" min="0" step="0.01" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Duração (min)</label>
              <input className="field-input" type="number" min="5" step="5" value={form.duracaoMin} onChange={e => setForm(f => ({ ...f, duracaoMin: Number(e.target.value) }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4 accent-brand" />
            <span className="text-sm text-ink-3 font-medium">Serviço ativo</span>
          </label>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.nome} className="flex-1 bg-brand text-white text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .field-label { display:block; font-size:.7rem; font-weight:600; color:#3d4f63; margin-bottom:.35rem; }
        .field-input { width:100%; border:1px solid #e2e8f0; border-radius:8px; padding:.5rem .75rem; font-size:.82rem; outline:none; transition:border .15s; }
        .field-input:focus { border-color:#0057ff; box-shadow:0 0 0 3px rgba(0,87,255,.08); }
      `}</style>
    </>
  );
}

function ServicosTable({ title, servicos, onEdit, onDelete }: {
  title: string;
  servicos: Servico[];
  onEdit: (s: Servico) => void;
  onDelete: (id: string) => void;
}) {
  function fmt(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">{title} ({servicos.length})</span>
      </div>
      {servicos.length === 0 ? (
        <p className="p-6 text-center text-muted text-sm">Nenhum serviço.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-muted border-b border-slate-100">
              <th className="px-5 py-2.5">Nome</th>
              <th className="px-4 py-2.5">Preço</th>
              <th className="px-4 py-2.5">Duração</th>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {servicos.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3">
                  <p className="font-medium text-ink">{s.nome}</p>
                  {s.descricao && <p className="text-xs text-muted truncate max-w-xs">{s.descricao}</p>}
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(s.preco)}</td>
                <td className="px-4 py-3 text-muted">{s.duracaoMin} min</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => onEdit(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand transition"><Pencil size={13} /></button>
                    <button onClick={() => onDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
