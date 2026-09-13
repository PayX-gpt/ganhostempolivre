import { useState, useEffect, useRef, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle } from "./QuizUI";
import { useLanguage, type Language } from "@/lib/i18n";
import {
  Play, Power, Bot, TrendingUp, Banknote, Bell,
  Lock, Loader2, Target, Clock, Trophy, Sparkles,
  ArrowRight, Wallet, Eye, MousePointer, Users, Zap,
} from "lucide-react";

/**
 * QUIZ B — Demo do Guardião no formato VALIDADO do Quiz A (plataforma gamificada:
 * clica → operações rápidas entrando/saindo, saldo subindo, notificações, meta batida).
 * Só re-tematizado: "Robô" → "Guardião", mercados de câmbio/Forex (Ouro, Prata, pares),
 * e um toque de copy trade ("N pessoas copiando agora / pegaram esta operação").
 * O Quiz A segue usando StepPlatformDemo.tsx (intocado). Tudo client-side, sem rede.
 */

interface Props { onNext: () => void; userName?: string; }

const plat = {
  bg: "bg-[hsl(260,30%,8%)]", card: "bg-[hsl(260,25%,12%)]", border: "border-[hsl(270,30%,22%)]",
  accent: "text-[hsl(280,70%,65%)]", tabActive: "bg-[hsl(220,70%,45%)]", tabBorder: "border-[hsl(220,70%,45%)]",
  headerBg: "bg-[hsl(260,28%,10%)]", secondary: "bg-[hsl(260,22%,15%)]",
  green: "text-[hsl(152,60%,42%)]", red: "text-[hsl(0,72%,55%)]",
};

// Só câmbio/Forex + metais (ouro, prata) — nada de cripto, pra ficar no mecanismo real.
const pares = ["XAU/USD","XAG/USD","EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD","USD/CHF","EUR/GBP","GBP/JPY","NZD/USD","EUR/JPY"];
const precos = ["2,385.40","29.87","1.08432","1.26781","149.320","0.65123","1.36540","0.87654","0.85612","188.410","0.61234","162.240"];
const tipDelays = [1200, 3500, 6000, 9000, 12000];
const TIP_ICONS = [Eye, Zap, TrendingUp, Users, MousePointer];

const TX = {
  pt: {
    goalSym: "R$",
    titleA: (n: string) => (n ? `${n}, essa` : "Essa"), titleMid: " é a plataforma do ", titleBold: "Guardião", titleEnd: " — operando no câmbio",
    subIdle: "Basta apertar em Iniciar Guardião, que ele começa a operar no câmbio (Forex) e gerar lucros pra você automático.",
    subDone: "Viu como é simples? Agora imagine isso caindo na sua conta todos os dias.",
    subActive: "O Guardião está operando no câmbio em tempo real. As mesmas entradas caem pra todo mundo — inclusive pra você.",
    fastBannerA: "⚡ Em segundos: veja o Guardião bater a ", fastBannerBold: "meta que VOCÊ escolher", fastBannerC: " — na sua frente.",
    platform: "GUARDIÃO", platformSuf: "CÂMBIO • FOREX", demoAccount: "Conta Demo", balance: "Saldo", pl: "Lucro/Prejuízo",
    marketsLine: "Operando: Ouro • Prata • EUR/USD • GBP/USD • USD/JPY",
    copyingNow: "copiando agora",
    botStopped: "Guardião parado", botRunning: "Guardião operando", goalReached: "META BATIDA!", metaLbl: "Meta:",
    startBot: "Iniciar Guardião", selectBot: "Selecionar mercado", tabTable: "Tabela", tabChart: "Gráfico", history: "Histórico", noOps: "Nenhuma operação ainda",
    thHora: "Hora", thPar: "Par", thPreco: "Preço", thLucro: "Lucro",
    trustBold: "100% automático", trustA: "O Guardião opera ", trustC: ". Você só ativa sua Chave de Acesso e acompanha no celular.",
    estTimeLbl: "Tempo estimado", estTimeA: "Aguarde cerca de ", estTimeBold: "1 minuto", estTimeC: ". O Guardião está operando sozinho — você não precisa fazer nada.",
    continueFast: "Já entendi — continuar →", continueSkip: "Continuar sem testar →",
    step: "Passo", of: "de",
    coach1: 'Toque no botão verde "Iniciar Guardião" para ativar a inteligência artificial.',
    coach2: "Digite quanto quer ganhar por dia. Pode ser qualquer valor acima de R$10.",
    coach3a: "Agora escolha quanto tempo você tem disponível.", coach3b: 'Tudo pronto! Toque em "Iniciar Guardião" abaixo.',
    tips: [
      "O Guardião identificou uma oportunidade no câmbio e entrou sozinho. Você não fez nada!",
      "O Guardião entra e sai na hora certa. Na conta real, o lucro já estaria disponível para saque.",
      "Olha o saldo subindo! As mesmas entradas caem pra todo mundo ao mesmo tempo.",
      "Milhares de pessoas estão copiando estas mesmas operações agora, em tempo real.",
      "Perceba: zero cliques. O Guardião opera o câmbio sozinho o dia inteiro.",
    ],
    gpTitle: (n: string) => (n ? `${n}, configure sua meta` : "Configure sua meta"), gpSub: "O Guardião vai operar no câmbio até bater automaticamente",
    gpGoalLbl: "Meta de ganho", gpGoalPh: "Ex: R$ 500", gpMin: "Mínimo R$10", gpTimeLbl: "Tempo disponível",
    gpTimes: [{ label: "30 minutos", value: "30min" }, { label: "1 hora", value: "1h" }, { label: "2 horas", value: "2h" }, { label: "Tempo livre", value: "livre" }],
    gpStart: "INICIAR GUARDIÃO",
    grTitle: "META BATIDA!", grSubA: (n: string) => (n ? `${n}, o Guardião bateu sua meta de ` : "O Guardião bateu sua meta de "), grSubC: " em apenas 1 minuto.",
    grIfReal: "Se estivesse na conta real, você teria ganho:", grWithdraw: "E poderia sacar agora mesmo",
    grDemoBold: "Isso foi só uma demonstração.", grDemoA: " Na conta real, o dinheiro cai direto na sua conta. Nossos alunos fazem isso ", grDemoBold2: "todos os dias", grDemoC: ".",
    grWithRealTitle: "Com acesso real, você teria:", grItems: ["Saques ilimitados para qualquer banco", "Guardião operando 24h no câmbio", "Suporte exclusivo no WhatsApp", "As mesmas entradas caindo pra você"],
    grCta: "QUERO A CONTA REAL AGORA", grWaiting: "Enquanto você espera, outros já estão lucrando.",
    notifDone: "Operação concluída", notifWin: (amt: string, par: string, c: string) => `+R$${amt} em ${par} · ${c} copiaram`,
    anWaiting: "Aguardando próxima operação...", anAnalyzing: "Analisando o câmbio...",
  },
  en: {
    goalSym: "$",
    titleA: (n: string) => (n ? `${n}, this` : "This"), titleMid: " is the ", titleBold: "Guardian", titleEnd: " platform — trading currencies",
    subIdle: "Just tap Start Guardian and it begins trading currencies (Forex) and generating profit for you automatically.",
    subDone: "See how simple it is? Now picture this landing in your account every day.",
    subActive: "The Guardian is trading currencies in real time. The same entries hit everyone — including you.",
    fastBannerA: "⚡ In seconds: watch the Guardian hit the ", fastBannerBold: "goal YOU choose", fastBannerC: " — right in front of you.",
    platform: "GUARDIAN", platformSuf: "CURRENCIES • FOREX", demoAccount: "Demo Account", balance: "Balance", pl: "Profit/Loss",
    marketsLine: "Trading: Gold • Silver • EUR/USD • GBP/USD • USD/JPY",
    copyingNow: "copying now",
    botStopped: "Guardian stopped", botRunning: "Guardian trading", goalReached: "GOAL REACHED!", metaLbl: "Goal:",
    startBot: "Start Guardian", selectBot: "Select market", tabTable: "Table", tabChart: "Chart", history: "History", noOps: "No trades yet",
    thHora: "Time", thPar: "Pair", thPreco: "Price", thLucro: "Profit",
    trustBold: "100% automatic", trustA: "The Guardian trades ", trustC: ". You just activate your Access Key and watch on your phone.",
    estTimeLbl: "Estimated time", estTimeA: "Wait about ", estTimeBold: "1 minute", estTimeC: ". The Guardian is trading on its own — you don't have to do a thing.",
    continueFast: "Got it — continue →", continueSkip: "Continue without testing →",
    step: "Step", of: "of",
    coach1: 'Tap the green "Start Guardian" button to activate the AI.',
    coach2: "Type how much you want to earn per day. Any amount above $10.",
    coach3a: "Now choose how much time you have available.", coach3b: 'All set! Tap "Start Guardian" below.',
    tips: [
      "The Guardian spotted an opportunity in the currency market and entered on its own. You did nothing!",
      "The Guardian enters and exits at the right moment. On a real account, the profit would already be available to withdraw.",
      "Watch the balance climb! The same entries hit everyone at the same time.",
      "Thousands of people are copying these exact trades right now, in real time.",
      "Notice: zero clicks. The Guardian trades currencies on its own, all day.",
    ],
    gpTitle: (n: string) => (n ? `${n}, set your goal` : "Set your goal"), gpSub: "The Guardian will trade currencies until it hits it automatically",
    gpGoalLbl: "Earnings goal", gpGoalPh: "e.g. $100", gpMin: "Minimum $10", gpTimeLbl: "Time available",
    gpTimes: [{ label: "30 minutes", value: "30min" }, { label: "1 hour", value: "1h" }, { label: "2 hours", value: "2h" }, { label: "Free time", value: "livre" }],
    gpStart: "START GUARDIAN",
    grTitle: "GOAL REACHED!", grSubA: (n: string) => (n ? `${n}, the Guardian hit your goal of ` : "The Guardian hit your goal of "), grSubC: " in just 1 minute.",
    grIfReal: "On a real account, you would have earned:", grWithdraw: "And you could withdraw right now",
    grDemoBold: "This was just a demo.", grDemoA: " On a real account, the money goes straight to your account. Our members do this ", grDemoBold2: "every day", grDemoC: ".",
    grWithRealTitle: "With real access, you'd have:", grItems: ["Unlimited withdrawals to any bank", "Guardian trading currencies 24/7", "Exclusive WhatsApp support", "The same entries landing for you"],
    grCta: "I WANT THE REAL ACCOUNT NOW", grWaiting: "While you wait, others are already profiting.",
    notifDone: "Trade complete", notifWin: (amt: string, par: string, c: string) => `+$${amt} on ${par} · ${c} copied`,
    anWaiting: "Waiting for the next trade...", anAnalyzing: "Analyzing the currency market...",
  },
  es: {
    goalSym: "$",
    titleA: (n: string) => (n ? `${n}, esta` : "Esta"), titleMid: " es la plataforma del ", titleBold: "Guardián", titleEnd: " — operando divisas",
    subIdle: "Solo aprieta Iniciar Guardián y empieza a operar en el mercado de cambios (Forex) y generar ganancias para ti automáticamente.",
    subDone: "¿Viste qué simple es? Ahora imagina esto cayendo en tu cuenta todos los días.",
    subActive: "El Guardián está operando divisas en tiempo real. Las mismas entradas les llegan a todos — incluido tú.",
    fastBannerA: "⚡ En segundos: mira al Guardián alcanzar la ", fastBannerBold: "meta que TÚ elijas", fastBannerC: " — frente a ti.",
    platform: "GUARDIÁN", platformSuf: "DIVISAS • FOREX", demoAccount: "Cuenta Demo", balance: "Saldo", pl: "Ganancia/Pérdida",
    marketsLine: "Operando: Oro • Plata • EUR/USD • GBP/USD • USD/JPY",
    copyingNow: "copiando ahora",
    botStopped: "Guardián detenido", botRunning: "Guardián operando", goalReached: "¡META ALCANZADA!", metaLbl: "Meta:",
    startBot: "Iniciar Guardián", selectBot: "Seleccionar mercado", tabTable: "Tabla", tabChart: "Gráfico", history: "Historial", noOps: "Aún no hay operaciones",
    thHora: "Hora", thPar: "Par", thPreco: "Precio", thLucro: "Ganancia",
    trustBold: "100% automático", trustA: "El Guardián opera ", trustC: ". Solo activas tu Llave de Acceso y acompañas desde el celular.",
    estTimeLbl: "Tiempo estimado", estTimeA: "Espera cerca de ", estTimeBold: "1 minuto", estTimeC: ". El Guardián está operando solo — no tienes que hacer nada.",
    continueFast: "Ya entendí — continuar →", continueSkip: "Continuar sin probar →",
    step: "Paso", of: "de",
    coach1: 'Toca el botón verde "Iniciar Guardián" para activar la inteligencia artificial.',
    coach2: "Escribe cuánto quieres ganar por día. Cualquier monto arriba de $10.",
    coach3a: "Ahora elige cuánto tiempo tienes disponible.", coach3b: '¡Todo listo! Toca "Iniciar Guardián" abajo.',
    tips: [
      "El Guardián identificó una oportunidad en las divisas y entró solo. ¡Tú no hiciste nada!",
      "El Guardián entra y sale en el momento justo. En cuenta real, la ganancia ya estaría disponible para retirar.",
      "¡Mira el saldo subiendo! Las mismas entradas les llegan a todos al mismo tiempo.",
      "Miles de personas están copiando estas mismas operaciones ahora, en tiempo real.",
      "Fíjate: cero clics. El Guardián opera las divisas solo todo el día.",
    ],
    gpTitle: (n: string) => (n ? `${n}, configura tu meta` : "Configura tu meta"), gpSub: "El Guardián operará divisas hasta alcanzarla automáticamente",
    gpGoalLbl: "Meta de ganancia", gpGoalPh: "Ej: $100", gpMin: "Mínimo $10", gpTimeLbl: "Tiempo disponible",
    gpTimes: [{ label: "30 minutos", value: "30min" }, { label: "1 hora", value: "1h" }, { label: "2 horas", value: "2h" }, { label: "Tiempo libre", value: "livre" }],
    gpStart: "INICIAR GUARDIÁN",
    grTitle: "¡META ALCANZADA!", grSubA: (n: string) => (n ? `${n}, el Guardián alcanzó tu meta de ` : "El Guardián alcanzó tu meta de "), grSubC: " en apenas 1 minuto.",
    grIfReal: "En cuenta real, habrías ganado:", grWithdraw: "Y podrías retirar ahora mismo",
    grDemoBold: "Esto fue solo una demostración.", grDemoA: " En cuenta real, el dinero cae directo en tu cuenta. Nuestros miembros hacen esto ", grDemoBold2: "todos los días", grDemoC: ".",
    grWithRealTitle: "Con acceso real, tendrías:", grItems: ["Retiros ilimitados a cualquier banco", "Guardián operando divisas 24h", "Soporte exclusivo en WhatsApp", "Las mismas entradas cayendo para ti"],
    grCta: "QUIERO LA CUENTA REAL AHORA", grWaiting: "Mientras esperas, otros ya están ganando.",
    notifDone: "Operación completada", notifWin: (amt: string, par: string, c: string) => `+$${amt} en ${par} · ${c} copiaron`,
    anWaiting: "Esperando la próxima operación...", anAnalyzing: "Analizando el mercado de divisas...",
  },
};
type Tx = typeof TX.pt;

const CoachBubble = ({ step, total, text, position = "bottom", t }: { step: number; total: number; text: string; position?: "top" | "bottom"; t: Tx }) => (
  <div className="animate-fade-in">
    <div className="relative bg-foreground text-background rounded-xl px-3 py-2.5 shadow-lg">
      {position === "top" && <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-foreground rotate-45 rounded-sm" />}
      {position === "bottom" && <div className="absolute -top-1.5 left-6 w-3 h-3 bg-foreground rotate-45 rounded-sm" />}
      <div className="flex items-start gap-2.5 relative z-10">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5"><span className="text-[10px] font-bold text-primary-foreground">{step}</span></div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-background/60 font-medium">{t.step} {step} {t.of} {total}</p>
          <p className="text-[11px] font-semibold leading-snug mt-0.5">{text}</p>
        </div>
      </div>
    </div>
  </div>
);

const TutorialTip = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="w-full animate-fade-in">
    <div className={`${plat.card} ${plat.border} border rounded-lg px-2.5 py-2 flex items-start gap-2`}>
      <div className="w-6 h-6 rounded-md bg-[hsl(280,70%,65%,0.15)] flex items-center justify-center shrink-0 mt-0.5"><Icon className="w-3 h-3 text-[hsl(280,70%,65%)]" /></div>
      <p className="text-[11px] text-[hsl(45,90%,65%)] font-semibold leading-snug flex-1">{text}</p>
    </div>
  </div>
);

const GoalReachedPopup = ({ goal, profit, onContinue, userName, t, locale }: { goal: number; profit: number; onContinue: () => void; userName?: string; t: Tx; locale: string }) => {
  const firstName = userName?.split(" ")[0] || "";
  const displayProfit = Math.max(profit, goal);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(260,30%,4%,0.9)] backdrop-blur-sm animate-fade-in px-4">
      <div className={`w-full max-w-sm ${plat.card} ${plat.border} border rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto`}>
        <div className="bg-[hsl(280,70%,65%,0.1)] border-b border-[hsl(270,30%,22%)] px-4 py-5 text-center">
          <div className="w-14 h-14 rounded-full bg-[hsl(280,70%,65%,0.2)] border-2 border-[hsl(280,70%,65%,0.4)] flex items-center justify-center mx-auto mb-3 animate-bounce-subtle"><Trophy className="w-7 h-7 text-[hsl(280,70%,65%)]" /></div>
          <h3 className="font-display font-bold text-lg text-foreground">{t.grTitle}</h3>
          <p className="text-sm text-[hsl(260,15%,65%)] mt-1.5 leading-relaxed">{t.grSubA(firstName)}<span className="font-bold text-foreground">{t.goalSym}{goal.toLocaleString(locale)}</span>{t.grSubC}</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className={`${plat.bg} rounded-xl p-3 text-center border border-[hsl(280,70%,65%,0.3)]`}>
            <p className="text-[11px] text-[hsl(260,15%,55%)] mb-1">{t.grIfReal}</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{t.goalSym} <span className="text-[hsl(280,70%,65%)]">{displayProfit.toLocaleString(locale, { minimumFractionDigits: 2 })}</span></p>
            <p className="text-[11px] text-[hsl(280,70%,65%)] mt-1.5 font-medium">{t.grWithdraw}</p>
          </div>
          <div className="bg-[hsl(280,70%,65%,0.08)] rounded-xl p-2.5 border border-[hsl(280,70%,65%,0.2)]">
            <p className="text-[11px] text-foreground leading-relaxed text-center"><span className="font-bold">{t.grDemoBold}</span>{t.grDemoA}<span className="font-bold text-[hsl(280,70%,65%)]">{t.grDemoBold2}</span>{t.grDemoC}</p>
          </div>
          <div className={`${plat.bg} rounded-xl p-2.5 border ${plat.border} space-y-1.5`}>
            <p className="text-[11px] font-bold text-foreground text-center">{t.grWithRealTitle}</p>
            {t.grItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[hsl(280,70%,65%,0.2)] flex items-center justify-center shrink-0"><ArrowRight className="w-2 h-2 text-[hsl(280,70%,65%)]" /></div>
                <span className="text-[10px] text-[hsl(260,15%,65%)]">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={onContinue} className="w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide text-white cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all duration-300 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,60%,55%)]" style={{ boxShadow: `0 0 25px hsl(280 70% 65% / 0.3), 0 0 50px hsl(280 70% 65% / 0.15)` }}>
            <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> {t.grCta}</span>
          </button>
          <p className="text-[10px] text-[hsl(260,15%,45%)] text-center">{t.grWaiting}</p>
        </div>
      </div>
    </div>
  );
};

const GoalPopup = ({ onSubmit, userName, t, locale }: { onSubmit: (goal: number, time: string) => void; userName?: string; t: Tx; locale: string }) => {
  const [goal, setGoal] = useState("");
  const [time, setTime] = useState("");
  const firstName = userName?.split(" ")[0] || "";
  const goalNum = parseFloat(goal.replace(/\D/g, "")) || 0;
  const canSubmit = goalNum >= 10 && time !== "";
  const formatGoal = (val: string) => { const nums = val.replace(/\D/g, ""); if (!nums) return ""; return `${t.goalSym} ${parseInt(nums).toLocaleString(locale)}`; };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(260,30%,4%,0.9)] backdrop-blur-sm animate-fade-in px-4">
      <div className={`w-full max-w-sm ${plat.card} ${plat.border} border rounded-2xl shadow-2xl overflow-hidden animate-scale-in`}>
        <div className="bg-[hsl(280,70%,65%,0.1)] border-b border-[hsl(270,30%,22%)] px-4 py-3.5 text-center">
          <div className="w-11 h-11 rounded-full bg-[hsl(280,70%,65%,0.2)] border border-[hsl(280,70%,65%,0.3)] flex items-center justify-center mx-auto mb-2"><Target className="w-5 h-5 text-[hsl(280,70%,65%)]" /></div>
          <h3 className="font-display font-bold text-base text-foreground">{t.gpTitle(firstName)}</h3>
          <p className="text-[11px] text-[hsl(260,15%,55%)] mt-1">{t.gpSub}</p>
        </div>
        <CoachBubble step={2} total={3} text={t.coach2} position="top" t={t} />
        <div className="px-4 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" /> {t.gpGoalLbl}</label>
            <input type="text" inputMode="numeric" placeholder={t.gpGoalPh} value={goal} onChange={(e) => setGoal(formatGoal(e.target.value))}
              className="w-full bg-[hsl(260,22%,15%)] border border-[hsl(270,30%,22%)] rounded-xl px-3 py-2.5 text-foreground text-lg font-bold placeholder:text-[hsl(260,15%,40%)] focus:outline-none focus:ring-2 focus:ring-[hsl(280,70%,65%,0.5)] transition-all" />
            <p className="text-[10px] text-[hsl(260,15%,55%)]">{t.gpMin}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" /> {t.gpTimeLbl}</label>
            <div className="grid grid-cols-2 gap-1.5">
              {t.gpTimes.map((opt) => (
                <button key={opt.value} onClick={() => setTime(opt.value)} className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${time === opt.value ? "border-[hsl(280,70%,65%)] bg-[hsl(280,70%,65%,0.15)] text-[hsl(280,70%,65%)]" : "border-[hsl(270,30%,22%)] bg-[hsl(260,22%,15%)] text-[hsl(260,15%,55%)]"}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          {goalNum >= 10 && !time && <CoachBubble step={3} total={3} text={t.coach3a} position="top" t={t} />}
          {goalNum >= 10 && time && <CoachBubble step={3} total={3} text={t.coach3b} position="top" t={t} />}
          <button onClick={() => canSubmit && onSubmit(goalNum, time)} disabled={!canSubmit}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide transition-all duration-300 ${canSubmit ? "text-white cursor-pointer hover:brightness-110 active:scale-[0.98] bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,60%,55%)]" : "bg-[hsl(260,22%,18%)] text-[hsl(260,15%,40%)] cursor-not-allowed"}`}
            style={canSubmit ? { boxShadow: `0 0 25px hsl(280 70% 65% / 0.3)` } : {}}>
            <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" fill="currentColor" /> {t.gpStart}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AnalyzingBar = ({ onDone, paused, t }: { onDone: () => void; paused?: boolean; t: Tx }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (paused) { setProgress(0); return; }
    const duration = 300 + Math.random() * 300;
    const start = Date.now();
    const interval = setInterval(() => { const pct = Math.min(100, ((Date.now() - start) / duration) * 100); setProgress(pct); if (pct >= 100) { clearInterval(interval); setTimeout(onDone, 150); } }, 30);
    return () => clearInterval(interval);
  }, [onDone, paused]);
  return (
    <div className="w-full py-2 px-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Loader2 className={`w-3 h-3 text-[hsl(280,70%,65%)] ${paused ? '' : 'animate-spin'}`} />
        <span className="text-[11px] font-semibold text-[hsl(280,70%,65%)]">{paused ? t.anWaiting : t.anAnalyzing}</span>
      </div>
      <div className="w-full h-1.5 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]" style={{ width: `${progress}%` }} /></div>
    </div>
  );
};

const NotificationToast = ({ text, onDone, t }: { text: string; onDone: () => void; t: Tx }) => {
  useEffect(() => { const to = setTimeout(onDone, 3000); return () => clearTimeout(to); }, [onDone]);
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-50 animate-slide-up">
      <div className={`${plat.card} border border-[hsl(280,70%,65%,0.3)] rounded-xl px-3 py-2.5 shadow-2xl flex items-center gap-2.5`}>
        <div className="w-7 h-7 rounded-full bg-[hsl(280,70%,65%,0.2)] flex items-center justify-center shrink-0"><Banknote className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" /></div>
        <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-[hsl(280,70%,65%)]">{t.notifDone}</p><p className="text-[11px] text-foreground">{text}</p></div>
      </div>
    </div>
  );
};

// Ticker rolando de cotações (estilo plataforma de trader) — câmbio + metais.
const TICKER_MKTS: { sym: string; label?: Record<Language, string>; base: number; dec: number }[] = [
  { sym: "XAU/USD", label: { pt: "Ouro", en: "Gold", es: "Oro" }, base: 2385.40, dec: 2 },
  { sym: "XAG/USD", label: { pt: "Prata", en: "Silver", es: "Plata" }, base: 29.87, dec: 2 },
  { sym: "EUR/USD", base: 1.08432, dec: 5 },
  { sym: "GBP/USD", base: 1.26781, dec: 5 },
  { sym: "USD/JPY", base: 149.320, dec: 3 },
  { sym: "USD/CAD", base: 1.36540, dec: 4 },
  { sym: "AUD/USD", base: 0.65123, dec: 5 },
  { sym: "USD/CHF", base: 0.87654, dec: 4 },
  { sym: "EUR/GBP", base: 0.85612, dec: 5 },
];

const MarketTicker = ({ lang, locale }: { lang: Language; locale: string }) => {
  const [quotes, setQuotes] = useState(() => TICKER_MKTS.map(() => ({ price: 0, pct: Math.random() * 2 - 1 })));
  useEffect(() => {
    setQuotes(TICKER_MKTS.map((m) => ({ price: m.base, pct: Math.random() * 1.6 - 0.8 })));
    const iv = setInterval(() => {
      setQuotes((prev) => prev.map((it, i) => {
        const m = TICKER_MKTS[i];
        const base = it.price || m.base;
        const np = base * (1 + (Math.random() * 2 - 1) * 0.0013);
        return { price: np, pct: ((np - m.base) / m.base) * 100 };
      }));
    }, 1300);
    return () => clearInterval(iv);
  }, []);
  const row = TICKER_MKTS.map((m, i) => {
    const it = quotes[i]; const up = it.pct >= 0;
    return (
      <span key={m.sym} className="inline-flex items-center gap-1.5 px-3 border-r border-[hsl(270,30%,20%)]">
        {m.label && <span className="text-[9px] text-[hsl(45,90%,60%)] font-semibold">{m.label[lang]}</span>}
        <span className="text-[10px] font-bold text-foreground">{m.sym}</span>
        <span className="text-[10px] font-mono text-[hsl(260,15%,72%)] tabular-nums">{(it.price || m.base).toLocaleString(locale, { minimumFractionDigits: m.dec, maximumFractionDigits: m.dec })}</span>
        <span className={`text-[9px] font-bold tabular-nums ${up ? "text-[hsl(152,60%,48%)]" : "text-[hsl(0,72%,60%)]"}`}>{up ? "▲" : "▼"}{Math.abs(it.pct).toFixed(2)}%</span>
      </span>
    );
  });
  return (
    <div className={`relative overflow-hidden ${plat.border} border-b ${plat.secondary} py-1.5`}>
      <div className="flex w-max whitespace-nowrap" style={{ animation: "gtl-ticker 30s linear infinite" }}>
        <div className="flex">{row}</div>
        <div className="flex" aria-hidden>{row}</div>
      </div>
      <style>{`@keyframes gtl-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
};

const StepPlatformDemoForex = ({ onNext, userName }: Props) => {
  const { lang, locale } = useLanguage();
  const t = TX[lang];
  const firstName = userName?.split(" ")[0] || "";
  const fast = true; // Quiz B: sempre ritmo rápido (dinheiro entrando/saindo veloz).

  const [showPopup, setShowPopup] = useState(false);
  const [showGoalReached, setShowGoalReached] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [goal, setGoal] = useState(0);
  const [balance, setBalance] = useState(362.72);
  const [profit, setProfit] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [copiers, setCopiers] = useState(5782);
  const [history, setHistory] = useState<Array<{ hora: string; par: string; preco: string; lucro: number; tipo: "win" | "loss"; }>>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(-1);

  const historyRef = useRef<HTMLDivElement>(null);
  const opTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const totalOpsRef = useRef(0);
  const accumulatedRef = useRef(0);
  const startTimeRef = useRef(0);

  const dismissNotification = useCallback(() => setNotification(null), []);
  const GOAL_TIME_MS = 16_000;

  const handleGoalSubmit = (goalValue: number, _time: string) => { setGoal(goalValue); setShowPopup(false); setIsActive(true); setIsAnalyzing(true); startTimeRef.current = Date.now(); };

  useEffect(() => {
    if (!isActive) return;
    const delays = [1200, 3500, 6000, 9000, 12000];
    delays.forEach((delay, index) => { const timer = setTimeout(() => setCurrentTipIndex(index), delay); tipTimersRef.current.push(timer); });
    return () => tipTimersRef.current.forEach(tm => clearTimeout(tm));
  }, [isActive]);

  // Contador "copiando agora" — sobe enquanto o Guardião opera (copy trade).
  useEffect(() => {
    if (!isActive || showGoalReached) return;
    const iv = setInterval(() => setCopiers((c) => c + Math.round(1 + Math.random() * 18)), 1100);
    return () => clearInterval(iv);
  }, [isActive, showGoalReached]);

  const runNextOperation = useCallback(() => { if (accumulatedRef.current >= goal && goal > 0) { setShowGoalReached(true); return; } setIsAnalyzing(true); }, [goal]);

  const handleAnalysisDone = useCallback(() => {
    setIsAnalyzing(false);
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = goal - accumulatedRef.current;
    const timeLeft = Math.max(1, GOAL_TIME_MS - elapsed);
    const estOpsLeft = Math.max(1, Math.floor(timeLeft / 2000));
    const isWin = Math.random() < 0.88;
    let lucro: number;
    if (isWin) {
      const base = remaining / estOpsLeft;
      const variance = base * (0.5 + Math.random() * 1.0);
      lucro = Math.max(3, Math.min(remaining * 0.3, variance));
      if (timeLeft < 10000 && remaining > 0) lucro = Math.max(lucro, remaining * 0.5);
      lucro = parseFloat(lucro.toFixed(2));
    } else { lucro = -parseFloat((Math.random() * 8 + 1).toFixed(2)); }
    const parIndex = Math.floor(Math.random() * pares.length);
    const hora = new Date().toLocaleTimeString(locale).slice(0, 8);
    totalOpsRef.current++;
    accumulatedRef.current += lucro;
    setHistory(prev => [...prev, { hora, par: pares[parIndex], preco: precos[parIndex], lucro, tipo: isWin ? "win" : "loss" }]);
    setProfit(prev => parseFloat((prev + lucro).toFixed(2)));
    setBalance(prev => parseFloat((prev + lucro).toFixed(2)));
    if (isWin) setWins(prev => prev + 1); else setLosses(prev => prev + 1);
    if (isWin) { const took = Math.round(3800 + Math.random() * 2600).toLocaleString(locale); setNotification(t.notifWin(lucro.toFixed(2), pares[parIndex], took)); }
    if (accumulatedRef.current >= goal) { setTimeout(() => setShowGoalReached(true), 800); return; }
    const delay = 120 + Math.random() * 220;
    opTimerRef.current = setTimeout(runNextOperation, delay);
  }, [goal, runNextOperation, t, locale]);

  useEffect(() => { if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; }, [history]);
  useEffect(() => () => { if (opTimerRef.current) clearTimeout(opTimerRef.current); }, []);

  const goalReached = showGoalReached;
  const progressPct = goal > 0 ? Math.min(100, Math.round((Math.max(0, profit) / goal) * 100)) : 0;

  return (
    <StepContainer>
      <StepTitle>{t.titleA(firstName)}{t.titleMid}<span className="text-gradient-green">{t.titleBold}</span>{t.titleEnd}</StepTitle>
      <StepSubtitle>{!isActive ? t.subIdle : goalReached ? t.subDone : t.subActive}</StepSubtitle>

      {!goalReached && (
        <div className="w-full funnel-card border-accent/40 bg-accent/10 text-center py-2 px-2.5">
          <p className="text-[13px] sm:text-sm font-bold text-foreground leading-snug">{t.fastBannerA}<span className="text-gradient-green">{t.fastBannerBold}</span>{t.fastBannerC}</p>
        </div>
      )}

      <div className={`w-full rounded-2xl overflow-hidden shadow-2xl ${plat.bg} ${plat.border} border`}>
        <div className={`${plat.headerBg} px-2.5 py-2 flex items-center justify-between ${plat.border} border-b`}>
          <div className="flex items-center gap-1.5">
            <Play className="w-3 h-3 text-[hsl(280,70%,65%)]" fill="currentColor" />
            <span className="text-[11px] font-bold text-foreground tracking-wide"><span className={plat.accent}>{t.platform}</span> {t.platformSuf}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full ${plat.secondary} ${plat.border} border flex items-center justify-center`}><span className="text-[9px]">{lang === "pt" ? "🇧🇷" : "🌎"}</span></div>
            <div className="w-6 h-6 rounded-full bg-[hsl(280,60%,50%)] flex items-center justify-center"><Bell className="w-3 h-3 text-white" /></div>
          </div>
        </div>

        {/* Ticker de cotações rolando (estilo plataforma de trader) */}
        <MarketTicker lang={lang} locale={locale} />

        <div className={`${plat.card} mx-2.5 mt-2 rounded-lg p-2 flex items-center gap-2.5 ${plat.border} border`}>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${isActive ? "bg-[hsl(152,60%,42%,0.15)] border-[hsl(152,60%,42%,0.3)]" : "bg-[hsl(0,72%,55%,0.15)] border-[hsl(0,72%,55%,0.3)]"}`}>
            <Power className={`w-4 h-4 ${isActive ? plat.green : plat.red}`} />
          </div>
          <div><p className="text-xs font-bold text-foreground leading-tight">{t.demoAccount}</p><p className="text-[9px] text-[hsl(260,15%,55%)]">DM7829401 - USD</p></div>
        </div>

        <div className="px-2.5 py-2 flex gap-1.5">
          <div className={`flex-1 ${plat.card} rounded-lg p-2 ${plat.border} border`}>
            <p className="text-[9px] text-[hsl(260,15%,55%)]">{t.balance}</p>
            <p className="text-base font-bold text-foreground font-display leading-tight mt-0.5">$ {balance.toLocaleString(locale, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className={`flex-1 ${plat.card} rounded-lg p-2 ${plat.border} border`}>
            <p className="text-[9px] text-[hsl(260,15%,55%)]">{t.pl}</p>
            <p className={`text-base font-bold font-display leading-tight mt-0.5 ${profit > 0 ? plat.green : profit < 0 ? plat.red : "text-foreground"}`}>{profit >= 0 ? "+" : ""}$ {profit.toLocaleString(locale, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className={`px-2.5 py-3 text-center ${plat.border} border-t border-b`}>
          <div className="flex items-center justify-center gap-1.5 mb-1"><Bot className="w-3.5 h-3.5 text-[hsl(260,15%,55%)]" /><span className="text-[11px] font-bold text-foreground tracking-wide">GUARDIÃO 2.0</span></div>
          {!isActive ? (<p className="text-xs text-[hsl(260,15%,55%)]">{t.botStopped}</p>)
            : goalReached ? (<p className={`text-xs font-bold ${plat.accent} animate-pulse`}>{t.goalReached}</p>)
            : (
              <div className="space-y-1.5">
                <p className={`text-xs ${plat.accent} font-semibold`}>{t.botRunning}</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(152,60%,42%)] animate-ping opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(152,60%,42%)]" /></span>
                  <span className="text-[10px] font-bold text-[hsl(152,60%,42%)] tabular-nums">{copiers.toLocaleString(locale)}</span>
                  <span className="text-[10px] text-[hsl(260,15%,55%)]">{t.copyingNow}</span>
                </div>
                {goal > 0 && (
                  <div className="w-full max-w-[200px] mx-auto">
                    <div className="flex justify-between text-[9px] text-[hsl(260,15%,55%)] mb-0.5"><span>{t.metaLbl} {t.goalSym}{goal.toLocaleString(locale)}</span><span className={`${plat.accent} font-medium`}>{progressPct}%</span></div>
                    <div className="w-full h-1 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]" style={{ width: `${progressPct}%` }} /></div>
                  </div>
                )}
              </div>
            )}
        </div>

        {isActive && !goalReached && <AnalyzingBar key={isAnalyzing ? "analyzing" : "idle"} onDone={handleAnalysisDone} paused={!isAnalyzing} t={t} />}

        {!isActive && (
          <div className="px-2.5 pt-2 pb-3 relative">
            <div className="flex gap-1.5">
              <button onClick={() => setShowPopup(true)} className="flex-1 py-2.5 rounded-xl border-2 border-[hsl(152,60%,42%,0.6)] bg-[hsl(152,60%,42%,0.15)] text-[hsl(152,60%,42%)] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-125 active:scale-[0.98] transition-all relative overflow-hidden">
                <span className="absolute inset-0 rounded-xl animate-ping bg-[hsl(152,60%,42%,0.1)]" style={{ animationDuration: '2s' }} />
                <Play className="w-3.5 h-3.5 relative z-10" fill="currentColor" /><span className="relative z-10">{t.startBot}</span>
              </button>
              <button className={`flex-1 py-2.5 rounded-xl ${plat.border} border ${plat.secondary} text-[hsl(260,15%,55%)] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-default`}><Bot className="w-3.5 h-3.5" /> {t.selectBot}</button>
            </div>
            <div className="mt-2"><CoachBubble step={1} total={3} text={t.coach1} t={t} /></div>
          </div>
        )}

        <div className={`${plat.border} border-t`}>
          <div className={`flex ${plat.border} border-b`}>
            <div className={`flex-1 py-2 text-center text-[11px] font-bold text-white ${plat.tabActive} border-b-2 ${plat.tabBorder}`}>{t.tabTable}</div>
            <div className="flex-1 py-2 text-center text-[11px] font-medium text-[hsl(260,15%,55%)] cursor-default">{t.tabChart}</div>
          </div>
          <div className={`px-2.5 py-2 flex items-center justify-between ${plat.border} border-b`}>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold text-foreground">{t.history}</p>
              <span className="text-[11px]"><span className={plat.green + " font-bold"}>{wins}</span><span className="text-[hsl(260,15%,55%)]">/</span><span className={plat.red + " font-bold"}>{losses}</span></span>
            </div>
            <div className="flex items-center gap-1"><Bell className="w-3 h-3 text-[hsl(260,15%,55%)]" /><span className="text-[9px] text-[hsl(260,15%,55%)]">{history.length}</span></div>
          </div>
          <div className={`px-2.5 py-1.5 grid grid-cols-4 gap-1 ${plat.border} border-b ${plat.secondary}`}>
            <span className="text-[9px] font-semibold text-[hsl(260,15%,55%)]">{t.thHora}</span>
            <span className="text-[9px] font-semibold text-[hsl(260,15%,55%)]">{t.thPar}</span>
            <span className="text-[9px] font-semibold text-[hsl(260,15%,55%)] text-right">{t.thPreco}</span>
            <span className="text-[9px] font-semibold text-[hsl(260,15%,55%)] text-right">{t.thLucro}</span>
          </div>
          <div ref={historyRef} className="max-h-[140px] sm:max-h-[200px] overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
            {history.length === 0 && (<div className="py-6 text-center"><p className="text-[11px] text-[hsl(260,15%,55%)]">{t.noOps}</p></div>)}
            {history.map((op, i) => (
              <div key={i} className={`px-2.5 py-1.5 grid grid-cols-4 gap-1 ${plat.border} border-b border-opacity-20 animate-fade-in`}>
                <span className="text-[9px] text-[hsl(260,15%,55%)] font-mono">{op.hora}</span>
                <span className="text-[9px] font-semibold text-foreground">{op.par}</span>
                <span className="text-[9px] text-[hsl(260,15%,55%)] text-right font-mono">{op.preco}</span>
                <span className={`text-[9px] font-bold text-right ${op.tipo === "win" ? plat.green : plat.red}`}>{op.lucro >= 0 ? "+" : ""}${op.lucro.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isActive && !goalReached && (
        <div className="w-full space-y-2">
          <div className="animate-fade-in">
            <div className="relative bg-foreground text-background rounded-xl px-3 py-2.5 shadow-lg">
              <div className="absolute -top-1.5 left-6 w-3 h-3 bg-foreground rotate-45 rounded-sm" />
              <div className="flex items-start gap-2.5 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[hsl(280,70%,65%)] flex items-center justify-center shrink-0 mt-0.5"><Clock className="w-3 h-3 text-white" /></div>
                <div className="flex-1 min-w-0"><p className="text-[10px] text-background/60 font-medium">{t.estTimeLbl}</p><p className="text-[11px] font-semibold leading-snug mt-0.5">{t.estTimeA}<span className="text-primary font-bold">{t.estTimeBold}</span>{t.estTimeC}</p></div>
              </div>
            </div>
          </div>
          {currentTipIndex >= 0 && <TutorialTip key={currentTipIndex} icon={TIP_ICONS[currentTipIndex]} text={t.tips[currentTipIndex]} />}
        </div>
      )}

      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center p-2.5">
        <div className="flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-foreground font-medium leading-snug">{t.trustA}<strong>{t.trustBold}</strong>{t.trustC}</p>
        </div>
      </div>

      {isActive && !goalReached ? (
        <button onClick={onNext} className="w-full py-3 rounded-xl font-bold text-sm text-black uppercase tracking-wide animate-fade-in" style={{ background: "linear-gradient(135deg, #00E676 0%, #00C853 100%)", boxShadow: "0 4px 16px rgba(0,200,83,0.35)" }}>{t.continueFast}</button>
      ) : (
        <button onClick={onNext} className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer py-1">{t.continueSkip}</button>
      )}

      {showPopup && <GoalPopup onSubmit={handleGoalSubmit} userName={userName} t={t} locale={locale} />}
      {showGoalReached && <GoalReachedPopup goal={goal} profit={profit} onContinue={onNext} userName={userName} t={t} locale={locale} />}
      {notification && <NotificationToast text={notification} onDone={dismissNotification} t={t} />}
    </StepContainer>
  );
};

export default StepPlatformDemoForex;
