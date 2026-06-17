// ─────────────────────────────────────────────────────────────
// demoData.ts — Comprehensive fake data generator for the /live
// presentation dashboard. Zero Supabase calls. 100 % hardcoded.
// ─────────────────────────────────────────────────────────────

// ─── Interface definitions ────────────────────────────────────

export interface StepData {
  step: string;
  label: string;
  views: number;
  dropOff: number;
  avgTimeMs: number;
}

export interface CampaignRow {
  campaign: string;
  leads: number;
  checkouts: number;
  sales: number;
  revenue: number;
  refunds: number;
  spend: number;
  cpa: number;
  roas: number;
  convRate: number;
}

export interface CreativeRow {
  channel: string;
  creative: string;
  leads: number;
  checkouts: number;
  sales: number;
  revenue: number;
  convRate: number;
  pitchRate: number;
}

export interface Sale {
  id: string;
  buyerName: string;
  amount: number;
  productName: string;
  source: string;
  funnelStep: string;
  createdAt: string;
  sessionId: string;
}

export interface AuditLog {
  id: string;
  created_at: string;
  event_type: string;
  page_id: string | null;
  session_id: string;
  status: string;
  metadata: unknown;
}

export interface LeadRow {
  id: string;
  session_id: string;
  created_at: string;
  quiz_answers: Record<string, string>;
  intent_score: number;
  intent_label: string;
  max_scroll_depth: number;
  time_on_page_ms: number;
  cta_clicks: number;
  checkout_clicked: boolean;
}

export interface ABVariantData {
  variant: string;
  visitors: number;
  ctaRate: number;
  quizRate: number;
  icRate: number;
  convRate: number;
  frontSales: number;
  totalRevenue: number;
  rpv: number;
  avgTicket: number;
  score: number;
}

export interface UpsellStats {
  name: string;
  views: number;
  buys: number;
  declines: number;
  revenue: number;
  convRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────

/** Returns today's date string in São Paulo time (YYYY-MM-DD) */
function todaySP(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build an ISO timestamp for today at a given hour+minute (SP time). */
function todayAt(hour: number, minute: number, second = 0): string {
  const base = todaySP();
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const ss = String(second).padStart(2, "0");
  return `${base}T${hh}:${mm}:${ss}-03:00`;
}

/** Seeded pseudo-random (deterministic across calls with same seed). */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(20260513);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function uuid(): string {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 32; i++) {
    s += hex[Math.floor(rand() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) s += "-";
  }
  return s;
}

// ─── Constant pools ──────────────────────────────────────────

const FIRST_NAMES = [
  "João", "Maria", "Carlos", "Ana", "Pedro", "Fernanda", "Lucas", "Camila",
  "Rafael", "Juliana", "Marcos", "Patrícia", "Bruno", "Letícia", "Thiago",
  "Aline", "Felipe", "Larissa", "Gabriel", "Beatriz", "Diego", "Mariana",
  "André", "Vanessa", "Ricardo", "Isabela", "Gustavo", "Priscila", "Eduardo",
  "Natália", "Vinícius", "Amanda", "Leandro", "Daniela", "Renato", "Carolina",
  "Matheus", "Bianca", "Henrique", "Tatiane", "Rodrigo", "Sabrina",
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Ferreira",
  "Almeida", "Nascimento", "Lima", "Araújo", "Ribeiro", "Carvalho", "Gomes",
  "Martins", "Rocha", "Rodrigues", "Moreira", "Barbosa", "Mendes",
];

const SOURCES_WEIGHTED: string[] = [
  ...Array(12).fill("facebook"),
  ...Array(6).fill("tiktok"),
  ...Array(2).fill("organic"),
];

const QUIZ_GOALS = [
  "Renda extra", "Demitido recentemente", "Trabalhar de casa",
  "Complementar salário", "Independência financeira",
];

const QUIZ_EXPERIENCE = ["Nenhuma", "Pouca", "Média", "Avançada"];

const QUIZ_BALANCE = ["menos100", "100-500", "500-2000", "2000-10000", "10000+"];

const QUIZ_DEVICE = ["celular", "computador", "ambos"];

const EVENT_TYPES = [
  "page_loaded", "step_viewed", "quiz_started", "quiz_answer",
  "quiz_completed", "cta_click", "scroll_depth", "video_play",
  "checkout_click", "payment_initiated", "payment_completed",
  "upsell_viewed", "upsell_accepted", "upsell_declined",
  "page_exit", "session_start", "lead_captured",
];

// ─── 1. Time-aware metrics ───────────────────────────────────
//
// Tudo aqui escala conforme o horário de São Paulo. O dia "cresce":
// às 6h temos ~1% do total diário; às 23h59 temos ~100%. Cada data tem
// um seed próprio, então hoje ≠ ontem ≠ anteontem. Recarregar a página
// no mesmo minuto mostra basicamente o mesmo número (com micro-jitter),
// mas em 10 minutos o valor já subiu de forma realista.

// Curva de tráfego brasileira (também usada em getDemoHourlyData)
const HOURLY_WEIGHTS = [
  0.4, 0.2, 0.1, 0.1, 0.1, 0.2, 0.5, 1.2,
  2.5, 3.8, 5.8, 7.2, 7.5, 7.0, 5.2, 3.8,
  3.2, 3.5, 4.8, 6.8, 7.8, 7.2, 5.0, 2.8,
];
const TOTAL_WEIGHT = HOURLY_WEIGHTS.reduce((a, b) => a + b, 0);

function spClock(): { h: number; m: number; s: number; dateKey: string } {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  return {
    h: d.getHours(),
    m: d.getMinutes(),
    s: d.getSeconds(),
    dateKey: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
  };
}

/** Fração do dia já "rodada" (0..1) seguindo a curva de tráfego. */
export function getDayProgress(): number {
  const { h, m } = spClock();
  let acc = 0;
  for (let i = 0; i < h; i++) acc += HOURLY_WEIGHTS[i];
  acc += HOURLY_WEIGHTS[h] * (m / 60);
  return Math.min(1, acc / TOTAL_WEIGHT);
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Multiplicador diário (0.85..1.18) — cada dia tem volume diferente. */
function dayMultiplier(offsetDays = 0): number {
  const { dateKey } = spClock();
  const d = new Date(dateKey);
  d.setDate(d.getDate() - offsetDays);
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  return 0.85 + hashSeed(key) * 0.33;
}

/** Jitter minúsculo por minuto (±0.5%) p/ refresh não ficar idêntico. */
function minuteJitter(salt: string): number {
  const { dateKey, h, m } = spClock();
  const r = hashSeed(`${dateKey}-${h}-${m}-${salt}`);
  return 1 + (r - 0.5) * 0.01;
}

const FULL_DAY = {
  ticketMedio: 87,
  sales: 957,
  pageviews: 25_184,
  leads: 10_577,
  checkouts: 3_280,
  adSpend: 43_315,
  quizTrafficAbs: 17_629,
  vslTrafficAbs: 7_555,
};

export interface DemoMetrics {
  ticketMedio: number;
  totalSalesApproved: number;
  revenueToday: number;
  totalPageviews: number;
  convPageviewToSale: number;
  pitchArrivalRate: number;
  leadsCapturados: number;
  checkoutInitiations: number;
  icToSaleRate: number;
  quizTrafficPct: number;
  quizTrafficAbs: number;
  vslTrafficPct: number;
  vslTrafficAbs: number;
  salesApproved: number;
  salesPending: number;
  salesRefused: number;
  salesRefunded: number;
  approvalRate: number;
  bounceStep1: number;
  activeUsersOnline: number;
  roas: number;
  cpa: number;
  adSpend: number;
  chargebackRate: number;
  dayProgress: number;
}

export function getDemoMetrics(): DemoMetrics {
  const progress = getDayProgress();
  const dayMul = dayMultiplier(0);
  const { h } = spClock();

  const scale = (full: number, salt: string) =>
    Math.round(full * dayMul * progress * minuteJitter(salt));

  const sales = Math.max(1, scale(FULL_DAY.sales, "sales"));
  const ticketMedio = FULL_DAY.ticketMedio;
  const revenueToday = sales * ticketMedio;
  const pageviews = scale(FULL_DAY.pageviews, "pv");
  const leads = scale(FULL_DAY.leads, "leads");
  const checkouts = scale(FULL_DAY.checkouts, "ic");
  const adSpend = scale(FULL_DAY.adSpend, "spend");

  const hourWeight = HOURLY_WEIGHTS[h];
  const peakWeight = Math.max(...HOURLY_WEIGHTS);
  const activeUsersOnline = Math.max(
    8,
    Math.round(160 * (hourWeight / peakWeight) * minuteJitter("au"))
  );

  const convPageviewToSale =
    pageviews > 0 ? +((sales / pageviews) * 100).toFixed(2) : 0;
  const icToSaleRate =
    checkouts > 0 ? +((sales / checkouts) * 100).toFixed(1) : 0;
  const roas = adSpend > 0 ? +(revenueToday / adSpend).toFixed(2) : 0;
  const cpa = sales > 0 ? +(adSpend / sales).toFixed(2) : 0;

  return {
    ticketMedio,
    totalSalesApproved: sales,
    revenueToday,
    totalPageviews: pageviews,
    convPageviewToSale,
    pitchArrivalRate: 42,
    leadsCapturados: leads,
    checkoutInitiations: checkouts,
    icToSaleRate,
    quizTrafficPct: 70,
    quizTrafficAbs: scale(FULL_DAY.quizTrafficAbs, "qz"),
    vslTrafficPct: 30,
    vslTrafficAbs: scale(FULL_DAY.vslTrafficAbs, "vsl"),
    salesApproved: sales,
    salesPending: Math.max(0, Math.round(sales * 0.126)),
    salesRefused: Math.max(0, Math.round(sales * 0.100)),
    salesRefunded: Math.max(0, Math.round(sales * 0.048)),
    approvalRate: 79,
    bounceStep1: 31,
    activeUsersOnline,
    roas,
    cpa,
    adSpend,
    chargebackRate: 0.2,
    dayProgress: +progress.toFixed(3),
  };
}

export function getDemoPeriodData() {
  const today = getDemoMetrics();
  const yMul = dayMultiplier(1);
  const ySales = Math.round(FULL_DAY.sales * yMul);
  const yPageviews = Math.round(FULL_DAY.pageviews * yMul);
  const yLeads = Math.round(FULL_DAY.leads * yMul);
  const yCheckouts = Math.round(FULL_DAY.checkouts * yMul);
  const ySpend = Math.round(FULL_DAY.adSpend * yMul);
  const yRevenue = ySales * FULL_DAY.ticketMedio;

  return {
    current: {
      label: "Hoje",
      revenue: today.revenueToday,
      sales: today.totalSalesApproved,
      leads: today.leadsCapturados,
      pageviews: today.totalPageviews,
      checkouts: today.checkoutInitiations,
      adSpend: today.adSpend,
      roas: today.roas,
      cpa: today.cpa,
      ticketMedio: today.ticketMedio,
      approvalRate: today.approvalRate,
      convRate: today.convPageviewToSale,
      activeUsers: today.activeUsersOnline,
    },
    previous: {
      label: "Ontem",
      revenue: yRevenue,
      sales: ySales,
      leads: yLeads,
      pageviews: yPageviews,
      checkouts: yCheckouts,
      adSpend: ySpend,
      roas: ySpend > 0 ? +(yRevenue / ySpend).toFixed(2) : 0,
      cpa: ySales > 0 ? +(ySpend / ySales).toFixed(2) : 0,
      ticketMedio: FULL_DAY.ticketMedio,
      approvalRate: 77,
      convRate:
        yPageviews > 0 ? +((ySales / yPageviews) * 100).toFixed(2) : 0,
      activeUsers: Math.round(today.activeUsersOnline * 0.86),
    },
  };
}

// Compat: snapshot inicial p/ qualquer código que ainda leia a constante.
export const DEMO_METRICS = getDemoMetrics();
export const DEMO_PERIOD_DATA = getDemoPeriodData();

// ─── 3. Hourly revenue data ─────────────────────────────────

/**
 * Curva horária realista (dois picos: almoço + noite).
 * Horas futuras (após a hora atual em SP) ficam zeradas, para que o
 * gráfico do dia "cresça" durante o dia em vez de já mostrar tudo.
 */
export function getDemoHourlyData(): {
  hour: number;
  revenue: number;
  sales: number;
}[] {
  const { h: nowH, m: nowM } = spClock();
  const dayMul = dayMultiplier(0);
  const totalSales = Math.round(FULL_DAY.sales * dayMul);
  const totalRevenue = totalSales * FULL_DAY.ticketMedio;

  return HOURLY_WEIGHTS.map((w, hour) => {
    let fraction = w / TOTAL_WEIGHT;
    if (hour > nowH) fraction = 0;
    else if (hour === nowH) fraction *= nowM / 60;

    const sales = Math.round(totalSales * fraction);
    const revenue = Math.round(totalRevenue * fraction);
    return { hour, revenue, sales };
  });
}

// ─── 4. Funnel steps ─────────────────────────────────────────

const QUIZ_FUNNEL_LABELS: [string, string][] = [
  ["step-1", "Página inicial (Quiz)"],
  ["step-2", "Qual seu objetivo?"],
  ["step-3", "Experiência com IA?"],
  ["step-4", "Quanto tempo disponível?"],
  ["step-5", "Qual dispositivo usa?"],
  ["step-6", "Saldo na conta?"],
  ["step-7", "Resultado personalizado"],
  ["step-8", "Depoimento social 1"],
  ["step-9", "Como funciona (passo a passo)"],
  ["step-10", "Prova de resultados"],
  ["step-11", "Depoimento social 2"],
  ["step-12", "Garantia explicada"],
  ["step-13", "FAQ / Objeções"],
  ["step-14", "Depoimento social 3"],
  ["step-15", "Resumo do método"],
  ["step-16", "Urgência / escassez"],
  ["step-17", "Pitch (CTA principal)"],
  ["step-18", "Checkout iniciado"],
  ["step-19", "Dados pessoais"],
  ["step-20", "Dados pagamento"],
  ["step-21", "Confirmação pedido"],
  ["step-22", "Upsell 1 (Acelerador)"],
  ["step-23", "Obrigado / Acesso"],
];

export function getDemoFunnelSteps(): StepData[] {
  // Step 1 = 17,629 (quiz traffic)
  // Step 17 = ~42% of step 1 = ~7,404
  // Smooth exponential-ish decay with slight plateaus at social proof steps
  const initial = 17_629;

  // Retention multipliers from previous step (tuned so step-17 ≈ 42%)
  const retentions = [
    1.0,   // step-1: base
    0.69,  // step-2: 31% bounce → 12,164
    0.93,  // step-3: 11,312
    0.94,  // step-4: 10,633
    0.95,  // step-5: 10,102
    0.93,  // step-6: 9,395
    0.92,  // step-7: 8,643
    0.95,  // step-8: 8,211 (social proof retains)
    0.93,  // step-9: 7,636
    0.95,  // step-10: 7,254
    0.96,  // step-11: 6,964 (social proof)
    0.94,  // step-12: 6,546
    0.93,  // step-13: 6,088
    0.96,  // step-14: 5,844 (social proof)
    0.94,  // step-15: 5,493
    0.92,  // step-16: 5,054
    0.87,  // step-17: 4,397 ← pitch arrival ~42% doesn't mean views, need to recalc
    0.75,  // step-18: checkout initiated
    0.82,  // step-19: personal data
    0.88,  // step-20: payment data
    0.78,  // step-21: order confirmed
    0.65,  // step-22: upsell
    0.90,  // step-23: thank you
  ];

  // Recalculate so step-17 ≈ 42% of step-1
  // 17629 * 0.69 * 0.93 * 0.94 * 0.95 * 0.93 * 0.92 * 0.95 * 0.93 * 0.95 * 0.96 * 0.94 * 0.93 * 0.96 * 0.94 * 0.92 * 0.87
  // Let me compute actual cascade
  const views: number[] = [initial];
  for (let i = 1; i < QUIZ_FUNNEL_LABELS.length; i++) {
    views.push(Math.round(views[i - 1] * retentions[i]));
  }

  // Adjust step-17 to target ~7,404 (42% of 17,629)
  // Current step-17 calculation: let's compute it and apply a correction
  const target17 = Math.round(initial * 0.42); // 7,404
  const current17 = views[16];
  // We'll scale retentions 1-16 uniformly if needed
  if (Math.abs(current17 - target17) > 200) {
    // Recompute with adjusted retentions
    const ratio = Math.pow(target17 / current17, 1 / 16);
    const adjusted: number[] = [initial];
    for (let i = 1; i < QUIZ_FUNNEL_LABELS.length; i++) {
      const r = i <= 16 ? retentions[i] * ratio : retentions[i];
      adjusted.push(Math.round(adjusted[i - 1] * r));
    }
    views.length = 0;
    views.push(...adjusted);
  }

  // Average time per step (ms)
  const avgTimes = [
    3200, 8500, 6200, 5800, 5500, 7200, 12000, 15000,
    18000, 14000, 12000, 9500, 22000, 11000, 16000, 8000,
    45000, 28000, 35000, 42000, 18000, 25000, 5000,
  ];

  return QUIZ_FUNNEL_LABELS.map(([step, label], i) => {
    const v = views[i];
    const next = i < views.length - 1 ? views[i + 1] : 0;
    const dropOff = v > 0 ? Math.round(((v - next) / v) * 1000) / 10 : 0;
    return {
      step,
      label,
      views: v,
      dropOff,
      avgTimeMs: avgTimes[i],
    };
  });
}

const TIKTOK_FUNNEL_LABELS: [string, string][] = [
  ["tk-1", "Landing page (VSL)"],
  ["tk-2", "Vídeo iniciado"],
  ["tk-3", "25% assistido"],
  ["tk-4", "50% assistido"],
  ["tk-5", "75% assistido"],
  ["tk-6", "Vídeo completo"],
  ["tk-7", "CTA clicado"],
  ["tk-8", "Checkout iniciado"],
  ["tk-9", "Pagamento enviado"],
  ["tk-10", "Compra confirmada"],
];

export function getDemoTiktokFunnelSteps(): StepData[] {
  const initial = 7_555;
  const retentions = [
    1.0,   // tk-1
    0.72,  // tk-2: 72% start video
    0.81,  // tk-3
    0.74,  // tk-4
    0.68,  // tk-5
    0.72,  // tk-6
    0.55,  // tk-7: CTA
    0.78,  // tk-8
    0.82,  // tk-9
    0.75,  // tk-10
  ];

  const views: number[] = [initial];
  for (let i = 1; i < TIKTOK_FUNNEL_LABELS.length; i++) {
    views.push(Math.round(views[i - 1] * retentions[i]));
  }

  const avgTimes = [
    4500, 25000, 45000, 68000, 90000, 120000, 8000, 32000, 48000, 6000,
  ];

  return TIKTOK_FUNNEL_LABELS.map(([step, label], i) => {
    const v = views[i];
    const next = i < views.length - 1 ? views[i + 1] : 0;
    const dropOff = v > 0 ? Math.round(((v - next) / v) * 1000) / 10 : 0;
    return {
      step,
      label,
      views: v,
      dropOff,
      avgTimeMs: avgTimes[i],
    };
  });
}

// ─── 5. Campaign table ───────────────────────────────────────

export function getDemoCampaigns(): CampaignRow[] {
  return [
    {
      campaign: "Criativo_VSL_Maio|120218349201",
      leads: 2_840,
      checkouts: 892,
      sales: 268,
      revenue: 23_316,
      refunds: 12,
      spend: 11_450,
      cpa: 42.72,
      roas: 2.04,
      convRate: 9.44,
    },
    {
      campaign: "Quiz_Retargeting|120218437852",
      leads: 3_120,
      checkouts: 1_024,
      sales: 312,
      revenue: 27_144,
      refunds: 14,
      spend: 9_800,
      cpa: 31.41,
      roas: 2.77,
      convRate: 10.0,
    },
    {
      campaign: "Lookalike_2pct_Compradores|120218501293",
      leads: 1_890,
      checkouts: 548,
      sales: 158,
      revenue: 13_746,
      refunds: 8,
      spend: 8_200,
      cpa: 51.90,
      roas: 1.68,
      convRate: 8.36,
    },
    {
      campaign: "TikTok_TopView_Mai|72058143290",
      leads: 1_620,
      checkouts: 482,
      sales: 128,
      revenue: 11_136,
      refunds: 7,
      spend: 9_365,
      cpa: 73.16,
      roas: 1.19,
      convRate: 7.90,
    },
    {
      campaign: "Stories_Depoimento|120218612748",
      leads: 810,
      checkouts: 228,
      sales: 64,
      revenue: 5_568,
      refunds: 3,
      spend: 3_200,
      cpa: 50.0,
      roas: 1.74,
      convRate: 7.90,
    },
    {
      campaign: "Broad_Brasil_18-55|120218298410",
      leads: 297,
      checkouts: 106,
      sales: 27,
      revenue: 2_349,
      refunds: 2,
      spend: 1_300,
      cpa: 48.15,
      roas: 1.81,
      convRate: 9.09,
    },
  ];
}

// ─── 6. Creative / channel performance ───────────────────────

export function getDemoCreatives(): CreativeRow[] {
  return [
    {
      channel: "Facebook",
      creative: "VSL_Principal_v3",
      leads: 4_210,
      checkouts: 1_380,
      sales: 418,
      revenue: 36_366,
      convRate: 9.93,
      pitchRate: 48.2,
    },
    {
      channel: "Facebook",
      creative: "Quiz_Carrossel_Depo",
      leads: 3_520,
      checkouts: 1_090,
      sales: 326,
      revenue: 28_362,
      convRate: 9.26,
      pitchRate: 52.1,
    },
    {
      channel: "TikTok",
      creative: "Hook_Demissao_v2",
      leads: 1_840,
      checkouts: 540,
      sales: 142,
      revenue: 12_354,
      convRate: 7.72,
      pitchRate: 35.4,
    },
    {
      channel: "TikTok",
      creative: "Resultado_Real_30s",
      leads: 1_007,
      checkouts: 270,
      sales: 71,
      revenue: 6_177,
      convRate: 7.05,
      pitchRate: 38.8,
    },
  ];
}

// ─── 7. Sales feed ───────────────────────────────────────────

export function getDemoSalesFeed(): Sale[] {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  const sales: Sale[] = [];

  for (let i = 0; i < 20; i++) {
    // Most recent first, 2-8 minutes apart
    const minutesAgo = i === 0 ? 1 : sales.length > 0
      ? (now.getTime() - new Date(sales[i - 1].createdAt).getTime()) / 60000 + 2 + Math.floor(rand() * 6)
      : 1;

    const ts = new Date(now.getTime() - minutesAgo * i * 60000 - (2 + Math.floor(rand() * 6)) * 60000);
    const hh = String(ts.getHours()).padStart(2, "0");
    const mm = String(ts.getMinutes()).padStart(2, "0");
    const ss = String(ts.getSeconds()).padStart(2, "0");
    const dateStr = todaySP();

    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const source = pick(SOURCES_WEIGHTED);
    const amount = pick([37, 47, 47, 47, 87, 87, 87, 87, 87, 87]);

    sales.push({
      id: uuid(),
      buyerName: `${firstName} ${lastName}`,
      amount,
      productName: "Chave Token ChatGPT",
      source,
      funnelStep: pick(["step-21", "step-21", "step-21", "tk-10"]),
      createdAt: `${dateStr}T${hh}:${mm}:${ss}-03:00`,
      sessionId: uuid(),
    });
  }

  // Sort most recent first
  sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return sales;
}

// ─── 8. Audit logs ───────────────────────────────────────────

export function getDemoAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = [];
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  for (let i = 0; i < 50; i++) {
    const minutesAgo = i * (1 + Math.floor(rand() * 4));
    const ts = new Date(now.getTime() - minutesAgo * 60000);
    const hh = String(ts.getHours()).padStart(2, "0");
    const mm = String(ts.getMinutes()).padStart(2, "0");
    const ss = String(ts.getSeconds()).padStart(2, "0");

    const eventType = pick(EVENT_TYPES);
    const pageId = eventType.includes("step") || eventType.includes("page")
      ? pick(["step-1", "step-5", "step-10", "step-17", "step-21", "tk-1", "tk-7"])
      : null;

    logs.push({
      id: uuid(),
      created_at: `${todaySP()}T${hh}:${mm}:${ss}-03:00`,
      event_type: eventType,
      page_id: pageId,
      session_id: uuid(),
      status: pick(["success", "success", "success", "success", "pending", "error"]),
      metadata: {
        user_agent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
        source: pick(SOURCES_WEIGHTED),
        ...(eventType === "scroll_depth" ? { depth: pick([25, 50, 75, 100]) } : {}),
        ...(eventType === "quiz_answer" ? { question: pick(["objetivo", "experiencia", "dispositivo"]), answer: pick(QUIZ_GOALS) } : {}),
        ...(eventType === "payment_completed" ? { amount: pick([37, 47, 87]), method: pick(["pix", "credit_card", "boleto"]) } : {}),
      },
    });
  }

  logs.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return logs;
}

// ─── 9. Leads table ──────────────────────────────────────────

export function getDemoLeads(): LeadRow[] {
  const leads: LeadRow[] = [];
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  for (let i = 0; i < 20; i++) {
    const minutesAgo = 5 + i * (3 + Math.floor(rand() * 8));
    const ts = new Date(now.getTime() - minutesAgo * 60000);
    const hh = String(ts.getHours()).padStart(2, "0");
    const mm = String(ts.getMinutes()).padStart(2, "0");
    const ss = String(ts.getSeconds()).padStart(2, "0");

    const intentScore = Math.round((30 + rand() * 70) * 10) / 10;
    const intentLabel =
      intentScore >= 80 ? "Quente" : intentScore >= 50 ? "Morno" : "Frio";

    const scrollDepth = Math.round(20 + rand() * 80);
    const timeOnPage = Math.round(15000 + rand() * 180000);
    const ctaClicks = Math.floor(rand() * 5);
    const checkoutClicked = rand() > 0.6;

    leads.push({
      id: uuid(),
      session_id: uuid(),
      created_at: `${todaySP()}T${hh}:${mm}:${ss}-03:00`,
      quiz_answers: {
        objetivo: pick(QUIZ_GOALS),
        experiencia: pick(QUIZ_EXPERIENCE),
        saldo: pick(QUIZ_BALANCE),
        dispositivo: pick(QUIZ_DEVICE),
        nome: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      },
      intent_score: intentScore,
      intent_label: intentLabel,
      max_scroll_depth: scrollDepth,
      time_on_page_ms: timeOnPage,
      cta_clicks: ctaClicks,
      checkout_clicked: checkoutClicked,
    });
  }

  leads.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return leads;
}

// ─── 10. A/B test data ──────────────────────────────────────

export function getDemoABData(): ABVariantData[] {
  return [
    {
      variant: "A",
      visitors: 12_840,
      ctaRate: 14.2,
      quizRate: 68.5,
      icRate: 13.8,
      convRate: 4.1,
      frontSales: 527,
      totalRevenue: 45_849,
      rpv: 3.57,
      avgTicket: 87,
      score: 92,
    },
    {
      variant: "E",
      visitors: 12_344,
      ctaRate: 12.8,
      quizRate: 64.2,
      icRate: 12.1,
      convRate: 3.5,
      frontSales: 430,
      totalRevenue: 37_410,
      rpv: 3.03,
      avgTicket: 87,
      score: 78,
    },
  ];
}

// ─── 11. Realtime event simulator ────────────────────────────

let _realtimeCounter = 0;

export function createRealtimeSimulator(): () => AuditLog {
  return () => {
    _realtimeCounter++;
    const now = new Date();
    const eventType = pick(EVENT_TYPES);
    const pageId = eventType.includes("step") || eventType.includes("page")
      ? pick(["step-1", "step-2", "step-5", "step-10", "step-17", "step-18", "step-21", "tk-1", "tk-5", "tk-7"])
      : null;

    const source = pick(SOURCES_WEIGHTED);
    const status = pick(["success", "success", "success", "success", "pending"]);

    let metadata: unknown = {
      user_agent: pick([
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36",
      ]),
      source,
    };

    if (eventType === "payment_completed") {
      metadata = {
        ...(metadata as Record<string, unknown>),
        amount: pick([37, 47, 87]),
        method: pick(["pix", "pix", "credit_card", "credit_card", "boleto"]),
        buyer: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      };
    } else if (eventType === "quiz_answer") {
      metadata = {
        ...(metadata as Record<string, unknown>),
        question: pick(["objetivo", "experiencia", "dispositivo", "saldo"]),
        answer: pick([...QUIZ_GOALS, ...QUIZ_EXPERIENCE, ...QUIZ_DEVICE]),
      };
    } else if (eventType === "scroll_depth") {
      metadata = {
        ...(metadata as Record<string, unknown>),
        depth: pick([25, 50, 75, 100]),
      };
    } else if (eventType === "checkout_click") {
      metadata = {
        ...(metadata as Record<string, unknown>),
        product: "Chave Token ChatGPT",
        price: pick([37, 47, 87]),
      };
    } else if (eventType === "upsell_accepted" || eventType === "upsell_declined") {
      metadata = {
        ...(metadata as Record<string, unknown>),
        upsell: pick(["Acelerador Básico", "Acelerador Duplo", "Acelerador Máximo"]),
        price: pick([97, 197, 297]),
      };
    }

    return {
      id: `rt-${_realtimeCounter}-${Date.now()}`,
      created_at: now.toISOString(),
      event_type: eventType,
      page_id: pageId,
      session_id: `sim-${uuid()}`,
      status,
      metadata,
    };
  };
}

// ─── 12. Upsell data ────────────────────────────────────────

export function getDemoUpsellStats(): Record<string, UpsellStats> {
  return {
    acelerador_basico: {
      name: "Acelerador Básico",
      views: 682,
      buys: 218,
      declines: 464,
      revenue: 21_146,
      convRate: 31.96,
    },
    acelerador_duplo: {
      name: "Acelerador Duplo",
      views: 524,
      buys: 142,
      declines: 382,
      revenue: 27_974,
      convRate: 27.10,
    },
    acelerador_maximo: {
      name: "Acelerador Máximo",
      views: 418,
      buys: 84,
      declines: 334,
      revenue: 24_948,
      convRate: 20.10,
    },
    guia_prompts: {
      name: "Guia de Prompts Pro",
      views: 380,
      buys: 133,
      declines: 247,
      revenue: 5_187,
      convRate: 35.0,
    },
    multiplicador: {
      name: "Multiplicador de Ganhos",
      views: 310,
      buys: 78,
      declines: 232,
      revenue: 11_622,
      convRate: 25.16,
    },
    blindagem: {
      name: "Blindagem de Conta",
      views: 295,
      buys: 103,
      declines: 192,
      revenue: 7_107,
      convRate: 34.92,
    },
  };
}
