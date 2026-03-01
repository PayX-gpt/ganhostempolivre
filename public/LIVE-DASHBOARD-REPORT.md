# 📊 Relatório Completo — Dashboard /live

## Visão Geral

Dashboard de monitoramento em tempo real para funil de vendas. Rota: `/live`. Stack: React + TypeScript + Supabase Realtime + Recharts + Tailwind CSS + shadcn/ui.

---

## 1. ARQUITETURA DE ARQUIVOS

```
src/pages/Live.tsx                    — Página principal (612 linhas)
src/components/LiveUserPresence.tsx   — Mapa do funil em tempo real (460 linhas)
src/components/LiveSalesFeed.tsx      — Feed de vendas ao vivo (263 linhas)
src/components/LiveUpsellMonitor.tsx  — Monitor de upsells UP1-UP6 (364 linhas)
src/components/LiveFunnelAnalytics.tsx — Gráficos de funil 24h (271 linhas)
src/components/LiveRevenueChart.tsx   — Gráfico de receita por hora (185 linhas)
src/components/LiveIntelligence.tsx   — Inteligência comportamental + IA (416 linhas)
src/components/LiveLeadsTable.tsx     — Tabela de leads com filtros (490 linhas)
src/components/LiveConversionMetrics.tsx — Widget flutuante de métricas (160 linhas)
src/components/CampaignFilter.tsx     — Filtro por campanha UTM (151 linhas)
src/components/SessionLogsDialog.tsx  — Dialog de jornada do lead (405 linhas)
src/hooks/usePagePresence.ts         — Hook de presença do usuário (173 linhas)
src/hooks/useAuditLog.ts             — Hook de audit logs (138 linhas)
src/lib/metricsClient.ts             — Cliente de métricas (37 linhas)
src/lib/trackingDataLayer.ts         — Camada de dados de tracking
src/lib/behaviorTracker.ts           — Tracker de comportamento
```

---

## 2. TABELAS SUPABASE NECESSÁRIAS

### 2.1 `funnel_audit_logs`
Armazena todos os eventos do funil (page_loaded, checkout_initiated, payment_completed, etc.)

```sql
CREATE TABLE funnel_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_id TEXT,
  payment_id TEXT,
  conversion_id TEXT,
  redirect_url TEXT,
  duration_ms INTEGER,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT
);

-- RLS
ALTER TABLE funnel_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert audit" ON funnel_audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select audit" ON funnel_audit_logs FOR SELECT USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE funnel_audit_logs;
```

### 2.2 `funnel_events`
Eventos granulares do frontend (step_viewed, lead_captured, checkout_click, upsell_step_view, upsell_oneclick_decline).

```sql
CREATE TABLE funnel_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  user_agent TEXT
);

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert events" ON funnel_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select events" ON funnel_events FOR SELECT USING (true);
```

### 2.3 `purchase_tracking`
Registro de compras via webhook (Kirvano/Hotmart/etc).

```sql
CREATE TABLE purchase_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  session_id TEXT,
  email TEXT,
  buyer_name TEXT,
  amount NUMERIC,
  product_name TEXT,
  funnel_step TEXT,
  status TEXT DEFAULT 'purchased',
  transaction_id TEXT,
  failure_reason TEXT,
  plan_id TEXT,
  event_id TEXT,
  whop_payment_id TEXT,
  vsl_variant TEXT,
  redirect_completed BOOLEAN DEFAULT false,
  redirect_completed_at TIMESTAMPTZ,
  redirect_source TEXT,
  pixel_sent BOOLEAN DEFAULT false,
  conversion_api_sent BOOLEAN DEFAULT false,
  utmify_sent BOOLEAN DEFAULT false,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  gclid TEXT,
  fbp TEXT,
  fbc TEXT,
  landing_page TEXT,
  referrer TEXT
);

ALTER TABLE purchase_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert purchase" ON purchase_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select purchase" ON purchase_tracking FOR SELECT USING (true);
CREATE POLICY "Allow update purchase" ON purchase_tracking FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE purchase_tracking;
```

### 2.4 `lead_behavior`
Dados comportamentais por sessão (scroll, tempo, CTA clicks, intent score, etc).

```sql
CREATE TABLE lead_behavior (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  session_id TEXT NOT NULL,
  quiz_answers JSONB DEFAULT '{}'::jsonb,
  time_on_page_ms INTEGER DEFAULT 0,
  max_scroll_depth INTEGER DEFAULT 0,
  sections_viewed TEXT[] DEFAULT '{}',
  section_times JSONB DEFAULT '{}'::jsonb,
  cta_views INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  cta_hesitation_count INTEGER DEFAULT 0,
  first_cta_view_ms INTEGER,
  first_cta_click_ms INTEGER,
  video_started BOOLEAN DEFAULT false,
  video_watch_time_ms INTEGER DEFAULT 0,
  faq_opened TEXT[] DEFAULT '{}',
  checkout_clicked BOOLEAN DEFAULT false,
  checkout_click_count INTEGER DEFAULT 0,
  intent_score INTEGER,
  intent_label TEXT,
  segment_tags TEXT[] DEFAULT '{}',
  dynamic_price NUMERIC,
  ai_insights TEXT,
  account_balance TEXT
);

ALTER TABLE lead_behavior ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert lead_behavior" ON lead_behavior FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select lead_behavior" ON lead_behavior FOR SELECT USING (true);
CREATE POLICY "Allow update lead_behavior" ON lead_behavior FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE lead_behavior;
```

### 2.5 `session_attribution`
Atribuição de fonte de tráfego por sessão (UTMs, click IDs).

```sql
CREATE TABLE session_attribution (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  session_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  gclid TEXT,
  ttclid TEXT,
  fbp TEXT,
  fbc TEXT,
  ttp TEXT,
  landing_page TEXT,
  referrer TEXT
);

ALTER TABLE session_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert session_attribution" ON session_attribution FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select session_attribution" ON session_attribution FOR SELECT USING (true);
CREATE POLICY "Allow update session_attribution" ON session_attribution FOR UPDATE USING (true);
```

### 2.6 `redirect_metrics`
Métricas de redirecionamento entre páginas.

```sql
CREATE TABLE redirect_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  session_id TEXT NOT NULL,
  from_page TEXT NOT NULL,
  to_page TEXT NOT NULL,
  redirect_duration_ms INTEGER NOT NULL
);

ALTER TABLE redirect_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert redirects" ON redirect_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select redirects" ON redirect_metrics FOR SELECT USING (true);
```

---

## 3. COMPONENTES — LÓGICA DETALHADA

### 3.1 Live.tsx (Página Principal)

**Função:** Orquestra todos os componentes do dashboard.

**Estado principal:**
- `logs` / `realtimeLogs` / `allRealtimeLogs` — Audit logs históricos e em tempo real
- `frontendICs` — Sessões únicas que clicaram checkout (de `funnel_events.event_name = 'checkout_click'`)
- `hotmartSalesToday` — Compras aprovadas hoje (de `purchase_tracking`)
- `totalRevenueToday` — Receita total em BRL
- `totalLeadsToday` — Leads capturados (de `funnel_events.event_name = 'lead_captured'`)
- `qualifiedLeadsToday` — Leads com `intent_score >= 50` (de `lead_behavior`)
- `hotmartApproved/Pending/Refused/Refunded` — Status de pagamento
- `campaignFilterState` — Estado do filtro de campanhas

**Métricas calculadas:**
- **Taxa de Aprovação** = `aprovados / (aprovados + pendentes + recusados) * 100`
- **IC → Vendas** = `compradores únicos / sessões IC * 100`
- **Ratio** = `1:N` onde N = `ICs / compradores`
- **Taxa de Interação** = `leads com cta_clicks > 0 / total leads * 100`

**Realtime channels:**
1. `funnel-audit-realtime` — INSERT em `funnel_audit_logs`
2. `payment-failures-realtime` — INSERT em `purchase_tracking` (toast de falha + refetch)

**Auto-refresh:** A cada 10 segundos + visibilitychange

**Componentes MetricCard e ProgressRing** são definidos inline no arquivo.

**Tipos de evento importantes filtrados:**
```typescript
const IMPORTANT_EVENT_TYPES = [
  "page_loaded", "checkout_initiated", "email_prefill", "payment_completed",
  "conversion_saved", "conversion_save_failed", "redirect_executed",
  "redirect_completed", "redirect_failed",
  "upsell_oneclick_buy", "upsell_oneclick_decline",
];
```

**Layout (ordem dos componentes):**
1. Header com controles (som, notificações, filtro de data, auto-refresh, export)
2. Badges de status (online, visitas, última atualização)
3. Grid 4 cols: Receita, Vendas, Taxa Aprovação, IC→Vendas
4. Grid 3 cols: Leads, Qualificados, Taxa Interação
5. Scroll horizontal: Aprovação Gateway, Funil IC→Venda, Sessões Únicas, Ticket Médio (ProgressRings)
6. CampaignFilter
7. LiveUserPresence (mapa do funil)
8. LiveSalesFeed
9. LiveUpsellMonitor
10. LiveFunnelAnalytics (gráficos)
11. LiveRevenueChart
12. LiveIntelligence
13. LiveLeadsTable
14. Tabs com Logs (filtráveis por evento e session_id)
15. SessionLogsDialog (modal ao clicar em log)

---

### 3.2 LiveUserPresence.tsx (Mapa do Funil em Tempo Real)

**Função:** Exibe mapa visual do funil com contagem de usuários em cada etapa em tempo real via Supabase Presence.

**Etapas do funil (STEPS):**
```
step1 (Intro) → step2 (Idade) → step3 (Nome) → step4 (Prova Social) →
step5 (Tentou Online) → step6 (Meta Renda) → step7 (Obstáculo) →
step8 (Vídeo Mentor) → step9 (Saldo) → step10 (Disponibilidade) →
step11 (Demo) → step12 (Loading) → step13 (Prova Social 2) →
step14 (WhatsApp) → step15 (Contato) → step16 (Input) →
step17 (Oferta Final) → checkout → thanks →
upsell1 (Acelerador) → upsell2 (Multiplicador) → upsell3 (Blindagem) →
upsell4 (Círculo) → upsell5 (Safety) → upsell6 (FOREX)
```

**Como funciona:**
1. Subscreve ao canal `funnel-presence` como observador admin (`admin_observer_TIMESTAMP`)
2. Recebe sync/join/leave events do Supabase Presence
3. Mapeia cada `page_id` do presence para um `stepId` via `toStepId()`
4. Filtra sessões admin/live/localhost
5. Exibe grid de cards com ícone + contagem por etapa

**Mapeamento de rotas (toStepId):**
- `/step-18` → `step16`, `/step-19` → `step17` (aliases legados)
- `/upsell-*` variantes mapeadas para `upsell1`-`upsell6`
- `/checkout`, `/processing` → `checkout`
- `/thanks` → `thanks`

**Codificação de cores por fonte de tráfego:**
- **TikTok** → borda vermelha + glow vermelho + dot vermelho
- **Meta** → borda verde + glow verde + dot verde
- **Misto** → borda amarela
- **Orgânico** → verde padrão

**Filtragem por campanha:**
- Mantém dados brutos (unfiltered) em `allPresenceDataRef`
- Quando `selectedCampaigns.size > 0`, filtra por `sessionCampaignMap[session_id]`
- Cross-referencia com `session_attribution` para obter campanha de cada sessão

**Lista de usuários online:**
- Nome do lead (ou "Visitante")
- Badge de fonte (TikTok/Meta)
- Badge de campanha (quando filtro ativo)
- Badge de compra com valor (quando existe em `purchase_tracking`)

**Props:**
```typescript
interface LiveUserPresenceProps {
  onTotalChange?: (total: number) => void;  // Callback para Live.tsx atualizar contador
  campaignFilter?: CampaignFilterState;      // Filtro de campanhas
}
```

---

### 3.3 LiveSalesFeed.tsx (Feed de Vendas)

**Função:** Lista as últimas 20 vendas aprovadas do dia.

**Fonte de dados:** `purchase_tracking` WHERE `status = 'approved'`

**Enriquecimento:** Cross-referencia com `session_attribution` para obter a fonte real de tráfego (prioriza dados internos sobre dados do webhook Kirvano).

**Detecção de fonte:**
```typescript
// Prioridade: own_fbclid > own_source > fbclid > utm_source
const isMetaSource = (sale): boolean => {
  if (sale.own_fbclid) return true;
  if (sale.own_source?.includes("facebook|instagram|meta")) return true;
  if (sale.fbclid) return true;
  // ...fallback to Kirvano utm_source
};
```

**Limpeza de nome de campanha:**
```typescript
// "[OB LOVABLE]|12024..." → "[OB LOVABLE]"
const parseCampaignName = (raw) => raw?.split("|")[0].trim();
```

**Labels de produto:**
```typescript
const STEP_LABELS = {
  front_37: "Produto Principal R$37",
  acelerador_basico: "Acelerador Básico",
  multiplicador_prata: "Multiplicador Prata",
  blindagem: "Blindagem",
  circulo_interno: "Círculo Interno",
  safety_pro: "Safety Pro",
  forex_mentoria: "FOREX Mentoria",
  downsell_guia: "Guia Downsell",
};
```

**Realtime:** Canal `live-sales-feed` + polling fallback a cada 15s.

**Animação:** Nova venda recebe `scale-[1.01]` + fundo colorido por 3 segundos.

---

### 3.4 LiveUpsellMonitor.tsx (Monitor de Upsells)

**Função:** Monitora conversões, recusas e receita de cada upsell (UP1-UP6).

**Dados coletados por upsell:**
- `views` — Sessões únicas que viram a página (de `funnel_audit_logs` + `funnel_events`)
- `buys` — Compras confirmadas (de `purchase_tracking` WHERE `funnel_step` in mapa)
- `declines` — Recusas (de `funnel_events.event_name = 'upsell_oneclick_decline'`)
- `revenue` — Soma dos valores aprovados

**Mapeamento funnel_step → upsell:**
```typescript
const STEP_TO_UPSELL = {
  acelerador_basico: "upsell1",
  acelerador_duplo: "upsell1",
  acelerador_maximo: "upsell1",
  multiplicador_prata: "upsell2",
  multiplicador_ouro: "upsell2",
  multiplicador_diamante: "upsell2",
  blindagem: "upsell3",
  circulo_interno: "upsell4",
  safety_pro: "upsell5",
  forex_mentoria: "upsell6",
  downsell_guia: "upsell1",
};
```

**KPIs agregados:**
- Receita total de upsells
- Total de compras
- Taxa de conversão global = `totalBuys / totalViews * 100`

**Feed de atividade recente:** Últimas 20 ações (compras + recusas) com timestamp.

**Realtime:** Canal `upsell-monitor-realtime` + polling a cada 15s.

---

### 3.5 LiveFunnelAnalytics.tsx (Gráficos do Funil)

**Função:** Gráficos de barra (funil por etapa) + linha (tráfego por hora) + drop-off rates.

**Etapas definidas (FUNNEL_STEPS):**
23 etapas: `/step-1` a `/step-17` + `/upsell1` a `/upsell6`

**Aliases de rota:**
```typescript
const ROUTE_ALIASES = { "/step-18": "/step-16", "/step-19": "/step-17" };
```

**Dados:**
- Contagem de sessões únicas por etapa (de `funnel_audit_logs.event_type = 'page_loaded'`)
- Cross-referencia com `session_attribution` para segmentação por campanha
- Checkout clicks de `funnel_events.event_name = 'checkout_click'`

**Modo campanha:** Quando filtro ativo, exibe barras empilhadas (stacked) coloridas por campanha.

**Drop-off:** Calculado como `(prevViews - views) / prevViews * 100` por etapa.

**KPIs:**
- Visualizações (step-1)
- Viram Oferta (step-17)
- Checkout (checkout_click events)
- Completaram (última etapa)

**Gráficos (Recharts):**
1. BarChart — Funil por etapa (ou stacked por campanha)
2. LineChart — Tráfego por hora
3. Lista de drop-off rates com barras de progresso coloridas

**Realtime:** Canal + polling a cada 30s.

---

### 3.6 LiveRevenueChart.tsx (Gráfico de Receita)

**Função:** AreaChart de receita + vendas por hora.

**Fonte:** `purchase_tracking` WHERE status IN ('completed', 'purchased', 'approved', 'redirected')

**Multiplicador:** Aceita prop `usdToBrl` (padrão 1, sem conversão).

**Tooltip customizado:** Mostra hora, receita em R$ e contagem de vendas.

**Atualização:** A cada 60 segundos.

---

### 3.7 LiveIntelligence.tsx (Inteligência Comportamental)

**Função:** Análise comportamental dos leads + integração com IA.

**Dados:** `lead_behavior` das últimas 24h (até 200 registros).

**KPIs calculados:**
- Score médio, taxa de checkout, scroll médio, tempo médio, hesitações médias

**Distribuição de intenção (PieChart):**
- Cold: score < 35
- Warm: 35-59
- Hot: 60-79
- Buyer: 80+

**Segmentação por quiz answers:**
- Por faixa etária, obstáculo, saldo
- Mostra taxa de checkout por segmento

**3 botões de análise IA (Edge Functions):**
1. **Funil** (`action: "full-funnel"`) — Gargalos e ações de crescimento
2. **Preço** (`action: "buyer-analysis"`) — Comprador vs não-comprador + sugestões de preço
3. **IA** (`action: "insights"`) — Insights de tendências 24h

**Edge Function chamada:** `analyze-leads`

**Análise de preço retorna:**
- Comparação comprador vs abandonador (tempo, scroll, CTA clicks, hesitações, vídeo, score, preço)
- Sugestões por segmento: `pode_aumentar`, `testar_reducao`, `revisar_funil`, `manter`

---

### 3.8 LiveLeadsTable.tsx (Tabela de Leads)

**Função:** Tabela completa de leads com todas as respostas do quiz e métricas comportamentais.

**Fonte:** `lead_behavior` (até 500 registros).

**Filtros:**
- Data: Hoje, Ontem, 7 dias, Personalizado
- Busca: nome, idade, sessão, intent_label, saldo
- Paginação: 20 por página

**Colunas quiz:**
```
Idade, Nome, Tentou Online, Meta Renda, Obstáculo, Sonho, 
Saldo, Dispositivo, Disponibilidade, Contato, Email, Telefone
```

**Colunas de interação:**
Scroll, Tempo, CTA Views/Clicks, Hesitações, Checkout, Vídeo, Seções

**Cores de intent:**
```typescript
const INTENT_COLORS = {
  buyer: "#22c55e",  // verde
  hot: "#f59e0b",    // amarelo
  warm: "#3b82f6",   // azul
  cold: "#6b7280",   // cinza
};
```

**Export CSV:** Com BOM UTF-8 para compatibilidade Excel.

**Responsivo:** Desktop mostra tabela, mobile mostra cards expansíveis.

---

### 3.9 CampaignFilter.tsx (Filtro de Campanhas)

**Função:** Filtro multi-select de campanhas UTM.

**Fonte:** `session_attribution.utm_campaign` do dia.

**Limpeza de nomes:**
```typescript
// Remove IDs técnicos: "CampanhaX|12345" → "CampanhaX"
const cleanCampaignName = (name) => name.split("|")[0].trim().slice(0, 25);
```

**Paleta de cores:** 15 cores pré-definidas, atribuídas por índice.

**Output (CampaignFilterState):**
```typescript
interface CampaignFilterState {
  selectedCampaigns: Set<string>;
  allCampaigns: string[];
  campaignColors: Record<string, string>;
}
```

**Sempre inclui "Direto"** para tráfego sem UTM.

---

### 3.10 SessionLogsDialog.tsx (Jornada do Lead)

**Função:** Modal que mostra timeline completa de uma sessão específica.

**Dados combinados:**
1. `funnel_audit_logs` WHERE `session_id = X`
2. `purchase_tracking` WHERE `session_id = X`

**Timeline unificada:** Logs + compras ordenados cronologicamente.

**Informações exibidas:**
- Rota completa (badges de páginas visitadas)
- Email do comprador (se existir)
- Contagem de eventos
- Receita total da sessão
- Cada evento com ícone, badge colorido, status, timestamp
- Pagamentos com produto, valor, step, transaction_id, failure_reason

**Realtime:** Canais específicos por session_id para atualizações em tempo real.

**Controles:**
- Pause/Play do realtime
- Copiar session_id

---

### 3.11 usePagePresence.ts (Hook de Presença)

**Função:** Registra a presença do usuário no canal Supabase Presence.

**Canal:** `funnel-presence` (singleton — nunca destruído durante a sessão).

**Dados enviados:**
```typescript
{
  session_id: string,
  page_id: string,       // ex: "/step-5"
  lead_name: string,     // ex: "João" ou "Visitante"
  traffic_source: string, // "tiktok", "meta", "google", "organic"
  joined_at: string       // ISO timestamp
}
```

**Detecção de dev session (excluída):**
- URLs com `__lovable_token=`
- Hostnames com `lovableproject.com`, `lovable.app`, `preview--`, `localhost`

**Atualização de nome:**
- Evento `quiz_name_updated` dispara re-track imediato
- Polling a cada 2s como fallback

**Audit log:** Registra `page_loaded` em `funnel_audit_logs` a cada mudança de página.

**Cleanup:** `beforeunload` chama `untrack()`.

---

### 3.12 useAuditLog.ts (Hook de Audit)

**Função:** Registra eventos no `funnel_audit_logs`.

**Métodos disponíveis:**
- `logPageLoad(pageName, loadTime?)`
- `logCheckoutInitiated(product, amount)`
- `logPaymentCompleted(paymentId, product, amount)`
- `logConversionSaved(conversionId, paymentId, duration)`
- `logConversionError(paymentId, error)`
- `logRedirectExecuted(targetUrl, paymentId?, duration?)`
- `logRedirectFailed(targetUrl, error)`
- `log(params)` — genérico

**Session ID:** Gerado uma vez e persistido em `localStorage` como `audit_session_id`.

---

### 3.13 metricsClient.ts

**Funções:**
- `saveFunnelEvent(eventName, eventData)` — Salva em `funnel_events`
- `saveRedirectMetric(fromPage, toPage, durationMs)` — Salva em `redirect_metrics`

---

## 4. FLUXO DE DADOS

```
[Usuário no Funil]
    │
    ├─→ usePagePresence → Supabase Presence (canal "funnel-presence")
    │                        ↓
    │                   LiveUserPresence (observa presence sync/join/leave)
    │
    ├─→ useAuditLog → INSERT funnel_audit_logs
    │                    ↓
    │               Live.tsx (canal "funnel-audit-realtime")
    │               LiveFunnelAnalytics (canal "funnel-analytics-realtime")
    │
    ├─→ saveFunnelEvent → INSERT funnel_events
    │                       ↓
    │                  LiveUpsellMonitor (filtra upsell events)
    │                  Live.tsx (conta checkout_click, lead_captured, step_viewed)
    │
    ├─→ behaviorTracker → UPSERT lead_behavior
    │                       ↓
    │                  LiveIntelligence (analisa comportamento)
    │                  LiveLeadsTable (tabela completa)
    │
    └─→ Webhook Kirvano → INSERT purchase_tracking
                            ↓
                       LiveSalesFeed (canal "live-sales-feed")
                       LiveUpsellMonitor (canal "upsell-monitor-realtime")
                       Live.tsx (canal "payment-failures-realtime")
                       LiveRevenueChart (polling 60s)
```

---

## 5. EDGE FUNCTIONS NECESSÁRIAS

### 5.1 `analyze-leads`
Chamada por LiveIntelligence com 3 ações:
- `action: "score"` — Calcula intent_score para leads sem score
- `action: "insights"` — Gera insights IA sobre tendências 24h
- `action: "buyer-analysis"` — Compara compradores vs não-compradores + sugere preços
- `action: "full-funnel"` — Análise completa do funil

### 5.2 `kirvano-webhook`
Recebe webhooks de pagamento e insere em `purchase_tracking`.

---

## 6. DEPENDÊNCIAS npm

```json
{
  "recharts": "^2.15.4",          // Gráficos
  "@supabase/supabase-js": "^2",  // Supabase client + Realtime + Presence
  "lucide-react": "^0.462.0",     // Ícones
  "sonner": "^1.7.4",             // Toasts
  "react-router-dom": "^6",       // Roteamento
  "tailwind-merge": "^2",         // Merge de classes
  "class-variance-authority": "^0.7", // Variantes de componentes
  "@radix-ui/react-*": "latest",  // Primitivos UI (dialog, tabs, select, scroll-area, etc.)
}
```

---

## 7. DESIGN SYSTEM

**Tema:** Dark mode exclusivo.

**Cores base:**
- Background: `#0a0a0a` (página), `#0d0d0d` (cards internos), `#1a1a1a` (cards externos), `#141414` (header)
- Borders: `#2a2a2a` (normal), `#3a3a3a` (hover)
- Text: `#fff` (primary), `#888` (secondary), `#666` (tertiary), `#444`/`#333` (disabled)

**Cores semânticas:**
- Emerald (`#10b981`) — Sucesso, vendas, Meta
- Red (`#ef4444`) — TikTok, erros
- Violet (`#8b5cf6`) — Upsells, inteligência
- Amber (`#f59e0b`) — Alertas, hot leads
- Sky (`#06b6d4`) — Funil analytics, informacional
- Yellow — Tráfego misto

**Padrão de cards:**
```html
<div class="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
```

**Animações:**
- `animate-ping` — Indicador de ao vivo
- `animate-spin` — Loading/refresh
- `animate-pulse` — Auto-refresh ativo
- `transition-all duration-300` — Hover effects
- `hover:scale-[1.02]` — Cards de métrica

---

## 8. CONFIGURAÇÃO DO ROTEAMENTO

Na rota do React Router:
```tsx
<Route path="/live" element={<Live />} />
```

A presença (`usePagePresence`) exclui automaticamente `/live` e `/admin` do tracking.

---

## 9. NOTAS DE IMPLEMENTAÇÃO

1. **Presença é singleton:** O canal Presence nunca é destruído durante a sessão (apenas `untrack` no `beforeunload`)
2. **Deduplicação de logs:** Realtime logs verificam duplicatas por session_id + event_type + page_id + janela de 3-5s
3. **Polling como fallback:** Todos os componentes usam polling + realtime para garantir dados mesmo com falhas de WebSocket
4. **Dados de sessão anteriores:** O `OLD_STEP_MAP` garante retrocompatibilidade com funis de 19 etapas
5. **Limite de queries:** Supabase default 1000 rows — os componentes usam `.limit(500)` e contam sessões únicas via `Set()`
6. **Moeda:** Tudo em BRL (R$). O `usdToBrl` no LiveRevenueChart é passado como 1
7. **Session_id:** Gerado pelo `trackingDataLayer` e armazenado em `sessionStorage` (presença) e `localStorage` (audit)
