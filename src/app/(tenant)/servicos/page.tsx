"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { getServicos, saveServico, deleteServico, getProdutos } from "@/lib/firestore";
import type { Produto } from "@/types";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Servico, ConsumívelServico } from "@/types";

const EMPTY: Omit<Servico, "id" | "tenantId"> = {
  nome: "", descricao: "", preco: 0, duracaoMin: 30, ativo: true,
  custoMaoObra: 0, consumiveis: [], tiposVeiculo: ["carro", "moto", "outro"],
};

const TIPOS = [
  { value: "carro" as const, label: "Carro", icon: "🚗" },
  { value: "moto"  as const, label: "Moto",  icon: "🏍️" },
  { value: "outro" as const, label: "Outro", icon: "🚐" },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcMargem(s: Pick<Servico, "preco" | "custoMaoObra" | "consumiveis">) {
  const totalConsumivel = (s.consumiveis ?? []).reduce((acc, c) => acc + c.quantidade * c.custoUnitario, 0);
  return s.preco - (s.custoMaoObra ?? 0) - totalConsumivel;
}


export default function ServicosPage() {
  const { tenant } = useTenant();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  function load() {
    if (!tenant) return;
    getServicos(tenant.id).then(setServicos);
    getProdutos(tenant.id).then(setProdutos);
  }
  useEffect(load, [tenant]);

  function openNew() {
    setEditando(null);
    setForm({ ...EMPTY, consumiveis: [] });
    setModal(true);
  }

  function openEdit(s: Servico) {
    setEditando(s);
    setForm({
      nome: s.nome, descricao: s.descricao ?? "", preco: s.preco,
      duracaoMin: s.duracaoMin, ativo: s.ativo,
      custoMaoObra: s.custoMaoObra ?? 0,
      consumiveis: s.consumiveis ? [...s.consumiveis] : [],
      tiposVeiculo: s.tiposVeiculo ?? ["carro", "moto", "outro"],
    });
    setModal(true);
  }

  function addConsumivel() {
    setForm(f => ({
      ...f,
      consumiveis: [...(f.consumiveis ?? []), { nome: "", quantidade: 1, unidade: "un", custoUnitario: 0 }],
    }));
  }

  function updateConsumivel(i: number, patch: Partial<ConsumívelServico>) {
    setForm(f => {
      const list = [...(f.consumiveis ?? [])];
      list[i] = { ...list[i], ...patch };
      return { ...f, consumiveis: list };
    });
  }

  function removeConsumivel(i: number) {
    setForm(f => ({ ...f, consumiveis: (f.consumiveis ?? []).filter((_, idx) => idx !== i) }));
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

  const margem = calcMargem(form);
  const ativos = servicos.filter(s => s.ativo);
  const inativos = servicos.filter(s => !s.ativo);

  return (
    <>
      <Topbar
        title="Serviços"
        actions={
          <button onClick={openNew} className="flex items-center gap-1.5 bg-brand text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
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
          {/* Nome e descrição */}
          <div>
            <label className="field-label">Nome *</label>
            <input className="field-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Lavagem completa" />
          </div>
          <div>
            <label className="field-label">Descrição</label>
            <textarea className="field-input resize-none h-16" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do serviço..." />
          </div>

          {/* Preço, duração e mão de obra */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">Preço (R$) *</label>
              <input className="field-input" type="number" min="0" step="0.01" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Duração (min)</label>
              <input className="field-input" type="number" min="5" step="5" value={form.duracaoMin} onChange={e => setForm(f => ({ ...f, duracaoMin: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Mão de obra (R$)</label>
              <input className="field-input" type="number" min="0" step="0.01" value={form.custoMaoObra} onChange={e => setForm(f => ({ ...f, custoMaoObra: Number(e.target.value) }))} />
            </div>
          </div>

          {/* Consumíveis */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="field-label mb-0">Consumíveis / Insumos</label>
              <button type="button" onClick={addConsumivel} className="flex items-center gap-1 text-xs text-brand font-semibold hover:underline">
                <Plus size={11} /> Adicionar
              </button>
            </div>

            {(form.consumiveis ?? []).length === 0 ? (
              <p className="text-xs text-muted italic">Nenhum consumível adicionado.</p>
            ) : (
              <div className="space-y-2">
                {(form.consumiveis ?? []).map((c, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_24px] gap-1.5 items-center">
                    <select
                      className="field-input"
                      value={c.nome}
                      onChange={e => {
                        const prod = produtos.find(p => p.nome === e.target.value);
                        updateConsumivel(i, {
                          nome: e.target.value,
                          unidade: prod?.unidade ?? c.unidade,
                          custoUnitario: prod?.precoCusto ?? c.custoUnitario,
                        });
                      }}
                    >
                      <option value="">Selecione o produto...</option>
                      {produtos.filter(p => p.ativo).map(p => (
                        <option key={p.id} value={p.nome}>{p.nome} ({p.unidade})</option>
                      ))}
                    </select>
                    <input
                      className="field-input"
                      type="number" min="0" step="0.01"
                      placeholder="Qtd"
                      value={c.quantidade}
                      onChange={e => updateConsumivel(i, { quantidade: Number(e.target.value) })}
                    />
                    <button type="button" onClick={() => removeConsumivel(i)} className="text-slate-400 hover:text-red-500 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_80px_24px] gap-1.5 text-xs text-muted pt-0.5">
                  <span>Produto</span><span>Qtd</span><span />
                </div>
              </div>
            )}
          </div>

          {/* Margem calculada */}
          {form.preco > 0 && (
            <div className={`rounded-lg px-3 py-2 text-xs font-semibold flex justify-between ${margem >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              <span>Margem estimada</span>
              <span>{fmt(margem)} ({form.preco > 0 ? Math.round((margem / form.preco) * 100) : 0}%)</span>
            </div>
          )}

          {/* Tipos de veículo */}
          <div>
            <label className="field-label">Tipos de veículo</label>
            <div className="flex gap-2">
              {TIPOS.map(t => {
                const ativo = (form.tiposVeiculo ?? []).includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      tiposVeiculo: ativo
                        ? (f.tiposVeiculo ?? []).filter(x => x !== t.value)
                        : [...(f.tiposVeiculo ?? []), t.value],
                    }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition ${
                      ativo ? "bg-brand/10 border-brand text-brand" : "border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4 accent-brand" />
            <span className="text-sm text-ink-3 font-medium">Serviço ativo</span>
          </label>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.nome} className="flex-1 bg-brand text-black text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .field-label { display:block; font-size:.7rem; font-weight:600; color:#3d4f63; margin-bottom:.35rem; }
        .field-input { width:100%; border:1px solid #e2e8f0; border-radius:8px; padding:.5rem .75rem; font-size:.82rem; outline:none; transition:border .15s; }
        .field-input:focus { border-color:#00ff88; box-shadow:0 0 0 3px rgba(0,255,136,.08); }
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
              <th className="px-4 py-2.5">Margem</th>
              <th className="px-4 py-2.5">Duração</th>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {servicos.map(s => {
              const margem = calcMargem(s);
              const pct = s.preco > 0 ? Math.round((margem / s.preco) * 100) : 0;
              return (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{s.nome}</p>
                    {s.descricao && <p className="text-xs text-muted truncate max-w-xs">{s.descricao}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(s.preco)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${margem >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {fmt(margem)} ({pct}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.duracaoMin} min</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => onEdit(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand transition"><Pencil size={13} /></button>
                      <button onClick={() => onDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
