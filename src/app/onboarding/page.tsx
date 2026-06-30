"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createTenant, saveUserTenant } from "@/lib/firestore";
import toast, { Toaster } from "react-hot-toast";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function OnboardingPage() {
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Você precisa estar logado"); return; }
    if (!nomeEmpresa.trim()) { toast.error("Informe o nome do lava jato"); return; }
    setLoading(true);
    try {
      const slug = (slugify(nomeEmpresa) || `lavaapp-${Date.now()}`).toLowerCase();
      const tenantId = await createTenant({
        slug,
        nome: nomeEmpresa.trim(),
        telefone: telefone.trim(),
        ativo: true,
      });
      await saveUserTenant(user.uid, tenantId);
      toast.success("Lava jato criado!");
      router.replace(`/dashboard?tenant=${slug}`);
    } catch {
      toast.error("Erro ao criar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl text-2xl mb-3">🚗</div>
          <h1 className="font-heading font-bold text-2xl text-ink">Bem-vindo!</h1>
          <p className="text-muted text-sm mt-1">Vamos configurar seu lava jato</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1.5">Nome do lava jato *</label>
            <input
              type="text"
              value={nomeEmpresa}
              onChange={e => setNomeEmpresa(e.target.value)}
              required
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
              placeholder="Ex: Auto Spa Premium"
            />
            {nomeEmpresa && (
              <p className="text-xs text-muted mt-1">Identificador: <span className="text-brand font-mono">{slugify(nomeEmpresa)}</span></p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1.5">Telefone</label>
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
              placeholder="(11) 99999-9999"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-sm transition"
          >
            {loading ? "Criando..." : "Criar meu lava jato →"}
          </button>
        </form>
      </div>
    </main>
  );
}
