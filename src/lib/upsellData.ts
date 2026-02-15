export interface UpsellLeadData {
  name: string;
  price_paid: string;
  pain: string;
  goal: string;
  risk: string;
  time: string;
  device: string;
  capital: string;
}

export interface UpsellChoice {
  accelerator: "basico" | "duplo" | "maximo" | null;
  guide: boolean;
  price: number;
}

const UPSELL_LEAD_KEY = "upsell_lead_data";
const UPSELL_CHOICE_KEY = "upsell_choice";

export const initUpsellData = (): UpsellLeadData => {
  const params = new URLSearchParams(window.location.search);
  const data: UpsellLeadData = {
    name: params.get("name") || localStorage.getItem("upsell_name") || "Visitante",
    price_paid: params.get("price_paid") || "37",
    pain: params.get("pain") || "medo_errar",
    goal: params.get("goal") || "pagar_contas",
    risk: params.get("risk") || "moderado",
    time: params.get("time") || "1h",
    device: params.get("device") || "celular",
    capital: params.get("capital") || "100_500",
  };
  localStorage.setItem(UPSELL_LEAD_KEY, JSON.stringify(data));
  return data;
};

export const getUpsellData = (): UpsellLeadData => {
  try {
    const stored = localStorage.getItem(UPSELL_LEAD_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return initUpsellData();
};

export const saveUpsellChoice = (choice: UpsellChoice) => {
  localStorage.setItem(UPSELL_CHOICE_KEY, JSON.stringify(choice));
};

export const getUpsellChoice = (): UpsellChoice => {
  try {
    const stored = localStorage.getItem(UPSELL_CHOICE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { accelerator: null, guide: false, price: 0 };
};
