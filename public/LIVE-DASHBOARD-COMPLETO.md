# 📊 Painel LIVE — Documentação COMPLETA (Lógica + Visual)

> Arquivo de referência para replicar o dashboard de monitoramento em tempo real em outros projetos.
> Inclui TODO o código-fonte: componentes visuais, hooks, libs, edge functions e schema SQL.
> Gerado em: 2026-02-19

---

## 📋 ÍNDICE

1. [Schema SQL (Tabelas)](#1-schema-sql)
2. [Libs de Tracking](#2-libs-de-tracking)
3. [Hooks](#3-hooks)
4. [Edge Functions](#4-edge-functions)
5. [Componentes Visuais do Dashboard](#5-componentes-visuais)
6. [Página Principal (Live.tsx)](#6-pagina-principal)
7. [Componentes Auxiliares](#7-componentes-auxiliares)
8. [Dependências NPM](#8-dependencias)
9. [Guia de Migração](#9-guia-de-migracao)

---

## 1. SCHEMA SQL

```sql
-- ============================================
-- TABELA: funnel_audit_logs
-- Registra TODOS os eventos do funil
-- ============================================
CREATE TABLE public.funnel_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  page_id TEXT,
  session_id TEXT NOT NULL,
  payment_id TEXT,
  conversion_id TEXT,
  redirect_url TEXT,
  duration_ms INTEGER,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  user_agent TEXT
);

ALTER TABLE public.funnel_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON public.funnel_audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous reads" ON public.funnel_audit_logs FOR SELECT USING (true);
CREATE INDEX idx_audit_session ON public.funnel_audit_logs(session_id);
CREATE INDEX idx_audit_event ON public.funnel_audit_logs(event_type);
CREATE INDEX idx_audit_created ON public.funnel_audit_logs(created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_audit_logs;

-- ============================================
-- TABELA: funnel_events
-- Eventos genéricos do funil (quiz steps, upsell actions)
-- ============================================
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT
);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON public.funnel_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous reads" ON public.funnel_events FOR SELECT USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;

-- ============================================
-- TABELA: lead_behavior
-- Rastreamento comportamental detalhado por sessão
-- ============================================
CREATE TABLE public.lead_behavior (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  quiz_answers JSONB DEFAULT '{}',
  time_on_page_ms INTEGER DEFAULT 0,
  max_scroll_depth INTEGER DEFAULT 0,
  sections_viewed TEXT[] DEFAULT '{}',
  section_times JSONB DEFAULT '{}',
  cta_views INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  first_cta_view_ms INTEGER,
  first_cta_click_ms INTEGER,
  cta_hesitation_count INTEGER DEFAULT 0,
  video_started BOOLEAN DEFAULT false,
  video_watch_time_ms INTEGER DEFAULT 0,
  faq_opened TEXT[] DEFAULT '{}',
  checkout_clicked BOOLEAN DEFAULT false,
  checkout_click_count INTEGER DEFAULT 0,
  intent_score INTEGER,
  intent_label TEXT,
  ai_insights TEXT,
  segment_tags TEXT[] DEFAULT '{}',
  dynamic_price NUMERIC,
  account_balance TEXT
);

ALTER TABLE public.lead_behavior ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON public.lead_behavior FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous reads" ON public.lead_behavior FOR SELECT USING (true);
CREATE POLICY "Allow anonymous updates" ON public.lead_behavior FOR UPDATE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_behavior;

-- ============================================
-- TABELA: purchase_tracking
-- Rastreamento de compras e pagamentos
-- ============================================
CREATE TABLE public.purchase_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  transaction_id TEXT,
  plan_id TEXT,
  product_name TEXT,
  amount NUMERIC,
  email TEXT,
  status TEXT DEFAULT 'pending',
  funnel_step TEXT,
  redirect_completed BOOLEAN DEFAULT false,
  redirect_completed_at TIMESTAMPTZ,
  redirect_source TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  gclid TEXT,
  fbp TEXT,
  conversion_api_sent BOOLEAN DEFAULT false,
  whop_payment_id TEXT,
  event_id TEXT,
  failure_reason TEXT,
  utmify_sent BOOLEAN DEFAULT false
);

ALTER TABLE public.purchase_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON public.purchase_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous reads" ON public.purchase_tracking FOR SELECT USING (true);
CREATE POLICY "Allow anonymous updates" ON public.purchase_tracking FOR UPDATE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_tracking;

-- ============================================
-- TABELA: redirect_metrics
-- Métricas de redirecionamento
-- ============================================
CREATE TABLE public.redirect_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  from_page TEXT NOT NULL,
  to_page TEXT NOT NULL,
  redirect_duration_ms INTEGER DEFAULT 0
);

ALTER TABLE public.redirect_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON public.redirect_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous reads" ON public.redirect_metrics FOR SELECT USING (true);
```

---

## 2. LIBS DE TRACKING

### 2.1 trackingDataLayer.ts

```typescript
/**
 * Global Tracking Data Layer
 * Centraliza todos os dados de rastreamento em window.trackingData
 */

export interface TrackingData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  fbp: string | null;
  fbc: string | null;
  xcod: string | null;
  cwr: string | null;
  cname: string | null;
  domain: string | null;
  placement: string | null;
  adset: string | null;
  adname: string | null;
  site: string | null;
  xid: string | null;
  src: string | null;
  sck: string | null;
  vsl_variant: string | null;
  vsl_player_id: string | null;
  session_id: string;
  landing_page: string;
  referrer: string;
  user_agent: string;
  current_step: string;
  funnel_events: string[];
  first_visit: string;
  last_activity: string;
}

const TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "xcod", "cwr", "cname", "domain", "placement",
  "adset", "adname", "site", "xid", "src", "sck",
] as const;

declare global {
  interface Window {
    trackingData: TrackingData;
  }
}

const STORAGE_KEY = "tracking_data_layer";

const generateSessionId = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const setCookie = (name: string, value: string, days: number = 30): void => {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (error) {
    console.error("[TrackingDataLayer] Failed to set cookie:", error);
  }
};

const getCookie = (name: string): string | null => {
  try {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
};

const loadFromStorage = (): Partial<TrackingData> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : null;
    const cookieSrc = getCookie("utmify_src");
    const cookieSck = getCookie("utmify_sck");
    if (data) {
      if (cookieSrc) data.src = cookieSrc;
      if (cookieSck) data.sck = cookieSck;
    }
    return data;
  } catch {
    return null;
  }
};

const extractFacebookCookies = (): { fbp: string | null; fbc: string | null } => {
  return { fbp: getCookie("_fbp"), fbc: getCookie("_fbc") };
};

const saveToStorage = (data: TrackingData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    sessionStorage.setItem("tracking_session", JSON.stringify(data));
    const fbTracking = { fbp: data.fbp, fbc: data.fbc };
    localStorage.setItem("fb_tracking", JSON.stringify(fbTracking));
    if (data.src) setCookie("utmify_src", data.src);
    if (data.sck) setCookie("utmify_sck", data.sck);
    if (data.fbclid) {
      const fbcValue = data.fbc || `fb.1.${Date.now()}.${data.fbclid}`;
      setCookie("_fbc", fbcValue);
    }
  } catch (error) {
    console.error("[TrackingDataLayer] Failed to save:", error);
  }
};

const extractUrlParams = (): Record<string, string | null> => {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string | null> = {};
  TRACKING_PARAMS.forEach((param) => {
    result[param] = params.get(param);
  });
  return result;
};

export const initializeTrackingDataLayer = (): TrackingData => {
  const urlParams = extractUrlParams();
  const storedData = loadFromStorage();
  const fbCookies = extractFacebookCookies();
  const now = new Date().toISOString();
  const currentPath = window.location.pathname;

  const trackingData: TrackingData = {
    utm_source: urlParams.utm_source || storedData?.utm_source || null,
    utm_medium: urlParams.utm_medium || storedData?.utm_medium || null,
    utm_campaign: urlParams.utm_campaign || storedData?.utm_campaign || null,
    utm_content: urlParams.utm_content || storedData?.utm_content || null,
    utm_term: urlParams.utm_term || storedData?.utm_term || null,
    fbclid: urlParams.fbclid || storedData?.fbclid || null,
    gclid: urlParams.gclid || storedData?.gclid || null,
    fbp: fbCookies.fbp || storedData?.fbp || null,
    fbc: fbCookies.fbc || storedData?.fbc || null,
    xcod: urlParams.xcod || storedData?.xcod || null,
    cwr: urlParams.cwr || storedData?.cwr || null,
    cname: urlParams.cname || storedData?.cname || null,
    domain: urlParams.domain || storedData?.domain || null,
    placement: urlParams.placement || storedData?.placement || null,
    adset: urlParams.adset || storedData?.adset || null,
    adname: urlParams.adname || storedData?.adname || null,
    site: urlParams.site || storedData?.site || null,
    xid: urlParams.xid || storedData?.xid || null,
    src: urlParams.src || storedData?.src || null,
    sck: urlParams.sck || storedData?.sck || null,
    vsl_variant: localStorage.getItem('vsl_variant') || storedData?.vsl_variant || null,
    vsl_player_id: localStorage.getItem('vsl_player_id') || storedData?.vsl_player_id || null,
    session_id: storedData?.session_id || generateSessionId(),
    landing_page: storedData?.landing_page || currentPath,
    referrer: storedData?.referrer || document.referrer || "direct",
    user_agent: navigator.userAgent,
    current_step: currentPath,
    funnel_events: storedData?.funnel_events || [],
    first_visit: storedData?.first_visit || now,
    last_activity: now,
  };

  if (trackingData.fbclid && !trackingData.fbc) {
    trackingData.fbc = `fb.1.${Date.now()}.${trackingData.fbclid}`;
  }

  window.trackingData = trackingData;

  (window as unknown as Record<string, unknown>).__trackingParams = {
    ...trackingData,
    src: trackingData.src,
    sck: trackingData.sck,
  };

  saveToStorage(trackingData);
  return trackingData;
};

export const updateCurrentStep = (step: string): void => {
  if (!window.trackingData) initializeTrackingDataLayer();
  window.trackingData.current_step = step;
  window.trackingData.last_activity = new Date().toISOString();
  saveToStorage(window.trackingData);
};

export const recordFunnelEvent = (eventName: string): void => {
  if (!window.trackingData) initializeTrackingDataLayer();
  if (!window.trackingData.funnel_events.includes(eventName)) {
    window.trackingData.funnel_events.push(eventName);
  }
  window.trackingData.last_activity = new Date().toISOString();
  saveToStorage(window.trackingData);
};

export const getTrackingDataForCheckout = (): Record<string, string> => {
  if (!window.trackingData) initializeTrackingDataLayer();
  const data = window.trackingData;
  const result: Record<string, string> = {};
  if (data.utm_source) result.utm_source = data.utm_source;
  if (data.utm_medium) result.utm_medium = data.utm_medium;
  if (data.utm_campaign) result.utm_campaign = data.utm_campaign;
  if (data.utm_content) result.utm_content = data.utm_content;
  if (data.utm_term) result.utm_term = data.utm_term;
  if (data.fbclid) result.fbclid = data.fbclid;
  if (data.gclid) result.gclid = data.gclid;
  if (data.xcod) result.xcod = data.xcod;
  if (data.src) result.src = data.src;
  if (data.sck) result.sck = data.sck;
  if (data.fbp) result.fbp = data.fbp;
  if (data.fbc) result.fbc = data.fbc;
  if (data.vsl_variant) result.vsl_variant = data.vsl_variant;
  if (data.vsl_player_id) result.vsl_player_id = data.vsl_player_id;
  result.session_id = data.session_id;
  return result;
};

export const getTrackingDataForFacebookCAPI = (): Record<string, string | null> => {
  if (!window.trackingData) initializeTrackingDataLayer();
  const data = window.trackingData;
  return {
    fbp: data.fbp, fbc: data.fbc, fbclid: data.fbclid,
    utm_source: data.utm_source, utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign, utm_content: data.utm_content,
    utm_term: data.utm_term, session_id: data.session_id,
    landing_page: data.landing_page, referrer: data.referrer,
    user_agent: data.user_agent, first_visit: data.first_visit,
  };
};

export const buildTrackingQueryString = (): string => {
  const params = getTrackingDataForCheckout();
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  if (params.session_id) {
    searchParams.set("src", params.session_id);
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

export const ensureUrlHasTrackingParams = (): void => {
  if (!window.trackingData) initializeTrackingDataLayer();
  const data = window.trackingData;
  const currentParams = new URLSearchParams(window.location.search);
  let changed = false;
  const criticalParams: (keyof TrackingData)[] = [
    "utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid", "src", "sck",
  ];
  criticalParams.forEach((param) => {
    const value = data[param];
    if (value && !currentParams.has(param)) {
      currentParams.set(param, value as string);
      changed = true;
    }
  });
  if (changed) {
    const newUrl = `${window.location.pathname}?${currentParams.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", newUrl);
  }
};

export const getTrackingData = (): TrackingData => {
  if (!window.trackingData) return initializeTrackingDataLayer();
  if (!window.trackingData.utm_source && !window.trackingData.utm_campaign) {
    const stored = loadFromStorage();
    if (stored && (stored.utm_source || stored.utm_campaign)) {
      window.trackingData = {
        ...window.trackingData,
        utm_source: stored.utm_source || window.trackingData.utm_source,
        utm_medium: stored.utm_medium || window.trackingData.utm_medium,
        utm_campaign: stored.utm_campaign || window.trackingData.utm_campaign,
        utm_content: stored.utm_content || window.trackingData.utm_content,
        utm_term: stored.utm_term || window.trackingData.utm_term,
        fbclid: stored.fbclid || window.trackingData.fbclid,
        gclid: stored.gclid || window.trackingData.gclid,
        fbp: stored.fbp || window.trackingData.fbp,
        fbc: stored.fbc || window.trackingData.fbc,
        landing_page: stored.landing_page || window.trackingData.landing_page,
        referrer: stored.referrer || window.trackingData.referrer,
        src: stored.src || window.trackingData.src,
        sck: stored.sck || window.trackingData.sck,
      };
    }
  }
  return window.trackingData;
};
```

### 2.2 metricsClient.ts

```typescript
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getTrackingData } from "./trackingDataLayer";

export const saveFunnelEvent = async (
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> => {
  try {
    const trackingData = getTrackingData();
    await supabase.from("funnel_events").insert([{
      session_id: trackingData.session_id || "unknown",
      event_name: eventName,
      event_data: JSON.parse(JSON.stringify(eventData)) as Json,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
    }]);
  } catch (error) {
    console.warn("[Metrics] Failed to save event:", error);
  }
};

export const saveRedirectMetric = async (
  fromPage: string, toPage: string, redirectDurationMs: number
): Promise<void> => {
  try {
    const trackingData = getTrackingData();
    await supabase.from("redirect_metrics").insert([{
      session_id: trackingData.session_id || "unknown",
      from_page: fromPage,
      to_page: toPage,
      redirect_duration_ms: redirectDurationMs,
    }]);
  } catch (error) {
    console.warn("[Metrics] Failed to save redirect metric:", error);
  }
};
```

### 2.3 behaviorTracker.ts

```typescript
import { supabase } from "@/integrations/supabase/client";
import { getTrackingData } from "./trackingDataLayer";

interface BehaviorState {
  sessionId: string;
  recordId: string | null;
  pageLoadTime: number;
  maxScroll: number;
  sectionsViewed: Set<string>;
  sectionEnterTimes: Map<string, number>;
  sectionTimes: Record<string, number>;
  ctaViews: number;
  ctaClicks: number;
  firstCtaViewMs: number | null;
  firstCtaClickMs: number | null;
  ctaHesitations: number;
  videoStarted: boolean;
  videoWatchTimeMs: number;
  faqOpened: Set<string>;
  checkoutClicked: boolean;
  checkoutClickCount: number;
  lastCtaVisible: boolean;
  flushTimer: ReturnType<typeof setInterval> | null;
}

let state: BehaviorState | null = null;

export function initBehaviorTracker(quizAnswers: Record<string, unknown>, pricing: { price: number }, accountBalance?: string) {
  const trackingData = getTrackingData();
  const sessionId = trackingData.session_id || "unknown";

  state = {
    sessionId,
    recordId: null,
    pageLoadTime: Date.now(),
    maxScroll: 0,
    sectionsViewed: new Set(),
    sectionEnterTimes: new Map(),
    sectionTimes: {},
    ctaViews: 0,
    ctaClicks: 0,
    firstCtaViewMs: null,
    firstCtaClickMs: null,
    ctaHesitations: 0,
    videoStarted: false,
    videoWatchTimeMs: 0,
    faqOpened: new Set(),
    checkoutClicked: false,
    checkoutClickCount: 0,
    lastCtaVisible: false,
    flushTimer: null,
  };

  supabase.from("lead_behavior").insert([{
    session_id: sessionId,
    quiz_answers: JSON.parse(JSON.stringify(quizAnswers)),
    dynamic_price: pricing.price,
    account_balance: accountBalance || null,
  }]).select("id").single().then(({ data }) => {
    if (data && state) state.recordId = data.id;
  });

  const handleScroll = () => {
    if (!state) return;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollHeight > 0 ? Math.round((window.scrollY / scrollHeight) * 100) : 0;
    state.maxScroll = Math.max(state.maxScroll, Math.min(100, scrollPercent));
  };
  window.addEventListener("scroll", handleScroll, { passive: true });

  state.flushTimer = setInterval(flushBehavior, 10000);
  window.addEventListener("beforeunload", flushBehavior);

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("beforeunload", flushBehavior);
    if (state?.flushTimer) clearInterval(state.flushTimer);
    flushBehavior();
    state = null;
  };
}

export function trackSectionView(sectionId: string) {
  if (!state) return;
  state.sectionsViewed.add(sectionId);
  if (!state.sectionEnterTimes.has(sectionId)) {
    state.sectionEnterTimes.set(sectionId, Date.now());
  }
}

export function trackSectionLeave(sectionId: string) {
  if (!state) return;
  const enterTime = state.sectionEnterTimes.get(sectionId);
  if (enterTime) {
    const elapsed = Date.now() - enterTime;
    state.sectionTimes[sectionId] = (state.sectionTimes[sectionId] || 0) + elapsed;
    state.sectionEnterTimes.delete(sectionId);
  }
}

export function trackCtaView() { if (!state) return; state.ctaViews++; if (state.firstCtaViewMs === null) state.firstCtaViewMs = Date.now() - state.pageLoadTime; }
export function trackCtaClick() { if (!state) return; state.ctaClicks++; if (state.firstCtaClickMs === null) state.firstCtaClickMs = Date.now() - state.pageLoadTime; }
export function trackCtaHesitation() { if (!state) return; state.ctaHesitations++; }
export function trackVideoStart() { if (!state) return; state.videoStarted = true; }
export function trackVideoProgress(watchTimeMs: number) { if (!state) return; state.videoWatchTimeMs = Math.max(state.videoWatchTimeMs, watchTimeMs); }
export function trackFaqOpen(question: string) { if (!state) return; state.faqOpened.add(question); }
export function trackCheckoutClick() { if (!state) return; state.checkoutClicked = true; state.checkoutClickCount++; trackCtaClick(); }

async function flushBehavior() {
  if (!state || !state.recordId) return;
  state.sectionEnterTimes.forEach((enterTime, sectionId) => {
    const elapsed = Date.now() - enterTime;
    state!.sectionTimes[sectionId] = (state!.sectionTimes[sectionId] || 0) + elapsed;
  });

  try {
    await supabase.from("lead_behavior").update({
      time_on_page_ms: Date.now() - state.pageLoadTime,
      max_scroll_depth: state.maxScroll,
      sections_viewed: Array.from(state.sectionsViewed),
      section_times: state.sectionTimes,
      cta_views: state.ctaViews,
      cta_clicks: state.ctaClicks,
      first_cta_view_ms: state.firstCtaViewMs,
      first_cta_click_ms: state.firstCtaClickMs,
      cta_hesitation_count: state.ctaHesitations,
      video_started: state.videoStarted,
      video_watch_time_ms: state.videoWatchTimeMs,
      faq_opened: Array.from(state.faqOpened),
      checkout_clicked: state.checkoutClicked,
      checkout_click_count: state.checkoutClickCount,
    }).eq("id", state.recordId);
  } catch (e) {
    console.warn("[Behavior] flush failed:", e);
  }

  state.sectionEnterTimes.clear();
  state.sectionsViewed.forEach(s => { state!.sectionEnterTimes.set(s, Date.now()); });
}
```

### 2.4 purchaseTracking.ts

```typescript
import { supabase } from "@/integrations/supabase/client";

interface TrackRedirectParams {
  transactionId?: string;
  planId?: string;
  redirectSource: string;
  sessionId?: string;
}

export const trackRedirectCompleted = async (params: TrackRedirectParams) => {
  const { transactionId, planId, redirectSource, sessionId } = params;
  try {
    if (transactionId) {
      const { data, error } = await supabase
        .from('purchase_tracking')
        .update({
          redirect_completed: true,
          redirect_completed_at: new Date().toISOString(),
          redirect_source: redirectSource,
          session_id: sessionId,
          status: 'redirected',
        })
        .eq('transaction_id', transactionId)
        .select().single();
      if (!error && data) return { success: true, data };
    }
    if (planId) {
      const { data, error } = await supabase
        .from('purchase_tracking')
        .update({
          redirect_completed: true,
          redirect_completed_at: new Date().toISOString(),
          redirect_source: redirectSource,
          session_id: sessionId,
          status: 'redirected',
        })
        .eq('plan_id', planId)
        .eq('redirect_completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .select().single();
      if (!error && data) return { success: true, data };
    }
    const { data, error } = await supabase
      .from('purchase_tracking')
      .insert({
        transaction_id: transactionId,
        plan_id: planId,
        redirect_completed: true,
        redirect_completed_at: new Date().toISOString(),
        redirect_source: redirectSource,
        session_id: sessionId,
        status: 'redirected',
        user_agent: navigator.userAgent,
      })
      .select().single();
    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('funnel_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('funnel_session_id', sessionId);
  }
  return sessionId;
};
```

### 2.5 facebookCAPI.ts

```typescript
import { getTrackingData } from "./trackingDataLayer";

let icSent = false;

export async function sendCAPIInitiateCheckout(params: {
  email?: string;
  phone?: string;
  amount?: number;
}): Promise<void> {
  if (icSent) return;
  icSent = true;

  try {
    const tracking = getTrackingData();
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId) return;

    const url = `https://${projectId}.supabase.co/functions/v1/facebook-capi-ic`;

    const body = {
      event_name: "InitiateCheckout",
      email: params.email || null,
      phone: params.phone || null,
      session_id: tracking.session_id,
      fbclid: tracking.fbclid,
      fbp: tracking.fbp,
      fbc: tracking.fbc,
      amount: params.amount || null,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await resp.json();
    console.log("[CAPI-IC]", result.sent ? "✅ Sent" : "⏭️ Skipped", result.reason || "");
  } catch (err) {
    console.warn("[CAPI-IC] Error:", err);
  }
}
```

---

## 3. HOOKS

### 3.1 usePagePresence.ts

```typescript
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTrackingData } from "@/lib/trackingDataLayer";
import { getLeadName } from "@/lib/upsellData";

const PRESENCE_CHANNEL = "funnel-presence";

const isDevSession = (): boolean => {
  const url = window.location.href;
  const hostname = window.location.hostname;
  if (url.includes('__lovable_token=')) return true;
  if (hostname.includes('lovableproject.com')) return true;
  if (hostname.includes('lovable.app') && hostname.includes('preview')) return true;
  if (hostname.includes('preview--')) return true;
  if (hostname.includes('-preview--')) return true;
  if (hostname.endsWith('.lovable.app') && hostname.includes('--')) return true;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  return false;
};

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem("presence_session_id");
  if (!sessionId) {
    const trackingData = getTrackingData();
    sessionId = trackingData.session_id || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("presence_session_id", sessionId);
  }
  return sessionId;
};

let sharedChannel: ReturnType<typeof supabase.channel> | null = null;
let sharedSessionId: string | null = null;
let subscribedStatus: "pending" | "subscribed" = "pending";
let pendingPageId: string | null = null;

const getOrCreateChannel = (sessionId: string): ReturnType<typeof supabase.channel> => {
  if (sharedChannel) return sharedChannel;

  sharedSessionId = sessionId;
  sharedChannel = supabase.channel(PRESENCE_CHANNEL, {
    config: { presence: { key: sessionId } },
  });

  sharedChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      subscribedStatus = "subscribed";
      if (pendingPageId) {
        sharedChannel!.track({
          session_id: sessionId,
          page_id: pendingPageId,
          lead_name: getLeadName(),
          joined_at: new Date().toISOString(),
        });
        pendingPageId = null;
      }
    }
  });

  return sharedChannel;
};

export const usePagePresence = (pageId: string): void => {
  const lastPageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pageId || isDevSession()) return;
    if (lastPageRef.current === pageId) return;
    lastPageRef.current = pageId;

    const sessionId = getOrCreateSessionId();
    const channel = getOrCreateChannel(sessionId);

    if (subscribedStatus === "subscribed") {
      channel.track({
        session_id: sessionId,
        page_id: pageId,
        lead_name: getLeadName(),
        joined_at: new Date().toISOString(),
      });
    } else {
      pendingPageId = pageId;
    }

    const trackingData = getTrackingData();
    supabase.from("funnel_audit_logs").insert([{
      session_id: sessionId,
      event_type: "page_loaded",
      page_id: pageId,
      user_agent: navigator.userAgent,
      metadata: {
        url: window.location.href,
        referrer: document.referrer || null,
        utm_source: trackingData.utm_source || null,
        utm_medium: trackingData.utm_medium || null,
        utm_campaign: trackingData.utm_campaign || null,
        is_production: true,
      },
    }]).then(() => {});
  }, [pageId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sharedChannel) sharedChannel.untrack();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
};
```

### 3.2 useAuditLog.ts

```typescript
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface AuditLogParams {
  eventType: string;
  pageId?: string;
  paymentId?: string;
  conversionId?: string;
  redirectUrl?: string;
  durationMs?: number;
  status?: "success" | "error" | "pending";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

const getSessionId = (): string => {
  const existing = localStorage.getItem("audit_session_id");
  if (existing) return existing;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("audit_session_id", sessionId);
  return sessionId;
};

export function useAuditLog(pageId?: string) {
  const startTimeRef = useRef<number>(0);
  const sessionId = getSessionId();

  const startTimer = useCallback(() => { startTimeRef.current = performance.now(); return startTimeRef.current; }, []);
  const getElapsedTime = useCallback(() => { if (startTimeRef.current === 0) return 0; return Math.round(performance.now() - startTimeRef.current); }, []);

  const log = useCallback(async (params: AuditLogParams) => {
    const logData = {
      event_type: params.eventType,
      page_id: params.pageId || pageId || window.location.pathname,
      session_id: sessionId,
      payment_id: params.paymentId || null,
      conversion_id: params.conversionId || null,
      redirect_url: params.redirectUrl || null,
      duration_ms: params.durationMs || null,
      status: params.status || "success",
      error_message: params.errorMessage || null,
      user_agent: navigator.userAgent,
      metadata: { ...params.metadata, timestamp: Date.now(), url: window.location.href } as Json,
    };
    try { await supabase.from("funnel_audit_logs").insert([logData]); }
    catch (error) { console.error("❌ [Audit] Failed:", error); }
  }, [sessionId, pageId]);

  const logPageLoad = useCallback((pageName: string, loadTime?: number) => log({ eventType: "page_loaded", pageId: pageName, durationMs: loadTime, metadata: { pageName } }), [log]);
  const logCheckoutInitiated = useCallback((product: string, amount: number) => { startTimer(); return log({ eventType: "checkout_initiated", metadata: { product, amount } }); }, [log, startTimer]);
  const logPaymentCompleted = useCallback((paymentId: string, product: string, amount: number) => log({ eventType: "payment_completed", paymentId, durationMs: getElapsedTime(), metadata: { product, amount } }), [log, getElapsedTime]);
  const logConversionSaved = useCallback((conversionId: string, paymentId: string, saveDuration: number) => log({ eventType: "conversion_saved", conversionId, paymentId, durationMs: saveDuration }), [log]);
  const logConversionError = useCallback((paymentId: string, error: string) => log({ eventType: "conversion_save_failed", paymentId, status: "error", errorMessage: error }), [log]);
  const logRedirectExecuted = useCallback((targetUrl: string, paymentId?: string, duration?: number) => log({ eventType: "redirect_executed", redirectUrl: targetUrl, paymentId, durationMs: duration }), [log]);
  const logRedirectFailed = useCallback((targetUrl: string, error: string) => log({ eventType: "redirect_failed", redirectUrl: targetUrl, status: "error", errorMessage: error }), [log]);

  return { log, startTimer, getElapsedTime, sessionId, logPageLoad, logCheckoutInitiated, logPaymentCompleted, logConversionSaved, logConversionError, logRedirectExecuted, logRedirectFailed };
}

export async function logAuditEvent(params: AuditLogParams & { sessionId?: string }) {
  const sessionId = params.sessionId || getSessionId();
  const logData = {
    event_type: params.eventType,
    page_id: params.pageId || window.location.pathname,
    session_id: sessionId,
    payment_id: params.paymentId || null,
    conversion_id: params.conversionId || null,
    redirect_url: params.redirectUrl || null,
    duration_ms: params.durationMs || null,
    status: params.status || "success",
    error_message: params.errorMessage || null,
    user_agent: navigator.userAgent,
    metadata: { ...params.metadata, timestamp: Date.now(), url: window.location.href } as Json,
  };
  try { await supabase.from("funnel_audit_logs").insert([logData]); }
  catch (error) { console.error("❌ [Audit] Failed:", error); }
}
```

---

## 4. EDGE FUNCTIONS

### 4.1 kirvano-webhook/index.ts

> Webhook que recebe notificações de pagamento do gateway (Kirvano).
> Identifica o produto/upsell, normaliza o status, grava em purchase_tracking e registra audit log.
> CAPI Purchase DESATIVADO (UTMify cuida disso).

O código completo está no arquivo `supabase/functions/kirvano-webhook/index.ts` do projeto.
São ~363 linhas. Principais responsabilidades:
- Extração robusta de amount (total_price, fiscal, products[0].price)
- Identificação de funnel_step por offer_id, nome do produto ou preço
- Deduplicação por transaction_id
- Normalização de status (approved, refused, refunded, pending, etc.)
- Gravação em purchase_tracking + funnel_audit_logs
- session_id recuperado via campo `src` (que carrega o session_id do tracking)

### 4.2 facebook-capi-ic/index.ts

> Envia InitiateCheckout para Facebook CAPI server-side.
> Deduplicação via funnel_events (capi_ic_sent).

```typescript
// Código completo em supabase/functions/facebook-capi-ic/index.ts
// ~129 linhas
// Secrets necessários: FB_PIXEL_ID, FB_ACCESS_TOKEN
```

### 4.3 analyze-leads/index.ts

> Edge function de inteligência com 4 ações:
> - `score`: Calcula intent_score (0-100) para leads sem score
> - `insights`: Análise IA 24h com Gemini (comportamento + receita + funil)
> - `buyer-analysis`: Correlação comprador vs não-comprador 7d + sugestões de preço
> - `full-funnel`: Análise completa do funil com todas as métricas

O código completo tem ~656 linhas. Secret necessário: `LOVABLE_API_KEY`.
Usa o endpoint `https://ai.gateway.lovable.dev/v1/chat/completions` com modelo `google/gemini-3-flash-preview`.

---

## 5. COMPONENTES VISUAIS DO DASHBOARD

> **NOTA:** Os componentes abaixo são muito grandes para incluir inline neste markdown.
> Eles estão nos seguintes arquivos do projeto e devem ser copiados integralmente:

| Componente | Arquivo | Linhas | Descrição |
|---|---|---|---|
| LiveUserPresence | `src/components/LiveUserPresence.tsx` | 238 | Mapa do funil em tempo real com Presence API |
| LiveUpsellMonitor | `src/components/LiveUpsellMonitor.tsx` | 351 | Monitor de upsells (UP1-UP4) com feed de atividade |
| LiveFunnelAnalytics | `src/components/LiveFunnelAnalytics.tsx` | 235 | Gráficos de funil por etapa + tráfego por hora |
| LiveRevenueChart | `src/components/LiveRevenueChart.tsx` | 185 | Gráfico de receita 24h (AreaChart) |
| LiveIntelligence | `src/components/LiveIntelligence.tsx` | 416 | Inteligência comportamental + IA + segmentação |
| LiveLeadsTable | `src/components/LiveLeadsTable.tsx` | 490 | Tabela paginada de leads com filtros e CSV |
| LiveConversionMetrics | `src/components/LiveConversionMetrics.tsx` | 160 | Widget flutuante de métricas IC→Vendas |
| SessionLogsDialog | `src/components/SessionLogsDialog.tsx` | 405 | Modal timeline da jornada do lead |
| SEOHead | `src/components/SEOHead.tsx` | 57 | Gerenciamento de meta tags |

### Componentes UI shadcn utilizados:
- Badge, Button, Input, ScrollArea, Select, Tabs, Dialog, Tooltip

### Bibliotecas de gráficos:
- `recharts`: BarChart, LineChart, AreaChart, PieChart, ResponsiveContainer

### Ícones:
- `lucide-react`: ~40+ ícones diferentes

---

## 6. PÁGINA PRINCIPAL

### Live.tsx (601 linhas)

Arquivo: `src/pages/Live.tsx`

Estrutura:
1. **Header**: Logo + controles (som, notificações, filtro de data, auto-refresh, export)
2. **Badges**: Online agora, Visitas únicas, Última atualização
3. **MetricCards (4)**: Receita, Vendas, Taxa Aprovação, IC→Vendas
4. **MetricCards (3)**: Leads, Qualificados, Taxa Interação
5. **Scroll horizontal**: Aprovação Gateway, Funil IC→Venda, Sessões Únicas, Ticket Médio (com ProgressRing SVG)
6. **LiveUserPresence**: Mapa do funil
7. **LiveUpsellMonitor**: Monitor de upsells
8. **LiveFunnelAnalytics**: Gráficos de funil
9. **LiveRevenueChart**: Receita por hora
10. **LiveIntelligence**: IA + comportamento
11. **LiveLeadsTable**: Tabela de leads
12. **Tabs (Logs)**: Feed de eventos em tempo real
13. **SessionLogsDialog**: Modal de jornada (ao clicar em um log)

### Componentes inline no Live.tsx:
- `MetricCard`: Card de KPI com ícone, valor, trend
- `ProgressRing`: Anel SVG circular de progresso

### Realtime channels:
- `funnel-audit-realtime`: Novos eventos de auditoria
- `payment-failures-realtime`: Pagamentos falhados (toast de erro)

### Data fetching:
- Auto-refresh a cada 10s
- Refresh ao voltar à aba (visibilitychange)
- Deduplicação de logs realtime por session_id + event_type + timestamp

---

## 7. COMPONENTES AUXILIARES

### SEOHead.tsx

```typescript
import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

const SEOHead = ({ title, description, image, url }: SEOHeadProps) => {
  useEffect(() => {
    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", description);

    const updateMeta = (property: string, content: string) => {
      const meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) meta.setAttribute("content", content);
    };

    const baseUrl = "https://ganhostempolivre.lovable.app";
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
    const imageUrl = image ? `${baseUrl}${image}` : `${baseUrl}/og-image.png`;

    updateMeta("og:title", title);
    updateMeta("og:description", description);
    updateMeta("og:url", fullUrl);
    updateMeta("og:image", imageUrl);

    return () => { document.title = "Ganhos Tempo Livre"; };
  }, [title, description, image, url]);

  return null;
};

export default SEOHead;
```

---

## 8. DEPENDÊNCIAS NPM

```json
{
  "@supabase/supabase-js": "^2.95.3",
  "recharts": "^2.15.4",
  "lucide-react": "^0.462.0",
  "framer-motion": "^12.34.0",
  "sonner": "^1.7.4",
  "tailwind-merge": "^2.6.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-scroll-area": "^1.2.9",
  "react-router-dom": "^6.30.1"
}
```

---

## 9. GUIA DE MIGRAÇÃO

### Passo a passo para conectar a outro quiz:

1. **Crie as tabelas SQL** (Seção 1) no novo projeto Supabase
2. **Copie os arquivos lib/** (`trackingDataLayer`, `metricsClient`, `behaviorTracker`, `purchaseTracking`, `facebookCAPI`)
3. **Copie os hooks/** (`usePagePresence`, `useAuditLog`)
4. **Instale as dependências** (Seção 8)
5. **No quiz**, chame `usePagePresence("/step-N")` em cada etapa
6. **Na página de oferta**, chame `initBehaviorTracker(quizAnswers, { price }, accountBalance)`
7. **No checkout**, chame `logCheckoutInitiated(product, amount)` e `sendCAPIInitiateCheckout({ email, amount })`
8. **Configure o webhook** do gateway de pagamento para apontar para a edge function `kirvano-webhook`
9. **Copie os componentes** do dashboard (Seção 5) e a página `Live.tsx`
10. **Configure os secrets**: `FB_PIXEL_ID`, `FB_ACCESS_TOKEN`, `LOVABLE_API_KEY`

### Adaptações necessárias:
- Ajuste os `FUNNEL_STEPS` em `LiveFunnelAnalytics.tsx` e `LiveUserPresence.tsx` para refletir as etapas do novo quiz
- Ajuste `UPSELL_LABELS` e `STEP_TO_UPSELL` em `LiveUpsellMonitor.tsx` para os novos upsells
- Ajuste as quiz keys em `LiveLeadsTable.tsx` (`QUIZ_KEYS`)
- Ajuste a URL base em `SEOHead.tsx`
- Ajuste `OFFER_ID_MAP` no webhook para os novos offer IDs do gateway

---

> **Para baixar este arquivo:** acesse `/LIVE-DASHBOARD-COMPLETO.md` no navegador do seu domínio publicado.
