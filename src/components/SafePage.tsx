import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import alfaLogo from "@/assets/alfa-hibrida-logo.png";
import flagBrazil from "@/assets/flag-brazil.jpg";
import flagUsa from "@/assets/flag-usa.jpg";
import flagUk from "@/assets/flag-uk.jpg";
import flagFrance from "@/assets/flag-france.jpg";
import flagPortugal from "@/assets/flag-portugal.png";
import flagGermany from "@/assets/flag-germany.png";

const STEPS = [
  {
    type: "intro" as const,
  },
  {
    type: "question" as const,
    question: "Qual a sua faixa de idade?",
    options: ["18 a 24 anos", "25 a 34 anos", "35 a 44 anos", "45 a 54 anos", "55+ anos"],
  },
  {
    type: "question" as const,
    question: "Você já tentou ganhar dinheiro pela internet antes?",
    options: ["Sim, mas não tive resultado", "Sim, e ganhei um pouco", "Nunca tentei", "Sim, e fui enganado(a)"],
  },
  {
    type: "question" as const,
    question: "Qual sua principal meta financeira?",
    options: ["Pagar dívidas", "Renda extra de R$1.000 a R$3.000/mês", "Renda de R$3.000 a R$5.000/mês", "Mais de R$5.000/mês", "Substituir meu salário"],
  },
  {
    type: "question" as const,
    question: "Qual o maior obstáculo que te impede de ganhar dinheiro online?",
    options: ["Falta de tempo", "Falta de dinheiro para investir", "Não sei por onde começar", "Já tentei e não funcionou", "Medo de ser golpe"],
  },
  {
    type: "question" as const,
    question: "Quanto tempo por dia você pode dedicar?",
    options: ["Menos de 30 minutos", "30 minutos a 1 hora", "1 a 2 horas", "Mais de 2 horas"],
  },
  {
    type: "question" as const,
    question: "Qual dispositivo você mais usa?",
    options: ["Celular", "Computador/Notebook", "Tablet", "Uso todos"],
  },
  {
    type: "question" as const,
    question: "Você tem acesso a internet estável?",
    options: ["Sim, Wi-Fi em casa", "Sim, dados móveis", "Mais ou menos", "Uso internet de terceiros"],
  },
  {
    type: "question" as const,
    question: "Se existisse um método comprovado e seguro, você estaria disposto(a) a começar hoje?",
    options: ["Sim, com certeza!", "Talvez, preciso saber mais", "Depende do valor", "Não tenho certeza"],
  },
  {
    type: "loading" as const,
  },
  {
    type: "result" as const,
  },
];

const TOTAL_STEPS = STEPS.length;

const SafePage = () => {
  const [step, setStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const currentStep = STEPS[step];
  const progress = ((step) / (TOTAL_STEPS - 1)) * 100;

  // Loading animation for step type "loading"
  useEffect(() => {
    if (currentStep.type !== "loading") return;
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep((s) => s + 1), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [step, currentStep.type]);

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    }
  };

  const renderStep = () => {
    if (currentStep.type === "intro") {
      return (
        <div className="w-full max-w-[600px] space-y-6">
          {/* Warning box */}
          <div
            className="rounded-xl p-4 sm:p-5"
            style={{
              background: "rgba(254, 243, 199, 0.9)",
              border: "1px solid rgba(234, 179, 8, 0.3)",
            }}
          >
            <p className="text-[14px] sm:text-[15px] leading-relaxed" style={{ color: "#92400e" }}>
              <span className="mr-1">⚠️</span>
              <strong>Atenção:</strong> este teste vai revelar se você está pronto para usar a tecnologia que já
              coloca dinheiro no bolso de pessoas comuns todos os dias — e indicar a estratégia mais rápida pro seu perfil.
            </p>
          </div>

          {/* Question */}
          <h2 className="text-center font-bold text-[17px] sm:text-[19px] leading-snug" style={{ color: "#e2e8f0" }}>
            Você já tentou ganhar dinheiro online e só se frustrou?
          </h2>

          {/* Main pitch */}
          <div className="text-center">
            <p className="text-[18px] sm:text-[22px] font-bold leading-snug" style={{ color: "#e2e8f0" }}>
              As próximas perguntas vão mostrar,{" "}
              <span className="px-1" style={{ background: "#16a34a", color: "#fff" }}>
                em menos de 2 minutos
              </span>
              , o caminho mais rápido pra você{" "}
              <span className="px-1 font-extrabold" style={{ background: "#dc2626", color: "#fff" }}>
                SAIR DAS DÍVIDAS
              </span>{" "}
              e começar a{" "}
              <span style={{ color: "#22c55e" }} className="font-extrabold underline">
                GANHAR R$2.000 a R$5.000/mês de maneira SEGURA
              </span>
            </p>
          </div>

          {/* Yellow subtitle */}
          <div className="text-center">
            <span
              className="inline text-[14px] sm:text-[15px] font-bold px-1"
              style={{ background: "#facc15", color: "#09090b" }}
            >
              30 minutos por dia. Método já testado. Resultados reais.
            </span>
          </div>

          {/* Country flags */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
            {[flagBrazil, flagUsa, flagUk, flagFrance, flagPortugal, flagGermany].map((flag, i) => (
              <img
                key={i}
                src={flag}
                alt="flag"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover"
              />
            ))}
          </div>

          <div className="h-4" />

          {/* CTA */}
          <button
            onClick={handleNext}
            className="w-full font-bold text-[16px] sm:text-[18px] py-4 rounded-2xl transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
            style={{ background: "#16a34a", color: "#ffffff" }}
          >
            INICIAR TESTE!
          </button>
        </div>
      );
    }

    if (currentStep.type === "question") {
      return (
        <div className="w-full max-w-[600px] space-y-5">
          <h2 className="text-center font-bold text-[18px] sm:text-[20px] leading-snug" style={{ color: "#e2e8f0" }}>
            {currentStep.question}
          </h2>
          <div className="space-y-3">
            {currentStep.options.map((option, i) => (
              <button
                key={i}
                onClick={handleNext}
                className="w-full text-left px-5 py-4 rounded-2xl text-[14px] sm:text-[15px] font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(22, 163, 74, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(22, 163, 74, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.type === "loading") {
      return (
        <div className="w-full max-w-[600px] space-y-6 text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#16a34a", borderTopColor: "transparent" }} />
            <h2 className="font-bold text-[18px] sm:text-[20px]" style={{ color: "#e2e8f0" }}>
              Analisando suas respostas...
            </h2>
            <p className="text-[14px]" style={{ color: "#94a3b8" }}>
              Cruzando dados com {(36000 + Math.floor(loadingProgress * 12)).toLocaleString("pt-BR")}+ perfis
            </p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${loadingProgress}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)" }}
            />
          </div>
          <p className="text-[13px] tabular-nums" style={{ color: "#64748b" }}>
            {loadingProgress}% concluído
          </p>
        </div>
      );
    }

    if (currentStep.type === "result") {
      return (
        <div className="w-full max-w-[600px] space-y-6 text-center">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
            style={{ background: "rgba(22, 163, 74, 0.15)", border: "2px solid rgba(22, 163, 74, 0.3)" }}
          >
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="font-bold text-[22px] sm:text-[26px]" style={{ color: "#e2e8f0" }}>
            Parabéns! Seu perfil foi aprovado!
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "#94a3b8" }}>
            Com base nas suas respostas, identificamos que você tem um{" "}
            <strong style={{ color: "#22c55e" }}>alto potencial</strong> para começar a gerar renda online
            com nosso método.
          </p>
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-[14px] font-semibold mb-2" style={{ color: "#facc15" }}>
              ⚠️ Vagas limitadas
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: "#64748b" }}>
              Infelizmente, no momento todas as vagas disponíveis para novos alunos estão preenchidas.
              Cadastre-se na lista de espera para ser notificado quando novas vagas abrirem.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="w-full px-5 py-4 rounded-2xl text-[14px] outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e2e8f0",
              }}
            />
            <button
              className="w-full font-bold text-[16px] py-4 rounded-2xl transition-all hover:brightness-110"
              style={{ background: "#16a34a", color: "#fff" }}
              onClick={() => {
                // Dead end - does nothing meaningful
                alert("Você foi adicionado à lista de espera! Entraremos em contato em breve.");
              }}
            >
              ENTRAR NA LISTA DE ESPERA
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B0F1A" }}>
      {/* Header */}
      <header className="w-full flex justify-center pt-6 pb-4">
        <img src={alfaLogo} alt="Alfa Híbrida" className="h-10 sm:h-12 object-contain" />
      </header>

      {/* Progress bar */}
      <div className="w-full max-w-[600px] mx-auto px-6 mb-6">
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "#1e2333" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(progress, 3)}%`, background: "#6366f1" }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-5 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="w-full flex justify-center"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 mt-8">
        <p className="text-center text-[11px] sm:text-[12px]" style={{ color: "#4a5568" }}>
          © 2026 - Alfa Híbrida • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default SafePage;
