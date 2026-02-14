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

export const getRedirectStats = async (hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('purchase_tracking').select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error) return null;
  const total = data.length;
  const redirected = data.filter(r => r.redirect_completed).length;
  const pending = total - redirected;
  const rate = total > 0 ? (redirected / total * 100).toFixed(1) : '0';
  return { total, redirected, pending, rate: `${rate}%`, records: data };
};

export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('funnel_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('funnel_session_id', sessionId);
  }
  return sessionId;
};
