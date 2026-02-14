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

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
    return startTimeRef.current;
  }, []);

  const getElapsedTime = useCallback(() => {
    if (startTimeRef.current === 0) return 0;
    return Math.round(performance.now() - startTimeRef.current);
  }, []);

  const log = useCallback(async (params: AuditLogParams) => {
    const {
      eventType,
      pageId: eventPageId,
      paymentId,
      conversionId,
      redirectUrl,
      durationMs,
      status = "success",
      errorMessage,
      metadata = {},
    } = params;

    const logData = {
      event_type: eventType,
      page_id: eventPageId || pageId || window.location.pathname,
      session_id: sessionId,
      payment_id: paymentId || null,
      conversion_id: conversionId || null,
      redirect_url: redirectUrl || null,
      duration_ms: durationMs || null,
      status,
      error_message: errorMessage || null,
      user_agent: navigator.userAgent,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        url: window.location.href,
      } as Json,
    };

    try {
      await supabase.from("funnel_audit_logs").insert([logData]);
    } catch (error) {
      console.error("❌ [Audit] Failed to log event:", error);
    }
  }, [sessionId, pageId]);

  const logPageLoad = useCallback((pageName: string, loadTime?: number) => {
    return log({ eventType: "page_loaded", pageId: pageName, durationMs: loadTime, metadata: { pageName } });
  }, [log]);

  const logCheckoutInitiated = useCallback((product: string, amount: number) => {
    startTimer();
    return log({ eventType: "checkout_initiated", metadata: { product, amount } });
  }, [log, startTimer]);

  const logPaymentCompleted = useCallback((paymentId: string, product: string, amount: number) => {
    return log({ eventType: "payment_completed", paymentId, durationMs: getElapsedTime(), metadata: { product, amount } });
  }, [log, getElapsedTime]);

  const logConversionSaved = useCallback((conversionId: string, paymentId: string, saveDuration: number) => {
    return log({ eventType: "conversion_saved", conversionId, paymentId, durationMs: saveDuration });
  }, [log]);

  const logConversionError = useCallback((paymentId: string, error: string) => {
    return log({ eventType: "conversion_save_failed", paymentId, status: "error", errorMessage: error });
  }, [log]);

  const logRedirectExecuted = useCallback((targetUrl: string, paymentId?: string, duration?: number) => {
    return log({ eventType: "redirect_executed", redirectUrl: targetUrl, paymentId, durationMs: duration });
  }, [log]);

  const logRedirectFailed = useCallback((targetUrl: string, error: string) => {
    return log({ eventType: "redirect_failed", redirectUrl: targetUrl, status: "error", errorMessage: error });
  }, [log]);

  return {
    log, startTimer, getElapsedTime, sessionId,
    logPageLoad, logCheckoutInitiated, logPaymentCompleted,
    logConversionSaved, logConversionError, logRedirectExecuted, logRedirectFailed,
  };
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
    metadata: {
      ...params.metadata,
      timestamp: Date.now(),
      url: window.location.href,
    } as Json,
  };

  try {
    await supabase.from("funnel_audit_logs").insert([logData]);
  } catch (error) {
    console.error("❌ [Audit] Failed to log event:", error);
  }
}
