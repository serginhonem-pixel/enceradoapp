"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getUserTenant } from "@/lib/firestore";
import type { ConfirmationResult } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";

type Modo = "email" | "celular";
type EtapaCelular = "numero" | "codigo";

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("email");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [celular, setCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<EtapaCelular>("numero");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const { signIn, sendPhoneCode, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function afterLogin(uid: string) {
    const tenant = await getUserTenant(uid);
    router.replace(tenant ? `/dashboard?tenant=${tenant.slug}` : "/dashboard");
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signIn(email, senha);
      await afterLogin(cred.user.uid);
    } catch {
      toast.error("Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!celular) return;
    setLoading(true);
    try {
      const numero = celular.startsWith("+") ? celular : `+55${celular.replace(/\D/g, "")}`;
      const result = await sendPhoneCode(numero, "recaptcha-container");
      setConfirmation(result);
      setEtapa("codigo");
      toast.success("Código enviado por SMS!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Phone auth error:", msg);
      toast.error(msg.slice(0, 150));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmation) return;
    setLoading(true);
    try {
      const cred = await confirmation.confirm(codigo);
      await afterLogin(cred.user.uid);
    } catch {
      toast.error("Código inválido ou expirado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div id="recaptcha-container" ref={recaptchaRef} />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl text-2xl mb-3">🚗</div>
          <h1 className="font-heading font-bold text-2xl text-ink">Encerad<span className="text-brand">oApp</span></h1>
          <p className="text-muted text-sm mt-1">Entre na sua conta</p>
        </div>

        {/* Toggle email / celular */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 mb-4">
          <button
            onClick={() => { setModo("email"); setEtapa("numero"); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${modo === "email" ? "bg-brand text-black shadow" : "text-slate-400 hover:text-slate-600"}`}
          >
            Email
          </button>
          <button
            onClick={() => { setModo("celular"); setEtapa("numero"); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${modo === "celular" ? "bg-brand text-black shadow" : "text-slate-400 hover:text-slate-600"}`}
          >
            Celular
          </button>
        </div>

        {/* Formulário Email */}
        {modo === "email" && (
          <form onSubmit={handleEmail} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-sm transition">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}

        {/* Formulário Celular — etapa número */}
        {modo === "celular" && etapa === "numero" && (
          <form onSubmit={handleEnviarCodigo} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Número de celular</label>
              <input type="tel" value={celular} onChange={e => setCelular(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                placeholder="(11) 99999-9999" />
              <p className="text-xs text-muted mt-1">Vamos enviar um código por SMS</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-sm transition">
              {loading ? "Enviando..." : "Enviar código →"}
            </button>
          </form>
        )}

        {/* Formulário Celular — etapa código */}
        {modo === "celular" && etapa === "codigo" && (
          <form onSubmit={handleConfirmarCodigo} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="text-center mb-2">
              <p className="text-sm text-slate-600">Código enviado para</p>
              <p className="font-semibold text-ink">{celular}</p>
              <button type="button" onClick={() => setEtapa("numero")} className="text-xs text-brand hover:underline mt-1">Trocar número</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 mb-1.5">Código SMS</label>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} required maxLength={6}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition text-center tracking-widest text-lg font-bold"
                placeholder="000000" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-sm transition">
              {loading ? "Verificando..." : "Confirmar"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted mt-4">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-brand font-semibold hover:underline">Criar conta grátis</Link>
        </p>
      </div>
    </main>
  );
}
