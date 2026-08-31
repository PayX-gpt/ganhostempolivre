/**
 * Teste A/B de ETAPAS (etapa 9 Saldo + etapa 11 Demo).
 * A = versão original. B = versão nova (pergunta suave + demo rápida com promessa).
 * Sorteio 50/50 travado por visitante no localStorage. Independente do teste de
 * versão (V1/V2), variante (tela inicial) e edição (A/B/C).
 */
export type StepExp = "A" | "B";
const KEY = "step_exp";

export function getStepExp(): StepExp {
  try {
    const s = localStorage.getItem(KEY);
    if (s === "A" || s === "B") return s;
    const v: StepExp = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem(KEY, v);
    return v;
  } catch {
    return "A";
  }
}
