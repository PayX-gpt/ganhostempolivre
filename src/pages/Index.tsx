import { useState } from "react";
import QuizFunnel from "@/components/quiz/QuizFunnel";
import QuizFunnelB from "@/components/quiz/QuizFunnelB";
import QuizFunnelC from "@/components/quiz/QuizFunnelC";
import { getEffectiveEdition } from "@/lib/quizEdition";

const Index = () => {
  // Edição travada uma vez por sessão. Padrão = "A" (quiz principal). Quiz B e C
  // só entram quando você ligar o teste e definir split > 0 no painel.
  const [edition] = useState(getEffectiveEdition);
  if (edition === "B") return <QuizFunnelB />;
  if (edition === "C") return <QuizFunnelC />;
  return <QuizFunnel />;
};

export default Index;
