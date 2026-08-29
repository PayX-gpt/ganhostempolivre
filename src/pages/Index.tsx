import { useState } from "react";
import QuizFunnel from "@/components/quiz/QuizFunnel";
import QuizFunnelB from "@/components/quiz/QuizFunnelB";
import { getEffectiveEdition } from "@/lib/quizEdition";

const Index = () => {
  // Edição travada uma vez por sessão. Padrão = "A" (quiz principal). O Quiz B
  // só entra quando você ligar o teste e definir split > 0 no painel.
  const [edition] = useState(getEffectiveEdition);
  return edition === "B" ? <QuizFunnelB /> : <QuizFunnel />;
};

export default Index;
