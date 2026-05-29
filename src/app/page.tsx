"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Benefícios", href: "#beneficios" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Preços", href: "#precos" },
];

const BENEFITS = [
  { icon: "💰", title: "Controle Financeiro", desc: "Acompanhe receitas, despesas e lucro em tempo real com gráficos intuitivos." },
  { icon: "📅", title: "Agendamento Online", desc: "Clientes agendam pelo celular. Sem ligações, sem confusão." },
  { icon: "👥", title: "Gestão de Clientes", desc: "Cadastro completo, histórico de visitas e preferências de cada cliente." },
  { icon: "🚗", title: "Histórico de Veículos", desc: "Todos os serviços realizados por placa, com fotos e observações." },
  { icon: "👷", title: "Controle de Funcionários", desc: "Escala, produtividade e comissões de cada colaborador." },
  { icon: "📊", title: "Relatórios Inteligentes", desc: "Insights automáticos para você tomar decisões com dados." },
  { icon: "💬", title: "WhatsApp Integrado", desc: "Confirmações, lembretes e promoções direto no WhatsApp do cliente." },
  { icon: "🔔", title: "Lembretes Automáticos", desc: "Sistema avisa o cliente na hora certa para retornar ao seu lava jato." },
];

const STEPS = [
  { num: "01", title: "Cadastre seu lava jato", desc: "Crie sua conta em minutos. Configure serviços, preços e equipe." },
  { num: "02", title: "Organize seus serviços", desc: "Adicione os serviços que você oferece, defina duração e valores." },
  { num: "03", title: "Gerencie tudo pelo celular", desc: "Acesse de qualquer lugar. Veja a agenda, caixa e relatórios na palma da mão." },
];

const TESTIMONIALS = [
  { name: "Ricardo Mendes", role: "Dono — Auto Spa Premium, SP", stars: 5, text: "Antes eu controlava tudo no caderno. Hoje sei exatamente quanto entrou, quanto saiu e quais clientes preciso recuperar. Dobrei meu faturamento em 4 meses." },
  { name: "Fernanda Costa", role: "Gerente — Lava Jato Central, RJ", stars: 5, text: "O agendamento online foi um divisor de águas. Reduzi 80% das ligações e os clientes adoram a praticidade. Recomendo demais." },
  { name: "Carlos Augusto", role: "Proprietário — Clean Car, MG", stars: 5, text: "Os relatórios me mostraram que eu estava perdendo dinheiro nos finais de semana. Ajustei a escala e aumentei o lucro em R$3.000 por mês." },
];

const PLANS = [
  {
    name: "Starter",
    price: "R$ 97",
    period: "/mês",
    desc: "Ideal para quem está começando",
    features: ["Até 2 funcionários", "Agendamento online", "Controle financeiro", "Histórico de clientes", "Suporte por e-mail"],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 197",
    period: "/mês",
    desc: "Para lava jatos em crescimento",
    features: ["Funcionários ilimitados", "WhatsApp integrado", "Lembretes automáticos", "Relatórios avançados", "Suporte prioritário", "App personalizado"],
    cta: "Começar grátis",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    desc: "Para redes e franquias",
    features: ["Múltiplas unidades", "Painel centralizador", "API dedicada", "Onboarding exclusivo", "Gerente de conta", "SLA garantido"],
    cta: "Falar com vendas",
    highlight: false,
  },
];

const STATS = [
  { value: "+500", label: "Lava jatos ativos" },
  { value: "+50mil", label: "Serviços realizados" },
  { value: "R$2M+", label: "Gerenciados na plataforma" },
  { value: "4.9★", label: "Avaliação média" },
];

const DASHBOARD_SCREENS = [
  { label: "Agenda", icon: "📅", color: "from-green-500/20 to-emerald-500/20" },
  { label: "Financeiro", icon: "💰", color: "from-emerald-500/20 to-teal-500/20" },
  { label: "Clientes", icon: "👥", color: "from-green-600/20 to-lime-400/20" },
  { label: "OS", icon: "🔧", color: "from-teal-500/20 to-green-400/20" },
  { label: "Relatórios", icon: "📊", color: "from-emerald-400/20 to-green-600/20" },
];

export default function LandingPage() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % DASHBOARD_SCREENS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050f09] text-white overflow-x-hidden">

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050f09]/90 backdrop-blur-xl border-b border-white/5 shadow-xl" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-base">🚗</div>
            <span className="font-heading font-bold text-lg">Encerado<span className="text-brand">App</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-slate-400 hover:text-white transition">{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition hidden sm:block">Entrar</Link>
            <Link href="/login" className="text-sm bg-brand hover:bg-brand-dark text-black font-semibold px-4 py-2 rounded-lg transition">
              Teste grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-green-500/5 rounded-full blur-[80px]" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 text-sm text-brand mb-6">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                Mais de 500 lava jatos usam o EnceradoApp
              </div>
              <h1 className="font-heading text-5xl sm:text-6xl font-bold leading-tight mb-6">
                Seu lava jato<br />
                <span className="bg-gradient-to-r from-brand to-emerald-300 bg-clip-text text-transparent">no controle total.</span>
              </h1>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Agendamentos, clientes, caixa, serviços e produtividade em um único app. Pare de perder tempo com planilhas e foque no que importa: crescer.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-black font-semibold px-6 py-3.5 rounded-xl transition shadow-lg shadow-green-500/20">
                  Teste grátis por 7 dias →
                </Link>
                <Link href="/demo/dashboard" className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3.5 rounded-xl transition">
                  Ver demonstração 🚀
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">Sem cartão de crédito. Cancele quando quiser.</p>
            </div>

            {/* Right — Dashboard Mockup */}
            <div className="relative">
              <div className="relative bg-[#061410]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-2xl">
                {/* Browser bar */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/50" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <span className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-md h-6 flex items-center px-3">
                    <span className="text-xs text-slate-500">app.enceradoapp.com.br</span>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Hoje", value: "23 carros", color: "text-cyan-400" },
                      { label: "Faturamento", value: "R$ 2.840", color: "text-green-400" },
                      { label: "Pendentes", value: "7 agend.", color: "text-yellow-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 rounded-xl p-3">
                        <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
                        <p className={`font-heading font-bold text-sm ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Main chart area */}
                  <div className="bg-white/5 rounded-xl p-4 h-32 flex items-end gap-1.5">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-brand to-emerald-300 opacity-70 transition-all" style={{ height: `${h}%` }} />
                    ))}
                  </div>

                  {/* Table rows */}
                  <div className="space-y-1.5">
                    {[
                      { placa: "ABC-1234", serv: "Lavagem + Enceramento", val: "R$ 120", status: "✅" },
                      { placa: "DEF-5678", serv: "Higienização Interna", val: "R$ 250", status: "🔄" },
                      { placa: "GHI-9012", serv: "Polimento Completo", val: "R$ 380", status: "⏳" },
                    ].map((row) => (
                      <div key={row.placa} className="flex items-center gap-3 bg-white/3 rounded-lg px-3 py-2 text-xs">
                        <span className="font-mono text-slate-400 w-16 shrink-0">{row.placa}</span>
                        <span className="text-slate-300 flex-1 truncate">{row.serv}</span>
                        <span className="text-green-400 font-semibold w-16 text-right shrink-0">{row.val}</span>
                        <span className="shrink-0">{row.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating indicators */}
              <div className="absolute -top-4 -right-4 bg-[#061410] border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-sm">
                <p className="text-[10px] text-slate-500 mb-0.5">Clientes ativos</p>
                <p className="font-heading font-bold text-lg text-white">1.247</p>
                <p className="text-[10px] text-green-400">↑ 12% este mês</p>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#061410] border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-sm">
                <p className="text-[10px] text-slate-500 mb-0.5">Ticket médio</p>
                <p className="font-heading font-bold text-lg text-white">R$ 185</p>
                <p className="text-[10px] text-cyan-400">↑ 8% vs. mês anterior</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-white/5 bg-white/2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-3xl font-bold bg-gradient-to-r from-brand to-emerald-300 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section id="beneficios" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Tudo que você precisa</p>
            <h2 className="font-heading text-4xl font-bold mb-4">Uma plataforma.<br />Tudo resolvido.</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Do agendamento ao fechamento de caixa, o EnceradoApp centraliza toda a operação do seu lava jato.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="group relative bg-white/3 hover:bg-white/6 border border-white/8 hover:border-brand/30 rounded-2xl p-6 transition-all duration-300 cursor-default">
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{b.icon}</div>
                <h3 className="font-heading font-semibold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{b.desc}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Simples assim</p>
            <h2 className="font-heading text-4xl font-bold mb-4">Pronto em 3 passos</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Configure o seu lava jato em menos de 15 minutos e comece a usar hoje mesmo.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-brand/30 to-transparent" />
                )}
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 mb-6">
                  <span className="font-heading font-bold text-brand text-xl">{s.num}</span>
                </div>
                <h3 className="font-heading font-semibold text-lg mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD SHOWCASE */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Interface premium</p>
            <h2 className="font-heading text-4xl font-bold mb-4">Tudo na palma da mão</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Cada tela foi projetada para ser rápida, intuitiva e eficiente.</p>
          </div>

          {/* Screen tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {DASHBOARD_SCREENS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setActiveScreen(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeScreen === i
                    ? "bg-brand text-black shadow-lg shadow-green-500/20"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* Screen preview */}
          <div className="relative bg-[#061410]/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Glow top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

            <div className={`bg-gradient-to-br ${DASHBOARD_SCREENS[activeScreen].color} p-8 min-h-[320px] flex items-center justify-center`}>
              <div className="text-center">
                <div className="text-6xl mb-4">{DASHBOARD_SCREENS[activeScreen].icon}</div>
                <p className="font-heading font-bold text-2xl text-white mb-2">Módulo {DASHBOARD_SCREENS[activeScreen].label}</p>
                <p className="text-slate-400">Visualização completa com dados em tempo real</p>

                {/* Mini mock content */}
                <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-xl h-16 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="depoimentos" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/3 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Prova social</p>
            <h2 className="font-heading text-4xl font-bold mb-4">Quem usa, recomenda</h2>
            <p className="text-slate-400">Mais de 500 lava jatos já transformaram seus negócios com o EnceradoApp.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-brand/20 transition-all duration-300">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center font-heading font-bold text-brand">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precos" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Planos e preços</p>
            <h2 className="font-heading text-4xl font-bold mb-4">Investimento que se paga</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Comece grátis por 7 dias. Sem cartão de crédito. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div key={p.name} className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                p.highlight
                  ? "bg-brand/10 border-brand/40 shadow-xl shadow-brand/10"
                  : "bg-white/3 border-white/8 hover:border-white/20"
              }`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">MAIS POPULAR</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg mb-1">{p.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{p.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className="font-heading font-bold text-3xl text-white">{p.price}</span>
                    {p.period && <span className="text-slate-400 text-sm mb-1">{p.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-green-400 text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block text-center font-semibold py-3 rounded-xl transition ${
                    p.highlight
                      ? "bg-brand hover:bg-brand-dark text-black shadow-lg shadow-green-500/20"
                      : "bg-white/8 hover:bg-white/12 text-white border border-white/10"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-cyan-500/5" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="bg-white/3 border border-white/10 rounded-3xl p-12 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
            <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Pare de perder<br />
              <span className="bg-gradient-to-r from-brand to-emerald-300 bg-clip-text text-transparent">clientes e dinheiro.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">Seu concorrente já está usando tecnologia. Está na hora de você também.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-black font-bold px-8 py-4 rounded-xl text-lg transition shadow-2xl shadow-green-500/25"
            >
              Começar agora →
            </Link>
            <p className="mt-4 text-sm text-slate-500">Teste grátis por 7 dias. Sem cartão de crédito.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-base">🚗</div>
                <span className="font-heading font-bold">Encerado<span className="text-brand">App</span></span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">Sistema de gestão completo para lava jatos modernos.</p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4 text-white">Produto</p>
              <ul className="space-y-2 text-sm text-slate-400">
                {["Funcionalidades", "Preços", "Demo", "Roadmap"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4 text-white">Empresa</p>
              <ul className="space-y-2 text-sm text-slate-400">
                {["Sobre nós", "Blog", "Casos de sucesso", "Contato"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4 text-white">Suporte</p>
              <ul className="space-y-2 text-sm text-slate-400">
                {["Central de ajuda", "Política de privacidade", "Termos de uso", "Status"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">© 2025 EnceradoApp. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="mailto:contato@enceradoapp.com.br" className="text-sm hover:text-white transition">contato@enceradoapp.com.br</a>
              <div className="flex gap-3">
                {["Instagram", "WhatsApp", "LinkedIn"].map((s) => (
                  <a key={s} href="#" className="text-xs hover:text-white transition">{s}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
