import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand mb-6 text-3xl">
          🚗
        </div>
        <h1 className="font-heading text-4xl font-bold text-white mb-3">
          Lava<span className="text-brand">App</span>
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Sistema de gestão completo para lava jatos. Controle atendimentos, clientes, serviços e relatórios em um só lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Entrar
          </Link>
          <a
            href="mailto:contato@lavaapp.com.br"
            className="border border-slate-600 text-slate-300 hover:border-slate-400 font-semibold px-6 py-3 rounded-lg transition"
          >
            Quero contratar
          </a>
        </div>
      </div>
      <footer className="absolute bottom-6 text-slate-600 text-sm">
        © 2025 LavaApp · Todos os direitos reservados
      </footer>
    </main>
  );
}
