import alfaLogo from "@/assets/alfa-hibrida-logo.png";
import flagBrazil from "@/assets/flag-brazil.jpg";
import flagUsa from "@/assets/flag-usa.jpg";
import flagUk from "@/assets/flag-uk.jpg";
import flagFrance from "@/assets/flag-france.jpg";
import flagPortugal from "@/assets/flag-portugal.png";
import flagGermany from "@/assets/flag-germany.png";

/**
 * Safe/decoy page that replicates the inlead.digital quiz landing page exactly.
 * Shown to unauthorized visitors so they don't suspect any protection.
 * The "INICIAR TESTE" button links to the real inlead page.
 */
const SafePage = () => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0B0F1A" }}
    >
      {/* Header with logo */}
      <header className="w-full flex justify-center pt-6 pb-4">
        <img
          src={alfaLogo}
          alt="Alfa Híbrida"
          className="h-10 sm:h-12 object-contain"
        />
      </header>

      {/* Progress bar */}
      <div className="w-full max-w-[600px] mx-auto px-6 mb-8">
        <div className="w-full h-1 rounded-full" style={{ background: "#1e2333" }}>
          <div
            className="h-full rounded-full"
            style={{ width: "3%", background: "#6366f1" }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-5 sm:px-6">
        <div className="w-full max-w-[600px] space-y-6">
          {/* Warning box */}
          <div
            className="rounded-xl p-4 sm:p-5"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <p
              className="text-[14px] sm:text-[15px] leading-relaxed"
              style={{ color: "#c4c9d4" }}
            >
              <span className="mr-1">⚠️</span>
              <strong style={{ color: "#e2e8f0" }}>Atenção:</strong> este teste
              vai revelar se você está pronto para usar a tecnologia que já
              coloca dinheiro no bolso de pessoas comuns todos os dias — e
              indicar a estratégia mais rápida pro seu perfil.
            </p>
          </div>

          {/* Question */}
          <h2
            className="text-center font-bold text-[17px] sm:text-[19px] leading-snug"
            style={{ color: "#e2e8f0" }}
          >
            Você já tentou ganhar dinheiro online e só se frustrou?
          </h2>

          {/* Main pitch */}
          <div className="text-center">
            <p
              className="text-[18px] sm:text-[22px] font-bold leading-snug"
              style={{ color: "#e2e8f0" }}
            >
              As próximas perguntas vão mostrar,{" "}
              <span
                className="px-1"
                style={{ background: "#22c55e", color: "#0B0F1A" }}
              >
                em menos de 2 minutos
              </span>
              , o caminho mais rápido pra você{" "}
              <span
                className="px-1 font-extrabold"
                style={{ background: "#eab308", color: "#0B0F1A" }}
              >
                SAIR DAS DÍVIDAS
              </span>{" "}
              e começar a{" "}
              <span style={{ color: "#22c55e" }} className="font-extrabold">
                GANHAR R$2.000 a R$5.000/mês de maneira SEGURA
              </span>
            </p>
          </div>

          {/* Subtitle with yellow highlight */}
          <div className="text-center">
            <span
              className="inline text-[14px] sm:text-[15px] font-semibold px-1"
              style={{ background: "#eab308", color: "#0B0F1A" }}
            >
              30 minutos por dia. Método já testado. Resultados reais.
            </span>
          </div>

          {/* Country flags */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
            {[flagBrazil, flagUsa, flagUk, flagFrance, flagPortugal, flagGermany].map(
              (flag, i) => (
                <img
                  key={i}
                  src={flag}
                  alt="flag"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                />
              )
            )}
          </div>

          {/* Spacer */}
          <div className="h-4" />

          {/* CTA Button */}
          <a
            href="https://inlead.digital/quiz-f-plataforma"
            className="block w-full text-center font-bold text-[16px] sm:text-[18px] py-4 rounded-xl transition-all duration-200 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#ffffff",
              textDecoration: "none",
            }}
          >
            INICIAR TESTE!
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 mt-8">
        <p
          className="text-center text-[11px] sm:text-[12px]"
          style={{ color: "#4a5568" }}
        >
          © 2026 - Alfa Híbrida • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default SafePage;
