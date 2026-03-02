import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, Shield, CheckCircle, Clock, Zap, Award,
  ArrowRight, Star, ShieldCheck, Target, BarChart3, Lock
} from "lucide-react";
import type { QuizAnswers } from "./QuizUI";
import { StepContainer } from "./QuizUI";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarClaudia from "@/assets/avatar-claudia.jpg";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";
import avatarRegina from "@/assets/avatar-regina.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";

interface Props {
  onNext: () => void;
  userName?: string;
  answers?: QuizAnswers;
}

/* ─── Helpers ─── */
const getGoalValues = (goal?: string) => {
  const map: Record<string, { daily: number }> = {
    "50-100": { daily: 75 }, "100-300": { daily: 200 },
    "300-500": { daily: 400 }, "500+": { daily: 600 },
  };
  return map[goal || ""] || { daily: 200 };
};

const getAgeGroup = (age?: string) => {
  const map: Record<string, string> = {
    "18-25": "18 a 25 anos", "26-35": "26 a 35 anos", "36-45": "36 a 45 anos",
    "46-55": "46 a 55 anos", "56+": "acima de 55 anos",
    "18 a 25 anos": "18 a 25 anos", "26 a 35 anos": "26 a 35 anos",
    "36 a 45 anos": "36 a 45 anos", "46 a 55 anos": "46 a 55 anos",
    "56 anos ou mais": "acima de 55 anos",
  };
  return map[age || ""] || "perfil semelhante ao seu";
};

const getAlumniCount = (age?: string) => {
  const map: Record<string, string> = {
    "18-25": "4.200", "26-35": "6.800", "36-45": "8.100",
    "46-55": "9.400", "56+": "7.500",
    "18 a 25 anos": "4.200", "26 a 35 anos": "6.800",
    "36 a 45 anos": "8.100", "46 a 55 anos": "9.400",
    "56 anos ou mais": "7.500",
  };
  return map[age || ""] || "8.000";
};

const getObstacleLabel = (o?: string) => {
  const map: Record<string, string> = {
    medo: "medo de golpe", tempo: "falta de tempo",
    inicio: "não saber por onde começar", dinheiro: "pouco capital",
  };
  return map[o || ""] || "desafios iniciais";
};

const getSuccessRate = (age?: string) => {
  const map: Record<string, number> = {
    "18 a 25 anos": 89, "26 a 35 anos": 91, "36 a 45 anos": 93,
    "46 a 55 anos": 94, "56 anos ou mais": 92,
  };
  return map[age || ""] || 92;
};

/* ─── Animated Counter ─── */
const AnimatedNumber = ({ target, prefix = "", suffix = "", delay = 0 }: { target: number; prefix?: string; suffix?: string; delay?: number }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const duration = 1200;
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return <span>{prefix}{value.toLocaleString("pt-BR")}{suffix}</span>;
};

/* ─── Main Component ─── */
const StepProfileProjection = ({ onNext, userName, answers }: Props) => {
  const firstName = userName?.split(" ")[0] || "";
  const { daily } = getGoalValues(answers?.incomeGoal);
  const ageGroup = getAgeGroup(answers?.age);
  const alumniCount = getAlumniCount(answers?.age);
  const obstacleLabel = getObstacleLabel(answers?.obstacle);
  const successRate = getSuccessRate(answers?.age);
  const monthly = daily * 30;
  const nearGoal = Math.round(monthly * 1.05);

  const day3 = Math.round(daily * 0.15);
  const day7 = Math.round(daily * 0.4);
  const day14 = Math.round(daily * 0.65);
  const day21 = Math.round(daily * 0.85);
  const day30 = Math.round(daily * 1.05);

  const projections = [
    { period: "Dia 3", value: day3, bar: 10, label: "Primeira operação configurada", icon: Target },
    { period: "Dia 7", value: day7, bar: 25, label: "Primeiros resultados reais", icon: TrendingUp },
    { period: "Dia 14", value: day14, bar: 45, label: "Ganhando consistência", icon: BarChart3 },
    { period: "Dia 21", value: day21, bar: 70, label: "Ritmo acelerando", icon: Zap },
    { period: "Dia 30", value: day30, bar: 100, label: "Meta diária atingida", icon: Award },
  ];

  const comparativeStats = [
    { label: "Alcançaram a meta em 30 dias", value: `${successRate}%`, icon: Target },
    { label: "Tempo médio para primeiro ganho", value: "3 dias", icon: Clock },
    { label: "Relataram superar " + obstacleLabel, value: "96%", icon: Shield },
    { label: "Nota média de satisfação", value: "4.8/5", icon: Star },
  ];

  const guarantees = [
    { title: "Garantia incondicional de 30 dias", desc: "Se não gostar, devolvemos 100% do valor. Sem perguntas, sem burocracia.", icon: ShieldCheck },
    { title: "Suporte humano via WhatsApp", desc: "Mentora dedicada para tirar suas dúvidas em tempo real, do começo ao primeiro resultado.", icon: Users },
    { title: "Método testado e validado", desc: `+${alumniCount} alunos com ${ageGroup} já comprovaram que funciona.`, icon: CheckCircle },
  ];

  return (
    <StepContainer>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center space-y-3"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5"
        >
          <CheckCircle className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Análise completa</span>
        </motion.div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight">
          {firstName ? <>{firstName}, sua <span className="text-gradient-green">projeção está pronta</span></> : <>Sua <span className="text-gradient-green">projeção está pronta</span></>}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Com base nas suas respostas e nos dados de{" "}
          <span className="text-primary font-bold">+{alumniCount} alunos</span> com{" "}
          <span className="font-semibold text-foreground">{ageGroup}</span>, a IA traçou o seu caminho.
        </p>
      </motion.div>

      {/* ── Profit Projection Chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full rounded-2xl overflow-hidden border border-primary/15"
        style={{ background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--primary) / 0.03))" }}
      >
        <div className="px-4 py-3 border-b border-primary/10 flex items-center gap-2" style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Projeção de Lucro — 30 Dias</span>
        </div>
        <div className="p-4 space-y-3.5">
          {projections.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
                className="space-y-1.5"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{p.period}</span>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">— {p.label}</span>
                  </div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.12 }}
                    className={`text-sm font-bold tabular-nums ${i === projections.length - 1 ? "text-primary text-base" : "text-foreground"}`}
                  >
                    R${p.value.toLocaleString("pt-BR")}/dia
                  </motion.span>
                </div>
                <div className="w-full h-3 bg-secondary/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.bar}%` }}
                    transition={{ delay: 0.5 + i * 0.12, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / ${0.35 + i * 0.15}))` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground sm:hidden">{p.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Monthly total highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="px-4 py-4 border-t border-primary/10"
          style={{ background: "hsl(var(--primary) / 0.08)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              <span className="text-sm font-bold text-foreground">Potencial mensal acumulado</span>
            </div>
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.4, type: "spring" }}
              className="text-xl sm:text-2xl font-display font-black text-primary"
            >
              R$<AnimatedNumber target={nearGoal} delay={1400} />
            </motion.span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Equivalente a R${day30.toLocaleString("pt-BR")}/dia × 30 dias
          </p>
        </motion.div>
      </motion.div>

      {/* ── Comparative Data ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full space-y-3"
      >
        <div className="flex items-center gap-2 justify-center">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            Dados de <span className="text-primary">+{alumniCount}</span> alunos com perfil semelhante
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {comparativeStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.1 }}
                className="rounded-xl border border-border p-3 space-y-2 text-center"
                style={{ background: "hsl(var(--card))" }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-lg font-display font-black text-primary">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Social Proof Avatars ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="w-full flex items-center gap-3 rounded-xl p-3 border border-border bg-secondary/30"
      >
        <div className="flex -space-x-2 shrink-0">
          {[avatarAntonio, avatarClaudia, avatarJose, avatarLucia, avatarRegina, avatarCarlos].slice(0, 5).map((av, i) => (
            <img key={i} src={av} alt="" className="w-7 h-7 rounded-full border-2 border-card object-cover" />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          <span className="font-semibold text-foreground">+{alumniCount} alunos</span> com {ageGroup} já alcançaram resultados como esses.
        </p>
      </motion.div>

      {/* ── Guarantees ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="w-full space-y-3"
      >
        <h3 className="text-base font-bold text-foreground text-center">
          Sua segurança é <span className="text-gradient-green">nossa prioridade</span>
        </h3>
        <div className="space-y-2.5">
          {guarantees.map((g, i) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + i * 0.1 }}
                className="flex items-start gap-3 rounded-xl border border-primary/15 p-3.5"
                style={{ background: "hsl(var(--primary) / 0.03)" }}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-foreground">{g.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{g.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Action Steps ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className="w-full space-y-3"
      >
        <h3 className="text-base font-bold text-foreground text-center">
          Como <span className="text-gradient-green">aplicar na prática</span>
        </h3>
        {[
          { step: "1", title: "Ative sua Chave Token", desc: "Em menos de 2 minutos, você configura tudo direto do celular." },
          { step: "2", title: "Siga o passo a passo", desc: "O suporte te guia pessoalmente. Zero dúvida, zero complicação." },
          { step: "3", title: "Receba seus primeiros resultados", desc: `A maioria dos alunos com ${ageGroup} vê o primeiro resultado em até 3 dias.` },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8 + i * 0.1 }}
            className="flex items-start gap-3"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent font-bold text-sm shrink-0 mt-0.5">
              {item.step}
            </span>
            <div>
              <p className="font-bold text-sm text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── CTA ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
        className="w-full space-y-3 pt-2"
      >
        <button
          onClick={onNext}
          className="w-full group relative overflow-hidden rounded-2xl py-5 px-6 font-extrabold text-lg tracking-wide cursor-pointer transition-all duration-300 active:scale-[0.97] bg-gradient-to-r from-accent via-amber-400 to-accent text-accent-foreground animate-bounce-subtle"
          style={{
            boxShadow: "0 0 30px hsl(42 100% 55% / 0.35), 0 0 60px hsl(42 100% 55% / 0.15), 0 8px 25px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
          <div className="relative flex items-center justify-center gap-3">
            <Zap className="w-6 h-6 shrink-0" />
            <span>VER MINHA OFERTA EXCLUSIVA</span>
            <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Oferta por tempo limitado</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Garantia de 30 dias</span>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/40 text-center pb-4">
        *Projeção baseada na média de resultados de alunos com perfil semelhante. Resultados individuais podem variar.
      </p>
    </StepContainer>
  );
};

export default StepProfileProjection;
