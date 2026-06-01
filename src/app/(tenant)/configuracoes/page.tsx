"use client";
import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { updateTenant } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import toast from "react-hot-toast";
import Image from "next/image";
import type { HorarioFuncionamento } from "@/types";

const DIAS = [
  { key: "0", label: "Domingo" },
  { key: "1", label: "Segunda" },
  { key: "2", label: "Terça" },
  { key: "3", label: "Quarta" },
  { key: "4", label: "Quinta" },
  { key: "5", label: "Sexta" },
  { key: "6", label: "Sábado" },
];

// 06:00 até 00:00 (meia-noite) em intervalos de 30min
const HORARIOS_OPTS = Array.from({ length: 37 }, (_, i) => {
  const total = 6 * 60 + i * 30;
  const h = (Math.floor(total / 60) % 24).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
});

const HORARIO_PADRAO: HorarioFuncionamento = { aberto: true, inicio: "08:00", fim: "18:00" };
const HORARIO_FECHADO: HorarioFuncionamento = { aberto: false, inicio: "08:00", fim: "18:00" };

const DEFAULT_HORARIOS: Record<string, HorarioFuncionamento> = {
  "0": { ...HORARIO_FECHADO },
  "1": { ...HORARIO_PADRAO },
  "2": { ...HORARIO_PADRAO },
  "3": { ...HORARIO_PADRAO },
  "4": { ...HORARIO_PADRAO },
  "5": { ...HORARIO_PADRAO },
  "6": { aberto: true, inicio: "08:00", fim: "14:00" },
};

export default function ConfiguracoesPage() {
  const { tenant } = useTenant();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [horarios, setHorarios] = useState<Record<string, HorarioFuncionamento>>(DEFAULT_HORARIOS);
  const [intervalo, setIntervalo] = useState(30);
  const [saving, setSaving] = useState(false);
  const [savingHorarios, setSavingHorarios] = useState(false);
  const [baixandoQR, setBaixandoQR] = useState(false);

  async function downloadQRCode() {
    if (!tenant?.slug) return;
    setBaixandoQR(true);
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`https://enceradoapp.vercel.app/agendar/${tenant.slug}`)}&bgcolor=ffffff&color=0d1b2a&margin=10`;
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qrcode-${tenant.slug}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Erro ao baixar QR Code");
    } finally {
      setBaixandoQR(false);
    }
  }

  useEffect(() => {
    if (!tenant) return;
    setNome(tenant.nome);
    setTelefone(tenant.telefone ?? "");
    setEndereco(tenant.endereco ?? "");
    if (tenant.horarios) setHorarios(tenant.horarios as Record<string, HorarioFuncionamento>);
    if (tenant.intervaloAgendamento) setIntervalo(tenant.intervaloAgendamento);
  }, [tenant]);

  function updateHorario(dia: string, patch: Partial<HorarioFuncionamento>) {
    setHorarios(h => ({ ...h, [dia]: { ...h[dia], ...patch } }));
  }

  async function handleSave() {
    if (!tenant) return;
    setSaving(true);
    try {
      await updateTenant(tenant.id, { nome, telefone, endereco });
      toast.success("Configurações salvas!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleSaveHorarios() {
    if (!tenant) return;
    setSavingHorarios(true);
    try {
      await updateTenant(tenant.id, { horarios, intervaloAgendamento: intervalo });
      toast.success("Horários salvos!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSavingHorarios(false); }
  }

  return (
    <>
      <Topbar title="Configurações" />
      <div className="p-4 md:p-6 max-w-2xl space-y-5">

        {/* Logo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-ink mb-4">Logo do Estabelecimento</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
              <Image src={tenant?.logoUrl || "/logo.jpeg"} alt="logo" width={64} height={64} className="object-cover w-full h-full" />
            </div>
            <p className="text-xs text-muted">Upload de logo disponível em breve.</p>
          </div>
        </div>

        {/* Dados */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-ink mb-4">Dados do Estabelecimento</h3>
          <div className="space-y-4">
            <div>
              <label className="field-label">Nome do estabelecimento</label>
              <input className="field-input" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Telefone / WhatsApp</label>
              <input className="field-input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="field-label">Endereço</label>
              <input className="field-input" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" />
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-brand text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-dark transition disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar Dados"}
            </button>
          </div>
        </div>

        {/* Horários de funcionamento */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-ink mb-1">Horários de Funcionamento</h3>
          <p className="text-xs text-muted mb-4">Apenas os horários disponíveis aparecerão na página de agendamento</p>

          <div className="space-y-3">
            {DIAS.map(({ key, label }) => {
              const h = horarios[key] ?? HORARIO_PADRAO;
              return (
                <div key={key} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateHorario(key, { aberto: !h.aberto })}
                    className={`w-20 shrink-0 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      h.aberto ? "bg-brand/10 border-brand text-brand" : "bg-slate-100 border-slate-200 text-slate-400"
                    }`}
                  >
                    {label}
                  </button>

                  {h.aberto ? (
                    <div className="flex items-center gap-2 flex-1">
                      <select
                        className="field-input flex-1"
                        value={h.inicio}
                        onChange={e => updateHorario(key, { inicio: e.target.value })}
                      >
                        {HORARIOS_OPTS.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                      <span className="text-xs text-muted shrink-0">até</span>
                      <select
                        className="field-input flex-1"
                        value={h.fim}
                        onChange={e => updateHorario(key, { fim: e.target.value })}
                      >
                        {HORARIOS_OPTS.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Fechado</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label className="field-label mb-0 shrink-0">Intervalo entre horários</label>
            <select className="field-input w-32" value={intervalo} onChange={e => setIntervalo(Number(e.target.value))}>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 hora</option>
            </select>
          </div>

          <button onClick={handleSaveHorarios} disabled={savingHorarios}
            className="w-full mt-4 bg-brand text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-dark transition disabled:opacity-60">
            {savingHorarios ? "Salvando..." : "Salvar Horários"}
          </button>
        </div>

        {/* Link de agendamento */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm text-ink mb-1">Link de Agendamento</h3>
          <p className="text-xs text-muted mb-3">Compartilhe com seus clientes para agendarem online</p>

          {/* Link completo */}
          <div className="flex items-center gap-2 mb-2">
            <input readOnly value={`https://enceradoapp.vercel.app/agendar/${tenant?.slug ?? ""}`}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 outline-none" />
            <button
              onClick={() => { navigator.clipboard.writeText(`https://enceradoapp.vercel.app/agendar/${tenant?.slug ?? ""}`); toast.success("Link copiado!"); }}
              className="shrink-0 bg-brand text-black text-xs font-semibold px-3 py-2 rounded-lg hover:bg-brand-dark transition">
              Copiar
            </button>
          </div>

          <div className="flex items-start justify-between mt-4 pt-4 border-t border-slate-100">
            <a href={`https://enceradoapp.vercel.app/agendar/${tenant?.slug ?? ""}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline">
              Abrir página →
            </a>
            {tenant?.slug && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://enceradoapp.vercel.app/agendar/${tenant.slug}`)}&bgcolor=ffffff&color=0d1b2a&margin=4`}
                  alt="QR Code"
                  width={120}
                  height={120}
                  className="rounded-lg border border-slate-200"
                />
                <button
                  onClick={downloadQRCode}
                  disabled={baixandoQR}
                  className="flex items-center gap-1.5 bg-ink text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-ink/80 disabled:opacity-60 transition"
                >
                  {baixandoQR ? "Salvando..." : "⬇ Salvar QR Code"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .field-label{display:block;font-size:.7rem;font-weight:600;color:#3d4f63;margin-bottom:.35rem}
        .field-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}
        .field-input:focus{border-color:#00ff88;box-shadow:0 0 0 3px rgba(0,255,136,.08)}
      `}</style>
    </>
  );
}
