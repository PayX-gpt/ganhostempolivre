import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, Shield, CheckCircle, Clock, Zap, Award,
  ArrowRight, Star, ShieldCheck, Target, BarChart3, Lock,
  User, Smartphone, Laptop, Calendar, DollarSign, AlertTriangle,
  Wallet, Brain, Flame
} from "lucide-react";
import type { QuizAnswers } from "./QuizUI";
import { StepContainer } from "./QuizUI";
import GuaranteeBadge from "./GuaranteeBadge";
import { useLanguage, type Language } from "@/lib/i18n";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarClaudia from "@/assets/avatar-claudia.jpg";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";
import avatarRegina from "@/assets/avatar-regina.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";

interface Props { onNext: () => void; userName?: string; answers?: QuizAnswers; isTiktok?: boolean; }

// Moeda coerente: PT em R$ (meta 75-600/dia); EN/ES em US$ (÷5, 15-120/dia).
const CUR: Record<Language, { sym: string; goalDaily: Record<string, number> }> = {
  pt: { sym: "R$", goalDaily: { "50-100": 75, "100-300": 200, "300-500": 400, "500+": 600 } },
  en: { sym: "$", goalDaily: { "50-100": 15, "100-300": 40, "300-500": 80, "500+": 120 } },
  es: { sym: "$", goalDaily: { "50-100": 15, "100-300": 40, "300-500": 80, "500+": 120 } },
};

const T = {
  pt: {
    goalLbl: { "50-100": "R$50 a R$100/dia", "100-300": "R$100 a R$300/dia", "300-500": "R$300 a R$500/dia", "500+": "R$500+/dia", def: "R$100 a R$300/dia" },
    ageLbl: { "18-25": "18 a 25 anos", "26-35": "26 a 35 anos", "36-45": "36 a 45 anos", "46-55": "46 a 55 anos", "56+": "56+ anos", def: "seu perfil" },
    obstacleLbl: { medo: "Medo de golpe", tempo: "Falta de tempo", inicio: "Não saber por onde começar", dinheiro: "Pouco capital inicial", def: "Desafios iniciais" },
    obstacleSol: { medo: "Plataforma 100% regulamentada com suporte humano 24h", tempo: "Sistema automatizado — opera mesmo enquanto você dorme", inicio: "Passo a passo guiado do zero, sem conhecimento prévio", dinheiro: "Estratégia otimizada para começar com valores baixos", def: "Suporte personalizado para o seu caso" },
    balanceLbl: { "menos100": "Menos de R$100", "100-500": "R$100 a R$500", "500-2000": "R$500 a R$2.000", "2000-10000": "R$2.000 a R$10.000", "10000+": "Mais de R$10.000", def: "Não informado" },
    deviceLbl: { celular: "Celular", computador: "Computador", ambos: "Celular e Computador", def: "Celular" },
    availLbl: { "1-2h": "1 a 2 horas/dia", "2-4h": "2 a 4 horas/dia", "4h+": "4+ horas/dia", integral: "Tempo integral", def: "Flexível" },
    kicker: "Análise personalizada", planReadyA: (n: string) => n ? `${n}, seu ` : "Seu ", planReadyBold: "plano exclusivo", planReadyC: " está pronto",
    crossedA: "A IA analisou cada uma das suas respostas e cruzou com dados de ", crossedAlumni: (c: string) => `+${c} alunos`, crossedC: " para criar uma estratégia sob medida.",
    profileTitle: "Seu Perfil Analisado", compat: (s: number) => `${s}% compatível`,
    lblName: "Nome", lblAge: "Faixa etária", lblGoal: "Meta de ganhos", lblCapital: "Capital disponível", lblDevice: "Dispositivo", lblAvail: "Disponibilidade", lblChallenge: "Maior desafio", notInformed: "Não informado",
    solutionFor: (o: string) => `Solução para "${o}"`,
    projTitle: "Projeção de Lucro — Baseada no Seu Perfil",
    calcA: "📊 Calculado com base na sua meta de ", calcMid: ", capital de ", calcMid2: " e disponibilidade de ", calcC: ".",
    perDay: "/dia", monthlyPotential: "Potencial mensal", monthlyNote: (d: string) => `${d}/dia × 30 dias — ajustado ao seu capital e meta`,
    projLabels: { today: "HOJE", d3: "Dia 3", d7: "Dia 7", d14: "Dia 14", d21: "Dia 21", d30: "Dia 30", p3: "Primeira operação configurada", p7tt: "Primeiros resultados altos", p7: "Primeiros resultados reais", p14: "Ganhando consistência", p21: "Ritmo acelerando", p30: "Meta diária atingida" },
    alumniAgeTitle: (age: string) => `Alunos com ${age} como você`, statGoal: "Alcançaram a meta em 30 dias", statTime: "Tempo médio pro primeiro ganho", statTimeVal: "3 dias", statOvercame: (o: string) => `Superaram "${o}"`, statSat: "Nota de satisfação",
    proofAlumni: (c: string, age: string) => `alunos`, proofA: (c: string) => `+${c} alunos`, proofB: (age: string) => ` com ${age} já alcançaram resultados como esses.`,
    securityTitleA: "Sua segurança é ", securityBold: "nossa prioridade",
    guarantees: [{ t: "Garantia incondicional de 30 dias", d: "Se não gostar, devolvemos 100% do valor. Sem perguntas." }, { t: "Suporte humano via WhatsApp", d: "Mentora dedicada pra te guiar do zero ao primeiro resultado." }, { t: "Método validado para seu perfil", df: (c: string, age: string) => `+${c} alunos com ${age} já comprovaram.` }],
    howTitleA: "Como ", howBold: "aplicar na prática",
    steps: [{ t: "Ative sua Chave Token", d: "Em menos de 2 minutos, direto do celular." }, { t: "Siga o passo a passo", d: "Suporte te guia pessoalmente. Zero complicação." }, { t: "Receba seus resultados", df: (age: string) => `A maioria dos alunos com ${age} vê o primeiro resultado em até 3 dias.` }],
    cta: "QUERO MEU ACESSO", limitedOffer: "Oferta por tempo limitado", guarantee30: "Garantia de 30 dias",
    disclaimer: "*Projeção baseada na média de resultados de alunos com perfil semelhante. Resultados individuais podem variar.",
  },
  en: {
    goalLbl: { "50-100": "$10 to $20/day", "100-300": "$20 to $60/day", "300-500": "$60 to $100/day", "500+": "$100+/day", def: "$20 to $60/day" },
    ageLbl: { "18-25": "18 to 25", "26-35": "26 to 35", "36-45": "36 to 45", "46-55": "46 to 55", "56+": "56+", def: "your profile" },
    obstacleLbl: { medo: "Fear of a scam", tempo: "Lack of time", inicio: "Not knowing where to start", dinheiro: "Little starting capital", def: "Early challenges" },
    obstacleSol: { medo: "Fully regulated platform with 24h human support", tempo: "Automated system — it works even while you sleep", inicio: "Guided step-by-step from zero, no prior knowledge", dinheiro: "Strategy optimized to start with small amounts", def: "Personalized support for your case" },
    balanceLbl: { "menos100": "Less than $20", "100-500": "$20 to $100", "500-2000": "$100 to $400", "2000-10000": "$400 to $2,000", "10000+": "More than $2,000", def: "Not provided" },
    deviceLbl: { celular: "Phone", computador: "Computer", ambos: "Phone and Computer", def: "Phone" },
    availLbl: { "1-2h": "1 to 2 hours/day", "2-4h": "2 to 4 hours/day", "4h+": "4+ hours/day", integral: "Full time", def: "Flexible" },
    kicker: "Personalized analysis", planReadyA: (n: string) => n ? `${n}, your ` : "Your ", planReadyBold: "exclusive plan", planReadyC: " is ready",
    crossedA: "The AI analyzed every one of your answers and cross-referenced data from ", crossedAlumni: (c: string) => `${c}+ members`, crossedC: " to build a strategy just for you.",
    profileTitle: "Your Profile, Analyzed", compat: (s: number) => `${s}% match`,
    lblName: "Name", lblAge: "Age range", lblGoal: "Earnings goal", lblCapital: "Available capital", lblDevice: "Device", lblAvail: "Availability", lblChallenge: "Biggest challenge", notInformed: "Not provided",
    solutionFor: (o: string) => `Solution for "${o}"`,
    projTitle: "Profit Projection — Based on Your Profile",
    calcA: "📊 Calculated from your goal of ", calcMid: ", capital of ", calcMid2: " and availability of ", calcC: ".",
    perDay: "/day", monthlyPotential: "Monthly potential", monthlyNote: (d: string) => `${d}/day × 30 days — adjusted to your capital and goal`,
    projLabels: { today: "TODAY", d3: "Day 3", d7: "Day 7", d14: "Day 14", d21: "Day 21", d30: "Day 30", p3: "First trade set up", p7tt: "First strong results", p7: "First real results", p14: "Gaining consistency", p21: "Pace picking up", p30: "Daily goal reached" },
    alumniAgeTitle: (age: string) => `Members aged ${age} like you`, statGoal: "Reached the goal in 30 days", statTime: "Average time to first earning", statTimeVal: "3 days", statOvercame: (o: string) => `Overcame "${o}"`, statSat: "Satisfaction score",
    proofAlumni: (c: string, age: string) => `members`, proofA: (c: string) => `${c}+ members`, proofB: (age: string) => ` aged ${age} have already reached results like these.`,
    securityTitleA: "Your safety is ", securityBold: "our priority",
    guarantees: [{ t: "Unconditional 30-day guarantee", d: "If you don't like it, we refund 100%. No questions." }, { t: "Human support via WhatsApp", d: "A dedicated mentor to guide you from zero to your first result." }, { t: "Method proven for your profile", df: (c: string, age: string) => `${c}+ members aged ${age} have already proven it.` }],
    howTitleA: "How to ", howBold: "put it into practice",
    steps: [{ t: "Activate your Token Key", d: "In under 2 minutes, straight from your phone." }, { t: "Follow the step-by-step", d: "Support guides you personally. Zero hassle." }, { t: "Get your results", df: (age: string) => `Most members aged ${age} see their first result within 3 days.` }],
    cta: "I WANT MY ACCESS", limitedOffer: "Limited-time offer", guarantee30: "30-day guarantee",
    disclaimer: "*Projection based on the average results of members with a similar profile. Individual results may vary.",
  },
  es: {
    goalLbl: { "50-100": "$10 a $20/día", "100-300": "$20 a $60/día", "300-500": "$60 a $100/día", "500+": "$100+/día", def: "$20 a $60/día" },
    ageLbl: { "18-25": "18 a 25 años", "26-35": "26 a 35 años", "36-45": "36 a 45 años", "46-55": "46 a 55 años", "56+": "56+ años", def: "tu perfil" },
    obstacleLbl: { medo: "Miedo a una estafa", tempo: "Falta de tiempo", inicio: "No saber por dónde empezar", dinheiro: "Poco capital inicial", def: "Desafíos iniciales" },
    obstacleSol: { medo: "Plataforma 100% regulada con soporte humano 24h", tempo: "Sistema automatizado — opera incluso mientras duermes", inicio: "Paso a paso guiado desde cero, sin conocimiento previo", dinheiro: "Estrategia optimizada para empezar con montos bajos", def: "Soporte personalizado para tu caso" },
    balanceLbl: { "menos100": "Menos de $20", "100-500": "$20 a $100", "500-2000": "$100 a $400", "2000-10000": "$400 a $2.000", "10000+": "Más de $2.000", def: "No informado" },
    deviceLbl: { celular: "Celular", computador: "Computadora", ambos: "Celular y Computadora", def: "Celular" },
    availLbl: { "1-2h": "1 a 2 horas/día", "2-4h": "2 a 4 horas/día", "4h+": "4+ horas/día", integral: "Tiempo completo", def: "Flexible" },
    kicker: "Análisis personalizado", planReadyA: (n: string) => n ? `${n}, tu ` : "Tu ", planReadyBold: "plan exclusivo", planReadyC: " está listo",
    crossedA: "La IA analizó cada una de tus respuestas y las cruzó con datos de ", crossedAlumni: (c: string) => `+${c} miembros`, crossedC: " para crear una estrategia a tu medida.",
    profileTitle: "Tu Perfil Analizado", compat: (s: number) => `${s}% compatible`,
    lblName: "Nombre", lblAge: "Rango de edad", lblGoal: "Meta de ganancias", lblCapital: "Capital disponible", lblDevice: "Dispositivo", lblAvail: "Disponibilidad", lblChallenge: "Mayor desafío", notInformed: "No informado",
    solutionFor: (o: string) => `Solución para "${o}"`,
    projTitle: "Proyección de Ganancias — Según Tu Perfil",
    calcA: "📊 Calculado según tu meta de ", calcMid: ", capital de ", calcMid2: " y disponibilidad de ", calcC: ".",
    perDay: "/día", monthlyPotential: "Potencial mensual", monthlyNote: (d: string) => `${d}/día × 30 días — ajustado a tu capital y meta`,
    projLabels: { today: "HOY", d3: "Día 3", d7: "Día 7", d14: "Día 14", d21: "Día 21", d30: "Día 30", p3: "Primera operación configurada", p7tt: "Primeros resultados altos", p7: "Primeros resultados reales", p14: "Ganando consistencia", p21: "El ritmo acelera", p30: "Meta diaria alcanzada" },
    alumniAgeTitle: (age: string) => `Miembros de ${age} como tú`, statGoal: "Alcanzaron la meta en 30 días", statTime: "Tiempo medio a la primera ganancia", statTimeVal: "3 días", statOvercame: (o: string) => `Superaron "${o}"`, statSat: "Nota de satisfacción",
    proofAlumni: (c: string, age: string) => `miembros`, proofA: (c: string) => `+${c} miembros`, proofB: (age: string) => ` de ${age} ya alcanzaron resultados como estos.`,
    securityTitleA: "Tu seguridad es ", securityBold: "nuestra prioridad",
    guarantees: [{ t: "Garantía incondicional de 30 días", d: "Si no te gusta, devolvemos el 100%. Sin preguntas." }, { t: "Soporte humano por WhatsApp", d: "Una mentora dedicada para guiarte de cero a tu primer resultado." }, { t: "Método validado para tu perfil", df: (c: string, age: string) => `+${c} miembros de ${age} ya lo comprobaron.` }],
    howTitleA: "Cómo ", howBold: "aplicarlo en la práctica",
    steps: [{ t: "Activa tu Llave Token", d: "En menos de 2 minutos, directo desde el celular." }, { t: "Sigue el paso a paso", d: "El soporte te guía personalmente. Cero complicación." }, { t: "Recibe tus resultados", df: (age: string) => `La mayoría de los miembros de ${age} ve su primer resultado en hasta 3 días.` }],
    cta: "QUIERO MI ACCESO", limitedOffer: "Oferta por tiempo limitado", guarantee30: "Garantía de 30 días",
    disclaimer: "*Proyección basada en el promedio de resultados de miembros con perfil similar. Los resultados individuales pueden variar.",
  },
};

// Normaliza chaves de idade (o quiz às vezes usa rótulos por extenso).
const normAge = (age?: string): string => {
  const m: Record<string, string> = { "18 a 25 anos": "18-25", "26 a 35 anos": "26-35", "36 a 45 anos": "36-45", "46 a 55 anos": "46-55", "56 anos ou mais": "56+" };
  return m[age || ""] || age || "";
};
const getAlumniCount = (age?: string): string => {
  const m: Record<string, string> = { "18-25": "4.200", "26-35": "6.800", "36-45": "8.100", "46-55": "9.400", "56+": "7.500" };
  return m[normAge(age)] || "8.000";
};
const getBalanceMultiplier = (b?: string) => ({ "menos100": 0.7, "100-500": 0.85, "500-2000": 1.0, "2000-10000": 1.15, "10000+": 1.3 } as Record<string, number>)[b || ""] || 1.0;
const getSuccessRate = (age?: string) => ({ "18-25": 89, "26-35": 91, "36-45": 93, "46-55": 94, "56+": 92 } as Record<string, number>)[normAge(age)] || 92;
const getDeviceIcon = (d?: string) => (d === "computador" ? Laptop : Smartphone);
const getCompatibilityScore = (answers?: QuizAnswers) => {
  let score = 85;
  if (answers?.availability === "4h+" || answers?.availability === "integral") score += 5;
  if (answers?.accountBalance === "2000-10000" || answers?.accountBalance === "10000+") score += 4;
  if (answers?.device === "ambos") score += 3;
  if (answers?.obstacle === "inicio") score += 2;
  return Math.min(score, 99);
};

const StepProfileProjection = ({ onNext, userName, answers, isTiktok }: Props) => {
  const { lang, locale } = useLanguage();
  const t = T[lang];
  const cur = CUR[lang];
  const money = (n: number) => `${cur.sym}${n.toLocaleString(locale)}`;
  const firstName = userName?.split(" ")[0] || "";
  const ttFired = useRef(false);

  const AnimatedNumber = ({ target, prefix = "", suffix = "", delay = 0 }: { target: number; prefix?: string; suffix?: string; delay?: number }) => {
    const [value, setValue] = useState(0);
    useEffect(() => {
      const to = setTimeout(() => {
        const duration = 1200; const start = Date.now();
        const tick = () => { const elapsed = Date.now() - start; const p = Math.min(elapsed / duration, 1); const eased = 1 - Math.pow(1 - p, 3); setValue(Math.round(target * eased)); if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }, delay);
      return () => clearTimeout(to);
    }, [target, delay]);
    return <span>{prefix}{value.toLocaleString(locale)}{suffix}</span>;
  };

  useEffect(() => {
    if (ttFired.current) return;
    ttFired.current = true;
    try { if (window.ttq) window.ttq.track("InitiateCheckout", { content_name: "Quiz - Etapa Projecao", content_type: "product", currency: "BRL" }); } catch { /* */ }
  }, []);

  const goalKey = answers?.incomeGoal || "";
  const daily = cur.goalDaily[goalKey] || (lang === "pt" ? 200 : 40);
  const balanceMult = getBalanceMultiplier(answers?.accountBalance);
  const adjustedDaily = Math.round(daily * balanceMult);
  const ageKey = normAge(answers?.age);
  const ageLabel = (t.ageLbl as any)[ageKey] || t.ageLbl.def;
  const alumniCount = getAlumniCount(answers?.age);
  const obstacleLabel = (t.obstacleLbl as any)[answers?.obstacle || ""] || t.obstacleLbl.def;
  const obstacleSolution = (t.obstacleSol as any)[answers?.obstacle || ""] || t.obstacleSol.def;
  const goalLabel = (t.goalLbl as any)[goalKey] || t.goalLbl.def;
  const balanceLabel = (t.balanceLbl as any)[answers?.accountBalance || ""] || t.balanceLbl.def;
  const deviceLabel = (t.deviceLbl as any)[answers?.device || ""] || t.deviceLbl.def;
  const availLabel = (t.availLbl as any)[answers?.availability || ""] || t.availLbl.def;
  const successRate = getSuccessRate(answers?.age);
  const compatScore = getCompatibilityScore(answers);
  const DeviceIcon = getDeviceIcon(answers?.device);

  const day3 = Math.round(adjustedDaily * 0.15);
  const day7 = Math.round(adjustedDaily * 0.4);
  const day14 = Math.round(adjustedDaily * 0.65);
  const day21 = Math.round(adjustedDaily * 0.85);
  const day30 = Math.round(adjustedDaily * 1.05);
  const monthly = day30 * 30;

  const projections = [
    { period: isTiktok ? t.projLabels.today : t.projLabels.d3, value: day3, bar: 10, label: t.projLabels.p3, icon: Target },
    { period: t.projLabels.d7, value: day7, bar: 25, label: isTiktok ? t.projLabels.p7tt : t.projLabels.p7, icon: TrendingUp },
    { period: t.projLabels.d14, value: day14, bar: 45, label: t.projLabels.p14, icon: BarChart3 },
    { period: t.projLabels.d21, value: day21, bar: 70, label: t.projLabels.p21, icon: Zap },
    { period: t.projLabels.d30, value: day30, bar: 100, label: t.projLabels.p30, icon: Award },
  ];

  const profileItems = [
    { icon: User, label: t.lblName, value: firstName || "—" },
    { icon: Calendar, label: t.lblAge, value: ageLabel },
    { icon: DollarSign, label: t.lblGoal, value: goalLabel },
    { icon: Wallet, label: t.lblCapital, value: balanceLabel },
    { icon: DeviceIcon, label: t.lblDevice, value: deviceLabel },
    { icon: Clock, label: t.lblAvail, value: availLabel },
    { icon: AlertTriangle, label: t.lblChallenge, value: obstacleLabel },
  ].filter(item => (item.value !== "—" && item.value !== t.notInformed) || item.label === t.lblName);

  return (
    <StepContainer>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full text-center space-y-3">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">{t.kicker}</span>
        </motion.div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight">
          {t.planReadyA(firstName)}<span className="text-gradient-green">{t.planReadyBold}</span>{t.planReadyC}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.crossedA}<span className="text-primary font-bold">{t.crossedAlumni(alumniCount)}</span>{t.crossedC}
        </p>
      </motion.div>

      <GuaranteeBadge />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full rounded-2xl overflow-hidden border border-primary/15" style={{ background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--primary) / 0.04))" }}>
        <div className="px-4 py-3 border-b border-primary/10 flex items-center justify-between" style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <div className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-foreground">{t.profileTitle}</span></div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
            <Flame className="w-3.5 h-3.5 text-accent" /><span className="text-xs font-bold text-primary">{t.compat(compatScore)}</span>
          </motion.div>
        </div>
        <div className="p-4 space-y-2.5">
          {profileItems.map((item, i) => { const Icon = item.icon; return (
            <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-primary" /></div><span className="text-xs text-muted-foreground">{item.label}</span></div>
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </motion.div>
          ); })}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mx-4 mb-4 p-3 rounded-xl border border-accent/20" style={{ background: "hsl(var(--accent) / 0.08)" }}>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">{t.solutionFor(obstacleLabel.toLowerCase())}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{obstacleSolution}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="w-full rounded-2xl overflow-hidden border border-primary/15" style={{ background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--primary) / 0.03))" }}>
        <div className="px-4 py-3 border-b border-primary/10 flex items-center gap-2" style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <TrendingUp className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-foreground">{t.projTitle}</span>
        </div>
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t.calcA}<span className="font-semibold text-foreground">{goalLabel}</span>{t.calcMid}<span className="font-semibold text-foreground">{balanceLabel}</span>{t.calcMid2}<span className="font-semibold text-foreground">{availLabel}</span>{t.calcC}
          </p>
        </div>
        <div className="p-4 space-y-3.5">
          {projections.map((p, i) => { const Icon = p.icon; return (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.12, duration: 0.4 }} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-3 h-3 text-primary" /></div>
                  <span className="text-sm font-semibold text-foreground">{p.period}</span>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">— {p.label}</span>
                </div>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 + i * 0.12 }} className={`text-sm font-bold tabular-nums ${i === projections.length - 1 ? "text-primary text-base" : "text-foreground"}`}>
                  {money(p.value)}{t.perDay}
                </motion.span>
              </div>
              <div className="w-full h-3 bg-secondary/60 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${p.bar}%` }} transition={{ delay: 0.9 + i * 0.12, duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / ${0.35 + i * 0.15}))` }} />
              </div>
              <p className="text-[11px] text-muted-foreground sm:hidden">{p.label}</p>
            </motion.div>
          ); })}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="px-4 py-4 border-t border-primary/10" style={{ background: "hsl(var(--primary) / 0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Award className="w-5 h-5 text-accent" /><span className="text-sm font-bold text-foreground">{t.monthlyPotential}</span></div>
            <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.8, type: "spring" }} className="text-xl sm:text-2xl font-display font-black text-primary">
              {cur.sym}<AnimatedNumber target={monthly} delay={1800} />
            </motion.span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{t.monthlyNote(money(day30))}</p>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="w-full space-y-3">
        <div className="flex items-center gap-2 justify-center"><Users className="w-4 h-4 text-primary" /><h3 className="text-base font-bold text-foreground">{t.alumniAgeTitle(ageLabel)}</h3></div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: t.statGoal, value: `${successRate}%`, icon: Target },
            { label: t.statTime, value: t.statTimeVal, icon: Clock },
            { label: t.statOvercame(obstacleLabel.toLowerCase()), value: "96%", icon: Shield },
            { label: t.statSat, value: "4.8/5", icon: Star },
          ].map((stat, i) => { const Icon = stat.icon; return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 + i * 0.1 }} className="rounded-xl border border-border p-3 space-y-2 text-center" style={{ background: "hsl(var(--card))" }}>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><Icon className="w-4 h-4 text-primary" /></div>
              <p className="text-lg font-display font-black text-primary">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{stat.label}</p>
            </motion.div>
          ); })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="w-full flex items-center gap-3 rounded-xl p-3 border border-border bg-secondary/30">
        <div className="flex -space-x-2 shrink-0">{[avatarAntonio, avatarClaudia, avatarJose, avatarLucia, avatarRegina, avatarCarlos].slice(0, 5).map((av, i) => (<img key={i} src={av} alt="" className="w-7 h-7 rounded-full border-2 border-card object-cover" />))}</div>
        <p className="text-[11px] text-muted-foreground leading-snug"><span className="font-semibold text-foreground">{t.proofA(alumniCount)}</span>{t.proofB(ageLabel)}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }} className="w-full space-y-3">
        <h3 className="text-base font-bold text-foreground text-center">{t.securityTitleA}<span className="text-gradient-green">{t.securityBold}</span></h3>
        <div className="space-y-2.5">
          {t.guarantees.map((g, i) => { const Icon = [ShieldCheck, Users, CheckCircle][i]; const desc = (g as any).df ? (g as any).df(alumniCount, ageLabel) : (g as any).d; return (
            <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8 + i * 0.1 }} className="flex items-start gap-3 rounded-xl border border-primary/15 p-3.5" style={{ background: "hsl(var(--primary) / 0.03)" }}>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><Icon className="w-4 h-4 text-primary" /></div>
              <div className="space-y-0.5"><p className="font-bold text-sm text-foreground">{g.t}</p><p className="text-xs text-muted-foreground leading-relaxed">{desc}</p></div>
            </motion.div>
          ); })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.0 }} className="w-full space-y-3">
        <h3 className="text-base font-bold text-foreground text-center">{t.howTitleA}<span className="text-gradient-green">{t.howBold}</span></h3>
        {t.steps.map((item, i) => { const desc = (item as any).df ? (item as any).df(ageLabel) : (item as any).d; return (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.2 + i * 0.1 }} className="flex items-start gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent font-bold text-sm shrink-0 mt-0.5">{i + 1}</span>
            <div><p className="font-bold text-sm text-foreground">{item.t}</p><p className="text-xs text-muted-foreground leading-relaxed">{desc}</p></div>
          </motion.div>
        ); })}
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.4 }} className="w-full space-y-3 pt-2">
        <button onClick={onNext} className="w-full group relative overflow-hidden rounded-2xl py-5 px-6 font-extrabold text-lg tracking-wide cursor-pointer transition-all duration-300 active:scale-[0.97] bg-gradient-to-r from-accent via-amber-400 to-accent text-accent-foreground animate-bounce-subtle" style={{ boxShadow: "0 0 30px hsl(42 100% 55% / 0.35), 0 0 60px hsl(42 100% 55% / 0.15), 0 8px 25px rgba(0,0,0,0.3)" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
          <div className="relative flex items-center justify-center gap-3"><Zap className="w-6 h-6 shrink-0" /><span>{t.cta}</span><ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" /></div>
        </button>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /><span className="text-xs text-muted-foreground font-medium">{t.limitedOffer}</span></div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /><span className="text-xs text-muted-foreground font-medium">{t.guarantee30}</span></div>
        </div>
      </motion.div>

      <p className="text-[10px] text-muted-foreground/40 text-center pb-4">{t.disclaimer}</p>
    </StepContainer>
  );
};

export default StepProfileProjection;
