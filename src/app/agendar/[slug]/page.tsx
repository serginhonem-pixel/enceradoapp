"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenantBySlug, getServicos, saveAgendamento, getAgendamentos } from "@/lib/firestore";
import { format, addDays, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast, { Toaster } from "react-hot-toast";
import type { Tenant, Servico } from "@/types";

function gerarHorarios(inicio: string, fim: string, intervalo: number): string[] {
  const slots: string[] = [];
  const [ih, im] = inicio.split(":").map(Number);
  const [fh, fm] = fim.split(":").map(Number);
  let cur = ih * 60 + im;
  const end = fh * 60 + fm;
  while (cur < end) {
    const h = Math.floor(cur / 60).toString().padStart(2, "0");
    const m = (cur % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    cur += intervalo;
  }
  return slots;
}

type Step = "servico" | "data" | "info" | "sucesso";

export default function AgendarPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("servico");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // seleções
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  // info do cliente
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (!slug) return;
    getTenantBySlug(slug).then(async (t) => {
      if (!t) { setLoading(false); return; }
      setTenant(t);
      const ss = await getServicos(t.id);
      setServicos(ss.filter(s => s.ativo));
      setLoading(false);
    });
  }, [slug]);

  async function carregarHorarios(dataSel: string) {
    if (!tenant) return;
    const ags = await getAgendamentos(tenant.id, dataSel.slice(0, 7));
    const ocupados = ags.filter(a => a.data === dataSel && a.status !== "cancelado").map(a => a.hora);
    setHorariosOcupados(ocupados);
  }

  function selecionarData(d: string) {
    setData(d);
    setHora("");
    carregarHorarios(d);
  }

  const servicoSel = servicos.find(s => s.id === servicoId);

  // Próximos 30 dias filtrando pelos dias abertos
  const horariosTenant = tenant?.horarios as Record<string, { aberto: boolean; inicio: string; fim: string }> | undefined;
  const intervaloTenant = tenant?.intervaloAgendamento ?? 30;

  const diasDisponiveis = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))
    .filter(d => {
      const diaSemana = d.getDay().toString();
      if (!horariosTenant) return d.getDay() !== 0;
      return horariosTenant[diaSemana]?.aberto ?? false;
    });

  const horariosDoDia = data ? (() => {
    const diaSemana = parseISO(data).getDay().toString();
    const h = horariosTenant?.[diaSemana];
    if (!h?.aberto) return [];
    const slots = gerarHorarios(h.inicio, h.fim, intervaloTenant);
    // Se for hoje, remove horários que já passaram (+ 30min de folga)
    const hoje = format(new Date(), "yyyy-MM-dd");
    if (data === hoje) {
      const agora = new Date().getHours() * 60 + new Date().getMinutes() + 30;
      return slots.filter(s => {
        const [sh, sm] = s.split(":").map(Number);
        return sh * 60 + sm > agora;
      });
    }
    return slots;
  })() : [];

  async function handleConfirmar() {
    if (!tenant || !servicoSel) return;
    if (!nome.trim() || !telefone.trim()) { toast.error("Informe nome e telefone"); return; }
    setSaving(true);
    try {
      await saveAgendamento(tenant.id, {
        clienteId: "",
        clienteNome: nome.trim(),
        clienteTelefone: telefone.trim(),
        veiculoPlaca: placa.toUpperCase().trim() || "-",
        veiculoModelo: modelo.trim() || "-",
        veiculoCor: cor.trim() || "-",
        servicoIds: [servicoSel.id],
        servicoNomes: [servicoSel.nome],
        totalEstimado: servicoSel.preco,
        data, hora,
        observacoes: obs.trim() || "",
        status: "agendado",
        createdAt: new Date(),
      });
      setStep("sucesso");
      // Notifica o dono via WhatsApp
      if (tenant?.telefone) {
        const tel = tenant.telefone.replace(/\D/g, "");
        const msg = encodeURIComponent(
          `🚗 *Novo agendamento!*\n\n` +
          `*Cliente:* ${nome.trim()}\n` +
          `*Telefone:* ${telefone.trim()}\n` +
          `*Servico:* ${servicoSel?.nome}\n` +
          `*Data:* ${format(parseISO(data), "d/MM/yyyy")}\n` +
          `*Horario:* ${hora}\n` +
          `*Veiculo:* ${placa || "-"} ${modelo || ""} ${cor || ""}` +
          `${obs ? `\n*Obs:* ${obs}` : ""}`
        );
        window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao agendar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!tenant) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-heading font-bold text-xl text-ink">Lava jato não encontrado</p>
        <p className="text-muted text-sm mt-1">Verifique o link e tente novamente.</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img src={tenant.logoUrl || "/logo.jpeg"} alt="logo" className="w-full h-full object-cover" />
            </div>
          <div>
            <p className="font-heading font-bold text-ink">{tenant.nome}</p>
            {tenant.telefone && <p className="text-xs text-muted">{tenant.telefone}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Steps indicator */}
        {step !== "sucesso" && (
          <div className="flex items-center gap-2 mb-6">
            {(["servico","data","info"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === s ? "bg-brand text-black" :
                  (["servico","data","info"].indexOf(step) > i) ? "bg-brand/30 text-brand" : "bg-slate-200 text-slate-400"
                }`}>{i + 1}</div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${["servico","data","info"].indexOf(step) > i ? "bg-brand/40" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 — Serviço */}
        {step === "servico" && (
          <div>
            <h2 className="font-heading font-bold text-xl text-ink mb-1">Escolha o serviço</h2>
            <p className="text-muted text-sm mb-5">Selecione o que deseja realizar</p>
            <div className="space-y-3">
              {servicos.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setServicoId(s.id); setStep("data"); }}
                  className="w-full bg-white border border-slate-200 hover:border-brand hover:shadow-sm rounded-xl p-4 text-left transition group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink group-hover:text-brand transition">{s.nome}</p>
                      {s.descricao && <p className="text-xs text-muted mt-0.5">{s.descricao}</p>}
                      <p className="text-xs text-muted mt-1">⏱ {s.duracaoMin} minutos</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-heading font-bold text-lg text-brand">R$ {s.preco.toFixed(2)}</p>
                    </div>
                  </div>
                </button>
              ))}
              {servicos.length === 0 && (
                <p className="text-center text-muted py-8">Nenhum serviço disponível no momento.</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 — Data e hora */}
        {step === "data" && (
          <div>
            <button onClick={() => setStep("servico")} className="text-xs text-brand mb-4 hover:underline">← Voltar</button>
            <h2 className="font-heading font-bold text-xl text-ink mb-1">Escolha a data e horário</h2>
            <p className="text-muted text-sm mb-5">Serviço: <span className="font-semibold text-ink">{servicoSel?.nome}</span></p>

            {/* Dias */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
              {diasDisponiveis.map(dia => {
                const diaStr = format(dia, "yyyy-MM-dd");
                const sel = data === diaStr;
                return (
                  <button
                    key={diaStr}
                    onClick={() => selecionarData(diaStr)}
                    className={`shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border transition ${
                      sel ? "bg-brand border-brand text-black" : "bg-white border-slate-200 hover:border-brand text-ink"
                    }`}
                  >
                    <span className="text-[0.65rem] font-semibold uppercase opacity-70">
                      {format(dia, "EEE", { locale: ptBR })}
                    </span>
                    <span className="font-heading font-bold text-lg leading-none">{format(dia, "d")}</span>
                    <span className="text-[0.6rem] opacity-70">{format(dia, "MMM", { locale: ptBR })}</span>
                  </button>
                );
              })}
            </div>

            {/* Horários */}
            {data && (
              <>
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-3">Horários disponíveis</p>
                <div className="grid grid-cols-4 gap-2">
                  {horariosDoDia.map(h => {
                    const ocupado = horariosOcupados.includes(h);
                    const sel = hora === h;
                    return (
                      <button
                        key={h}
                        disabled={ocupado}
                        onClick={() => setHora(h)}
                        className={`py-2.5 rounded-lg text-sm font-semibold border transition ${
                          ocupado ? "bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed" :
                          sel ? "bg-brand border-brand text-black" :
                          "bg-white border-slate-200 hover:border-brand text-ink"
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={!hora}
                  onClick={() => setStep("info")}
                  className="w-full mt-5 bg-brand hover:bg-brand-dark disabled:opacity-40 text-black font-semibold py-3 rounded-xl transition"
                >
                  Continuar →
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 3 — Dados do cliente */}
        {step === "info" && (
          <div>
            <button onClick={() => setStep("data")} className="text-xs text-brand mb-4 hover:underline">← Voltar</button>
            <h2 className="font-heading font-bold text-xl text-ink mb-1">Seus dados</h2>
            <p className="text-muted text-sm mb-5">
              {servicoSel?.nome} · {data && format(parseISO(data), "d 'de' MMMM", { locale: ptBR })} às {hora}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Seu nome *</label>
                <input value={nome} onChange={e => setNome(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition" placeholder="João Silva" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">WhatsApp / Telefone *</label>
                <input value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition" placeholder="(11) 99999-9999" type="tel" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">Placa</label>
                  <input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-brand transition uppercase" placeholder="ABC-1234" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">Modelo</label>
                  <input value={modelo} onChange={e => setModelo(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-brand transition" placeholder="Civic" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">Cor</label>
                  <input value={cor} onChange={e => setCor(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-brand transition" placeholder="Prata" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Observações</label>
                <textarea value={obs} onChange={e => setObs(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition resize-none h-16" placeholder="Alguma observação..." />
              </div>

              {/* Resumo */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted">Serviço</span><span className="font-semibold">{servicoSel?.nome}</span></div>
                <div className="flex justify-between"><span className="text-muted">Data</span><span className="font-semibold">{data && format(parseISO(data), "d/MM/yyyy")}</span></div>
                <div className="flex justify-between"><span className="text-muted">Horário</span><span className="font-semibold">{hora}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="text-muted">Total</span><span className="font-bold text-brand">R$ {servicoSel?.preco.toFixed(2)}</span></div>
              </div>

              <button
                onClick={handleConfirmar}
                disabled={saving || !nome || !telefone}
                className="w-full bg-brand hover:bg-brand-dark disabled:opacity-40 text-black font-bold py-3.5 rounded-xl transition"
              >
                {saving ? "Confirmando..." : "Confirmar agendamento ✓"}
              </button>
            </div>
          </div>
        )}

        {/* SUCESSO */}
        {step === "sucesso" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-ink mb-2">Agendado!</h2>
            <p className="text-muted mb-6">Seu agendamento foi enviado com sucesso.<br />Aguarde a confirmação de <strong>{tenant.nome}</strong>.</p>

            <div className="bg-white border border-slate-200 rounded-xl p-4 text-left space-y-2 text-sm mb-6">
              <div className="flex justify-between"><span className="text-muted">Serviço</span><span className="font-semibold">{servicoSel?.nome}</span></div>
              <div className="flex justify-between"><span className="text-muted">Data</span><span className="font-semibold">{data && format(parseISO(data), "d/MM/yyyy")}</span></div>
              <div className="flex justify-between"><span className="text-muted">Horário</span><span className="font-semibold">{hora}</span></div>
              <div className="flex justify-between"><span className="text-muted">Local</span><span className="font-semibold">{tenant.nome}</span></div>
            </div>

            {tenant.telefone && (
              <a
                href={`https://wa.me/55${tenant.telefone.replace(/\D/g, "")}?text=Olá, acabei de agendar um ${servicoSel?.nome} para ${data && format(parseISO(data), "d/MM")} às ${hora}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition"
              >
                💬 Falar no WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
