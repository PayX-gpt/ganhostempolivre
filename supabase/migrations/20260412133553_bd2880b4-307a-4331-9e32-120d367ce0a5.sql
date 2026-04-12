
-- Add quiz_version column
ALTER TABLE public.session_attribution ADD COLUMN IF NOT EXISTS quiz_version text;

-- Create index for fast filtering
CREATE INDEX IF NOT EXISTS idx_session_attribution_quiz_version ON public.session_attribution(quiz_version);

-- Function: Quiz Version A/B summary (today)
CREATE OR REPLACE FUNCTION public.get_quiz_version_ab_today()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result JSON;
BEGIN
  WITH tz AS (
    SELECT date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' AS day_start
  ),
  enriched_purchases AS (
    SELECT
      p.id, p.amount, p.status, p.funnel_step, p.created_at, p.email,
      COALESCE(p.session_id, psm_fb.session_id, esm_fb.session_id) AS effective_session_id
    FROM public.purchase_tracking p
    CROSS JOIN tz
    LEFT JOIN LATERAL (
      SELECT psm.session_id FROM public.phone_session_map psm
      WHERE p.session_id IS NULL AND p.event_id IS NOT NULL AND p.event_id LIKE '{%'
        AND RIGHT(REGEXP_REPLACE((p.event_id::jsonb)->>'phone', '\D', '', 'g'), 9) = RIGHT(psm.phone, 9)
      ORDER BY psm.created_at DESC LIMIT 1
    ) psm_fb ON p.session_id IS NULL
    LEFT JOIN LATERAL (
      SELECT esm.session_id FROM public.email_session_map esm
      WHERE p.session_id IS NULL AND psm_fb.session_id IS NULL
        AND p.email IS NOT NULL AND LOWER(TRIM(p.email)) = LOWER(TRIM(esm.email))
      ORDER BY esm.created_at DESC LIMIT 1
    ) esm_fb ON p.session_id IS NULL AND psm_fb.session_id IS NULL
    WHERE p.created_at >= tz.day_start
  ),
  version_sessions AS (
    SELECT session_id, COALESCE(quiz_version, 'V1') AS version
    FROM public.session_attribution CROSS JOIN tz
    WHERE created_at >= tz.day_start
  ),
  version_visitors AS (
    SELECT version, COUNT(DISTINCT session_id) AS visitors
    FROM version_sessions GROUP BY 1
  ),
  version_cta AS (
    SELECT vs.version, COUNT(DISTINCT fe.session_id) AS cta_clicks
    FROM public.funnel_events fe
    INNER JOIN version_sessions vs ON vs.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_completed'
      AND (fe.event_data->>'step') = 'step-1'
    GROUP BY 1
  ),
  version_quiz_complete AS (
    SELECT vs.version, COUNT(DISTINCT fe.session_id) AS quiz_complete
    FROM public.funnel_events fe
    INNER JOIN version_sessions vs ON vs.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_viewed'
      AND (fe.event_data->>'step') IN ('step-15','step-16','step-17')
    GROUP BY 1
  ),
  version_checkouts AS (
    SELECT vs.version, COUNT(DISTINCT fe.session_id) AS checkouts
    FROM public.funnel_events fe
    INNER JOIN version_sessions vs ON vs.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name IN ('checkout_click','capi_ic_sent')
    GROUP BY 1
  ),
  version_sales AS (
    SELECT vs.version,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step LIKE 'front%'), 0) AS front_revenue,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step NOT LIKE 'front%') AS upsell_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step NOT LIKE 'front%'), 0) AS upsell_revenue,
      COUNT(DISTINCT p.id) AS total_sales,
      COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM enriched_purchases p
    INNER JOIN version_sessions vs ON vs.session_id = p.effective_session_id
    WHERE p.status = 'approved'
    GROUP BY 1
  ),
  -- Step-level drop-off analysis
  step_views AS (
    SELECT vs.version,
      fe.event_data->>'step' AS step_slug,
      COUNT(DISTINCT fe.session_id) AS unique_views
    FROM public.funnel_events fe
    INNER JOIN version_sessions vs ON vs.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_viewed'
    GROUP BY 1, 2
  ),
  step_completions AS (
    SELECT vs.version,
      fe.event_data->>'step' AS step_slug,
      COUNT(DISTINCT fe.session_id) AS unique_completions,
      AVG((fe.event_data->>'time_spent_ms')::numeric) AS avg_time_ms
    FROM public.funnel_events fe
    INNER JOIN version_sessions vs ON vs.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_completed'
    GROUP BY 1, 2
  ),
  step_detail AS (
    SELECT sv.version, sv.step_slug,
      sv.unique_views,
      COALESCE(sc.unique_completions, 0) AS unique_completions,
      COALESCE(sc.avg_time_ms, 0)::int AS avg_time_ms
    FROM step_views sv
    LEFT JOIN step_completions sc ON sc.version = sv.version AND sc.step_slug = sv.step_slug
  ),
  -- Answer distribution for changed steps
  answer_dist AS (
    SELECT vs.version,
      fe.event_data->>'step' AS step_slug,
      fe.event_data->>'answer_value' AS answer_value,
      COUNT(DISTINCT fe.session_id) AS cnt
    FROM public.funnel_events fe
    INNER JOIN version_sessions vs ON vs.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_completed'
      AND (fe.event_data->>'step') IN ('step-5','step-7')
      AND fe.event_data->>'answer_value' IS NOT NULL
    GROUP BY 1, 2, 3
  ),
  combined AS (
    SELECT
      v.version, v.visitors,
      COALESCE(cta.cta_clicks, 0) AS cta_clicks,
      COALESCE(qc.quiz_complete, 0) AS quiz_complete,
      COALESCE(ck.checkouts, 0) AS checkouts,
      COALESCE(s.front_sales, 0) AS front_sales,
      COALESCE(s.front_revenue, 0) AS front_revenue,
      COALESCE(s.upsell_sales, 0) AS upsell_sales,
      COALESCE(s.upsell_revenue, 0) AS upsell_revenue,
      COALESCE(s.total_sales, 0) AS total_sales,
      COALESCE(s.total_revenue, 0) AS total_revenue
    FROM version_visitors v
    LEFT JOIN version_cta cta ON cta.version = v.version
    LEFT JOIN version_quiz_complete qc ON qc.version = v.version
    LEFT JOIN version_checkouts ck ON ck.version = v.version
    LEFT JOIN version_sales s ON s.version = v.version
  )
  SELECT json_build_object(
    'versions', COALESCE((SELECT json_agg(json_build_object(
      'version', version, 'visitors', visitors,
      'cta_clicks', cta_clicks, 'quiz_complete', quiz_complete,
      'checkouts', checkouts,
      'front_sales', front_sales, 'front_revenue', front_revenue,
      'upsell_sales', upsell_sales, 'upsell_revenue', upsell_revenue,
      'total_sales', total_sales, 'total_revenue', total_revenue
    )) FROM combined), '[]'::json),
    'step_funnel', COALESCE((SELECT json_agg(json_build_object(
      'version', version, 'step', step_slug,
      'views', unique_views, 'completions', unique_completions,
      'avg_time_ms', avg_time_ms
    ) ORDER BY version, step_slug) FROM step_detail), '[]'::json),
    'answer_distribution', COALESCE((SELECT json_agg(json_build_object(
      'version', version, 'step', step_slug,
      'answer', answer_value, 'count', cnt
    )) FROM answer_dist), '[]'::json)
  ) INTO result;
  RETURN result;
END;
$function$;
