"use client";
import { useEffect, useState, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";

interface Step {
  selector: string;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="nav-dashboard"]',
    title: "Dashboard",
    text: "Aqui você vê o resumo do dia: atendimentos abertos, carros concluídos e o faturamento em tempo real.",
  },
  {
    selector: '[data-tour="nav-agenda"]',
    title: "Agenda",
    text: "Visualize e confirme os agendamentos do mês. Clientes podem agendar pelo link público do estabelecimento.",
  },
  {
    selector: '[data-tour="nav-atendimentos"]',
    title: "Atendimentos (OS)",
    text: "Abra uma Ordem de Serviço para cada carro. Adicione os serviços realizados, desconto e forma de pagamento.",
  },
  {
    selector: '[data-tour="nav-clientes"]',
    title: "Clientes",
    text: "Cadastre clientes com nome, telefone e veículos. O histórico de atendimentos fica salvo por cliente.",
  },
  {
    selector: '[data-tour="nav-servicos"]',
    title: "Serviços",
    text: "Configure os serviços que você oferece com nome e preço. Eles aparecem automaticamente ao abrir uma OS.",
  },
  {
    selector: '[data-tour="nav-fechamento"]',
    title: "Fechamento do Dia",
    text: "No final do dia, registre o fechamento para salvar o resumo financeiro e acompanhar o lucro estimado.",
  },
  {
    selector: '[data-tour="nav-relatorios"]',
    title: "Relatórios",
    text: "Veja o desempenho mensal: faturamento, lucro, ticket médio e quais serviços foram mais vendidos.",
  },
  {
    selector: '[data-tour="nav-config"]',
    title: "Configurações",
    text: "Configure o horário de funcionamento e copie o link de agendamento para enviar aos seus clientes no WhatsApp.",
  },
];

const PAD = 8;
const BALLOON_W = 268;

function getVisibleEl(selector: string): Element | null {
  const els = Array.from(document.querySelectorAll(selector));
  return els.find(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
  }) ?? null;
}

type Arrow = "left" | "right" | "top" | "bottom" | null;

function calcBalloon(rect: DOMRect): { style: React.CSSProperties; arrow: Arrow } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bh = 200;

  if (rect.right + 20 + BALLOON_W < vw) {
    return {
      style: {
        top: Math.max(8, Math.min(vh - bh - 8, rect.top + rect.height / 2 - bh / 2)),
        left: rect.right + 14,
      },
      arrow: "left",
    };
  }
  if (rect.top - 20 - bh > 0) {
    return {
      style: {
        bottom: vh - rect.top + 14,
        left: Math.max(8, Math.min(vw - BALLOON_W - 8, rect.left + rect.width / 2 - BALLOON_W / 2)),
      },
      arrow: "bottom",
    };
  }
  return {
    style: {
      top: rect.bottom + 14,
      left: Math.max(8, Math.min(vw - BALLOON_W - 8, rect.left + rect.width / 2 - BALLOON_W / 2)),
    },
    arrow: "top",
  };
}

const ARROW_STYLE: Record<string, React.CSSProperties> = {
  left: {
    position: "absolute", top: "50%", left: -8, transform: "translateY(-50%)",
    width: 0, height: 0,
    borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderRight: "8px solid white",
  },
  right: {
    position: "absolute", top: "50%", right: -8, transform: "translateY(-50%)",
    width: 0, height: 0,
    borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "8px solid white",
  },
  bottom: {
    position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
    width: 0, height: 0,
    borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "8px solid white",
  },
  top: {
    position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
    width: 0, height: 0,
    borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "8px solid white",
  },
};

export function TourGuide() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [balloon, setBalloon] = useState<{ style: React.CSSProperties; arrow: Arrow }>({ style: {}, arrow: null });
  const [unseen, setUnseen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("encerado_tour_seen")) setUnseen(true);
  }, []);

  const updatePos = useCallback((stepIndex: number) => {
    const el = getVisibleEl(STEPS[stepIndex].selector);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect(r);
        setBalloon(calcBalloon(r));
      });
    } else {
      setRect(null);
      setBalloon({ style: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }, arrow: null });
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const handle = () => updatePos(step);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [active, step, updatePos]);

  function open() {
    setStep(0);
    setActive(true);
    setUnseen(false);
    localStorage.setItem("encerado_tour_seen", "1");
    setTimeout(() => updatePos(0), 80);
  }

  function close() {
    setActive(false);
    setRect(null);
  }

  function goTo(i: number) {
    setStep(i);
    updatePos(i);
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {!active && (
        <button
          onClick={open}
          className="fixed bottom-[72px] right-4 md:bottom-6 md:right-6 z-40 w-11 h-11 rounded-full bg-brand shadow-lg text-white flex items-center justify-center hover:scale-110 transition-transform"
          title="Tour do sistema"
          aria-label="Abrir tour guiado"
        >
          {unseen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full">
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            </span>
          )}
          <HelpCircle size={20} />
        </button>
      )}

      {active && (
        <>
          {/* Click-to-close backdrop */}
          <div className="fixed inset-0 z-[998] cursor-pointer" onClick={close} />

          {/* Spotlight */}
          {rect ? (
            <div
              className="fixed z-[999] rounded-lg pointer-events-none"
              style={{
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
                transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
              }}
            />
          ) : (
            <div className="fixed inset-0 z-[999] bg-black/72 pointer-events-none" />
          )}

          {/* Balloon */}
          <div
            className="fixed z-[1000] bg-white rounded-2xl shadow-2xl pointer-events-auto"
            style={{
              width: BALLOON_W,
              ...balloon.style,
              transition: "top 0.25s ease, left 0.25s ease, bottom 0.25s ease",
            }}
          >
            {balloon.arrow && <span style={ARROW_STYLE[balloon.arrow]} />}

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading font-bold text-sm text-ink leading-tight">{current.title}</h3>
                <button onClick={close} className="text-muted hover:text-ink ml-3 shrink-0 transition">
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-muted leading-relaxed mb-4">{current.text}</p>

              {/* Progress dots */}
              <div className="flex gap-1 mb-3 justify-center">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "bg-brand w-4" : "bg-slate-200 w-1.5 hover:bg-slate-300"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] text-muted font-medium">
                  {step + 1} / {STEPS.length}
                </span>
                <div className="flex gap-1.5 items-center">
                  {step > 0 && (
                    <button
                      onClick={() => goTo(step - 1)}
                      className="text-xs text-muted hover:text-ink flex items-center gap-0.5 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition"
                    >
                      <ChevronLeft size={13} /> Anterior
                    </button>
                  )}
                  <button
                    onClick={isLast ? close : () => goTo(step + 1)}
                    className="text-xs bg-ink text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 hover:bg-ink/90 transition"
                  >
                    {isLast ? "Concluir" : "Próximo"}
                    {!isLast && <ChevronRight size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
