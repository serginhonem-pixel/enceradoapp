"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function CadastroPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeEmpresa.trim()) { toast.error("Informe o nome do lava jato"); return; }
    setLoading(true);
    try {
      const cred = await signUp(email, senha);
      const slug = slugify(nomeEmpresa) || `lavaapp-${Date.now()}`;
      const tenantId = await createTenant({
        slug,
        nome: nomeEmpresa.trim(),
        ativo: true,
      });
      await saveUserTenant(cred.user.uid, tenantId);
      toast.success("Conta criada com sucesso!");
      router.replace(`/dashboard?tenant=${slug}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) toast.error("Este e-mail já está cadastrado");
      else if (msg.includes("weak-password")) toast.error("A senha deve ter pelo menos 6 caracteres");
      else toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl text-2xl mb-3">
            🚗
          </div>
          <h1 className="font-heading font-bold text-2xl text-ink">
            Encerad<span className="text-brand">oApp</span>
          </h1>
          <p className="text-muted text-sm mt-1">Crie sua conta grátis</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-brand" : "bg-slate-200"}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-brand" : "bg-slate-200"}`} />
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleCadastro}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">

          {step === 1 && (
            <>
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">Seus dados</p>
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Seu nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <button type="submit" className="w-full bg-brand hover:bg-brand-dark text-black font-semibold py-2.5 rounded-lg text-sm transition">
                Continuar →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">Seu lava jato</p>
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Nome do lava jato *</label>
                <input
                  type="text"
                  value={nomeEmpresa}
                  onChange={e => setNomeEmpresa(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                  placeholder="Ex: Auto Spa Premium"
                />
                {nomeEmpresa && (
                  <p className="text-xs text-muted mt-1">Slug: <span className="text-brand font-mono">{slugify(nomeEmpresa)}</span></p>
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
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2.5 rounded-lg hover:bg-slate-50 transition font-medium">
                  Voltar
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-sm transition">
                  {loading ? "Criando conta..." : "Criar conta"}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Já tem conta?{" "}
          <Link href="/login" className="text-brand font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
