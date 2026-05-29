"use client";
import { useState, useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";

interface Config {
  nome: string;
  telefone: string;
  endereco: string;
  logoUrl: string;
}

const DEFAULT_CONFIG: Config = {
  nome: "Sopinha Lava-Jato",
  telefone: "(11) 98765-4321",
  endereco: "Rua das Palmeiras, 123 - Vila Nova",
  logoUrl: "",
};

function loadConfig(): Config {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem("lavaapp_config");
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}

function saveConfig(cfg: Config) {
  localStorage.setItem("lavaapp_config", JSON.stringify(cfg));
}

export default function DemoConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setConfig(loadConfig()); }, []);

  function handleSave() {
    setSaving(true);
    saveConfig(config);
    // Atualiza o nome na sidebar via evento
    window.dispatchEvent(new CustomEvent("lavaapp-config-changed", { detail: config }));
    setTimeout(() => {
      toast.success("Configurações salvas!");
      setSaving(false);
    }, 300);
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const updated = { ...config, logoUrl: url };
      setConfig(updated);
      saveConfig(updated);
      toast.success("Logo atualizada!");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="font-heading font-bold text-xl text-ink mb-6">Configurações</h2>

      {/* Logo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <h3 className="font-heading font-semibold text-sm text-ink mb-4">Logo do Estabelecimento</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
            {config.logoUrl
              ? <img src={config.logoUrl} alt="logo" className="w-full h-full object-cover" />
              : <span className="text-3xl">🚗</span>
            }
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 border border-slate-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition">
              <Upload size={13} /> Trocar logo
            </button>
            <p className="text-xs text-muted mt-1">PNG ou JPG. Recomendado: 200×200px</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          </div>
        </div>
      </div>

      {/* Dados */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-heading font-semibold text-sm text-ink mb-4">Dados do Estabelecimento</h3>
        <div className="space-y-4">
          <div>
            <label className="field-label">Nome do estabelecimento</label>
            <input className="field-input" value={config.nome}
              onChange={e => setConfig(c => ({ ...c, nome: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Telefone / WhatsApp</label>
            <input className="field-input" value={config.telefone}
              onChange={e => setConfig(c => ({ ...c, telefone: e.target.value }))}
              placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="field-label">Endereço</label>
            <input className="field-input" value={config.endereco}
              onChange={e => setConfig(c => ({ ...c, endereco: e.target.value }))}
              placeholder="Rua, número, bairro, cidade" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-brand text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-dark transition disabled:opacity-60">
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 bg-slate-100 rounded-xl text-xs text-muted">
        <strong>Subdomínio:</strong> demo.lavaapp.com.br
      </div>

      <style jsx global>{`
        .field-label{display:block;font-size:.7rem;font-weight:600;color:#3d4f63;margin-bottom:.35rem}
        .field-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}
        .field-input:focus{border-color:#0057ff;box-shadow:0 0 0 3px rgba(0,87,255,.08)}
      `}</style>
    </div>
  );
}
