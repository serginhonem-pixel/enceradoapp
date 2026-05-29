"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createTenant, saveUserTenant } from "@/lib/firestore";
import type { ConfirmationResult } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";

type Modo = "email" | "celular";

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CadastroPage() {
  const [modo, setModo] = useState<Modo>("email");
  const [step, setStep] = useState<1 | 2>(1);

  // email
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // celular
  const [celular, setCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<"numero" | "codigo">("numero");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  // empresa (step 2)
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState("");

  const [loading, setLoading] = useState(false);
  const { signUp, sendPhoneCode, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function criarLavaJato(uid: string) {
    const slug = slugify(nomeEmpresa) || `lavaapp-${Date.now()}`;
    const tenantId = await createTenant({ slug, nome: nomeEmpresa.trim(), telefone: telefoneEmpresa.trim(), ativo: true });
    await saveUserTenant(uid, tenantId);
    toast.success("Conta criada com sucesso!");
    router.replace(`/dashboard?tenant=${slug}`);
  }

  // ── Email: step 1 → step 2 → criar
  async function handleContinuarEmail(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleCadastroEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeEmpresa.trim()) { toast.error("Informe o nome do lava jato"); return; }
    setLoading(true);
    try {
      const cred = await signUp(email, senha);
      await criarLavaJato(cred.user.uid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) toast.error("Este e-mail já está cadastrado");
      else if (msg.includes("weak-password")) toast.error("A senha deve ter pelo menos 6 caracteres");
      else toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── Celular: enviar código
  async function handleEnviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const numero = celular.startsWith("+") ? celular : `+55${celular.replace(/\D/g, "")}`;
      const result = await sendPhoneCode(numero, "recaptcha-cadastro");
      setConfirmation(result);
      setEtapa("codigo");
      toast.success("Código enviado por SMS!");
    } catch {
      toast.error("Erro ao enviar SMS. Verifique o número.");
    } finally {
      setLoading(false);
    }
  }

  // ── Celular: confirmar código → step 2
  async function handleConfirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmation) return;
    setLoading(true);
    try {
      await confirmation.confirm(codigo);
      setStep(2);
    } catch {
      toast.error("Código inválido ou expirado");
    } finally {
      setLoading(false);
    }
  }

  // ── Celular: criar lava jato após verificação
  async function handleCadastroPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeEmpresa.trim()) { toast.error("Informe o nome do lava jato"); return; }
    if (!user) { toast.error("Sessão expirada. Recarregue a página."); return; }
    setLoading(true);
    try {
      await criarLavaJato(user.uid);
    } catch {
      toast.error("Erro ao criar lava jato.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div id="recaptcha-cadastro" />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl text-2xl mb-3">🚗</div>
          <h1 className="font-heading font-bold text-2xl text-ink">Encerad<span className="text-brand">oApp</span></h1>
          <p className="text-muted text-sm mt-1">Crie sua conta grátis</p>
        </div>

        {/* Toggle — só aparece no step 1 */}
        {step === 1 && (
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 mb-4">
            <button onClick={() => { setModo("email"); setEtapa("numero"); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${modo === "email" ? "bg-brand text-black shadow" : "text-slate-400 hover:text-slate-600"}`}>
              Email
            </button>
            <button onClick={() => { setModo("celular"); setEtapa("numero"); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${modo === "celular" ? "bg-brand text-black shadow" : "text-slate-400 hover:text-slate-600"}`}>
              Celular
            </button>
          </div>
        )}

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-brand" : "bg-slate-200"}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-brand" : "bg-slate-200"}`} />
        </div>

        {/* ── EMAIL step 1 ── */}
        {modo === "email" && step === 1 && (
          <form onSubmit={handleContinuarEmail} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Seus dados</p>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Seu nome</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className={inputCls} placeholder="João Silva" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6} className={inputCls} placeholder="Mínimo 6 caracteres" />
            </div>
            <button type="submit" className="w-full bg-brand hover:bg-brand-dark text-black font-semibold py-2.5 rounded-lg text-sm transition">Continuar →</button>
          </form>
        )}

        {/* ── CELULAR step 1 — número ── */}
        {modo === "celular" && step === 1 && etapa === "numero" && (
          <form onSubmit={handleEnviarCodigo} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Seu celular</p>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Número de celular</label>
              <input type="tel" value={celular} onChange={e => setCelular(e.target.value)} required className={inputCls} placeholder="(11) 99999-9999" />
              <p className="text-xs text-muted mt-1">Vamos enviar um código por SMS</p>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-sm transition">
              {loading ? "Enviando..." : "Enviar código →"}
            </button>
          </form>
        )}

        {/* ── CELULAR step 1 — código ── */}
        {modo === "celular" && step === 1 && etapa === "codigo" && (
          <form onSubmit={handleConfirmarCodigo} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-slate-600">Código enviado para</p>
              <p className="font-semibold text-ink">{celular}</p>
              <button type="button" onClick={() => setEtapa("numero")} className="text-xs text-brand hover:underline mt-1">Trocar número</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Código SMS</label>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} required maxLength={6}
                className={`${inputCls} text-center tracking-widest text-lg font-bold`} placeholder="000000" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-sm transition">
              {loading ? "Verificando..." : "Confirmar"}
            </button>
          </form>
        )}

        {/* ── STEP 2 — Lava jato (email e celular) ── */}
        {step === 2 && (
          <form onSubmit={modo === "email" ? handleCadastroEmail : handleCadastroPhone}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Seu lava jato</p>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Nome do lava jato *</label>
              <input type="text" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} required className={inputCls} placeholder="Ex: Auto Spa Premium" />
              {nomeEmpresa && (
                <p className="text-xs text-muted mt-1">Identificador: <span className="text-brand font-mono">{slugify(nomeEmpresa)}</span></p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Telefone</label>
              <input type="tel" value={telefoneEmpresa} onChange={e => setTelefoneEmpresa(e.target.value)} className={inputCls} placeholder="(11) 99999-9999" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-slate-200 text-sm text-slate-600 py-2.5 rounded-lg hover:bg-slate-50 transition font-medium">Voltar</button>
              <button type="submit" disabled={loading} className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-sm transition">
                {loading ? "Criando..." : "Criar conta"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted mt-4">
          Já tem conta?{" "}
          <Link href="/login" className="text-brand font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
