"use client";
import { useEffect, useState, useRef } from "react";
import { useTenant } from "@/hooks/useTenant";
import { updateTenant } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Topbar } from "@/components/layout/Topbar";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

export default function ConfiguracoesPage() {
  const { tenant } = useTenant();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tenant) return;
    setNome(tenant.nome);
    setTelefone(tenant.telefone ?? "");
    setEndereco(tenant.endereco ?? "");
  }, [tenant]);

  async function handleSave() {
    if (!tenant) return;
    setSaving(true);
    try {
      await updateTenant(tenant.id, { nome, telefone, endereco });
      toast.success("Configurações salvas!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !tenant || !storage) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `tenants/${tenant.id}/logo`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateTenant(tenant.id, { logoUrl: url });
      toast.success("Logo atualizada! Recarregue a página.");
    } catch { toast.error("Erro ao enviar logo"); }
    finally { setUploading(false); }
  }

  return (
    <>
      <Topbar title="Configurações" />
      <div className="p-6 max-w-2xl">
        {/* Logo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
          <h3 className="font-heading font-semibold text-sm text-ink mb-4">Logo do Estabelecimento</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
              {tenant?.logoUrl ? (
                <Image src={tenant.logoUrl} alt="logo" width={64} height={64} className="object-cover" />
              ) : (
                <span className="text-2xl">🚗</span>
              )}
            </div>
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 border border-slate-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              >
                <Upload size={13} />
                {uploading ? "Enviando..." : "Trocar logo"}
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
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-brand text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-dark transition disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </div>

        {/* Link de agendamento */}
        <div className="mt-4 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm text-ink mb-1">Link de Agendamento</h3>
          <p className="text-xs text-muted mb-3">Compartilhe este link para seus clientes agendarem online</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={`https://enceradoapp.vercel.app/agendar/${tenant?.slug ?? ""}`}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://enceradoapp.vercel.app/agendar/${tenant?.slug ?? ""}`);
                toast.success("Link copiado!");
              }}
              className="shrink-0 bg-brand text-black text-xs font-semibold px-3 py-2 rounded-lg hover:bg-brand-dark transition"
            >
              Copiar
            </button>
          </div>
          <a
            href={`https://enceradoapp.vercel.app/agendar/${tenant?.slug ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand hover:underline mt-2 block"
          >
            Abrir página →
          </a>
        </div>
      </div>

      <style jsx global>{`
        .field-label{display:block;font-size:.7rem;font-weight:600;color:#3d4f63;margin-bottom:.35rem}
        .field-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}
        .field-input:focus{border-color:#0057ff;box-shadow:0 0 0 3px rgba(0,87,255,.08)}
      `}</style>
    </>
  );
}
