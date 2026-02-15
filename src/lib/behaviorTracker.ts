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

  // Create initial record
  supabase.from("lead_behavior").insert([{
    session_id: sessionId,
    quiz_answers: JSON.parse(JSON.stringify(quizAnswers)),
    dynamic_price: pricing.price,
    account_balance: accountBalance || null,
  }]).select("id").single().then(({ data }) => {
    if (data && state) state.recordId = data.id;
  });

  // Setup scroll tracking
  const handleScroll = () => {
    if (!state) return;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollHeight > 0 ? Math.round((window.scrollY / scrollHeight) * 100) : 0;
    state.maxScroll = Math.max(state.maxScroll, Math.min(100, scrollPercent));
  };
  window.addEventListener("scroll", handleScroll, { passive: true });

  // Flush every 10 seconds
  state.flushTimer = setInterval(flushBehavior, 10000);

  // Flush on page unload
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

export function trackCtaView() {
  if (!state) return;
  state.ctaViews++;
  if (state.firstCtaViewMs === null) {
    state.firstCtaViewMs = Date.now() - state.pageLoadTime;
  }
}

export function trackCtaClick() {
  if (!state) return;
  state.ctaClicks++;
  if (state.firstCtaClickMs === null) {
    state.firstCtaClickMs = Date.now() - state.pageLoadTime;
  }
}

export function trackCtaHesitation() {
  if (!state) return;
  state.ctaHesitations++;
}

export function trackVideoStart() {
  if (!state) return;
  state.videoStarted = true;
}

export function trackVideoProgress(watchTimeMs: number) {
  if (!state) return;
  state.videoWatchTimeMs = Math.max(state.videoWatchTimeMs, watchTimeMs);
}

export function trackFaqOpen(question: string) {
  if (!state) return;
  state.faqOpened.add(question);
}

export function trackCheckoutClick() {
  if (!state) return;
  state.checkoutClicked = true;
  state.checkoutClickCount++;
  trackCtaClick();
}

async function flushBehavior() {
  if (!state || !state.recordId) return;

  // Finalize open section times
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

  // Reset enter times so we don't double count
  state.sectionEnterTimes.clear();
  state.sectionsViewed.forEach(s => {
    // Re-enter currently visible sections
    state!.sectionEnterTimes.set(s, Date.now());
  });
}
