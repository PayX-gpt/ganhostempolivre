# 📊 Painel LIVE — Documentação Completa da Lógica

> Arquivo de referência para replicar o dashboard de monitoramento em tempo real em outros projetos.
> Gerado em: 2026-02-19

---

## 📋 ÍNDICE

1. [Arquitetura Geral](#1-arquitetura-geral)
2. [Tabelas do Banco de Dados (Supabase)](#2-tabelas-do-banco-de-dados)
3. [Sistema de Tracking (Frontend)](#3-sistema-de-tracking-frontend)
4. [Sistema de Presença em Tempo Real](#4-sistema-de-presença-em-tempo-real)
5. [Dashboard /live — Página Principal](#5-dashboard-live)
6. [Componentes do Dashboard](#6-componentes-do-dashboard)
7. [Edge Functions (Backend)](#7-edge-functions-backend)
8. [Webhook de Pagamento (Kirvano)](#8-webhook-de-pagamento)
9. [Facebook CAPI](#9-facebook-capi)
10. [Como Conectar em Outro Projeto](#10-como-conectar-em-outro-projeto)

---

## 1. ARQUITETURA GERAL

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Quiz Funnel  │  │ Upsell Funnel│  │ Offer Page (Step19) │ │
│  │ (19 steps)   │  │ (6 steps)    │  │ + Checkout          │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬───────────┘ │
│         │                 │                     │             │
│  ┌──────▼─────────────────▼─────────────────────▼───────────┐│
│  │              TRACKING DATA LAYER                          ││
│  │  • UTMs, fbclid, gclid, session_id                       ││
│  │  • Cookies (_fbp, _fbc, utmify_src, utmify_sck)          ││
│  │  • localStorage + sessionStorage persistence              ││
│  └──────┬────────────────────────────────────────────────────┘│
│         │                                                     │
│  ┌──────▼────────────────────────────────────────────────────┐│
│  │              SUPABASE CLIENT                              ││
│  │  • funnel_audit_logs (page loads, events)                 ││
│  │  • funnel_events (quiz steps, upsell steps)               ││
│  │  • lead_behavior (scroll, CTA, video, checkout)           ││
│  │  • Presence Channel (real-time user tracking)             ││
│  └───────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      BACKEND (Edge Functions)                │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                   │
│  │ kirvano-webhook  │  │ facebook-capi-ic │                   │
│  │ • Recebe vendas  │  │ • InitiateCheckout│                  │
│  │ • Salva em       │  │ • Envia p/ FB CAPI│                  │
│  │   purchase_      │  └──────────────────┘                   │
│  │   tracking       │                                        │
│  └─────────────────┘  ┌──────────────────┐                   │
│                       │ analyze-leads    │                    │
│                       │ • Score leads    │                    │
│                       │ • AI insights    │                    │
│                       │ • Buyer analysis │                    │
│                       └──────────────────┘                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    DASHBOARD /live                            │
│                                                              │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ KPIs    │ │ Presença │ │ Upsell    │ │ Inteligência   │  │
│  │ Receita │ │ Mapa do  │ │ Monitor   │ │ Comportamental │  │
│  │ Vendas  │ │ Funil    │ │ UP1-UP4   │ │ + IA           │  │
│  │ IC→Sale │ │ Usuários │ │ Revenue   │ │ + Segmentação  │  │
│  └─────────┘ └──────────┘ └───────────┘ └────────────────┘  │
│                                                              │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────────────┐  │
│  │ Revenue  │ │ Funnel       │ │ Leads Table              │  │
│  │ Chart    │ │ Analytics    │ │ Paginada + CSV + Filtros  │  │
│  │ (24h)    │ │ Bar + Line   │ │ + Session Logs Dialog    │  │
│  └──────────┘ └──────────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. TABELAS DO BANCO DE DADOS

### 2.1 `funnel_audit_logs`
Registra TODOS os eventos do funil (page loads, checkouts, redirects, upsell clicks).

```sql
CREATE TABLE public.funnel_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL,
  -- Tipos: page_loaded, checkout_initiated, payment_completed,
  -- conversion_saved, conversion_save_failed, redirect_executed,
  -- redirect_completed, redirect_failed, upsell_oneclick_buy,
  -- upsell_oneclick_decline, email_prefill
  page_id TEXT,
  session_id TEXT NOT NULL,
  payment_id TEXT,
  conversion_id TEXT,
  redirect_url TEXT,
  duration_ms INTEGER,
  status TEXT DEFAULT 'success', -- success | error | pending
  error_message TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_audit_logs;

-- Índices importantes
CREATE INDEX idx_fal_event_type ON public.funnel_audit_logs(event_type);
CREATE INDEX idx_fal_session_id ON public.funnel_audit_logs(session_id);
CREATE INDEX idx_fal_created_at ON public.funnel_audit_logs(created_at DESC);
CREATE INDEX idx_fal_page_id ON public.funnel_audit_logs(page_id);
```

### 2.2 `funnel_events`
Eventos específicos do quiz e upsell (step views, completions).

```sql
CREATE TABLE public.funnel_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  -- Tipos: step_viewed, step_completed, upsell_step_view,
  -- upsell_oneclick_decline
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;
```

### 2.3 `lead_behavior`
Rastreamento comportamental detalhado de cada lead na página de oferta.

```sql
CREATE TABLE public.lead_behavior (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  session_id TEXT NOT NULL,
  quiz_answers JSONB,
  dynamic_price NUMERIC,
  account_balance TEXT,
  
  -- Métricas comportamentais
  time_on_page_ms INTEGER DEFAULT 0,
  max_scroll_depth INTEGER DEFAULT 0,
  sections_viewed TEXT[] DEFAULT '{}',
  section_times JSONB DEFAULT '{}',
  
  -- CTA tracking
  cta_views INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  first_cta_view_ms INTEGER,
  first_cta_click_ms INTEGER,
  cta_hesitation_count INTEGER DEFAULT 0,
  
  -- Vídeo
  video_started BOOLEAN DEFAULT false,
  video_watch_time_ms INTEGER DEFAULT 0,
  
  -- FAQ
  faq_opened TEXT[] DEFAULT '{}',
  
  -- Checkout
  checkout_clicked BOOLEAN DEFAULT false,
  checkout_click_count INTEGER DEFAULT 0,
  
  -- Scoring (preenchido pela edge function analyze-leads)
  intent_score INTEGER,
  intent_label TEXT, -- cold | warm | hot | buyer
  ai_insights TEXT,
  segment_tags TEXT[]
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_behavior;
```

### 2.4 `purchase_tracking`
Fonte de verdade para vendas (preenchida pelo webhook).

```sql
CREATE TABLE public.purchase_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  transaction_id TEXT,
  plan_id TEXT,
  product_name TEXT,
  funnel_step TEXT,
  -- Valores: acelerador_basico, acelerador_duplo, acelerador_maximo,
  -- multiplicador_prata, multiplicador_ouro, multiplicador_diamante,
  -- blindagem, circulo_interno, downsell_guia
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pending',
  -- Valores: pending, approved, completed, purchased, redirected,
  -- refused, refunded, canceled, failed
  email TEXT,
  phone TEXT,
  session_id TEXT,
  user_agent TEXT,
  
  -- Redirect tracking
  redirect_completed BOOLEAN DEFAULT false,
  redirect_completed_at TIMESTAMPTZ,
  redirect_source TEXT,
  
  -- Facebook CAPI
  conversion_api_sent BOOLEAN DEFAULT false,
  
  -- Failure tracking
  failure_reason TEXT,
  
  -- UTMify
  utmify_sent BOOLEAN DEFAULT false
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_tracking;
```

### 2.5 `redirect_metrics`

```sql
CREATE TABLE public.redirect_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  session_id TEXT,
  from_page TEXT,
  to_page TEXT,
  redirect_duration_ms INTEGER
);
```

---

## 3. SISTEMA DE TRACKING (FRONTEND)

### 3.1 Tracking Data Layer (`trackingDataLayer.ts`)

O coração do rastreamento. Captura e persiste:
- UTMs (source, medium, campaign, content, term)
- Facebook (fbclid, fbp, fbc)
- Google (gclid)
- UTMify (src, sck)
- Parâmetros customizados (xcod, cwr, cname, domain, placement, adset, adname, site, xid)
- Session ID único
- Landing page, referrer, user agent

**Fluxo:**
1. Na primeira visita, extrai parâmetros da URL
2. Salva em `localStorage` (persiste entre páginas) e `sessionStorage`
3. Sincroniza cookies para UTMify e Facebook
4. Disponibiliza via `window.trackingData`

```typescript
// Inicialização (chamar no App.tsx ou main.tsx)
import { initializeTrackingDataLayer } from "./trackingDataLayer";
initializeTrackingDataLayer();

// Obter dados para checkout
import { getTrackingDataForCheckout, buildTrackingQueryString } from "./trackingDataLayer";
const checkoutUrl = `https://pay.kirvano.com/xxx${buildTrackingQueryString()}`;

// Obter dados para Facebook CAPI
import { getTrackingDataForFacebookCAPI } from "./trackingDataLayer";
```

### 3.2 Metrics Client (`metricsClient.ts`)

Salva eventos no Supabase de forma assíncrona (fire-and-forget).

```typescript
import { saveFunnelEvent } from "./metricsClient";

// Evento genérico
saveFunnelEvent("step_viewed", { step: "step-5", step_number: 5 });

// Evento com dados
saveFunnelEvent("step_completed", { 
  step: "step-5", 
  answer_key: "incomeGoal", 
  answer_value: "5000-10000",
  time_spent_ms: 4500
});
```

### 3.3 Behavior Tracker (`behaviorTracker.ts`)

Rastreia comportamento detalhado na página de oferta:
- **Scroll depth** (máximo atingido)
- **Seções visualizadas** e tempo em cada uma
- **CTA views/clicks** com timestamps
- **Hesitações** (hover no CTA sem clicar)
- **Vídeo** (iniciou + tempo assistido)
- **FAQ** (quais perguntas abriu)
- **Checkout** (clicou + quantas vezes)

Faz **flush automático a cada 10 segundos** e no `beforeunload`.

```typescript
import { 
  initBehaviorTracker, 
  trackSectionView, trackSectionLeave,
  trackCtaView, trackCtaClick, trackCtaHesitation,
  trackVideoStart, trackVideoProgress,
  trackFaqOpen, trackCheckoutClick
} from "./behaviorTracker";

// Inicializar na página de oferta
const cleanup = initBehaviorTracker(quizAnswers, { price: 47 }, "500-2000");

// Rastrear eventos
trackSectionView("hero");
trackCtaClick();
trackCheckoutClick();
trackVideoStart();
```

### 3.4 Audit Log Hook (`useAuditLog.ts`)

Hook React para registrar eventos de auditoria com timer integrado.

```typescript
import { useAuditLog } from "@/hooks/useAuditLog";

const { log, logPageLoad, logCheckoutInitiated, logPaymentCompleted } = useAuditLog("/step-19");

logPageLoad("oferta-final", 1200);
logCheckoutInitiated("plano-basico", 47);
logPaymentCompleted("tx_123", "plano-basico", 47);
```

### 3.5 Purchase Tracking (`purchaseTracking.ts`)

Rastreia redirecionamentos pós-compra.

```typescript
import { trackRedirectCompleted } from "./purchaseTracking";

await trackRedirectCompleted({
  transactionId: "tx_123",
  redirectSource: "upsell1",
  sessionId: "sess_abc123"
});
```

---

## 4. SISTEMA DE PRESENÇA EM TEMPO REAL

### 4.1 Hook `usePagePresence`

Usa Supabase Presence com **canal singleton** (nunca destruído durante a sessão).
Isso elimina oscilações no contador de usuários entre transições de página.

**Características:**
- Canal único `funnel-presence` compartilhado por todas as páginas
- Session ID persistido em `sessionStorage`
- Transmite `page_id`, `lead_name` e `joined_at`
- Ignora sessões de desenvolvimento (preview, localhost)
- Registra `page_loaded` no `funnel_audit_logs` automaticamente

```typescript
// Em cada página/step do funil
import { usePagePresence } from "@/hooks/usePagePresence";

// Dentro do componente:
usePagePresence("/step-5"); // ou "/upsell1", "/checkout", etc.
```

**No dashboard**, o componente `LiveUserPresence` escuta o mesmo canal:

```typescript
const channel = supabase.channel("funnel-presence");
channel
  .on("presence", { event: "sync" }, sync)
  .on("presence", { event: "join" }, sync)
  .on("presence", { event: "leave" }, sync)
  .subscribe();
```

---

## 5. DASHBOARD /live

### 5.1 Estrutura da Página (`Live.tsx`)

**Header:**
- Badge de usuários online (tempo real)
- Contador de visitas únicas do dia
- Controles: som, notificações, filtro de data (1h/24h/7d/30d), auto-refresh (10s), export

**KPIs (Grid 2x2 → 4 colunas no desktop):**
1. **Receita Hoje** — soma de `amount` de `purchase_tracking` (status approved)
2. **Vendas Hoje** — contagem de purchases aprovadas + reembolsos
3. **Taxa de Aprovação** — `aprovados / (aprovados + pendentes + recusados) * 100`
4. **IC → Vendas** — `compradores únicos / sessões únicas de checkout * 100`

**KPIs (Grid 3 colunas):**
1. **Leads Hoje** — count de `lead_behavior` do dia
2. **Qualificados** — leads com `intent_score >= 50`
3. **Taxa Interação** — leads com `cta_clicks > 0` / total

**Scroll horizontal de métricas avançadas:**
- Aprovação Gateway (ring chart)
- Funil IC → Venda (ring chart)
- Sessões Únicas (ring chart)
- Ticket Médio (ring chart)

**Componentes:**
1. `LiveUserPresence` — Mapa do funil + lista de usuários online
2. `LiveUpsellMonitor` — Monitor UP1-UP4
3. `LiveFunnelAnalytics` — Gráficos de funil e tráfego
4. `LiveRevenueChart` — Receita por hora (AreaChart)
5. `LiveIntelligence` — Scoring + IA + segmentação
6. `LiveLeadsTable` — Tabela paginada com todos os leads
7. Logs de auditoria (tab inferior)

### 5.2 Realtime Listeners

```typescript
// 1. Novos eventos de auditoria
supabase.channel("funnel-audit-realtime")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "funnel_audit_logs" }, handler)
  .subscribe();

// 2. Novas compras / falhas de pagamento
supabase.channel("payment-failures-realtime")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "purchase_tracking" }, handler)
  .subscribe();
```

### 5.3 Cálculos Importantes

**Visitantes Únicos do Dia:**
```typescript
const { data: visitRows } = await supabase
  .from("funnel_audit_logs")
  .select("session_id")
  .eq("event_type", "page_loaded")
  .eq("page_id", "/step-1")
  .gte("created_at", todayISO);
const uniqueVisits = new Set(visitRows?.map(r => r.session_id)).size;
```

**ICs Únicos (Checkout sessions):**
```typescript
const { data: checkoutPageLoads } = await supabase
  .from("funnel_audit_logs")
  .select("session_id")
  .eq("event_type", "page_loaded")
  .in("page_id", ["/checkout", "/step-19"])
  .gte("created_at", todayISO);
const icSessions = new Set(checkoutPageLoads?.map(r => r.session_id));
```

**Taxa de Aprovação:**
```
(aprovados) / (aprovados + pendentes_pix + recusados_cartão) × 100
```

---

## 6. COMPONENTES DO DASHBOARD

### 6.1 `LiveUserPresence`
- **25 steps** mapeados no funil (step-1 a step-19 + checkout + thanks + UP1-UP4)
- Grid responsivo 7→11 colunas
- Lista de usuários online com nome do lead
- Função `toStepId()` mapeia qualquer URL para o step correto
- Ignora `/admin`, `/live`, `/docs`

### 6.2 `LiveUpsellMonitor`
- Dados de **receita vindos do webhook** (tabela `purchase_tracking`)
- Mapeia `funnel_step` para upsell: acelerador→UP1, multiplicador→UP2, blindagem→UP3, circulo→UP4
- Views contadas via `funnel_audit_logs` + `funnel_events`
- Declines contados via `funnel_events` (event_name: upsell_oneclick_decline)
- Feed de atividade recente

### 6.3 `LiveFunnelAnalytics`
- Bar chart: visualizações por etapa (sessões únicas)
- Line chart: tráfego por hora
- Drop-off rates com barras coloridas (verde < 30%, amarelo 30-50%, vermelho > 50%)

### 6.4 `LiveRevenueChart`
- Area chart com receita por hora (Recharts)
- KPIs: Receita 24h + Vendas 24h
- Auto-refresh a cada 60s

### 6.5 `LiveIntelligence`
- **Score médio**, taxa checkout, scroll médio, tempo médio, hesitações
- **Distribuição de intenção** (Pie chart: Cold/Warm/Hot/Buyer)
- **3 botões de análise:**
  - **Funil** → `analyze-leads?action=full-funnel` (identifica gargalos)
  - **Preço** → `analyze-leads?action=buyer-analysis` (comprador vs não-comprador)
  - **IA** → `analyze-leads?action=insights` (tendências 24h)
- **Segmentação** por faixa etária, obstáculo, saldo
- Tabela de leads recentes embutida

### 6.6 `LiveLeadsTable`
- Paginação de 20 itens
- Filtros: Hoje/Ontem/7 dias/Personalizado
- Busca por nome, sessão, resposta
- Export CSV com BOM UTF-8
- Desktop: tabela completa | Mobile: cards expansíveis
- Dados: score, respostas do quiz, scroll, tempo, CTA, checkout, vídeo

### 6.7 `SessionLogsDialog`
- Timeline vertical com eventos em tempo real
- Mostra rota completa do lead (páginas visitadas)
- Integra `funnel_audit_logs` + `purchase_tracking`
- Pausa/resume do realtime
- Destaque visual para pagamentos (success/failure)

### 6.8 `LiveConversionMetrics`
- Widget flutuante (canto inferior direito)
- Mostra ICs, compras, conversão, ratio
- Toggle de visibilidade com click

---

## 7. EDGE FUNCTIONS (BACKEND)

### 7.1 `analyze-leads`
Três ações:
- `score` — Calcula intent_score baseado em: cta_clicks, time_on_page, max_scroll, video_started, checkout_clicked, cta_hesitation_count
- `insights` — Gera insights com IA sobre tendências de 24h
- `buyer-analysis` — Correlaciona compradores vs não-compradores
- `full-funnel` — Análise completa do funil com gargalos

### 7.2 `kirvano-webhook`
Webhook que recebe eventos da Kirvano:
- Normaliza status (approved, pending, refused, refunded, etc.)
- Salva/atualiza em `purchase_tracking`
- Mapeia `plan_id` para `funnel_step`
- Extrai email, phone, transaction_id

### 7.3 `facebook-capi-ic`
Envia evento `InitiateCheckout` para Facebook CAPI (server-side).
Purchase events são enviados SOMENTE pelo UTMify (evita duplicação).

---

## 8. WEBHOOK DE PAGAMENTO (Kirvano)

**URL do webhook:** `https://<project>.supabase.co/functions/v1/kirvano-webhook`

**Payload esperado:**
```json
{
  "event": "SALE_APPROVED",
  "data": {
    "transaction": { "id": "tx_123", "status": "approved" },
    "product": { "id": "prod_123", "name": "Acelerador Básico" },
    "plan": { "id": "plan_123" },
    "customer": { "email": "...", "phone": "..." },
    "purchase": { "price": { "value": 47.00 } }
  }
}
```

**Mapeamento plan_id → funnel_step:**
Configurado no código do webhook. Cada plan_id da Kirvano mapeia para um funnel_step que identifica qual upsell foi comprado.

---

## 9. FACEBOOK CAPI

### InitiateCheckout (IC)
- Enviado via edge function `facebook-capi-ic`
- Disparado no frontend quando o lead clica no checkout pela PRIMEIRA vez
- Usa event_id único para deduplicação com o pixel do browser

### Purchase
- **NÃO é enviado pelo webhook** (desabilitado para evitar duplicação)
- Enviado SOMENTE pelo UTMify (integração externa)
- UTMify usa seu próprio event_id

**Secrets necessários:**
- `FB_PIXEL_ID` — ID do pixel do Facebook
- `FB_ACCESS_TOKEN` — Token de acesso da API de Conversões

---

## 10. COMO CONECTAR EM OUTRO PROJETO

### Passo 1: Criar as tabelas
Execute as SQL do item 2 no seu banco Supabase.

### Passo 2: Copiar os arquivos de tracking
```
src/lib/trackingDataLayer.ts    → Tracking UTM/session
src/lib/metricsClient.ts        → Salvar eventos
src/lib/behaviorTracker.ts      → Comportamento na oferta
src/lib/purchaseTracking.ts     → Tracking de redirect
src/hooks/usePagePresence.ts    → Presença em tempo real
src/hooks/useAuditLog.ts        → Logs de auditoria
```

### Passo 3: Inicializar no app
```typescript
// main.tsx ou App.tsx
import { initializeTrackingDataLayer } from "./lib/trackingDataLayer";
initializeTrackingDataLayer();
```

### Passo 4: Adicionar presença em cada página
```typescript
// Em cada step/página do funil
usePagePresence("/nome-da-pagina");
```

### Passo 5: Copiar componentes do dashboard
```
src/pages/Live.tsx
src/components/LiveUserPresence.tsx
src/components/LiveFunnelAnalytics.tsx
src/components/LiveRevenueChart.tsx
src/components/LiveIntelligence.tsx
src/components/LiveLeadsTable.tsx
src/components/LiveUpsellMonitor.tsx
src/components/LiveConversionMetrics.tsx
src/components/SessionLogsDialog.tsx
```

### Passo 6: Configurar rota
```typescript
// App.tsx
<Route path="/live" element={<Live />} />
```

### Passo 7: Configurar webhook
Apontar o webhook da plataforma de pagamento para:
```
https://<seu-projeto>.supabase.co/functions/v1/kirvano-webhook
```

### Passo 8: Configurar secrets
```
FB_PIXEL_ID=seu_pixel_id
FB_ACCESS_TOKEN=seu_token
```

### Passo 9: Adaptar os steps do funil
No `LiveUserPresence.tsx`, editar o array `STEPS` com as rotas do seu novo funil.
No `LiveFunnelAnalytics.tsx`, editar o array `FUNNEL_STEPS`.

### Dependências necessárias
```json
{
  "@supabase/supabase-js": "^2.x",
  "recharts": "^2.x",
  "framer-motion": "^12.x",
  "lucide-react": "^0.4x",
  "sonner": "^1.x"
}
```

---

## RESUMO DAS MÉTRICAS

| Métrica | Fonte | Cálculo |
|---------|-------|---------|
| Receita Hoje | `purchase_tracking` | SUM(amount) WHERE status IN (approved, completed, purchased, redirected) |
| Vendas Hoje | `purchase_tracking` | COUNT WHERE status approved |
| Taxa Aprovação | `purchase_tracking` | approved / (approved + pending + refused) × 100 |
| IC → Vendas | `funnel_audit_logs` + `purchase_tracking` | unique_buyers / unique_IC_sessions × 100 |
| Leads Hoje | `lead_behavior` | COUNT do dia |
| Qualificados | `lead_behavior` | COUNT WHERE intent_score >= 50 |
| Taxa Interação | `lead_behavior` | (cta_clicks > 0) / total × 100 |
| Visitantes | `funnel_audit_logs` | Sessões únicas com page_loaded em /step-1 |
| Intent Score | `lead_behavior` | Calculado por: cta_clicks + time + scroll + video + checkout + hesitações |

---

*Este arquivo foi gerado automaticamente. Consulte o código-fonte para detalhes de implementação.*
