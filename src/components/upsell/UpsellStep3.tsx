import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, MessageCircle, BarChart3, Headphones, Check, Crown, Clock, TrendingUp, Users, CalendarClock, Gauge } from "lucide-react";
import { saveUpsellChoice } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

const plans = [
  {
    id: "basico" as const,
    name: "Acelerador Básico",
    subtitle: "Resultados em até 72 horas",
    subtitleColor: "#22C55E",
    description: "A plataforma opera com prioridade nos servidores dedicados, reduzindo de 7 dias para 72 horas. Proteção básica ativada.",
    features: [
      { icon: Zap, text: "Servidores prioritários" },
      { icon: Shield, text: "Proteção básica contra perdas" },
      { icon: Headphones, text: "Suporte por e-mail" },
    ],
    price: 37, installments: "12x de R$ 3,08",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent", btnColor: "#22C55E", btnBorder: "1.5px solid #22C55E",
    btnText: "ATIVAR BÁSICO",
    badge: null,
    checkoutUrl: "https://pay.hub.la/LzOocnV4vkWEqJu08WQo/upsell",
  },
  {
    id: "duplo" as const,
    name: "Acelerador Duplo",
    subtitle: "Resultados em até 24 horas",
    subtitleColor: "#22C55E",
    description: "Tudo do Básico + uma segunda IA monitora cada operação em tempo real. É o que 9 em cada 10 novos membros escolhem.",
    features: [
      { icon: Zap, text: "Servidores prioritários" },
      { icon: Shield, text: "Proteção dupla contra perdas" },
      { icon: BarChart3, text: "Monitoramento 24h por segunda IA" },
      { icon: MessageCircle, text: "Suporte prioritário no WhatsApp" },
    ],
    price: 67, installments: "12x de R$ 5,58",
    border: "2px solid #22C55E",
    btnBg: "linear-gradient(135deg, #16A34A, #15803D)", btnColor: "#fff", btnBorder: "none",
    btnText: "ATIVAR DUPLO — MAIS ESCOLHIDO",
    badge: "⚡ RECOMENDADO",
    checkoutUrl: "https://pay.hub.la/NxLkOmGzH1PJSm1Nz63o/upsell",
  },
  {
    id: "maximo" as const,
    name: "Acelerador Máximo",
    subtitle: "Resultados em até 12 horas",
    subtitleColor: "#FACC15",
    description: "O nível máximo. Tudo do Duplo + um especialista humano te guia clique por clique no WhatsApp por 48h.",
    features: [
      { icon: Zap, text: "Servidores prioritários" },
      { icon: Shield, text: "Proteção tripla contra perdas" },
      { icon: BarChart3, text: "Monitoramento 24h por segunda IA" },
      { icon: MessageCircle, text: "Especialista pessoal no WhatsApp — 48h" },
      { icon: Headphones, text: "Relatório de ganhos toda manhã" },
    ],
    price: 97, installments: "12x de R$ 8,08",
    border: "1px solid rgba(250,204,21,0.25)",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)", btnColor: "#020617", btnBorder: "none",
    btnText: "ATIVAR MÁXIMO",
    badge: null,
    checkoutUrl: "https://pay.hub.la/dYNMVeaVxs3bS32Ioffo/upsell",
  },
];

// Links de checkout da variação CARA (ordem Essencial/Avançado/MAX).
const V147_LINKS = {
  essencial: "https://pay.hub.la/VWl1fjDbG6ONhlKunD4S/upsell",
  avancado:  "https://pay.hub.la/pYcsABZulGE2viELYvDK/upsell",
  max:       "https://pay.hub.la/Bc5NPZjzZbV2vHTAXEkv/upsell",
};

// Tiers da oferta CARA (só quem veio pela oferta R$147). Copy nova de alta conversão.
const V147_TIERS = [
  {
    id: "basico", key: "essencial", tag: "PRO Essencial", price: 197, installments: "12x de R$ 19,90",
    perDay: "até R$310", perDayLabel: "por dia", first: "72 horas", saque: "72h",
    checkoutUrl: V147_LINKS.essencial,
    headline: "Até R$310 por dia · primeiro saque em 72h",
    body: "Pra o Guardião operar mais ativo já nessa primeira semana. Mais microoperações que o padrão. Otimizado pra Forex.",
    bullets: [
      "Sem acelerar: R$25/dia e 7 dias de espera.",
      "Com Essencial: até R$310/dia, resultado em 72h, saque em 3 dias.",
    ],
    cta: "ATIVAR R$310/DIA · SAQUE EM 72H",
    accent: "#22C55E",
    btnBg: "transparent", btnColor: "#22C55E", btnBorder: "1.5px solid #22C55E",
    badge: null, recommended: false,
  },
  {
    id: "duplo", key: "avancado", tag: "PRO Avançado", price: 297, installments: "12x de R$ 29,70",
    perDay: "até R$700", perDayLabel: "por dia", first: "24 horas", saque: "Amanhã",
    checkoutUrl: V147_LINKS.avancado,
    headline: "Até R$700 por dia · primeiro saque amanhã",
    body: "Tudo do Essencial. O Guardião passa a trabalhar enquanto você dorme, no fim de semana, feriado — quando o Forex fecha, a cripto 24/7 continua.",
    bullets: [
      "Análise de notícia em tempo real (o modo padrão ignora).",
      "Grupo VIP no WhatsApp.",
      "Até R$700/dia · resultado em 24h · saque amanhã. Sem aumentar o risco.",
    ],
    cta: "ATIVAR R$700/DIA · SAQUE EM 24H",
    accent: "#22C55E",
    btnBg: "linear-gradient(135deg, #16A34A, #15803D)", btnColor: "#fff", btnBorder: "none",
    badge: "★ MELHOR ESCOLHA", recommended: true,
  },
  {
    id: "maximo", key: "max", tag: "PRO MAX", price: 347, installments: "12x de R$ 34,70",
    perDay: "~R$1.200", perDayLabel: "por dia", first: "12 horas", saque: "Hoje",
    checkoutUrl: V147_LINKS.max,
    headline: "~R$1.200 por dia · primeiro saque hoje",
    body: "Tudo do Avançado. O time configura o Guardião no turbo no seu primeiro dia. Você não mexe em nada.",
    bullets: [
      "Forex + cripto + índices ao mesmo tempo",
      "LIVE OURO · amanhã, 20h — fechada pra quem ativar o MAX hoje",
      "Consultoria 1 a 1 de 30 min",
      "Suporte 24h (minutos, não dias)",
      "+ US$ 100 na corretora (além dos US$ 100 do acesso)",
      "Versões novas do Guardião antes de todo mundo",
      "Relatório de ganhos toda manhã",
    ],
    cta: "ATIVAR MAX · R$1.200/DIA · SAQUE HOJE",
    accent: "#FACC15",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)", btnColor: "#020617", btnBorder: "none",
    badge: "só R$50 a mais", recommended: false,
  },
];

// Linhas da tabela comparativa (acima da dobra).
const TABLE_ROWS: { label: string; icon: any; vals: [string, string, string, string]; }[] = [
  { label: "Potencial por dia", icon: TrendingUp, vals: ["R$25", "até R$310", "até R$700", "~R$1.200"] },
  { label: "Primeiro resultado", icon: Clock, vals: ["7 dias", "72 horas", "24 horas", "12 horas"] },
  { label: "Primeiro saque", icon: CalendarClock, vals: ["Fila", "72h", "Amanhã", "Hoje"] },
  { label: "Quando opera", icon: Gauge, vals: ["Padrão", "+ ativo", "24h + FDS", "24h · 3 merc"] },
  { label: "Quem configura", icon: Users, vals: ["Você", "Você", "Você", "O time"] },
  { label: "Risco", icon: Shield, vals: ["—", "Sem aumentar", "Sem aumentar", "Sem aumentar"] },
  { label: "Paga uma vez", icon: Check, vals: ["—", "R$197", "R$297", "R$347"] },
];
const TABLE_COLS = ["Hoje", "Essencial", "Avançado", "MAX"];

const UpsellStep3 = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState<string | null>(null);
  const [showGuar, setShowGuar] = useState(false);

  // Variação cara (197/297/347) quando: ?oferta=147 na URL (link dedicado p/ redirect
  // da Hubla) OU offer_exp='v147' travado no navegador (veio pela oferta R$147 no quiz).
  const isV147 = (() => {
    try {
      const u = new URLSearchParams(window.location.search);
      const forced = u.get("oferta") === "147" || u.get("offer") === "v147";
      if (forced) { try { localStorage.setItem("offer_exp", "v147"); } catch { /* ignore */ } return true; }
      return localStorage.getItem("offer_exp") === "v147";
    } catch { return false; }
  })();

  const openCheckout = (id: string, price: number, url: string) => {
    setLoading(id);
    saveUpsellChoice({ accelerator: id, guide: false, price });
    const utmQs = buildTrackingQueryString();
    const separator = url.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${url}${separator}${utmQs.slice(1)}` : url;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(null), 3000);
  };

  const handleClick = (plan: typeof plans[0]) => openCheckout(plan.id, plan.price, plan.checkoutUrl);

  // ─────────────────────────────────────────────────────────────────────────
  // VARIAÇÃO CARA (v147) — layout premium com tabela + cards + fecho.
  // ─────────────────────────────────────────────────────────────────────────
  if (isV147) {
    return (
      <div className="flex flex-col gap-5 pt-3">
        {/* Headline */}
        <div className="text-center">
          <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
            {firstName ? `${firstName}, qual` : "Qual"} velocidade você quer?
          </h1>
          <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
            Cada modo faz o Guardião trabalhar mais por você. <b style={{ color: "#E2E8F0" }}>Sem aumentar o risco.</b>
          </p>
          <div className="mt-3 flex flex-col gap-1.5 text-left mx-auto max-w-[340px]">
            <p className="text-[12.5px] leading-snug" style={{ color: "#94A3B8" }}>
              <b style={{ color: "#64748B" }}>Sem acelerar:</b> R$25 por dia, primeiro real em 7 dias, saque na fila.
            </p>
            <p className="text-[12.5px] leading-snug" style={{ color: "#CBD5E1" }}>
              <b style={{ color: "#22C55E" }}>Com acelerador:</b> o limite sobe, o primeiro saque antecipa. Você não opera. Ele opera.
            </p>
          </div>
          <p className="text-[11px] mt-2.5" style={{ color: "#64748B" }}>
            Pagamento único · Garantia 30 dias · Sem mensalidade
          </p>
        </div>

        {/* TABELA COMPARATIVA (acima da dobra) */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0B1220", border: "1px solid rgba(255,255,255,0.06)" }}>
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "29%" }} /><col style={{ width: "15%" }} />
              <col style={{ width: "18%" }} /><col style={{ width: "19%" }} /><col style={{ width: "19%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-left px-1.5 py-2" style={{ background: "#0B1220" }}></th>
                {TABLE_COLS.map((c, i) => {
                  const rec = i === 2, max = i === 3, free = i === 0;
                  return (
                    <th key={c} className="px-0.5 py-2 text-center align-bottom"
                      style={{ background: rec ? "rgba(34,197,94,0.10)" : max ? "rgba(250,204,21,0.08)" : "transparent" }}>
                      {rec && <div className="text-[7px] font-bold mb-0.5 leading-none" style={{ color: "#22C55E" }}>★ MELHOR</div>}
                      {max && <div className="text-[7px] font-bold mb-0.5 leading-none" style={{ color: "#FACC15" }}>TETO</div>}
                      <span className="text-[11px] font-extrabold" style={{ color: free ? "#475569" : rec ? "#22C55E" : max ? "#FACC15" : "#E2E8F0" }}>{c}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, ri) => (
                <tr key={row.label} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td className="px-1.5 py-1.5" style={{ background: "#0B1220" }}>
                    <div className="flex items-center gap-1">
                      <row.icon className="w-3 h-3 shrink-0" style={{ color: "#475569" }} />
                      <span className="text-[9.5px] font-medium leading-tight" style={{ color: "#94A3B8" }}>{row.label}</span>
                    </div>
                  </td>
                  {row.vals.map((v, ci) => {
                    const rec = ci === 2, max = ci === 3, free = ci === 0;
                    const strong = ri === 0;
                    return (
                      <td key={ci} className="px-0.5 py-1.5 text-center"
                        style={{ background: rec ? "rgba(34,197,94,0.07)" : max ? "rgba(250,204,21,0.05)" : "transparent" }}>
                        <span style={{ color: free ? "#475569" : strong ? (rec ? "#22C55E" : max ? "#FACC15" : "#F8FAFC") : (rec ? "#86EFAC" : max ? "#FDE68A" : "#CBD5E1"),
                                   fontWeight: strong ? 800 : 700, fontSize: strong ? 12 : 9.5, lineHeight: 1.15, display: "inline-block" }}>
                          {v}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Uma linha */}
        <p className="text-[13px] text-center leading-relaxed px-2" style={{ color: "#CBD5E1" }}>
          De <b style={{ color: "#475569" }}>vinte e cinco</b> por dia pra <b style={{ color: "#86EFAC" }}>trezentos</b>, <b style={{ color: "#86EFAC" }}>setecentos</b> ou <b style={{ color: "#FDE68A" }}>mil e duzentos</b>. A diferença é a velocidade. <b style={{ color: "#F8FAFC" }}>O risco não sobe.</b>
        </p>

        {/* 4 linhas entre tabela e cards */}
        <div className="rounded-xl p-3.5 flex flex-col gap-2" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(34,197,94,0.15)" }}>
          {[
            "Quanto maior a velocidade, maior o potencial por dia.",
            "O risco não sobe. Quem sobe é o Guardião.",
            "Você não opera. No MAX, o time liga tudo no 1º dia.",
            "Um pagamento. 30 dias. Se não for a tua, volta.",
          ].map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-[1px]" style={{ color: "#22C55E" }} />
              <span className="text-[12.5px] leading-snug" style={{ color: "#E2E8F0" }}>{l}</span>
            </div>
          ))}
        </div>

        {/* CARDS */}
        {V147_TIERS.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-2xl p-5"
            style={{
              background: t.recommended ? "linear-gradient(180deg, rgba(22,163,74,0.08), #0F172A)" : "#0F172A",
              border: t.recommended ? "2px solid #22C55E" : t.accent === "#FACC15" ? "1.5px solid rgba(250,204,21,0.35)" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: t.recommended ? "0 8px 30px rgba(22,163,74,0.15)" : "none",
            }}
          >
            {t.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap"
                style={{
                  background: t.recommended ? "linear-gradient(135deg, #16A34A, #15803D)" : "linear-gradient(135deg, #FACC15, #EAB308)",
                  color: t.recommended ? "#fff" : "#020617",
                  boxShadow: t.recommended ? "0 2px 10px rgba(22,163,74,0.4)" : "0 2px 10px rgba(250,204,21,0.35)",
                }}>
                {t.badge}
              </span>
            )}

            <div className="flex items-center gap-2">
              {t.accent === "#FACC15" ? <Crown className="w-5 h-5" style={{ color: "#FACC15" }} /> : <Zap className="w-5 h-5" style={{ color: "#22C55E" }} />}
              <h3 className="text-[18px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.tag}</h3>
            </div>

            {/* Potencial em destaque */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[30px] font-extrabold leading-none" style={{ color: t.accent }}>{t.perDay}</span>
              <span className="text-[13px]" style={{ color: "#94A3B8" }}>{t.perDayLabel}</span>
            </div>
            <p className="text-[12.5px] font-semibold mt-1" style={{ color: t.accent }}>{t.headline}</p>

            <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{t.body}</p>

            <ul className="mt-3 flex flex-col gap-2">
              {t.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 shrink-0 mt-[2px]" style={{ color: t.accent }} />
                  <span className="text-[12.5px] leading-snug" style={{ color: "#E2E8F0" }}>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-baseline gap-2 flex-wrap">
              <span className="text-[26px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {t.price}</span>
              <span className="text-[12px]" style={{ color: "#64748B" }}>ou {t.installments}</span>
            </div>
            {t.accent === "#FACC15" && (
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#FDE68A" }}>só R$50 a mais que o Avançado</p>
            )}
            <p className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: "#64748B" }}>
              <Shield className="w-3.5 h-3.5" style={{ color: "#22C55E" }} /> Garantia 30 dias incondicional
            </p>

            <button
              onClick={() => openCheckout(t.id, t.price, t.checkoutUrl)}
              disabled={loading === t.id}
              className="w-full mt-4 py-[15px] rounded-xl font-bold text-[14px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 leading-tight"
              style={{ background: t.btnBg, color: t.btnColor, border: t.btnBorder }}
            >
              {loading === t.id ? "Abrindo checkout..." : t.cta}
            </button>
          </motion.div>
        ))}

        {/* FECHO */}
        <div className="rounded-xl p-4 text-center" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "#E2E8F0" }}>
            A maioria ativa o <b style={{ color: "#22C55E" }}>Avançado</b>: até R$700/dia, saque amanhã.
          </p>
          <p className="text-[13.5px] leading-relaxed mt-1.5" style={{ color: "#CBD5E1" }}>
            Quem quer o teto e o time no primeiro dia paga <b style={{ color: "#FACC15" }}>R$50 a mais</b> e vai no MAX.
          </p>
        </div>

        {/* Garantia (toggle) */}
        <button onClick={() => setShowGuar(v => !v)} className="text-[13px] underline cursor-pointer bg-transparent border-none mx-auto py-1" style={{ color: "#94A3B8" }}>
          Quero saber da garantia primeiro
        </button>
        {showGuar && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl p-4 -mt-2" style={{ background: "#0F172A", border: "1px solid rgba(34,197,94,0.25)" }}>
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 shrink-0" style={{ color: "#22C55E" }} />
              <div>
                <p className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>Garantia de 30 dias incondicional</p>
                <p className="text-[12.5px] leading-relaxed mt-1" style={{ color: "#94A3B8" }}>
                  Ativa hoje e testa por 30 dias. Se não for pra você, devolvemos <b style={{ color: "#22C55E" }}>100%</b> — sem pergunta, sem burocracia. O risco é todo nosso, não seu.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <button onClick={onDecline} className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2" style={{ color: "#475569" }}>
          Não, prefiro continuar no ritmo padrão (R$25/dia, 7 dias).
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VARIAÇÃO NORMAL (37/67/97) — layout original.
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="flex flex-col gap-5 pt-4">
      <div className="text-center">
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, como` : "Como"} você quer começar?
        </h1>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
          Cada plano acelera seus primeiros resultados e protege seu capital. Escolha o que faz sentido pra sua realidade agora.
        </p>
      </div>

      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
          className="relative rounded-2xl p-5"
          style={{ background: "#0F172A", border: plan.border }}
        >
          {plan.badge && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full text-white whitespace-nowrap" style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
              {plan.badge}
            </span>
          )}

          <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>{plan.name}</h3>
          <p className="text-[13px] font-medium mt-1" style={{ color: plan.subtitleColor }}>{plan.subtitle}</p>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{plan.description}</p>

          <ul className="mt-3 flex flex-col gap-2">
            {plan.features.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5">
                <f.icon className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {plan.price}</span>
            <span className="text-[12px]" style={{ color: "#64748B" }}>ou {plan.installments}</span>
          </div>

          <button
            onClick={() => handleClick(plan)}
            disabled={loading === plan.id}
            className="w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            style={{ background: plan.btnBg, color: plan.btnColor, border: plan.btnBorder }}
          >
            {loading === plan.id ? "Abrindo checkout..." : plan.btnText}
          </button>
        </motion.div>
      ))}

      {/* Social proof */}
      <div className="rounded-xl p-4" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <p className="text-[14px] font-bold mb-3" style={{ color: "#E2E8F0" }}>
          Quem ativou o acelerador:
        </p>
        {[
          { img: avatarAntonio, name: "Antônio, 57", text: "Ativei o Duplo e no dia seguinte caiu R$43 na conta. Se tivesse esperado os 7 dias, já tinha desistido." },
          { img: avatarMaria, name: "Dona Márcia, 52", text: "O especialista me ajudou a configurar tudo em 10 minutos. Primeira vez que me senti segura com algo na internet." },
        ].map((t) => (
          <div key={t.name} className="flex items-start gap-3 mt-3">
            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(22,163,74,0.3)" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>{t.name}</p>
              <p className="text-[12px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>"{t.text}"</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onDecline} className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2" style={{ color: "#475569" }}>
        Não, prefiro esperar os 7 dias com a configuração padrão.
      </button>
    </div>
    </>
  );
};

export default UpsellStep3;
