import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Crown, Diamond, Check, ArrowRight, Lock, TrendingUp, Zap, ChevronRight, Sparkles, AlertTriangle, Users, Home, Wallet, Trophy, Clock, Calendar, Timer, Target, Landmark, ShieldCheck, XCircle, CheckCircle2, Rocket, UserCheck } from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { useLanguage, type Language } from "@/lib/i18n";

import avatarCarlos from "@/assets/avatar-carlos.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarRegina from "@/assets/avatar-regina.jpg";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

// Modelo de moeda coerente p/ as projeções. PT em R$ (base 25/dia); EN/ES em US$ (base 5/dia).
const CUR: Record<Language, { sym: string; base: number; basicMonthly: number; goalDefault: number; per: string; perMonth: string }> = {
  pt: { sym: "R$", base: 25, basicMonthly: 750, goalDefault: 2000, per: "/dia", perMonth: "/mês" },
  en: { sym: "$", base: 5, basicMonthly: 150, goalDefault: 400, per: "/day", perMonth: "/mo" },
  es: { sym: "$", base: 5, basicMonthly: 150, goalDefault: 400, per: "/día", perMonth: "/mes" },
};

// Base de planos independente de idioma (id, ícone, fator, preço REAL cobrado, cores, link).
const BASE_PLANS = [
  { id: "prata", icon: Shield, multLabel: "5x", multFactor: 5, subtitleColor: "#94A3B8", price: 47, border: "1px solid rgba(255,255,255,0.08)", btnBg: "transparent", btnColor: "#94A3B8", btnBorder: "1.5px solid #94A3B8", badgeType: null, checkoutUrl: "https://pay.hub.la/HM7pfypVNJAhbx8uOzbA/upsell" },
  { id: "ouro", icon: Crown, multLabel: "10x", multFactor: 10, subtitleColor: "#FACC15", price: 67, border: "2px solid #FACC15", btnBg: "linear-gradient(135deg, #FACC15, #EAB308)", btnColor: "#020617", btnBorder: "none", badgeType: "popular", checkoutUrl: "https://pay.hub.la/GSSlN8AQjsZMky5sQUM3/upsell" },
  { id: "diamante", icon: Diamond, multLabel: "∞", multFactor: 20, subtitleColor: "#60A5FA", price: 97, border: "1px solid rgba(96,165,250,0.25)", btnBg: "linear-gradient(135deg, #3B82F6, #2563EB)", btnColor: "#fff", btnBorder: "none", badgeType: null, checkoutUrl: "https://pay.hub.la/h3lb933xw4EWRKtBt6Gs/upsell" },
] as const;

const T = {
  pt: {
    plans: {
      prata: { name: "Multiplicação Moderada", dailyChoose: null, installments: "5x de R$ 9,40", btnText: "ATIVAR MULTIPLICAÇÃO 5X", badge: null, description: "Seus juros compostos passam a operar 5x mais rápido, desbloqueando um novo limite diário maior. É como trocar da 1ª marcha pra 5ª — mais velocidade com segurança." },
      ouro: { name: "Multiplicação Avançada", dailyChoose: null, installments: "7x de R$ 9,57", btnText: "ATIVAR MULTIPLICAÇÃO 10X", badge: "MAIS ESCOLHIDO", description: "Juros compostos turbinados a 10x: a IA reinveste e multiplica seus ganhos 24h. Seus lucros crescem enquanto você dorme." },
      diamante: { name: "Multiplicação Ilimitada", dailyChoose: "Você escolhe", installments: "10x de R$ 9,70", btnText: "ATIVAR MULTIPLICAÇÃO ILIMITADA", badge: null, description: "Sem teto de multiplicação. Você define o quanto quer multiplicar seus ganhos. A IA opera 24h reinvestindo no seu potencial máximo + relatório semanal no WhatsApp." },
    },
    q1: [{ id: "conservador", label: "CONSERVADOR", desc: "Prefiro crescer de forma segura, mesmo que seja mais devagar", Icon: Shield }, { id: "equilibrado", label: "EQUILIBRADO", desc: "Quero equilíbrio entre segurança e crescimento rápido", Icon: Zap }, { id: "agressivo", label: "AGRESSIVO", desc: "Quero retornos máximos no menor tempo possível", Icon: TrendingUp }],
    q2: [{ id: "endividado", label: "ENDIVIDADO", desc: "Tenho dívidas que preciso pagar urgentemente", Icon: Wallet }, { id: "estavel", label: "ESTÁVEL MAS LIMITADO", desc: "Pago as contas mas sobra pouco ou nada", Icon: Landmark }, { id: "confortavel", label: "CONFORTÁVEL", desc: "Tenho reservas e quero multiplicar meu dinheiro", Icon: TrendingUp }],
    q3: [{ id: "contas", label: "PAGAR DÍVIDAS", desc: "Quero me livrar das dívidas e respirar tranquilo", Icon: Home }, { id: "renda", label: "RENDA EXTRA", desc: "Quero ganhar mais por mês para viver melhor", Icon: Landmark }, { id: "liberdade", label: "LIBERDADE FINANCEIRA", desc: "Quero parar de trabalhar e viver dos meus ganhos", Icon: Trophy }, { id: "familia", label: "DEIXAR UM LEGADO", desc: "Quero dar segurança financeira pra minha família", Icon: Users }],
    q4: [{ id: "30dias", label: "EM 30 DIAS", desc: "O mais rápido possível", Icon: Zap }, { id: "urgente", label: "MENOS DE 6 MESES", desc: "Urgente", Icon: Timer }, { id: "medio", label: "6 A 12 MESES", desc: "Médio prazo", Icon: Calendar }, { id: "longo", label: "1 A 2 ANOS", desc: "Longo prazo", Icon: Clock }],
    conf: {
      profile: { title: "✓ Perfil identificado!", map: { conservador: "Os investidores CONSERVADORES são pessoas que preferem crescer com segurança e constância.", equilibrado: "Os investidores EQUILIBRADOS buscam o ponto ideal entre segurança e crescimento acelerado.", agressivo: "Os investidores AGRESSIVOS buscam retornos máximos e estão prontos para acelerar." }, enc: "Perfeito!" },
      situation: { title: "✓ Situação mapeada!", map: { endividado: "Você está ENDIVIDADO, o que significa que precisa de resultados rápidos. Multiplicar seus ganhos pode mudar essa situação por completo.", estavel: "Você está ESTÁVEL MAS LIMITADO, o que significa que paga as contas mas sobra pouco. Multiplicar seus ganhos muda essa equação por completo.", confortavel: "Você está CONFORTÁVEL e quer multiplicar o que já tem. Esse é o cenário ideal para acelerar." }, enc: "Vamos acelerar isso." },
      goal: { title: "✓ Meta definida!", map: { contas: "Pagar dívidas é alcançável quando você para de apenas GANHAR e começa a MULTIPLICAR.", renda: "Renda extra é alcançável quando você para de apenas GANHAR e começa a MULTIPLICAR.", liberdade: "Liberdade financeira é alcançável quando você para de apenas GANHAR e começa a MULTIPLICAR.", familia: "Deixar um legado é alcançável quando você para de apenas GANHAR e começa a MULTIPLICAR." }, enc: "" },
    },
    goalLbl: { contas: "Pagar dívidas", renda: "Renda extra", liberdade: "Liberdade financeira", familia: "Deixar um legado" },
    timeLbl: { "30dias": "30 dias", urgente: "menos de 6 meses", medio: "6 a 12 meses", longo: "1 a 2 anos" },
    profLbl: { conservador: "CONSERVADOR", equilibrado: "EQUILIBRADO", agressivo: "AGRESSIVO" },
    sitLbl: { endividado: "ENDIVIDADO", estavel: "ESTÁVEL MAS LIMITADO", confortavel: "CONFORTÁVEL" },
    monthWord: "mês", monthsWord: "meses", yearWord: "ano", yearsWord: "anos", moreThan3y: "mais de 3 anos", lessThan1Month: "menos de 1 mês",
    qOf: (n: number, tot: number) => `Pergunta ${n} de ${tot}`, nextQuestion: "PRÓXIMA PERGUNTA",
    q1Title: "Que tipo de investidor você é?", q2Title: "Qual é a sua situação financeira hoje?", q3Title: "Qual é a sua MAIOR meta financeira?", q4Title: "Em quanto tempo você quer alcançar sua meta?",
    s1Active: "ACELERADOR ATIVO", s1ActiveSub: "Plano base configurado com sucesso",
    s1H1: (n: string) => (n ? `${n}, falta apenas 1 etapa` : "Falta apenas 1 etapa"),
    s1LeadA: "Precisamos ", s1LeadBold1: "completar a ativação", s1LeadMid: " da sua conta e configurar o seu ", s1LeadBold2: "limite diário de ganhos", s1LeadC: ".",
    s1Done: "Concluído", s1Pending: "Pendente", s1Created: "Conta criada", s1AccelOn: "Acelerador ativado", s1Configure: "Configurar limite de ganhos",
    s1Under1min: "Leva menos de 1 minuto", s1Cta: "COMPLETAR ATIVAÇÃO",
    s2Title: "COMPLETE SEU REGISTRO", s2Sub: "Para ativar sua conta na plataforma, precisamos de alguns dados:", s2Label: "Seu primeiro nome", s2Ph: "Ex: Carlos", s2Cta: "CONTINUAR",
    s8LabelDefault: "Quanto você quer ganhar por mês?", s8LabelContas: "Quanto você quer ganhar por mês para quitar suas dívidas?", s8LabelFamilia: "Quanto você quer ganhar por mês para sua família?", s8Note: "Valor mensal que você deseja alcançar",
    s10Prazo: "✓ Prazo estabelecido!", s10Analyzing: "Analisando seu perfil...", s10Profile: "Perfil", s10Situation: "Situação", s10Goal: "Meta:", s10Timeline: "Prazo:",
    s11H1: (n: string) => `${n}, aqui está seu plano:`, s11ForA: "Para alcançar ", s11ForMid: " em ", s11ForEnd: "...", s11Need: "Você precisa gerar:",
    s11RealTitle: "Realidade atual", s11BasicA: "Com a IA básica, você gera no ", s11BasicBold: (m: string) => `máximo ${m}`, s11ToReachA: "Para atingir ", s11ToReachMid: " levaria: ", s11TooFar: (t: string) => `Isso está MUITO LONGE da sua meta de ${t}.`,
    s11CalmTitle: (n: string) => `Mas calma, ${n}. Tenho uma solução.`, s11CalmA: "Existe uma forma de ", s11CalmBold: "acelerar drasticamente", s11CalmC: " esse tempo. Vou te mostrar agora.", s11Cta: "VER A SOLUÇÃO",
    s12H1: (n: string) => n, s12Problem: "PROBLEMA", s12ProblemPre: "existe um ", s12ProblemPost: " no seu sistema.",
    s12GoalA: "Sua meta: ", s12ModeA: "Mas sua IA está em ", s12ModeBold: "MODO BÁSICO", s12ModeC: ".", s12GenA: "Ela gera ganhos... mas não os ", s12GenBold: "MULTIPLICA", s12GenC: ".",
    s12CarA: "É como ter um carro potente mas só andar em ", s12CarBold: "1ª marcha", s12CarC: ".",
    s12LimitA: (lim: string, mo: string) => `Com o limite de `, s12Limit1: "", s12Far: "Está MUITO LONGE do que você precisa.", s12Cta: "VER A SOLUÇÃO",
    s13SecondAi: "Existe uma segunda IA na Plataforma de Ganhos.", s13Few: "Poucos membros sabem que ela existe.", s13Called: "Ela se chama:", s13MultAi: "MULTIPLICADOR DE IA", s13Works: "E funciona assim:",
    s13BasicTitle: "IA BÁSICA:", s13Basic1: "→ Analisa o mercado", s13Basic2: "→ Gera ganhos diários", s13Basic3pre: "→ ", s13Basic3suf: " constante",
    s13MultTitle: "MULTIPLICADOR DE IA:", s13Mult1: "→ Pega esses ganhos", s13Mult2: "→ Multiplica exponencialmente", s13Mult3pre: "→ ", s13Mult3bold: "Crescimento acelerado", s13Cta: "VER A DIFERENÇA",
    s14H1: (n: string) => `${n}, VEJA A DIFERENÇA:`, s14Without: "SEM Multiplicador", s14With: "COM Multiplicador", s14Month: "Mês", s14GoalReached: (n: string, m: number) => `← ${n}, META ALCANÇADA NO MÊS ${m}!`, s14WithoutChart: "Sem Multiplicador", s14WithChart: "Com Multiplicador", s14Cta: "COMO ISSO É POSSÍVEL?",
    s15H1a: (n: string) => `${n}, veja a diferença `, s15H1green: "com o Multiplicador", s15H1c: ":", s15Period: "Período", s15SemShort: "Sem", s15ComShort: "Com Mult.",
    s15In3A: "Em 3 meses você ganharia", s15In3B: (v: string) => `+${v} a mais`, s15In3C: "Graças ao efeito de juros compostos aplicados pela IA", s15Cta: "COMO ATIVAR ISSO?",
    s15Periods: ["1 semana", "15 dias", "1 mês", "2 meses", "3 meses"],
    s16H1: '"Por que o Multiplicador não vem ativado?"', s16WhyA: "Porque o Multiplicador consome ", s16WhyBold: "5x mais recursos", s16WhyC: ":",
    s16R1: "Processa operações extras", s16R2: "Calcula multiplicações em tempo real", s16R3: "Monitora o saldo 24/7", s16IfA: "Se ativássemos pra todos...", s16IfBold: "Nossos custos explodiriam.", s16OptionalA: "Por isso mantemos como uma melhoria ", s16OptionalBold: "OPCIONAL", s16OptionalC: ".", s16Cta: "QUANTO CUSTA?",
    s17H1a: (n: string) => `${n ? `${n}, o seu` : "O seu"} sistema tá `, s17H1red: "travado em R$25 por dia", s17H1red_en: "", s17SubA: "Isso dá ", s17SubBold1: (m: string) => m, s17SubMid: " no mês. Sua meta é ", s17SubBold2: (g: string) => g, s17SubMid2: ". Nesse ritmo, são ", s17SubBold3: (t: string) => t, s17SubEnd: ".",
    s17NoWait: (t: string) => `Você não vai esperar ${t}.`, s17OneA: "Em ", s17OneBold1: "um pagamento", s17OneMid: ", a IA sobe o limite. ", s17OneBold2: "Você não opera — ela opera 24h.", s17OneC: " Relatório no WhatsApp.", s17Micro: "Pagamento único · Sem mensalidade · Garantia 30 dias",
    s17ColToday: "Hoje", s17RowLimit: "Limite por dia", s17RowMonth: "No mês", s17RowReach: "Pra chegar na sua meta", s17RowWho: "Quem opera", s17RowYouDo: "Você faz", s17RowPayOnce: "Paga uma vez",
    s17WhoToday: "Você, no básico", s17WhoAi: "IA 24h", s17WhoAiNoCap: "IA 24h, sem teto", s17Nothing: "Nada",
    s17CompoundInterest: "juros compostos", s17NewDaily: "novo limite diário", s17YourMult: "sua multiplicação personalizada", s17ReachA: "Alcança sua meta de ", s17ReachMid: " em ", s17IdealBadge: "IDEAL PRO SEU PERFIL", s17PayOnceGuar: "Pagamento único • Garantia 30 dias", s17OrWord: "ou",
    s17DiamanteFaster: (m: number) => `${m}x mais rápido que no modo básico`,
    s17ProofA: "2.847 pessoas", s17ProofB: " já aumentaram o limite", s17GuarLink: "Quero saber sobre a garantia primeiro",
    s18Title: "+ Garantia de 30 Dias", s18L1: "Ative agora.", s18L2a: "Teste por ", s18L2b: "30 dias", s18L2c: ".", s18L3a: "Não gostou? ", s18L3bold: "Devolvemos 100% do valor", s18L3c: ".", s18L4: "Sem perguntas. Sem complicações.", s18Cta: "ATIVAR MULTIPLICADOR DE IA", s18Doubts: "Ainda tenho dúvidas",
    s19Title: "ÚLTIMA OPORTUNIDADE", s19A: "Esta oferta está ", s19Bold: "disponível apenas AGORA", s19C: ".", s19Leave: "Sair desta página = perder o acesso permanentemente.", s19Cta: "ATIVAR MULTIPLICADOR DE IA", s19Secure: "Pagamento seguro • Criptografia SSL", s19Decline: "Não, quero continuar sem multiplicar",
  },
  en: {
    plans: {
      prata: { name: "Moderate Multiplication", dailyChoose: null, installments: "5x $1.80", btnText: "ACTIVATE 5X MULTIPLICATION", badge: null, description: "Your compound interest starts running 5x faster, unlocking a higher daily limit. It's like shifting from 1st gear to 5th — more speed, still safe." },
      ouro: { name: "Advanced Multiplication", dailyChoose: null, installments: "7x $1.90", btnText: "ACTIVATE 10X MULTIPLICATION", badge: "MOST CHOSEN", description: "Compound interest turbocharged to 10x: the AI reinvests and multiplies your earnings 24/7. Your profits grow while you sleep." },
      diamante: { name: "Unlimited Multiplication", dailyChoose: "You choose", installments: "10x $1.90", btnText: "ACTIVATE UNLIMITED MULTIPLICATION", badge: null, description: "No multiplication ceiling. You decide how much to multiply your earnings. The AI runs 24/7 reinvesting at your maximum potential + a weekly WhatsApp report." },
    },
    q1: [{ id: "conservador", label: "CONSERVATIVE", desc: "I'd rather grow safely, even if it's slower", Icon: Shield }, { id: "equilibrado", label: "BALANCED", desc: "I want a balance between safety and fast growth", Icon: Zap }, { id: "agressivo", label: "AGGRESSIVE", desc: "I want maximum returns in the least time possible", Icon: TrendingUp }],
    q2: [{ id: "endividado", label: "IN DEBT", desc: "I have debts I urgently need to pay", Icon: Wallet }, { id: "estavel", label: "STABLE BUT TIGHT", desc: "I pay the bills but little or nothing is left", Icon: Landmark }, { id: "confortavel", label: "COMFORTABLE", desc: "I have savings and want to multiply my money", Icon: TrendingUp }],
    q3: [{ id: "contas", label: "PAY OFF DEBT", desc: "I want to get out of debt and breathe easy", Icon: Home }, { id: "renda", label: "EXTRA INCOME", desc: "I want to earn more each month to live better", Icon: Landmark }, { id: "liberdade", label: "FINANCIAL FREEDOM", desc: "I want to stop working and live off my earnings", Icon: Trophy }, { id: "familia", label: "LEAVE A LEGACY", desc: "I want to give my family financial security", Icon: Users }],
    q4: [{ id: "30dias", label: "IN 30 DAYS", desc: "As fast as possible", Icon: Zap }, { id: "urgente", label: "LESS THAN 6 MONTHS", desc: "Urgent", Icon: Timer }, { id: "medio", label: "6 TO 12 MONTHS", desc: "Medium term", Icon: Calendar }, { id: "longo", label: "1 TO 2 YEARS", desc: "Long term", Icon: Clock }],
    conf: {
      profile: { title: "✓ Profile identified!", map: { conservador: "CONSERVATIVE investors are people who prefer to grow safely and steadily.", equilibrado: "BALANCED investors look for the sweet spot between safety and accelerated growth.", agressivo: "AGGRESSIVE investors chase maximum returns and are ready to accelerate." }, enc: "Perfect!" },
      situation: { title: "✓ Situation mapped!", map: { endividado: "You're IN DEBT, which means you need fast results. Multiplying your earnings can change this completely.", estavel: "You're STABLE BUT TIGHT, which means you pay the bills but little is left. Multiplying your earnings changes that equation completely.", confortavel: "You're COMFORTABLE and want to multiply what you already have. That's the ideal scenario to accelerate." }, enc: "Let's accelerate this." },
      goal: { title: "✓ Goal set!", map: { contas: "Paying off debt is reachable when you stop just EARNING and start MULTIPLYING.", renda: "Extra income is reachable when you stop just EARNING and start MULTIPLYING.", liberdade: "Financial freedom is reachable when you stop just EARNING and start MULTIPLYING.", familia: "Leaving a legacy is reachable when you stop just EARNING and start MULTIPLYING." }, enc: "" },
    },
    goalLbl: { contas: "Pay off debt", renda: "Extra income", liberdade: "Financial freedom", familia: "Leave a legacy" },
    timeLbl: { "30dias": "30 days", urgente: "less than 6 months", medio: "6 to 12 months", longo: "1 to 2 years" },
    profLbl: { conservador: "CONSERVATIVE", equilibrado: "BALANCED", agressivo: "AGGRESSIVE" },
    sitLbl: { endividado: "IN DEBT", estavel: "STABLE BUT TIGHT", confortavel: "COMFORTABLE" },
    monthWord: "month", monthsWord: "months", yearWord: "year", yearsWord: "years", moreThan3y: "more than 3 years", lessThan1Month: "less than 1 month",
    qOf: (n: number, tot: number) => `Question ${n} of ${tot}`, nextQuestion: "NEXT QUESTION",
    q1Title: "What kind of investor are you?", q2Title: "What's your financial situation today?", q3Title: "What's your BIGGEST financial goal?", q4Title: "How soon do you want to reach your goal?",
    s1Active: "ACCELERATOR ACTIVE", s1ActiveSub: "Base plan set up successfully",
    s1H1: (n: string) => (n ? `${n}, just 1 step left` : "Just 1 step left"),
    s1LeadA: "We need to ", s1LeadBold1: "finish activating", s1LeadMid: " your account and set your ", s1LeadBold2: "daily earnings limit", s1LeadC: ".",
    s1Done: "Done", s1Pending: "Pending", s1Created: "Account created", s1AccelOn: "Accelerator activated", s1Configure: "Set earnings limit",
    s1Under1min: "Takes less than 1 minute", s1Cta: "FINISH ACTIVATION",
    s2Title: "COMPLETE YOUR SIGN-UP", s2Sub: "To activate your account on the platform, we need a few details:", s2Label: "Your first name", s2Ph: "e.g. Carlos", s2Cta: "CONTINUE",
    s8LabelDefault: "How much do you want to earn per month?", s8LabelContas: "How much do you want to earn per month to clear your debts?", s8LabelFamilia: "How much do you want to earn per month for your family?", s8Note: "Monthly amount you want to reach",
    s10Prazo: "✓ Timeline set!", s10Analyzing: "Analyzing your profile...", s10Profile: "Profile", s10Situation: "Situation", s10Goal: "Goal:", s10Timeline: "Timeline:",
    s11H1: (n: string) => `${n}, here's your plan:`, s11ForA: "To reach ", s11ForMid: " in ", s11ForEnd: "...", s11Need: "You need to generate:",
    s11RealTitle: "Current reality", s11BasicA: "With the basic AI, you generate at ", s11BasicBold: (m: string) => `most ${m}`, s11ToReachA: "To hit ", s11ToReachMid: " would take: ", s11TooFar: (t: string) => `That's WAY OFF from your goal of ${t}.`,
    s11CalmTitle: (n: string) => `But relax, ${n}. I have a solution.`, s11CalmA: "There's a way to ", s11CalmBold: "drastically speed up", s11CalmC: " that timeline. Let me show you now.", s11Cta: "SEE THE SOLUTION",
    s12H1: (n: string) => n, s12Problem: "PROBLEM", s12ProblemPre: "there's a ", s12ProblemPost: " in your system.",
    s12GoalA: "Your goal: ", s12ModeA: "But your AI is in ", s12ModeBold: "BASIC MODE", s12ModeC: ".", s12GenA: "It generates earnings... but doesn't ", s12GenBold: "MULTIPLY", s12GenC: " them.",
    s12CarA: "It's like having a powerful car but only driving in ", s12CarBold: "1st gear", s12CarC: ".",
    s12LimitA: (lim: string, mo: string) => `With the limit of `, s12Limit1: "", s12Far: "It's WAY OFF from what you need.", s12Cta: "SEE THE SOLUTION",
    s13SecondAi: "There's a second AI in the Earnings Platform.", s13Few: "Few members know it exists.", s13Called: "It's called:", s13MultAi: "AI MULTIPLIER", s13Works: "And it works like this:",
    s13BasicTitle: "BASIC AI:", s13Basic1: "→ Analyzes the market", s13Basic2: "→ Generates daily earnings", s13Basic3pre: "→ ", s13Basic3suf: " steady",
    s13MultTitle: "AI MULTIPLIER:", s13Mult1: "→ Takes those earnings", s13Mult2: "→ Multiplies them exponentially", s13Mult3pre: "→ ", s13Mult3bold: "Accelerated growth", s13Cta: "SEE THE DIFFERENCE",
    s14H1: (n: string) => `${n}, SEE THE DIFFERENCE:`, s14Without: "WITHOUT Multiplier", s14With: "WITH Multiplier", s14Month: "Month", s14GoalReached: (n: string, m: number) => `← ${n}, GOAL REACHED IN MONTH ${m}!`, s14WithoutChart: "Without Multiplier", s14WithChart: "With Multiplier", s14Cta: "HOW IS THIS POSSIBLE?",
    s15H1a: (n: string) => `${n}, see the difference `, s15H1green: "with the Multiplier", s15H1c: ":", s15Period: "Period", s15SemShort: "Without", s15ComShort: "With Mult.",
    s15In3A: "In 3 months you'd earn", s15In3B: (v: string) => `+${v} more`, s15In3C: "Thanks to the compound-interest effect applied by the AI", s15Cta: "HOW DO I ACTIVATE THIS?",
    s15Periods: ["1 week", "15 days", "1 month", "2 months", "3 months"],
    s16H1: '"Why isn\'t the Multiplier on by default?"', s16WhyA: "Because the Multiplier uses ", s16WhyBold: "5x more resources", s16WhyC: ":",
    s16R1: "Processes extra operations", s16R2: "Calculates multiplications in real time", s16R3: "Monitors your balance 24/7", s16IfA: "If we turned it on for everyone...", s16IfBold: "Our costs would explode.", s16OptionalA: "That's why we keep it as an ", s16OptionalBold: "OPTIONAL", s16OptionalC: " upgrade.", s16Cta: "HOW MUCH IS IT?",
    s17H1a: (n: string) => `${n ? `${n}, your` : "Your"} system is `, s17H1red: "stuck at $5 a day", s17H1red_en: "", s17SubA: "That's ", s17SubBold1: (m: string) => m, s17SubMid: " a month. Your goal is ", s17SubBold2: (g: string) => g, s17SubMid2: ". At this pace, that's ", s17SubBold3: (t: string) => t, s17SubEnd: ".",
    s17NoWait: (t: string) => `You won't wait ${t}.`, s17OneA: "In ", s17OneBold1: "one payment", s17OneMid: ", the AI raises the limit. ", s17OneBold2: "You don't trade — it trades 24/7.", s17OneC: " Report on WhatsApp.", s17Micro: "One-time payment · No monthly fee · 30-day guarantee",
    s17ColToday: "Today", s17RowLimit: "Limit per day", s17RowMonth: "Per month", s17RowReach: "To hit your goal", s17RowWho: "Who trades", s17RowYouDo: "You do", s17RowPayOnce: "Pay once",
    s17WhoToday: "You, on basic", s17WhoAi: "AI 24/7", s17WhoAiNoCap: "AI 24/7, no cap", s17Nothing: "Nothing",
    s17CompoundInterest: "compound interest", s17NewDaily: "new daily limit", s17YourMult: "your custom multiplication", s17ReachA: "Reaches your goal of ", s17ReachMid: " in ", s17IdealBadge: "IDEAL FOR YOUR PROFILE", s17PayOnceGuar: "One-time payment • 30-day guarantee", s17OrWord: "or",
    s17DiamanteFaster: (m: number) => `${m}x faster than basic mode`,
    s17ProofA: "2,847 people", s17ProofB: " have already raised their limit", s17GuarLink: "I want to hear about the guarantee first",
    s18Title: "+ 30-Day Guarantee", s18L1: "Activate now.", s18L2a: "Test it for ", s18L2b: "30 days", s18L2c: ".", s18L3a: "Not happy? ", s18L3bold: "We refund 100%", s18L3c: ".", s18L4: "No questions. No hassle.", s18Cta: "ACTIVATE AI MULTIPLIER", s18Doubts: "I still have doubts",
    s19Title: "LAST CHANCE", s19A: "This offer is ", s19Bold: "available only NOW", s19C: ".", s19Leave: "Leaving this page = losing access permanently.", s19Cta: "ACTIVATE AI MULTIPLIER", s19Secure: "Secure payment • SSL encryption", s19Decline: "No, I'll keep going without multiplying",
  },
  es: {
    plans: {
      prata: { name: "Multiplicación Moderada", dailyChoose: null, installments: "5x $1,80", btnText: "ACTIVAR MULTIPLICACIÓN 5X", badge: null, description: "Tu interés compuesto empieza a operar 5x más rápido, desbloqueando un límite diario mayor. Es como pasar de 1ra a 5ta — más velocidad, con seguridad." },
      ouro: { name: "Multiplicación Avanzada", dailyChoose: null, installments: "7x $1,90", btnText: "ACTIVAR MULTIPLICACIÓN 10X", badge: "MÁS ELEGIDO", description: "Interés compuesto turbo a 10x: la IA reinvierte y multiplica tus ganancias 24h. Tus ganancias crecen mientras duermes." },
      diamante: { name: "Multiplicación Ilimitada", dailyChoose: "Tú eliges", installments: "10x $1,90", btnText: "ACTIVAR MULTIPLICACIÓN ILIMITADA", badge: null, description: "Sin techo de multiplicación. Tú defines cuánto multiplicar tus ganancias. La IA opera 24h reinvirtiendo en tu potencial máximo + reporte semanal en WhatsApp." },
    },
    q1: [{ id: "conservador", label: "CONSERVADOR", desc: "Prefiero crecer de forma segura, aunque sea más lento", Icon: Shield }, { id: "equilibrado", label: "EQUILIBRADO", desc: "Quiero equilibrio entre seguridad y crecimiento rápido", Icon: Zap }, { id: "agressivo", label: "AGRESIVO", desc: "Quiero retornos máximos en el menor tiempo posible", Icon: TrendingUp }],
    q2: [{ id: "endividado", label: "ENDEUDADO", desc: "Tengo deudas que necesito pagar urgente", Icon: Wallet }, { id: "estavel", label: "ESTABLE PERO LIMITADO", desc: "Pago las cuentas pero sobra poco o nada", Icon: Landmark }, { id: "confortavel", label: "CÓMODO", desc: "Tengo reservas y quiero multiplicar mi dinero", Icon: TrendingUp }],
    q3: [{ id: "contas", label: "PAGAR DEUDAS", desc: "Quiero librarme de las deudas y respirar tranquilo", Icon: Home }, { id: "renda", label: "INGRESO EXTRA", desc: "Quiero ganar más por mes para vivir mejor", Icon: Landmark }, { id: "liberdade", label: "LIBERTAD FINANCIERA", desc: "Quiero dejar de trabajar y vivir de mis ganancias", Icon: Trophy }, { id: "familia", label: "DEJAR UN LEGADO", desc: "Quiero darle seguridad financiera a mi familia", Icon: Users }],
    q4: [{ id: "30dias", label: "EN 30 DÍAS", desc: "Lo más rápido posible", Icon: Zap }, { id: "urgente", label: "MENOS DE 6 MESES", desc: "Urgente", Icon: Timer }, { id: "medio", label: "6 A 12 MESES", desc: "Mediano plazo", Icon: Calendar }, { id: "longo", label: "1 A 2 AÑOS", desc: "Largo plazo", Icon: Clock }],
    conf: {
      profile: { title: "✓ ¡Perfil identificado!", map: { conservador: "Los inversores CONSERVADORES son personas que prefieren crecer con seguridad y constancia.", equilibrado: "Los inversores EQUILIBRADOS buscan el punto ideal entre seguridad y crecimiento acelerado.", agressivo: "Los inversores AGRESIVOS buscan retornos máximos y están listos para acelerar." }, enc: "¡Perfecto!" },
      situation: { title: "✓ ¡Situación mapeada!", map: { endividado: "Estás ENDEUDADO, lo que significa que necesitas resultados rápidos. Multiplicar tus ganancias puede cambiar esto por completo.", estavel: "Estás ESTABLE PERO LIMITADO, lo que significa que pagas las cuentas pero sobra poco. Multiplicar tus ganancias cambia esa ecuación por completo.", confortavel: "Estás CÓMODO y quieres multiplicar lo que ya tienes. Ese es el escenario ideal para acelerar." }, enc: "Vamos a acelerar esto." },
      goal: { title: "✓ ¡Meta definida!", map: { contas: "Pagar deudas es alcanzable cuando dejas de solo GANAR y empiezas a MULTIPLICAR.", renda: "El ingreso extra es alcanzable cuando dejas de solo GANAR y empiezas a MULTIPLICAR.", liberdade: "La libertad financiera es alcanzable cuando dejas de solo GANAR y empiezas a MULTIPLICAR.", familia: "Dejar un legado es alcanzable cuando dejas de solo GANAR y empiezas a MULTIPLICAR." }, enc: "" },
    },
    goalLbl: { contas: "Pagar deudas", renda: "Ingreso extra", liberdade: "Libertad financiera", familia: "Dejar un legado" },
    timeLbl: { "30dias": "30 días", urgente: "menos de 6 meses", medio: "6 a 12 meses", longo: "1 a 2 años" },
    profLbl: { conservador: "CONSERVADOR", equilibrado: "EQUILIBRADO", agressivo: "AGRESIVO" },
    sitLbl: { endividado: "ENDEUDADO", estavel: "ESTABLE PERO LIMITADO", confortavel: "CÓMODO" },
    monthWord: "mes", monthsWord: "meses", yearWord: "año", yearsWord: "años", moreThan3y: "más de 3 años", lessThan1Month: "menos de 1 mes",
    qOf: (n: number, tot: number) => `Pregunta ${n} de ${tot}`, nextQuestion: "SIGUIENTE PREGUNTA",
    q1Title: "¿Qué tipo de inversor eres?", q2Title: "¿Cuál es tu situación financiera hoy?", q3Title: "¿Cuál es tu MAYOR meta financiera?", q4Title: "¿En cuánto tiempo quieres alcanzar tu meta?",
    s1Active: "ACELERADOR ACTIVO", s1ActiveSub: "Plan base configurado con éxito",
    s1H1: (n: string) => (n ? `${n}, falta solo 1 paso` : "Falta solo 1 paso"),
    s1LeadA: "Necesitamos ", s1LeadBold1: "completar la activación", s1LeadMid: " de tu cuenta y configurar tu ", s1LeadBold2: "límite diario de ganancias", s1LeadC: ".",
    s1Done: "Completado", s1Pending: "Pendiente", s1Created: "Cuenta creada", s1AccelOn: "Acelerador activado", s1Configure: "Configurar límite de ganancias",
    s1Under1min: "Toma menos de 1 minuto", s1Cta: "COMPLETAR ACTIVACIÓN",
    s2Title: "COMPLETA TU REGISTRO", s2Sub: "Para activar tu cuenta en la plataforma, necesitamos algunos datos:", s2Label: "Tu primer nombre", s2Ph: "Ej: Carlos", s2Cta: "CONTINUAR",
    s8LabelDefault: "¿Cuánto quieres ganar por mes?", s8LabelContas: "¿Cuánto quieres ganar por mes para saldar tus deudas?", s8LabelFamilia: "¿Cuánto quieres ganar por mes para tu familia?", s8Note: "Monto mensual que deseas alcanzar",
    s10Prazo: "✓ ¡Plazo establecido!", s10Analyzing: "Analizando tu perfil...", s10Profile: "Perfil", s10Situation: "Situación", s10Goal: "Meta:", s10Timeline: "Plazo:",
    s11H1: (n: string) => `${n}, aquí está tu plan:`, s11ForA: "Para alcanzar ", s11ForMid: " en ", s11ForEnd: "...", s11Need: "Necesitas generar:",
    s11RealTitle: "Realidad actual", s11BasicA: "Con la IA básica, generas como ", s11BasicBold: (m: string) => `máximo ${m}`, s11ToReachA: "Para llegar a ", s11ToReachMid: " tardarías: ", s11TooFar: (t: string) => `Eso está MUY LEJOS de tu meta de ${t}.`,
    s11CalmTitle: (n: string) => `Pero tranquilo, ${n}. Tengo una solución.`, s11CalmA: "Hay una forma de ", s11CalmBold: "acelerar drásticamente", s11CalmC: " ese tiempo. Te la muestro ahora.", s11Cta: "VER LA SOLUCIÓN",
    s12H1: (n: string) => n, s12Problem: "PROBLEMA", s12ProblemPre: "existe un ", s12ProblemPost: " en tu sistema.",
    s12GoalA: "Tu meta: ", s12ModeA: "Pero tu IA está en ", s12ModeBold: "MODO BÁSICO", s12ModeC: ".", s12GenA: "Genera ganancias... pero no las ", s12GenBold: "MULTIPLICA", s12GenC: ".",
    s12CarA: "Es como tener un auto potente pero andar solo en ", s12CarBold: "1ra marcha", s12CarC: ".",
    s12LimitA: (lim: string, mo: string) => `Con el límite de `, s12Limit1: "", s12Far: "Está MUY LEJOS de lo que necesitas.", s12Cta: "VER LA SOLUCIÓN",
    s13SecondAi: "Existe una segunda IA en la Plataforma de Ganancias.", s13Few: "Pocos miembros saben que existe.", s13Called: "Se llama:", s13MultAi: "MULTIPLICADOR DE IA", s13Works: "Y funciona así:",
    s13BasicTitle: "IA BÁSICA:", s13Basic1: "→ Analiza el mercado", s13Basic2: "→ Genera ganancias diarias", s13Basic3pre: "→ ", s13Basic3suf: " constante",
    s13MultTitle: "MULTIPLICADOR DE IA:", s13Mult1: "→ Toma esas ganancias", s13Mult2: "→ Las multiplica exponencialmente", s13Mult3pre: "→ ", s13Mult3bold: "Crecimiento acelerado", s13Cta: "VER LA DIFERENCIA",
    s14H1: (n: string) => `${n}, MIRA LA DIFERENCIA:`, s14Without: "SIN Multiplicador", s14With: "CON Multiplicador", s14Month: "Mes", s14GoalReached: (n: string, m: number) => `← ${n}, ¡META ALCANZADA EN EL MES ${m}!`, s14WithoutChart: "Sin Multiplicador", s14WithChart: "Con Multiplicador", s14Cta: "¿CÓMO ES POSIBLE?",
    s15H1a: (n: string) => `${n}, mira la diferencia `, s15H1green: "con el Multiplicador", s15H1c: ":", s15Period: "Período", s15SemShort: "Sin", s15ComShort: "Con Mult.",
    s15In3A: "En 3 meses ganarías", s15In3B: (v: string) => `+${v} más`, s15In3C: "Gracias al efecto de interés compuesto aplicado por la IA", s15Cta: "¿CÓMO ACTIVO ESTO?",
    s15Periods: ["1 semana", "15 días", "1 mes", "2 meses", "3 meses"],
    s16H1: '"¿Por qué el Multiplicador no viene activado?"', s16WhyA: "Porque el Multiplicador consume ", s16WhyBold: "5x más recursos", s16WhyC: ":",
    s16R1: "Procesa operaciones extra", s16R2: "Calcula multiplicaciones en tiempo real", s16R3: "Monitorea el saldo 24/7", s16IfA: "Si lo activáramos para todos...", s16IfBold: "Nuestros costos explotarían.", s16OptionalA: "Por eso lo mantenemos como una mejora ", s16OptionalBold: "OPCIONAL", s16OptionalC: ".", s16Cta: "¿CUÁNTO CUESTA?",
    s17H1a: (n: string) => `${n ? `${n}, tu` : "Tu"} sistema está `, s17H1red: "atascado en $5 por día", s17H1red_en: "", s17SubA: "Eso da ", s17SubBold1: (m: string) => m, s17SubMid: " al mes. Tu meta es ", s17SubBold2: (g: string) => g, s17SubMid2: ". A este ritmo, son ", s17SubBold3: (t: string) => t, s17SubEnd: ".",
    s17NoWait: (t: string) => `No vas a esperar ${t}.`, s17OneA: "En ", s17OneBold1: "un pago", s17OneMid: ", la IA sube el límite. ", s17OneBold2: "Tú no operas — ella opera 24h.", s17OneC: " Reporte en WhatsApp.", s17Micro: "Pago único · Sin mensualidad · Garantía 30 días",
    s17ColToday: "Hoy", s17RowLimit: "Límite por día", s17RowMonth: "Al mes", s17RowReach: "Para llegar a tu meta", s17RowWho: "Quién opera", s17RowYouDo: "Tú haces", s17RowPayOnce: "Pagas una vez",
    s17WhoToday: "Tú, en básico", s17WhoAi: "IA 24h", s17WhoAiNoCap: "IA 24h, sin techo", s17Nothing: "Nada",
    s17CompoundInterest: "interés compuesto", s17NewDaily: "nuevo límite diario", s17YourMult: "tu multiplicación personalizada", s17ReachA: "Alcanza tu meta de ", s17ReachMid: " en ", s17IdealBadge: "IDEAL PARA TU PERFIL", s17PayOnceGuar: "Pago único • Garantía 30 días", s17OrWord: "o",
    s17DiamanteFaster: (m: number) => `${m}x más rápido que en modo básico`,
    s17ProofA: "2.847 personas", s17ProofB: " ya aumentaron el límite", s17GuarLink: "Quiero saber de la garantía primero",
    s18Title: "+ Garantía de 30 Días", s18L1: "Actívalo ahora.", s18L2a: "Pruébalo por ", s18L2b: "30 días", s18L2c: ".", s18L3a: "¿No te gustó? ", s18L3bold: "Devolvemos el 100%", s18L3c: ".", s18L4: "Sin preguntas. Sin complicaciones.", s18Cta: "ACTIVAR MULTIPLICADOR DE IA", s18Doubts: "Aún tengo dudas",
    s19Title: "ÚLTIMA OPORTUNIDAD", s19A: "Esta oferta está ", s19Bold: "disponible solo AHORA", s19C: ".", s19Leave: "Salir de esta página = perder el acceso permanentemente.", s19Cta: "ACTIVAR MULTIPLICADOR DE IA", s19Secure: "Pago seguro • Cifrado SSL", s19Decline: "No, quiero seguir sin multiplicar",
  },
};

const TOTAL_DOTS = 24;
const TOTAL_QUESTIONS = 4;

const UpsellMultiplicador = ({ name: propName, onNext, onDecline }: Props) => {
  const { lang, locale } = useLanguage();
  const t = T[lang];
  const cur = CUR[lang];
  const money = (n: number) => (lang === "pt" ? `R$ ${n.toLocaleString(locale)}` : `$${n.toLocaleString(locale)}`);

  const existingName = propName !== "Visitante" ? propName : "";
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState(existingName);
  const [nameInput, setNameInput] = useState(existingName);
  const [answers, setAnswers] = useState({ profile: "", situation: "", goal: "", timeline: "", goalAmount: 0 });
  const [goalAmountInput, setGoalAmountInput] = useState("");
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [recommendedPlan, setRecommendedPlan] = useState<string>("ouro");
  const [customMultiplier, setCustomMultiplier] = useState(25);

  const firstName = userName || "";

  const plans = BASE_PLANS.map(b => {
    const pt = (t.plans as any)[b.id];
    const dailyValue = b.multFactor * cur.base;
    return { ...b, ...pt, dailyLimitValue: dailyValue, dailyLimit: pt.dailyChoose || `${money(dailyValue)}${cur.per}` };
  });

  useEffect(() => {
    if (step !== 10) return;
    setAnalysisPhase(0);
    const t1 = setTimeout(() => setAnalysisPhase(1), 600);
    const t2 = setTimeout(() => setAnalysisPhase(2), 1400);
    const t3 = setTimeout(() => setAnalysisPhase(3), 2200);
    const t4 = setTimeout(() => setAnalysisPhase(4), 3000);
    const t5 = setTimeout(() => {
      let rec = "ouro";
      const goalAmt = answers.goalAmount || cur.goalDefault;
      const highGoal = cur.base >= 25 ? 10000 : 2000; // ~equivalente em USD
      const midGoal = cur.base >= 25 ? 5000 : 1000;
      if (goalAmt >= highGoal) rec = "diamante";
      else if (goalAmt >= midGoal && answers.situation !== "endividado") rec = answers.profile === "conservador" ? "ouro" : "diamante";
      else if (answers.profile === "conservador" && (answers.timeline === "longo" || answers.timeline === "medio")) rec = "prata";
      else if (answers.profile === "agressivo" && answers.situation === "confortavel") rec = "diamante";
      else if (answers.situation === "endividado") rec = answers.profile === "conservador" ? "prata" : "ouro";
      else if (answers.timeline === "30dias" || answers.timeline === "urgente") rec = answers.situation === "confortavel" ? "diamante" : "ouro";
      setRecommendedPlan(rec);
      setStep(11);
    }, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [step, answers]);

  const goTo = useCallback((s: number) => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); setStep(s); }, []);
  const goNext = useCallback(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); setStep(s => s + 1); }, []);
  const selectQuizOption = useCallback((key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setTimeout(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); setStep(s => s + 1); }, 300);
  }, []);

  const handleSelectPlan = (plan: typeof plans[0]) => {
    saveUpsellExtras("multiplicador", { plan: plan.id, price: plan.price });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell2", plan: plan.id, price: plan.price });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell2", metadata: { plan: plan.id, price: plan.price } });
    const utmQs = buildTrackingQueryString();
    const separator = plan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${plan.checkoutUrl}${separator}${utmQs.slice(1)}` : plan.checkoutUrl;
    window.open(fullUrl, "_blank");
  };

  const getQuestionNumber = (): number | null => (step === 3 ? 1 : step === 5 ? 2 : step === 7 ? 3 : step === 9 ? 4 : null);
  const questionNum = getQuestionNumber();
  const progressPercent = questionNum ? (questionNum / TOTAL_QUESTIONS) * 100 : 0;

  const goalLabel = (id: string) => (t.goalLbl as any)[id] || id;
  const timelineLabel = (id: string) => (t.timeLbl as any)[id] || id;
  const profileLabel = (id: string) => (t.profLbl as any)[id] || id;
  const situationLabel = (id: string) => (t.sitLbl as any)[id] || id;

  const getGoalAmount = (): number => (answers.goalAmount > 0 ? answers.goalAmount : cur.goalDefault);
  const getGoalAmountLabel = (): string => `${money(getGoalAmount())}${cur.perMonth}`;
  const getMonthsToGoalBasic = (): number => Math.ceil(getGoalAmount() / cur.basicMonthly);

  const mLabel = (m: number): string => {
    if (m <= 1) return `~1 ${t.monthWord}`;
    if (m <= 12) {
      const b = m <= 2 ? 2 : m <= 3 ? 3 : m <= 4 ? 4 : m <= 6 ? 6 : m <= 9 ? 9 : 12;
      return `~${b} ${t.monthsWord}`;
    }
    if (m <= 18) return `~18 ${t.monthsWord}`;
    if (m <= 24) return `~2 ${t.yearsWord}`;
    if (m <= 36) return `~3 ${t.yearsWord}`;
    return t.moreThan3y;
  };
  const getTimeToGoalBasic = (): string => mLabel(getMonthsToGoalBasic());
  const getTimeToGoalForPlan = (dailyLimit: number): string => {
    const monthlyGoal = getGoalAmount();
    const planMonthly = dailyLimit * 30;
    if (planMonthly >= monthlyGoal) return t.lessThan1Month;
    const months = Math.ceil(monthlyGoal / planMonthly);
    if (months <= 1) return `~1 ${t.monthWord}`;
    if (months <= 2) return `~2 ${t.monthsWord}`;
    if (months <= 3) return `~3 ${t.monthsWord}`;
    if (months <= 6) return `~6 ${t.monthsWord}`;
    return `~${months} ${t.monthsWord}`;
  };
  const getRecommendedMultiplier = (): number => { const rec = plans.find(p => p.id === recommendedPlan); return rec ? rec.multFactor : 10; };

  const getComparisonData = () => {
    const recMult = getRecommendedMultiplier();
    const monthlyGoal = getGoalAmount();
    const sem = [{ mes: 1, val: cur.basicMonthly }, { mes: 3, val: cur.basicMonthly * 3 }, { mes: 6, val: cur.basicMonthly * 6 }, { mes: 12, val: cur.basicMonthly * 12 }];
    const com = sem.map(s => ({ mes: s.mes, val: Math.round(s.val * recMult) }));
    let goalMonth: number | null = null;
    for (const c of com) { if (c.val >= monthlyGoal && !goalMonth) goalMonth = c.mes; }
    return { sem, com, goalMonth };
  };

  const getComparisonRows = () => {
    const base = cur.base;
    const recMult = getRecommendedMultiplier();
    const periods = t.s15Periods.map((label, i) => ({ label, days: [7, 15, 30, 60, 90][i] }));
    return periods.map(p => { const without = base * p.days; const withMult = Math.round(base * p.days * recMult); return { ...p, without, withMult, diff: withMult - without }; });
  };

  const dots = Array.from({ length: TOTAL_DOTS }, (_, i) => i + 1);
  const activeDot = Math.min(step, TOTAL_DOTS);

  const renderQuestionStep = (title: string, options: any[], answerKey: string) => (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between text-[13px] mb-1.5">
          <span style={{ color: "#94A3B8" }}>{t.qOf(questionNum || 1, TOTAL_QUESTIONS)}</span>
          <span style={{ color: "#94A3B8" }}>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #16A34A, #22D3EE)" }} initial={{ width: "0%" }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>
      <h2 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>{title}</h2>
      <div className="space-y-3">
        {options.map(opt => (
          <button key={opt.id} onClick={() => selectQuizOption(answerKey, opt.id)}
            className="w-full text-left p-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-4" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
              <opt.Icon className="w-5 h-5" style={{ color: "#94A3B8" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-extrabold tracking-wide" style={{ color: "#F8FAFC" }}>{opt.label}</p>
              <p className="text-[13px] mt-0.5" style={{ color: "#64748B" }}>{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderConfirmationStep = (dataKey: "profile" | "situation" | "goal", answerValue: string) => {
    const data = (t.conf as any)[dataKey];
    return (
      <div className="flex flex-col items-center text-center space-y-5 py-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}>
          <Check className="w-9 h-9 text-white" strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-[22px] font-extrabold" style={{ color: "#22C55E" }}>{data.title}</h2>
        <p className="text-[15px] leading-relaxed px-2" style={{ color: "#CBD5E1" }}>{data.map[answerValue] || ""}</p>
        {data.enc && <p className="text-[17px] font-bold" style={{ color: "#22C55E" }}>{data.enc}</p>}
        <button onClick={goNext} className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}>
          {t.nextQuestion}<ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <>
    <div className="flex flex-col gap-4 pt-2">
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl flex items-center gap-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}>
                  <Check className="w-6 h-6 text-white" strokeWidth={3} />
                </motion.div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "#22C55E" }}>{t.s1Active}</p>
                  <p className="text-[12px]" style={{ color: "#64748B" }}>{t.s1ActiveSub}</p>
                </div>
              </motion.div>

              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))", border: "1px solid rgba(59,130,246,0.3)" }}>
                  <UserCheck className="w-7 h-7" style={{ color: "#3B82F6" }} />
                </div>
                <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>{t.s1H1(existingName)}</h1>
                <p className="text-[14px] leading-relaxed" style={{ color: "#94A3B8" }}>
                  {t.s1LeadA}<strong style={{ color: "#F8FAFC" }}>{t.s1LeadBold1}</strong>{t.s1LeadMid}<strong style={{ color: "#FACC15" }}>{t.s1LeadBold2}</strong>{t.s1LeadC}
                </p>
              </div>

              <div className="space-y-2.5">
                {[t.s1Created, t.s1AccelOn].map(label => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#22C55E" }} />
                    <span className="text-[13px]" style={{ color: "#64748B" }}>{label}</span>
                    <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>{t.s1Done}</span>
                  </div>
                ))}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.15)" }}>
                  <Clock className="w-5 h-5 shrink-0" style={{ color: "#FACC15" }} />
                  <span className="text-[13px] font-medium" style={{ color: "#F8FAFC" }}>{t.s1Configure}</span>
                  <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(250,204,21,0.12)", color: "#FACC15" }}>{t.s1Pending}</span>
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-2 py-1">
                <Timer className="w-4 h-4" style={{ color: "#64748B" }} />
                <span className="text-[12px]" style={{ color: "#64748B" }}>{t.s1Under1min}</span>
              </div>

              <button onClick={goNext} className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff" }}>
                {t.s1Cta}<ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-[22px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.s2Title}</h2>
                <p className="text-[14px] mt-2" style={{ color: "#94A3B8" }}>{t.s2Sub}</p>
              </div>
              <div>
                <label className="text-[13px] font-medium block mb-1.5" style={{ color: "#94A3B8" }}>{t.s2Label}</label>
                <input type="text" placeholder={t.s2Ph} value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={50} autoFocus
                  className="w-full px-5 py-4 rounded-2xl text-lg focus:outline-none transition-all" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)", color: "#F8FAFC" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && nameInput.trim().length > 1) { setUserName(nameInput.trim()); goNext(); } }} />
              </div>
              <button onClick={() => { if (nameInput.trim().length > 1) { setUserName(nameInput.trim()); goNext(); } }} disabled={nameInput.trim().length < 2}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40" style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}>
                {t.s2Cta}<ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 3 && renderQuestionStep(t.q1Title, t.q1, "profile")}
          {step === 4 && renderConfirmationStep("profile", answers.profile)}
          {step === 5 && renderQuestionStep(t.q2Title, t.q2, "situation")}
          {step === 6 && renderConfirmationStep("situation", answers.situation)}
          {step === 7 && renderQuestionStep(t.q3Title, t.q3, "goal")}

          {/* STEP 8 */}
          {step === 8 && (() => {
            const data = (t.conf as any).goal;
            const placeholder = answers.goal === "contas" ? (lang === "pt" ? "Ex: 3000" : "e.g. 600") : answers.goal === "familia" ? (lang === "pt" ? "Ex: 5000" : "e.g. 1000") : (lang === "pt" ? "Ex: 2000" : "e.g. 400");
            const label = answers.goal === "contas" ? t.s8LabelContas : answers.goal === "familia" ? t.s8LabelFamilia : t.s8LabelDefault;
            const handleGoalAmountSubmit = () => {
              const val = parseInt(goalAmountInput.replace(/\D/g, ""), 10);
              if (val && val >= 100) { setAnswers(prev => ({ ...prev, goalAmount: val })); goNext(); }
            };
            return (
              <div className="space-y-5 py-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}>
                    <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <h2 className="text-[20px] font-extrabold" style={{ color: "#22C55E" }}>{data.title}</h2>
                  <p className="text-[14px] leading-relaxed px-2" style={{ color: "#CBD5E1" }}>{data.map[answers.goal] || ""}</p>
                </div>
                <div className="p-5 rounded-xl space-y-4" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[16px] font-bold text-center" style={{ color: "#F8FAFC" }}>{label}</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-bold" style={{ color: "#94A3B8" }}>{cur.sym}</span>
                    <input type="text" inputMode="numeric" placeholder={placeholder} value={goalAmountInput}
                      onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); if (raw.length <= 7) setGoalAmountInput(raw ? parseInt(raw, 10).toLocaleString(locale) : ""); }} autoFocus
                      className="w-full pl-14 pr-5 py-4 rounded-2xl text-[22px] font-bold focus:outline-none transition-all text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(34,197,94,0.3)", color: "#F8FAFC" }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleGoalAmountSubmit(); }} />
                  </div>
                  <p className="text-[12px] text-center" style={{ color: "#64748B" }}>{t.s8Note}</p>
                </div>
                <button onClick={handleGoalAmountSubmit} disabled={!goalAmountInput || parseInt(goalAmountInput.replace(/\D/g, ""), 10) < 100}
                  className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40" style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}>
                  {t.s2Cta}<ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })()}

          {step === 9 && renderQuestionStep(t.q4Title, t.q4, "timeline")}

          {/* STEP 10 */}
          {step === 10 && (
            <div className="flex flex-col items-center text-center space-y-5 py-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}>
                <Check className="w-9 h-9 text-white" strokeWidth={2.5} />
              </motion.div>
              <h2 className="text-[22px] font-extrabold" style={{ color: "#22C55E" }}>{t.s10Prazo}</h2>
              <div className="w-full p-5 rounded-xl text-left space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[14px] text-center" style={{ color: "#94A3B8" }}>{t.s10Analyzing}</p>
                {[
                  { on: analysisPhase >= 1, txt: `${t.s10Profile} ${profileLabel(answers.profile)}`, done: true },
                  { on: analysisPhase >= 2, txt: `${t.s10Situation} ${situationLabel(answers.situation)}`, done: true },
                  { on: analysisPhase >= 3, txt: `${t.s10Goal} ${goalLabel(answers.goal)}`, done: true },
                  { on: analysisPhase >= 4, txt: `${t.s10Timeline} ${timelineLabel(answers.timeline)}`, done: false },
                ].map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: r.on ? 1 : 0 }} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={r.done ? { background: "#16A34A" } : { border: "1.5px solid #475569", background: "transparent" }}>
                      {r.done && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={r.done ? "text-[14px] font-bold" : "text-[14px]"} style={{ color: r.done ? "#F8FAFC" : "#64748B" }}>{r.txt}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 11 */}
          {step === 11 && (
            <div className="space-y-5">
              <h1 className="text-[24px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
                <span style={{ color: "#FACC15" }}>{userName}</span>{t.s11H1("").replace("{n}", "")}
              </h1>
              <div className="p-5 rounded-xl space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>
                  {t.s11ForA}<strong style={{ color: "#F8FAFC" }}>{goalLabel(answers.goal)}</strong>{t.s11ForMid}<strong style={{ color: "#F8FAFC" }}>{timelineLabel(answers.timeline)}</strong>{t.s11ForEnd}
                </p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>{t.s11Need}</p>
                <p className="text-[36px] font-extrabold text-center" style={{ color: "#22C55E" }}>{getGoalAmountLabel()}</p>
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(239,68,68,0.3)" }}>
                <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: "rgba(239,68,68,0.12)" }}>
                  <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
                  <span className="text-[13px] font-bold uppercase tracking-wide" style={{ color: "#EF4444" }}>{t.s11RealTitle}</span>
                </div>
                <div className="px-4 py-4 space-y-2" style={{ background: "rgba(239,68,68,0.04)" }}>
                  <p className="text-[14px] text-center" style={{ color: "#CBD5E1" }}>{t.s11BasicA}<strong style={{ color: "#F8FAFC" }}>{t.s11BasicBold(`${money(cur.basicMonthly)}${cur.perMonth}`)}</strong></p>
                  <p className="text-[14px] text-center" style={{ color: "#F8FAFC" }}>{t.s11ToReachA}{getGoalAmountLabel()}{t.s11ToReachMid}<strong style={{ color: "#EF4444" }}>{getTimeToGoalBasic()}</strong></p>
                  {getMonthsToGoalBasic() > 6 && (<p className="text-[13px] text-center font-bold mt-1" style={{ color: "#EF4444" }}>{t.s11TooFar(timelineLabel(answers.timeline))}</p>)}
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>{t.s11CalmTitle(userName)}</p>
                  <p className="text-[13px] mt-1" style={{ color: "#94A3B8" }}>{t.s11CalmA}<strong style={{ color: "#22C55E" }}>{t.s11CalmBold}</strong>{t.s11CalmC}</p>
                </div>
              </motion.div>

              <button onClick={goNext} className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}>
                {t.s11Cta}<ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 12 */}
          {step === 12 && (
            <div className="space-y-6 py-4">
              <h1 className="text-[26px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
                {userName}, {t.s12ProblemPre}<span style={{ color: "#EF4444" }}>{t.s12Problem}</span>{t.s12ProblemPost}
              </h1>
              <div className="p-5 rounded-xl text-center space-y-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-[17px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.s12GoalA}<span style={{ color: "#FACC15" }}>{getGoalAmountLabel()}</span></p>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>{t.s12ModeA}<strong style={{ color: "#EF4444" }}>{t.s12ModeBold}</strong>{t.s12ModeC}</p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>{t.s12GenA}<strong style={{ color: "#F8FAFC" }}>{t.s12GenBold}</strong>{t.s12GenC}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                <p className="text-[15px] text-center leading-relaxed" style={{ color: "#CBD5E1" }}>{t.s12CarA}<strong style={{ color: "#FACC15" }}>{t.s12CarBold}</strong>{t.s12CarC}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[14px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
                  {t.s12LimitA("", "")}<strong style={{ color: "#EF4444" }}>{money(cur.base)}{cur.per}</strong> ({money(cur.basicMonthly)}{cur.perMonth}), {lang === "pt" ? "sua meta de " : lang === "es" ? "tu meta de " : "your goal of "}<strong style={{ color: "#FACC15" }}>{getGoalAmountLabel()}</strong>{lang === "pt" ? " levaria " : lang === "es" ? " tardaría " : " would take "}<strong style={{ color: "#EF4444" }}>{getTimeToGoalBasic()}</strong>.
                </p>
                <p className="text-[15px] font-bold text-center mt-2" style={{ color: "#F8FAFC" }}>{t.s12Far}</p>
              </div>
              <button onClick={goNext} className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}>
                <Sparkles className="w-5 h-5" />{t.s12Cta}
              </button>
            </div>
          )}

          {/* STEP 13 */}
          {step === 13 && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-3">
                <p className="text-[15px]" style={{ color: "#94A3B8" }}>{t.s13SecondAi}</p>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>{t.s13Few}</p>
                <p className="text-[17px] font-bold mt-2" style={{ color: "#F8FAFC" }}>{t.s13Called}</p>
                <h1 className="text-[28px] font-extrabold" style={{ color: "#22C55E" }}>{t.s13MultAi}</h1>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>{t.s13Works}</p>
              </div>
              <div className="p-5 rounded-xl space-y-2" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2.5 mb-2"><Landmark className="w-5 h-5" style={{ color: "#94A3B8" }} /><h3 className="text-[16px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.s13BasicTitle}</h3></div>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>{t.s13Basic1}</p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>{t.s13Basic2}</p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>{t.s13Basic3pre}<strong style={{ color: "#F8FAFC" }}>{money(cur.base)}{cur.per}</strong>{t.s13Basic3suf}</p>
              </div>
              <div className="p-5 rounded-xl space-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="flex items-center gap-2.5 mb-2"><Sparkles className="w-5 h-5" style={{ color: "#22C55E" }} /><h3 className="text-[16px] font-extrabold" style={{ color: "#22C55E" }}>{t.s13MultTitle}</h3></div>
                <p className="text-[14px]" style={{ color: "#CBD5E1" }}>{t.s13Mult1}</p>
                <p className="text-[14px]" style={{ color: "#CBD5E1" }}>{t.s13Mult2}</p>
                <p className="text-[14px]" style={{ color: "#CBD5E1" }}>{t.s13Mult3pre}<strong style={{ color: "#22C55E" }}>{t.s13Mult3bold}</strong></p>
              </div>
              <button onClick={goNext} className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}>
                {t.s13Cta}<ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 14 */}
          {step === 14 && (() => {
            const { sem, com, goalMonth } = getComparisonData();
            return (
              <div className="space-y-5 py-4">
                <h1 className="text-[24px] font-extrabold text-center" style={{ color: "#F8FAFC" }}>{t.s14H1(userName)}</h1>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl space-y-2" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <h3 className="text-[13px] font-bold text-center" style={{ color: "#94A3B8" }}>{t.s14Without}</h3>
                    {sem.map(s => (<div key={s.mes} className="flex justify-between text-[13px]"><span style={{ color: "#64748B" }}>{t.s14Month} {s.mes}:</span><span className="font-bold" style={{ color: "#F8FAFC" }}>{money(s.val)}</span></div>))}
                  </div>
                  <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <h3 className="text-[13px] font-bold text-center" style={{ color: "#22C55E" }}>{t.s14With}</h3>
                    {com.map(c => { const isGoal = goalMonth === c.mes; return (<div key={c.mes} className="flex justify-between text-[13px]"><span style={{ color: "#64748B" }}>{t.s14Month} {c.mes}:</span><span className="font-bold" style={{ color: isGoal ? "#FACC15" : "#22C55E" }}>{money(c.val)} {isGoal ? "✓" : c.mes === 12 ? "🚀" : ""}</span></div>); })}
                  </div>
                </div>
                {goalMonth && (<p className="text-center text-[14px] font-bold" style={{ color: "#22C55E" }}>{t.s14GoalReached(userName, goalMonth)}</p>)}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[11px] text-center mb-2" style={{ color: "#64748B" }}>{t.s14WithoutChart}</p>
                    <div className="flex items-end justify-between gap-1 h-20">{[15, 20, 25, 30, 35, 40].map((h, i) => (<motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.1 * i, duration: 0.4 }} className="flex-1 rounded-t-sm" style={{ background: "#334155" }} />))}</div>
                    <div className="flex justify-between text-[9px] mt-1" style={{ color: "#475569" }}>{["M1","M2","M3","M4","M5","M6"].map(m => <span key={m}>{m}</span>)}</div>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <p className="text-[11px] text-center mb-2" style={{ color: "#22C55E" }}>{t.s14WithChart}</p>
                    <div className="flex items-end justify-between gap-1 h-20">{[15, 25, 40, 55, 75, 100].map((h, i) => (<motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.1 * i, duration: 0.4 }} className="flex-1 rounded-t-sm" style={{ background: "linear-gradient(180deg, #16A34A, #22C55E)" }} />))}</div>
                    <div className="flex justify-between text-[9px] mt-1" style={{ color: "#475569" }}>{["M1","M2","M3","M4","M5","M6"].map(m => <span key={m}>{m}</span>)}</div>
                  </div>
                </div>
                <button onClick={goNext} className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}>
                  {t.s14Cta}<ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })()}

          {/* STEP 15 */}
          {step === 15 && (() => {
            const rows = getComparisonRows();
            return (
              <div className="space-y-5 py-4">
                <h1 className="text-[22px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>{t.s15H1a(userName)}<span style={{ color: "#22C55E" }}>{t.s15H1green}</span>{t.s15H1c}</h1>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <span className="text-[11px] font-bold" style={{ color: "#64748B" }}>{t.s15Period}</span>
                  <div className="flex items-center justify-center gap-1"><XCircle className="w-3.5 h-3.5" style={{ color: "#EF4444" }} /><span className="text-[11px] font-bold" style={{ color: "#EF4444" }}>{t.s15SemShort}</span></div>
                  <div className="flex items-center justify-center gap-1"><Rocket className="w-3.5 h-3.5" style={{ color: "#22C55E" }} /><span className="text-[11px] font-bold" style={{ color: "#22C55E" }}>{t.s15ComShort}</span></div>
                </div>
                <div className="space-y-2">
                  {rows.map((r, i) => (
                    <motion.div key={r.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 * i }} className="grid grid-cols-3 gap-2 items-center p-3 rounded-xl" style={{ background: i >= 3 ? "rgba(34,197,94,0.06)" : "#0F172A", border: i >= 3 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="text-[13px] font-medium" style={{ color: "#CBD5E1" }}>{r.label}</span>
                      <span className="text-[14px] text-center line-through" style={{ color: "#64748B" }}>{money(r.without)}</span>
                      <div className="text-right"><span className="text-[15px] font-bold" style={{ color: "#22C55E" }}>{money(r.withMult)}</span></div>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} className="p-4 rounded-xl text-center space-y-1" style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)" }}>
                  <p className="text-[13px]" style={{ color: "#94A3B8" }}>{t.s15In3A}</p>
                  <p className="text-[22px] font-extrabold" style={{ color: "#FACC15" }}>{t.s15In3B(money(rows[rows.length - 1].diff))}</p>
                  <p className="text-[12px]" style={{ color: "#64748B" }}>{t.s15In3C}</p>
                </motion.div>
                <button onClick={goNext} className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}>
                  {t.s15Cta}<ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })()}

          {/* STEP 16 */}
          {step === 16 && (
            <div className="space-y-6 py-4">
              <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>{t.s16H1}</h1>
              <div className="p-5 rounded-xl space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>{t.s16WhyA}<strong style={{ color: "#FACC15" }}>{t.s16WhyBold}</strong>{t.s16WhyC}</p>
                <div className="space-y-2 pl-1">
                  {[t.s16R1, t.s16R2, t.s16R3].map(r => (<div key={r} className="flex items-center gap-2"><ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#64748B" }} /><span className="text-[14px]" style={{ color: "#94A3B8" }}>{r}</span></div>))}
                </div>
              </div>
              <div className="p-5 rounded-xl" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.12)" }}>
                <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>{t.s16IfA}</p>
                <p className="text-[15px] font-bold mt-1" style={{ color: "#FACC15" }}>{t.s16IfBold}</p>
              </div>
              <p className="text-[14px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>{t.s16OptionalA}<strong style={{ color: "#F8FAFC" }}>{t.s16OptionalBold}</strong>{t.s16OptionalC}</p>
              <button onClick={goNext} className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}>
                {t.s16Cta}<ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 17 */}
          {step === 17 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
                  {t.s17H1a(userName)}<span style={{ color: "#EF4444" }}>{t.s17H1red}</span>.
                </h2>
                <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
                  {t.s17SubA}<strong style={{ color: "#F8FAFC" }}>{money(cur.basicMonthly)}</strong>{t.s17SubMid}<strong style={{ color: "#F8FAFC" }}>{getGoalAmountLabel()}</strong>{t.s17SubMid2}<strong style={{ color: "#EF4444" }}>{getTimeToGoalBasic()}</strong>{t.s17SubEnd}
                </p>
              </div>
              <div className="rounded-2xl p-4 text-center space-y-1.5" style={{ background: "rgba(239,68,68,0.06)", border: "1.5px solid rgba(239,68,68,0.28)" }}>
                <p className="text-[15px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.s17NoWait(getTimeToGoalBasic())}</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>{t.s17OneA}<strong style={{ color: "#F8FAFC" }}>{t.s17OneBold1}</strong>{t.s17OneMid}<strong style={{ color: "#F8FAFC" }}>{t.s17OneBold2}</strong>{t.s17OneC}</p>
                <p className="text-[12px] font-semibold" style={{ color: "#22C55E" }}>{t.s17Micro}</p>
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse min-w-[420px]">
                    <thead>
                      <tr style={{ background: "#0B1220" }}>
                        <th className="text-left py-2 px-2.5 font-medium" style={{ color: "#64748B" }}></th>
                        <th className="py-2 px-1.5 font-bold text-center" style={{ color: "#94A3B8" }}>{t.s17ColToday}</th>
                        <th className="py-2 px-1.5 font-bold text-center" style={{ color: "#CBD5E1" }}>5x</th>
                        <th className="py-2 px-1.5 font-bold text-center" style={{ color: "#22C55E", background: "rgba(34,197,94,0.10)" }}>10x ★</th>
                        <th className="py-2 px-1.5 font-bold text-center" style={{ color: "#60A5FA" }}>25x</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: "#E2E8F0" }}>
                      {[
                        { l: t.s17RowLimit, v: [money(cur.base), money(cur.base * 5), money(cur.base * 10), money(cur.base * 25)] },
                        { l: t.s17RowMonth, v: [money(cur.base * 30), money(cur.base * 5 * 30), money(cur.base * 10 * 30), money(cur.base * 25 * 30)] },
                        { l: t.s17RowReach, v: [getTimeToGoalBasic(), getTimeToGoalForPlan(cur.base * 5), getTimeToGoalForPlan(cur.base * 10), getTimeToGoalForPlan(cur.base * 25)] },
                        { l: t.s17RowWho, v: [t.s17WhoToday, t.s17WhoAi, t.s17WhoAi, t.s17WhoAiNoCap] },
                        { l: t.s17RowYouDo, v: ["—", t.s17Nothing, t.s17Nothing, t.s17Nothing] },
                        { l: t.s17RowPayOnce, v: ["—", money(47), money(67), money(97)] },
                      ].map((row, ri) => (
                        <tr key={ri} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <td className="py-2 px-2.5 font-medium" style={{ color: "#94A3B8" }}>{row.l}</td>
                          <td className="py-2 px-1.5 text-center" style={{ color: "#94A3B8" }}>{row.v[0]}</td>
                          <td className="py-2 px-1.5 text-center">{row.v[1]}</td>
                          <td className="py-2 px-1.5 text-center font-bold" style={{ color: "#22C55E", background: "rgba(34,197,94,0.06)" }}>{row.v[2]}</td>
                          <td className="py-2 px-1.5 text-center" style={{ color: "#93C5FD" }}>{row.v[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {[...plans].sort((a, b) => (a.id === recommendedPlan ? -1 : b.id === recommendedPlan ? 1 : 0)).map((plan, i) => {
                const isRecommended = plan.id === recommendedPlan;
                const timeToGoal = plan.id === "diamante" ? t.s17DiamanteFaster(customMultiplier) : getTimeToGoalForPlan(plan.dailyLimitValue);
                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="relative rounded-2xl p-5" style={{ background: "#0F172A", border: isRecommended ? "2px solid #22C55E" : plan.border, boxShadow: isRecommended ? "0 0 20px rgba(34,197,94,0.15)" : "none" }}>
                    {isRecommended && (<span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5" style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", boxShadow: "0 2px 8px rgba(22,163,74,0.4)" }}><Sparkles className="w-3.5 h-3.5" />{t.s17IdealBadge}</span>)}
                    {!isRecommended && plan.badge && (<span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5" style={{ background: "linear-gradient(135deg, #FACC15, #EAB308)", color: "#020617", boxShadow: "0 2px 8px rgba(250,204,21,0.3)" }}><Crown className="w-3.5 h-3.5" />{plan.badge}</span>)}
                    <div className="flex items-center gap-2.5 mb-1 mt-1"><plan.icon className="w-5 h-5" style={{ color: plan.subtitleColor }} /><h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>{plan.name}</h3></div>
                    <div className="mt-2 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                      {plan.id === "diamante" ? (
                        <div className="space-y-3">
                          <div className="text-center"><p className="text-[32px] font-extrabold" style={{ color: "#60A5FA" }}>{customMultiplier}x</p><p className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>{t.s17YourMult}</p></div>
                          <input type="range" min={20} max={100} step={5} value={customMultiplier} onChange={(e) => setCustomMultiplier(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" style={{ height: "6px" }} />
                          <div className="flex justify-between text-[10px]" style={{ color: "#64748B" }}><span>20x</span><span>50x</span><span>100x</span></div>
                          <div className="text-center pt-1"><p className="text-[16px] font-extrabold" style={{ color: "#F8FAFC" }}>{money(cur.base * customMultiplier)}{cur.per}</p><p className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>{t.s17NewDaily}</p></div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1"><p className="text-[28px] font-extrabold" style={{ color: plan.subtitleColor }}>{plan.multLabel}</p><p className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>{t.s17CompoundInterest}</p></div>
                          <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />
                          <div className="text-center flex-1"><p className="text-[18px] font-extrabold" style={{ color: "#F8FAFC" }}>{plan.dailyLimit}</p><p className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>{t.s17NewDaily}</p></div>
                        </div>
                      )}
                    </div>
                    <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{plan.description}</p>
                    <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <Target className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                      <p className="text-[12px] leading-snug" style={{ color: "#86EFAC" }}>{t.s17ReachA}<strong style={{ color: "#F8FAFC" }}>{getGoalAmountLabel()}</strong>{t.s17ReachMid}<strong style={{ color: "#22C55E" }}>{timeToGoal}</strong></p>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-[13px] line-through" style={{ color: "#475569" }}>{money(plan.price * 3)}</span>
                      <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>{money(plan.price)}</span>
                      <span className="text-[12px]" style={{ color: "#64748B" }}>{t.s17OrWord} {plan.installments}</span>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: "#22C55E" }}><span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> {t.s17PayOnceGuar}</span></p>
                    <button onClick={() => handleSelectPlan(plan)} className="w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: isRecommended ? "linear-gradient(135deg, #16A34A, #22C55E)" : plan.btnBg, color: isRecommended ? "#fff" : plan.btnColor, border: isRecommended ? "none" : plan.btnBorder }}>
                      {plan.btnText}
                    </button>
                  </motion.div>
                );
              })}

              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="flex -space-x-2">{[avatarCarlos, avatarMaria, avatarJose, avatarRegina].map((src, i) => (<img key={i} src={src} alt="" className="w-7 h-7 rounded-full object-cover" style={{ border: "2px solid #0F172A" }} />))}</div>
                <p className="text-[12px]" style={{ color: "#64748B" }}><strong style={{ color: "#94A3B8" }}>{t.s17ProofA}</strong>{t.s17ProofB}</p>
              </div>

              <button onClick={() => { saveFunnelEvent("upsell_guarantee_click", { page: "/upsell2" }); goTo(18); }} className="text-[13px] underline cursor-pointer bg-transparent border-none mx-auto block py-2" style={{ color: "#64748B" }}>{t.s17GuarLink}</button>
            </div>
          )}

          {/* STEP 18 */}
          {step === 18 && (
            <div className="flex flex-col items-center text-center space-y-6 py-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}>
                <ShieldCheck className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-[24px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.s18Title}</h2>
              <div className="w-full p-5 rounded-xl text-left space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>{t.s18L1}</p>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>{t.s18L2a}<strong style={{ color: "#F8FAFC" }}>{t.s18L2b}</strong>{t.s18L2c}</p>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>{t.s18L3a}<strong style={{ color: "#22C55E" }}>{t.s18L3bold}</strong>{t.s18L3c}</p>
                <p className="text-[17px] font-bold mt-2" style={{ color: "#F8FAFC" }}>{t.s18L4}</p>
              </div>
              <button onClick={() => goTo(17)} className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}>{t.s18Cta}</button>
              <button onClick={() => { saveFunnelEvent("upsell_still_doubts_click", { page: "/upsell2" }); goTo(19); }} className="text-[13px] underline cursor-pointer bg-transparent border-none py-2" style={{ color: "#64748B" }}>{t.s18Doubts}</button>
            </div>
          )}

          {/* STEP 19 */}
          {step === 19 && (
            <div className="flex flex-col items-center text-center space-y-6 py-8">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="w-full p-6 rounded-2xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 30px rgba(239,68,68,0.1)" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.15)" }}><AlertTriangle className="w-7 h-7" style={{ color: "#EF4444" }} /></div>
                <h2 className="text-[22px] font-extrabold italic" style={{ color: "#F87171" }}>{t.s19Title}</h2>
                <p className="text-[15px] mt-3" style={{ color: "#CBD5E1" }}>{t.s19A}<strong style={{ color: "#F8FAFC" }}>{t.s19Bold}</strong>{t.s19C}</p>
                <p className="text-[14px] mt-2" style={{ color: "#94A3B8" }}>{t.s19Leave}</p>
              </motion.div>
              <button onClick={() => goTo(17)} className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}>{t.s19Cta}</button>
              <div className="flex items-center justify-center gap-2"><Lock className="w-3.5 h-3.5" style={{ color: "#64748B" }} /><span className="text-[12px]" style={{ color: "#64748B" }}>{t.s19Secure}</span></div>
              <button onClick={() => { saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell2" }); logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell2" }); onDecline(); }} className="text-[12px] underline cursor-pointer bg-transparent border-none py-2" style={{ color: "#475569" }}>{t.s19Decline}</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-1 mt-2 pb-2 flex-wrap">
        {dots.map(d => (<div key={d} className="h-2 rounded-full transition-all duration-300" style={{ width: d === activeDot ? 14 : 6, background: d < activeDot ? "#16A34A" : d === activeDot ? "#3B82F6" : "rgba(255,255,255,0.1)" }} />))}
      </div>
    </div>
    </>
  );
};

export default UpsellMultiplicador;
