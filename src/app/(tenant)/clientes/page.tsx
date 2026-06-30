"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { getClientes, saveCliente, deleteCliente, getAtendimentosByCliente, getAtendimentos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Search, Pencil, Trash2, History, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Cliente, Veiculo, AtendimentoOS } from "@/types";

const EMPTY_VEICULO: Veiculo = { id: "", tipo: "carro", placa: "", modelo: "", cor: "", ano: "" };
const TIPO_ICONS: Record<string, string> = { carro: "🚗", moto: "🏍️", outro: "🚐" };
const TIPO_LABELS: Record<string, string> = { carro: "Carro", moto: "Moto", outro: "Outro" };

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(d: Date) {
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export default function ClientesPage() {
  const { tenant } = useTenant();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", cpf: "" });
  const [veiculos, setVeiculos] = useState<Veiculo[]>([{ ...EMPTY_VEICULO, id: "1" }]);
  const [saving, setSaving] = useState(false);

  // histórico
  const [modalHistorico, setModalHistorico] = useState(false);
  const [clienteHistorico, setClienteHistorico] = useState<Cliente | null>(null);
  const [historico, setHistorico] = useState<AtendimentoOS[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // lembretes
  const [abaAtiva, setAbaAtiva] = useState<"lista" | "inativos">("lista");
  const [lembreteDias, setLembreteDias] = useState(30);
  const [inativos, setInativos] = useState<{ cliente: Cliente; diasSemVisita: number; ultimaVisita: Date | null }[]>([]);
  const [loadingInativos, setLoadingInativos] = useState(false);

  function load() {
    if (!tenant) return;
    getClientes(tenant.id).then(setClientes);
  }
  useEffect(load, [tenant]);

  // ── Histórico ──────────────────────────────────────────────────────────────
  async function abrirHistorico(c: Cliente) {
    setClienteHistorico(c);
    setModalHistorico(true);
    setLoadingHistorico(true);
    const os = await getAtendimentosByCliente(tenant!.id, c.id);
    os.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setHistorico(os);
    setLoadingHistorico(false);
  }

  // ── Lembretes ──────────────────────────────────────────────────────────────
  async function carregarInativos() {
    if (!tenant) return;
    setLoadingInativos(true);
    try {
      const todos = await getAtendimentos(tenant.id);
      const ultimaVisita: Record<string, Date> = {};
      for (const a of todos) {
        if (a.status === "concluido") {
          const d = a.concluidoAt || a.createdAt;
          if (!ultimaVisita[a.clienteId] || d > ultimaVisita[a.clienteId]) {
            ultimaVisita[a.clienteId] = d;
          }
        }
      }
      const hoje = new Date();
      const result = clientes
        .map(c => {
          const ultima = ultimaVisita[c.id] ?? null;
          const dias = ultima
            ? Math.floor((hoje.getTime() - ultima.getTime()) / 86400000)
            : 9999;
          return { cliente: c, diasSemVisita: dias, ultimaVisita: ultima };
        })
        .filter(x => x.diasSemVisita >= lembreteDias)
        .sort((a, b) => b.diasSemVisita - a.diasSemVisita);
      setInativos(result);
    } finally {
      setLoadingInativos(false);
    }
  }

  useEffect(() => {
    if (abaAtiva === "inativos" && clientes.length > 0) carregarInativos();
  }, [abaAtiva, lembreteDias]);

  function msgWhatsApp(c: Cliente, dias: number) {
    const nome = c.nome.split(" ")[0];
    const lava = tenant?.nome ?? "nosso lava jato";
    return encodeURIComponent(`Olá ${nome}! 👋\nFaz ${dias} dias que não te vemos no ${lava}. Que tal dar uma passada? 🚗✨`);
  }

  // ── Cadastro ──────────────────────────────────────────────────────────────
  function openNew() {
    setEditando(null);
    setForm({ nome: "", telefone: "", email: "", cpf: "" });
    setVeiculos([{ ...EMPTY_VEICULO, id: Date.now().toString() }]);
    setModal(true);
  }

  function openEdit(c: Cliente) {
    setEditando(c);
    setForm({ nome: c.nome, telefone: c.telefone, email: c.email ?? "", cpf: c.cpf ?? "" });
    setVeiculos(c.veiculos.length > 0 ? c.veiculos : [{ ...EMPTY_VEICULO, id: Date.now().toString() }]);
    setModal(true);
  }

  async function handleSave() {
    if (!tenant) return;
    setSaving(true);
    try {
      const data = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim() || "",
        cpf: form.cpf.trim() || "",
        veiculos: veiculos.filter(v => v.placa || v.modelo),
      };
      await saveCliente(tenant.id, data, editando?.id);
      toast.success(editando ? "Cliente atualizado!" : "Cliente cadastrado!");
      setModal(false);
      load();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!tenant || !confirm("Excluir este cliente?")) return;
    await deleteCliente(tenant.id, id);
    toast.success("Removido");
    load();
  }

  function updateVeiculo(idx: number, field: keyof Veiculo, val: string) {
    setVeiculos(v => v.map((x, i) => i === idx ? { ...x, [field]: val } : x));
  }

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca) ||
    c.veiculos.some(v => v.placa.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <>
      <Topbar
        title="Clientes"
        actions={
          <button onClick={openNew} className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
            <Plus size={13} /> Novo Cliente
          </button>
        }
      />
      <div className="p-6 max-w-5xl">

        {/* Abas */}
        <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setAbaAtiva("lista")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${abaAtiva === "lista" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"}`}
          >
            Lista de Clientes
          </button>
          <button
            onClick={() => setAbaAtiva("inativos")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${abaAtiva === "inativos" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"}`}
          >
            <Bell size={11} /> Lembretes
          </button>
        </div>

        {/* ── ABA: LISTA ── */}
        {abaAtiva === "lista" && (
          <>
            <div className="relative mb-5">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome, telefone ou placa..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand transition"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-muted uppercase tracking-wide">
                {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
              </div>
              {filtered.length === 0 ? (
                <p className="p-8 text-center text-muted text-sm">Nenhum cliente encontrado.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map(c => (
                    <div key={c.id} className="px-5 py-3.5 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-bold text-sm flex items-center justify-center uppercase shrink-0">
                        {c.nome[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-ink truncate">{c.nome}</p>
                        <p className="text-xs text-muted">{c.telefone}{c.email ? ` · ${c.email}` : ""}</p>
                        {c.veiculos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {c.veiculos.map(v => (
                              <span key={v.id} className="inline-flex items-center gap-1 text-[0.65rem] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                {TIPO_ICONS[v.tipo ?? "carro"]} {v.placa} · {v.modelo} · {v.cor}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {c.telefone && (
                          <a href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                            className="p-1.5 rounded-md hover:bg-green-50 text-slate-400 hover:text-green-500 transition">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        )}
                        <button onClick={() => abrirHistorico(c)} className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition" title="Histórico">
                          <History size={13} />
                        </button>
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-brand transition">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ABA: LEMBRETES ── */}
        {abaAtiva === "inativos" && (
          <div>
            <div className="flex items-center gap-4 mb-5">
              <p className="text-sm text-muted">Clientes sem visita há mais de</p>
              <select
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand"
                value={lembreteDias}
                onChange={e => setLembreteDias(Number(e.target.value))}
              >
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
                <option value={90}>90 dias</option>
              </select>
              <button
                onClick={carregarInativos}
                disabled={loadingInativos}
                className="text-xs bg-brand text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark transition disabled:opacity-60"
              >
                {loadingInativos ? "Carregando..." : "Atualizar"}
              </button>
            </div>

            {loadingInativos ? (
              <p className="text-sm text-muted text-center py-8">Carregando...</p>
            ) : inativos.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-sm text-muted">Nenhum cliente inativo por {lembreteDias} dias. 🎉</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-muted uppercase tracking-wide">
                  {inativos.length} cliente{inativos.length !== 1 ? "s" : ""} inativos
                </div>
                <div className="divide-y divide-slate-100">
                  {inativos.map(({ cliente: c, diasSemVisita, ultimaVisita }) => (
                    <div key={c.id} className="px-5 py-3.5 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold text-sm flex items-center justify-center uppercase shrink-0">
                        {c.nome[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-ink truncate">{c.nome}</p>
                        <p className="text-xs text-muted">{c.telefone}</p>
                        <p className="text-xs text-amber-600 font-medium mt-0.5">
                          {ultimaVisita ? `Última visita: ${fmtData(ultimaVisita)} (${diasSemVisita} dias)` : "Nunca visitou"}
                        </p>
                      </div>
                      {c.telefone && (
                        <a
                          href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}?text=${msgWhatsApp(c, diasSemVisita)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Enviar lembrete
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Cadastro */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Cliente" : "Novo Cliente"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="field-label">Nome *</label>
              <input className="field-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <label className="field-label">Telefone *</label>
              <input className="field-input" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="field-label">CPF</label>
              <input className="field-input" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
            <div className="col-span-2">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="cliente@email.com" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="field-label">Veículos</label>
              <button type="button" onClick={() => setVeiculos(v => [...v, { ...EMPTY_VEICULO, id: Date.now().toString() }])}
                className="text-xs text-brand font-semibold hover:underline">
                + Adicionar
              </button>
            </div>
            {veiculos.map((v, i) => (
              <div key={v.id} className="space-y-2 mb-3 pb-3 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                <div className="flex gap-2">
                  {(["carro", "moto", "outro"] as const).map(tipo => (
                    <button key={tipo} type="button" onClick={() => updateVeiculo(i, "tipo", tipo)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition ${
                        v.tipo === tipo ? "bg-brand/10 border-brand text-brand" : "border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}>
                      <span>{TIPO_ICONS[tipo]}</span> {TIPO_LABELS[tipo]}
                    </button>
                  ))}
                  {veiculos.length > 1 && (
                    <button onClick={() => setVeiculos(vv => vv.filter((_, ii) => ii !== i))} className="text-red-400 hover:text-red-600 px-2">✕</button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input className="field-input uppercase" placeholder="Placa" value={v.placa} onChange={e => updateVeiculo(i, "placa", e.target.value.toUpperCase())} />
                  <input className="field-input" placeholder="Modelo" value={v.modelo} onChange={e => updateVeiculo(i, "modelo", e.target.value)} />
                  <input className="field-input" placeholder="Cor" value={v.cor} onChange={e => updateVeiculo(i, "cor", e.target.value)} />
                  <input className="field-input" placeholder="Ano" value={v.ano} onChange={e => updateVeiculo(i, "ano", e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.nome || !form.telefone}
              className="flex-1 bg-brand text-white text-sm py-2 rounded-lg hover:bg-brand-dark transition font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Histórico */}
      <Modal open={modalHistorico} onClose={() => setModalHistorico(false)} title={`Histórico — ${clienteHistorico?.nome}`} size="lg">
        {loadingHistorico ? (
          <p className="text-center text-muted text-sm py-8">Carregando...</p>
        ) : historico.length === 0 ? (
          <p className="text-center text-muted text-sm py-8">Nenhum atendimento registrado.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted mb-3">{historico.length} atendimento{historico.length !== 1 ? "s" : ""} no total</p>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {historico.map(a => (
                <div key={a.id} className="py-3 flex items-start gap-3">
                  <div className="text-center shrink-0 w-14">
                    <p className="text-[0.6rem] font-mono text-muted">#{String(a.numero).padStart(4, "0")}</p>
                    <p className="text-[0.65rem] text-muted mt-0.5">{fmtData(a.createdAt)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{a.veiculoPlaca} · {a.veiculoModelo} · {a.veiculoCor}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.itens.map((item, i) => (
                        <span key={i} className="text-[0.65rem] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {item.servicoNome}{item.quantidade && item.quantidade > 1 ? ` ×${item.quantidade}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-700">{fmt(a.totalFinal)}</p>
                    <p className="text-[0.65rem] text-slate-400 capitalize">{a.formaPagamento}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-semibold">
              <span>Total gasto</span>
              <span className="text-emerald-700">{fmt(historico.reduce((s, a) => s + a.totalFinal, 0))}</span>
            </div>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .field-label { display: block; font-size: 0.7rem; font-weight: 600; color: #3d4f63; margin-bottom: 0.35rem; }
        .field-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.82rem; outline: none; transition: border 0.15s; }
        .field-input:focus { border-color: #0057ff; box-shadow: 0 0 0 3px rgba(0,87,255,0.08); }
      `}</style>
    </>
  );
}
