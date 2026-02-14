import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, TrustBadge, VideoPlaceholder } from "./QuizUI";
import mentorPhoto from "@/assets/mentor-photo.jpg";

interface Step13Props {
  userName?: string;
}

const Step13Offer = ({ userName }: Step13Props) => {
  const [showCTA, setShowCTA] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const firstName = userName?.split(" ")[0] || "";

  return (
    <StepContainer>
      {/* Timer */}
      <div className="w-full funnel-card border-destructive/30 bg-destructive/5 text-center">
        <p className="text-sm text-destructive font-bold">⏰ SUA CONDIÇÃO ESPECIAL EXPIRA EM</p>
        <p className="text-3xl font-display font-bold text-foreground mt-1">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Depois disso, o valor volta ao preço original.</p>
      </div>

      {/* Headline */}
      <div className="text-center space-y-2">
        <StepTitle>
          {firstName ? `${firstName}, seu plano personalizado está pronto!` : "Seu plano personalizado está pronto!"}
        </StepTitle>
        <StepSubtitle>
          A plataforma que te guia, passo a passo, para gerar uma renda extra segura todos os dias — mesmo que você nunca tenha feito nada parecido.
        </StepSubtitle>
      </div>

      {/* VSL Video */}
      <VideoPlaceholder label="Assista para entender como funciona (4 min)" />

      {/* Mentor endorsement */}
      <div className="flex items-center gap-4 w-full funnel-card border-primary/20 bg-primary/5">
        <img
          src={mentorPhoto}
          alt="Ricardo Almeida"
          className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shrink-0"
        />
        <p className="text-sm text-foreground/90 italic leading-snug">
          "Se você chegou até aqui, é porque realmente quer mudar. Eu vou te acompanhar pessoalmente nessa jornada."
          <span className="block text-muted-foreground text-xs mt-1 not-italic font-medium">— Ricardo Almeida</span>
        </p>
      </div>

      {/* What you get */}
      <div className="w-full space-y-1">
        <p className="text-base font-bold text-foreground mb-3">O que você recebe hoje:</p>
        {[
          { icon: "✅", text: "Acesso completo à plataforma Alfa Híbrida" },
          { icon: "✅", text: "Método passo a passo — do zero ao primeiro resultado" },
          { icon: "✅", text: "Suporte humano em tempo real via WhatsApp" },
          { icon: "✅", text: "Comunidade exclusiva com +36.000 alunos" },
          { icon: "✅", text: "Acompanhamento personalizado para o seu perfil" },
          { icon: "🛡️", text: "Garantia incondicional de 7 dias — não gostou, devolvemos 100% do valor" },
        ].map((benefit, i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <span className="text-lg shrink-0">{benefit.icon}</span>
            <p className="text-base text-foreground leading-snug">{benefit.text}</p>
          </div>
        ))}
      </div>

      {/* Price anchor */}
      <div className="w-full funnel-card border-accent/30 bg-accent/5 text-center space-y-2">
        <p className="text-sm text-muted-foreground">Valor normal da plataforma:</p>
        <p className="text-xl text-muted-foreground line-through font-semibold">R$ 297,00</p>
        <p className="text-sm text-primary font-bold">🎁 Condição especial para quem completou o teste:</p>
        <p className="text-5xl font-display font-bold text-foreground mt-1">
          R$<span className="text-gradient-green">66</span>
        </p>
        <p className="text-base text-muted-foreground">ou 12x de R$6,58 no cartão</p>
        <p className="text-sm text-primary font-medium mt-1">
          💡 Menos de R$2,20 por dia — o preço de um cafezinho.
        </p>
      </div>

      {/* Real testimonials */}
      <div className="w-full space-y-3">
        <p className="text-sm text-muted-foreground text-center font-bold uppercase tracking-wider">
          O que nossos alunos 50+ dizem:
        </p>

        {[
          {
            name: "Seu José, 61 anos",
            city: "Salvador, BA",
            icon: "👨‍🦳",
            text: "Finalmente tenho tranquilidade financeira. O suporte é excelente, me ajudaram em cada passo. Já não preciso pedir dinheiro emprestado no final do mês.",
          },
          {
            name: "Dona Maria, 54 anos",
            city: "Curitiba, PR",
            icon: "👩‍🦳",
            text: "Paguei todas as minhas contas atrasadas no primeiro mês. Não acreditava que era possível na minha idade. Hoje tenho paz de espírito e dignidade.",
          },
          {
            name: "Seu Carlos, 67 anos",
            city: "Recife, PE",
            icon: "👨‍🦳",
            text: "Eu tinha medo porque já perdi dinheiro na internet. Mas aqui é diferente — tem gente de verdade te ajudando. Comecei devagar, e hoje minha esposa também usa. Juntos tiramos mais de R$200 por dia.",
          },
        ].map((t, i) => (
          <div key={i} className="funnel-card border-primary/15">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="font-bold text-base text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.city} ✅</p>
              </div>
            </div>
            <p className="text-base text-foreground/85 italic leading-relaxed">"{t.text}"</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      {showCTA ? (
        <CTAButton onClick={() => window.open("#", "_blank")} variant="accent" className="animate-fade-in text-xl animate-bounce-subtle">
          🔥 GARANTIR MEU ACESSO POR R$66
        </CTAButton>
      ) : (
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full border-3 border-primary/30 border-t-primary animate-spin mx-auto" />
          <p className="text-base text-muted-foreground animate-pulse">
            Assista o vídeo para liberar o botão de acesso...
          </p>
        </div>
      )}

      <TrustBadge>Pagamento 100% seguro • Garantia de 7 dias • Suporte em português</TrustBadge>

      {/* Final urgency */}
      <div className="w-full funnel-card border-border text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          ⚠️ <strong>Atenção:</strong> esta condição especial de R$66 é válida apenas para quem completou o teste agora. Ao sair desta página, o valor volta para R$297.
        </p>
      </div>
    </StepContainer>
  );
};

export default Step13Offer;
