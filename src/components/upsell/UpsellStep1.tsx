import { motion } from "framer-motion";
import { Check, AlertTriangle, ShieldCheck, Clock, Zap, Turtle, ArrowDown, Lock } from "lucide-react";

interface Props { name: string; onNext: () => void; }

function detectV147(): boolean {
  try {
    const u = new URLSearchParams(window.location.search);
    if (u.get("oferta") === "147" || u.get("offer") === "v147") { try { localStorage.setItem("offer_exp", "v147"); } catch { /* ignore */ } return true; }
    return localStorage.getItem("offer_exp") === "v147";
  } catch { return false; }
}

// Marca "Guardião" com o esclarecedor discreto entre parênteses.
const Guardiao = () => (
  <>Guardião <span style={{ color: "#64748B", fontWeight: 400 }}>(Plataforma de tempo livre)</span></>
);

const UpsellStep1 = ({ name, onNext }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const isV147 = detectV147();

  // Cabeçalho compartilhado (check + confirmação).
  const Header = (
    <>
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.2 }}
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.2), rgba(34,197,94,0.1))", border: "2px solid rgba(22,163,74,0.3)" }}
      >
        <Check className="w-9 h-9" style={{ color: "#22C55E" }} strokeWidth={3} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-sm font-semibold tracking-wide" style={{ color: "#22C55E" }}
      >
        ✓ Pagamento confirmado com sucesso
      </motion.p>
      <h1 className="text-[26px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
        {firstName ? `${firstName}, você está dentro.` : "Você está dentro."}
      </h1>
    </>
  );

  // ───────────────────────────────────────────────────────────────────────
  // VARIAÇÃO CARA (v147) — copy nova com contraste Padrão vs Acelerado.
  // ───────────────────────────────────────────────────────────────────────
  if (isV147) {
    return (
      <div className="flex flex-col items-center gap-5 pt-6">
        {Header}

        <p className="text-[15px] text-center leading-relaxed" style={{ color: "#CBD5E1" }}>
          O <Guardiao /> já está sendo ligado na sua conta agora. Antes de liberar tudo, tem <b style={{ color: "#F8FAFC" }}>uma coisa que define quando o primeiro real cai</b> — e quanto por dia ele pode fazer.
        </p>

        {/* AVISO */}
        <div className="w-full rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(30,41,59,0.85), rgba(30,41,59,0.6))", borderLeft: "3px solid #FACC15" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#FACC15" }} />
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-bold" style={{ color: "#FACC15" }}>Aviso</p>
              <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                No modo padrão, o <Guardiao /> opera devagar <b style={{ color: "#F8FAFC" }}>de propósito</b>. Protege o capital. É seguro.
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                O problema: leva <b style={{ color: "#F8FAFC" }}>7 dias</b> pra calibrar e gerar o primeiro resultado. Limite: <b style={{ color: "#F8FAFC" }}>R$25 por dia</b>. Saque na fila.
              </p>
              {/* Stat 73% em destaque */}
              <div className="rounded-lg px-3 py-2 mt-0.5 flex items-center gap-2.5" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
                <span className="text-[24px] font-extrabold leading-none" style={{ color: "#F87171" }}>73%</span>
                <span className="text-[12px] leading-tight" style={{ color: "#FCA5A5" }}>dos novos membros <b>desistem</b> nesses 7 dias, antes de ver o primeiro centavo.</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                Quem fica só no padrão ganha pouco, ganha lento, e larga. <b style={{ color: "#F8FAFC" }}>Não é falta de sistema. É velocidade.</b>
              </p>
            </div>
          </div>
        </div>

        {/* A CHANCE */}
        <div className="w-full rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(34,197,94,0.18)" }}>
          <p className="text-[14px] leading-relaxed" style={{ color: "#E2E8F0" }}>
            {firstName ? `${firstName}, você ` : "Você "}não pagou esse acesso pra ficar <b style={{ color: "#F8FAFC" }}>7 dias no zero</b>.
          </p>
          <p className="text-[14px] leading-relaxed mt-2" style={{ color: "#CBD5E1" }}>
            Dá pra fazer o <Guardiao /> trabalhar mais desde o primeiro dia — sem tirar a mão da proteção. <b style={{ color: "#22C55E" }}>O risco não sobe. Sobe o limite e o saque.</b>
          </p>
        </div>

        {/* COMPARATIVO Padrão vs Acelerado */}
        <div className="w-full grid grid-cols-2 gap-2.5 items-stretch">
          {/* Padrão */}
          <div className="rounded-xl p-3.5 flex flex-col" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Turtle className="w-4 h-4" style={{ color: "#64748B" }} />
              <span className="text-[12px] font-bold" style={{ color: "#64748B" }}>Padrão</span>
            </div>
            <span className="text-[22px] font-extrabold leading-none" style={{ color: "#64748B" }}>R$25<span className="text-[12px] font-medium">/dia</span></span>
            <div className="mt-2.5 flex flex-col gap-1.5 text-[11.5px]" style={{ color: "#64748B" }}>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 7 dias pro 1º real</span>
              <span className="flex items-center gap-1.5"><ArrowDown className="w-3.5 h-3.5" /> saque na fila</span>
            </div>
          </div>

          {/* Acelerado */}
          <div className="relative rounded-xl p-3.5 flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(22,163,74,0.14), rgba(250,204,21,0.06))", border: "1.5px solid #22C55E", boxShadow: "0 6px 22px rgba(22,163,74,0.18)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4" style={{ color: "#22C55E" }} />
              <span className="text-[12px] font-bold" style={{ color: "#22C55E" }}>Acelerado</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-extrabold leading-none" style={{ color: "#F8FAFC" }}>até R$1.200</span>
            </div>
            <span className="text-[11px] mt-0.5" style={{ color: "#86EFAC" }}>R$310 · R$700 · R$1.200 /dia</span>
            <div className="mt-2.5 flex flex-col gap-1.5 text-[11.5px]" style={{ color: "#E2E8F0" }}>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" style={{ color: "#22C55E" }} /> 72h · 24h · 12h</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" style={{ color: "#FACC15" }} /> saque cedo</span>
            </div>
            <div className="mt-2.5 rounded-md px-2 py-1 flex items-center gap-1.5" style={{ background: "rgba(34,197,94,0.12)" }}>
              <Lock className="w-3 h-3" style={{ color: "#22C55E" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#86EFAC" }}>risco não sobe</span>
            </div>
          </div>
        </div>

        {/* Reforço */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          {["Um pagamento", "Garantia 30 dias", "Leva 30 segundos", "Sem compromisso"].map((t, i) => (
            <span key={t} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "#94A3B8" }}>
              {i === 1 ? <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#22C55E" }} /> : <Check className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />}
              {t}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onNext}
          className="w-full py-[18px] px-6 rounded-xl text-[16px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] leading-tight"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.3), 0 4px 12px rgba(0,0,0,0.3)", animation: "pulse-btn 2.5s ease-in-out infinite" }}
        >
          ENTENDI — QUAL MODO VOCÊS RECOMENDAM?
        </button>
        <p className="text-[12px] -mt-1" style={{ color: "#475569" }}>
          Sem compromisso. Você decide.
        </p>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // VARIAÇÃO NORMAL — layout original.
  // ───────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 pt-6">
      {Header}

      <p className="text-[15px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
        Seu acesso está sendo configurado agora mesmo.{" "}
        {firstName ? `Mas ${firstName}, ` : "Mas "}antes de liberar tudo, preciso te mostrar algo que vai definir a velocidade dos seus primeiros resultados.
      </p>

      {/* Warning card */}
      <div className="w-full rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(30,41,59,0.6))", borderLeft: "3px solid #FACC15" }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#FACC15" }} />
          <div>
            <p className="text-[13px] font-bold mb-1" style={{ color: "#FACC15" }}>Aviso Importante</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
              Na configuração padrão, a plataforma leva <strong style={{ color: "#F8FAFC" }}>em média 7 dias</strong> para calibrar e gerar os primeiros resultados. Durante essa espera, <strong style={{ color: "#F8FAFC" }}>73% dos novos membros desistem</strong> antes de ver o primeiro centavo.
            </p>
          </div>
        </div>
      </div>

      {/* Personal touch */}
      <div className="w-full rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          {firstName
            ? `${firstName}, eu sei que você não investiu nesse acesso pra ficar 7 dias olhando pra tela esperando alguma coisa acontecer. Ninguém quer essa sensação. Por isso, quero te dar a chance de pular essa etapa agora.`
            : "Você não investiu nesse acesso pra ficar 7 dias esperando. Ninguém quer isso. Por isso, quero te dar a chance de pular essa etapa agora."}
        </p>
      </div>

      {/* Trust indicators */}
      <div className="flex items-center gap-4 w-full justify-center">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" style={{ color: "#64748B" }} />
          <span className="text-[11px]" style={{ color: "#64748B" }}>Garantia 30 dias</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" style={{ color: "#64748B" }} />
          <span className="text-[11px]" style={{ color: "#64748B" }}>Leva 30 segundos</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full py-[18px] px-8 rounded-xl text-[17px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.3), 0 4px 12px rgba(0,0,0,0.3)", animation: "pulse-btn 2.5s ease-in-out infinite" }}
      >
        ENTENDI — O QUE VOCÊS RECOMENDAM?
      </button>

      <p className="text-[12px]" style={{ color: "#475569" }}>
        Sem compromisso. Você decide se faz sentido.
      </p>
    </div>
  );
};

export default UpsellStep1;
