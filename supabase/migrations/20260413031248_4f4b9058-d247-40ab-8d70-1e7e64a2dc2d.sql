
-- Fix: when attributing sales to A/B variants, look up session_attribution
-- without date filter so that sessions created before midnight still get
-- credit for sales that happen after midnight.

CREATE OR REPLACE FUNCTION public.get_dashboard_summary_today()
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
      p.session_id AS original_session_id,
      COALESCE(p.session_id, psm_fallback.session_id, esm_fallback.session_id) AS effective_session_id
    FROM public.purchase_tracking p
    CROSS JOIN tz
    LEFT JOIN LATERAL (
      SELECT psm.session_id FROM public.phone_session_map psm
      WHERE p.session_id IS NULL AND p.event_id IS NOT NULL AND p.event_id LIKE '{%'
        AND RIGHT(REGEXP_REPLACE((p.event_id::jsonb)->>'phone', '\D', '', 'g'), 9) = RIGHT(psm.phone, 9)
      ORDER BY psm.created_at DESC LIMIT 1
    ) psm_fallback ON p.session_id IS NULL
    LEFT JOIN LATERAL (
      SELECT esm.session_id FROM public.email_session_map esm
      WHERE p.session_id IS NULL AND psm_fallback.session_id IS NULL
        AND p.email IS NOT NULL AND LOWER(TRIM(p.email)) = LOWER(TRIM(esm.email))
      ORDER BY esm.created_at DESC LIMIT 1
    ) esm_fallback ON p.session_id IS NULL AND psm_fallback.session_id IS NULL
    WHERE p.created_at >= tz.day_start
  ),
  sales_breakdown AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'approved' AND funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(amount) FILTER (WHERE status = 'approved' AND funnel_step LIKE 'front%'), 0) AS front_revenue,
      COUNT(*) FILTER (WHERE status = 'approved' AND funnel_step NOT LIKE 'front%') AS upsell_sales,
      COALESCE(SUM(amount) FILTER (WHERE status = 'approved' AND funnel_step NOT LIKE 'front%'), 0) AS upsell_revenue,
      COUNT(*) FILTER (WHERE status = 'approved') AS total_sales,
      COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS total_revenue,
      COUNT(*) FILTER (WHERE status IN ('refunded', 'canceled')) AS refunds,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'refused') AS refused,
      COUNT(*) FILTER (WHERE status = 'approved' AND effective_session_id IS NULL) AS orphan_sales
    FROM enriched_purchases
  ),
  upsell_detail AS (
    SELECT funnel_step, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS rev
    FROM enriched_purchases WHERE status = 'approved' AND funnel_step NOT LIKE 'front%'
    GROUP BY funnel_step ORDER BY rev DESC
  ),
  -- Sessions created today for visitor counting
  ab_today_sessions AS (
    SELECT session_id, quiz_variant AS variant
    FROM public.session_attribution CROSS JOIN tz
    WHERE created_at >= tz.day_start AND quiz_variant IN ('A','B','C','D','E')
  ),
  ab_visitors AS (
    SELECT variant, COUNT(DISTINCT session_id) AS visitors
    FROM ab_today_sessions
    GROUP BY 1
  ),
  ab_cta AS (
    SELECT ats.variant, COUNT(DISTINCT fe.session_id) AS cta_clicks
    FROM public.funnel_events fe
    INNER JOIN ab_today_sessions ats ON ats.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_completed'
      AND (fe.event_data->>'step') = 'step-1'
    GROUP BY 1
  ),
  ab_quiz AS (
    SELECT ats.variant, COUNT(DISTINCT fe.session_id) AS quiz_complete
    FROM public.funnel_events fe
    INNER JOIN ab_today_sessions ats ON ats.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_viewed'
      AND (fe.event_data->>'step') IN ('step-15', 'step-16', 'step-17')
    GROUP BY 1
  ),
  ab_checkouts AS (
    SELECT ats.variant, COUNT(DISTINCT fe.session_id) AS checkouts
    FROM public.funnel_events fe
    INNER JOIN ab_today_sessions ats ON ats.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name IN ('checkout_click', 'capi_ic_sent')
    GROUP BY 1
  ),
  -- KEY FIX: For sales attribution, look up variant WITHOUT date filter
  -- so sessions created before midnight still get credit for today's sales
  ab_sales_data AS (
    SELECT sa.quiz_variant AS variant,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step LIKE 'front%'), 0) AS front_revenue,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step NOT LIKE 'front%') AS upsell_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step NOT LIKE 'front%'), 0) AS upsell_revenue,
      COUNT(DISTINCT p.id) AS total_sales,
      COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM enriched_purchases p
    INNER JOIN public.session_attribution sa ON sa.session_id = p.effective_session_id
    WHERE p.status = 'approved' AND sa.quiz_variant IN ('A','B','C','D','E')
    GROUP BY 1
  ),
  ab_combined AS (
    SELECT
      v.variant, v.visitors,
      COALESCE(cta.cta_clicks, 0) AS cta_clicks,
      COALESCE(q.quiz_complete, 0) AS quiz_complete,
      COALESCE(ck.checkouts, 0) AS checkouts,
      COALESCE(s.front_sales, 0) AS front_sales,
      COALESCE(s.front_revenue, 0) AS front_revenue,
      COALESCE(s.upsell_sales, 0) AS upsell_sales,
      COALESCE(s.upsell_revenue, 0) AS upsell_revenue,
      COALESCE(s.total_sales, 0) AS total_sales,
      COALESCE(s.total_revenue, 0) AS total_revenue
    FROM ab_visitors v
    LEFT JOIN ab_sales_data s ON v.variant = s.variant
    LEFT JOIN ab_cta cta ON cta.variant = v.variant
    LEFT JOIN ab_quiz q ON q.variant = v.variant
    LEFT JOIN ab_checkouts ck ON ck.variant = v.variant
  ),
  -- Also include variants that have sales but no visitors today (cross-midnight)
  ab_sales_only AS (
    SELECT s.variant, 0 AS visitors, 0 AS cta_clicks, 0 AS quiz_complete, 0 AS checkouts,
      s.front_sales, s.front_revenue, s.upsell_sales, s.upsell_revenue, s.total_sales, s.total_revenue
    FROM ab_sales_data s
    WHERE NOT EXISTS (SELECT 1 FROM ab_visitors v WHERE v.variant = s.variant)
  ),
  ab_final AS (
    SELECT * FROM ab_combined
    UNION ALL
    SELECT * FROM ab_sales_only
  ),
  buyer_profile AS (
    SELECT COALESCE(lb.quiz_answers->>'age', 'unknown') AS age_range,
      COALESCE(lb.quiz_answers->>'device', 'unknown') AS device,
      extract(hour from p.created_at AT TIME ZONE 'America/Sao_Paulo') AS purchase_hour, p.amount, p.funnel_step
    FROM enriched_purchases p LEFT JOIN public.lead_behavior lb ON lb.session_id = p.effective_session_id
    WHERE p.status = 'approved' AND p.funnel_step LIKE 'front%'
  ),
  age_stats AS (SELECT age_range, COUNT(*) AS cnt FROM buyer_profile GROUP BY 1 ORDER BY cnt DESC),
  hour_stats AS (SELECT purchase_hour::int AS hr, COUNT(*) AS cnt FROM buyer_profile GROUP BY 1 ORDER BY cnt DESC LIMIT 3),
  device_stats AS (SELECT device, COUNT(*) AS cnt FROM buyer_profile GROUP BY 1 ORDER BY cnt DESC)
  SELECT json_build_object(
    'front_sales', (SELECT front_sales FROM sales_breakdown),
    'front_revenue', (SELECT front_revenue FROM sales_breakdown),
    'upsell_sales', (SELECT upsell_sales FROM sales_breakdown),
    'upsell_revenue', (SELECT upsell_revenue FROM sales_breakdown),
    'total_sales', (SELECT total_sales FROM sales_breakdown),
    'total_revenue', (SELECT total_revenue FROM sales_breakdown),
    'refunds', (SELECT refunds FROM sales_breakdown),
    'pending', (SELECT pending FROM sales_breakdown),
    'refused', (SELECT refused FROM sales_breakdown),
    'orphan_sales', (SELECT orphan_sales FROM sales_breakdown),
    'upsell_detail', COALESCE((SELECT json_agg(json_build_object('step', funnel_step, 'count', cnt, 'revenue', rev)) FROM upsell_detail), '[]'::json),
    'ab_sales', COALESCE((SELECT json_agg(json_build_object(
      'variant', variant, 'visitors', visitors, 'cta_clicks', cta_clicks,
      'quiz_complete', quiz_complete, 'checkouts', checkouts,
      'front_sales', front_sales, 'front_revenue', front_revenue,
      'upsell_sales', upsell_sales, 'upsell_revenue', upsell_revenue,
      'total_sales', total_sales, 'total_revenue', total_revenue
    )) FROM ab_final), '[]'::json),
    'buyer_age', COALESCE((SELECT json_agg(json_build_object('age', age_range, 'count', cnt)) FROM age_stats), '[]'::json),
    'buyer_hours', COALESCE((SELECT json_agg(json_build_object('hour', hr, 'count', cnt)) FROM hour_stats), '[]'::json),
    'buyer_devices', COALESCE((SELECT json_agg(json_build_object('device', device, 'count', cnt)) FROM device_stats), '[]'::json),
    'front_ticket_avg', (SELECT CASE WHEN front_sales > 0 THEN ROUND(front_revenue / front_sales, 2) ELSE 0 END FROM sales_breakdown),
    'total_ticket_avg', (SELECT CASE WHEN total_sales > 0 THEN ROUND(total_revenue / total_sales, 2) ELSE 0 END FROM sales_breakdown)
  ) INTO result;
  RETURN result;
END;
$function$;

-- Same fix for get_quiz_version_ab_today
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
  -- Sessions created today for visitor/funnel counting
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
  -- KEY FIX: Sales attribution without date filter on session_attribution
  version_sales AS (
    SELECT COALESCE(sa.quiz_version, 'V1') AS version,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step LIKE 'front%'), 0) AS front_revenue,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step NOT LIKE 'front%') AS upsell_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step NOT LIKE 'front%'), 0) AS upsell_revenue,
      COUNT(DISTINCT p.id) AS total_sales,
      COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM enriched_purchases p
    INNER JOIN public.session_attribution sa ON sa.session_id = p.effective_session_id
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
  ),
  -- Include versions with sales but no visitors today (cross-midnight)
  version_sales_only AS (
    SELECT s.version, 0 AS visitors, 0 AS cta_clicks, 0 AS quiz_complete, 0 AS checkouts,
      s.front_sales, s.front_revenue, s.upsell_sales, s.upsell_revenue, s.total_sales, s.total_revenue
    FROM version_sales s
    WHERE NOT EXISTS (SELECT 1 FROM version_visitors v WHERE v.version = s.version)
  ),
  final_combined AS (
    SELECT * FROM combined
    UNION ALL
    SELECT * FROM version_sales_only
  )
  SELECT json_build_object(
    'versions', COALESCE((SELECT json_agg(json_build_object(
      'version', version, 'visitors', visitors,
      'cta_clicks', cta_clicks, 'quiz_complete', quiz_complete,
      'checkouts', checkouts,
      'front_sales', front_sales, 'front_revenue', front_revenue,
      'upsell_sales', upsell_sales, 'upsell_revenue', upsell_revenue,
      'total_sales', total_sales, 'total_revenue', total_revenue
    )) FROM final_combined), '[]'::json),
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

-- Same fix for get_ab_summary_by_date
CREATE OR REPLACE FUNCTION public.get_ab_summary_by_date(target_date date DEFAULT CURRENT_DATE)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  WITH tz AS (
    SELECT
      (target_date::timestamp AT TIME ZONE 'America/Sao_Paulo') AS day_start,
      ((target_date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo') AS day_end
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
    WHERE p.created_at >= tz.day_start AND p.created_at < tz.day_end
  ),
  ab_date_sessions AS (
    SELECT session_id, quiz_variant AS variant
    FROM public.session_attribution CROSS JOIN tz
    WHERE created_at >= tz.day_start AND created_at < tz.day_end
      AND quiz_variant IN ('A','B','C','D','E')
  ),
  ab_visitors AS (
    SELECT variant, COUNT(DISTINCT session_id) AS visitors
    FROM ab_date_sessions
    GROUP BY 1
  ),
  ab_cta AS (
    SELECT ads.variant, COUNT(DISTINCT fe.session_id) AS cta_clicks
    FROM public.funnel_events fe
    INNER JOIN ab_date_sessions ads ON ads.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.created_at < tz.day_end
      AND fe.event_name = 'step_completed' AND (fe.event_data->>'step') = 'step-1'
    GROUP BY 1
  ),
  ab_quiz AS (
    SELECT ads.variant, COUNT(DISTINCT fe.session_id) AS quiz_complete
    FROM public.funnel_events fe
    INNER JOIN ab_date_sessions ads ON ads.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.created_at < tz.day_end
      AND fe.event_name = 'step_viewed' AND (fe.event_data->>'step') IN ('step-15', 'step-16', 'step-17')
    GROUP BY 1
  ),
  ab_checkouts AS (
    SELECT ads.variant, COUNT(DISTINCT fe.session_id) AS checkouts
    FROM public.funnel_events fe
    INNER JOIN ab_date_sessions ads ON ads.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.created_at < tz.day_end
      AND fe.event_name IN ('checkout_click','capi_ic_sent')
    GROUP BY 1
  ),
  -- KEY FIX: Sales attribution without date filter on session_attribution
  ab_sales_data AS (
    SELECT sa.quiz_variant AS variant,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step LIKE 'front%'), 0) AS front_revenue,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step NOT LIKE 'front%') AS upsell_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step NOT LIKE 'front%'), 0) AS upsell_revenue,
      COUNT(DISTINCT p.id) AS total_sales,
      COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM enriched_purchases p
    INNER JOIN public.session_attribution sa ON sa.session_id = p.effective_session_id
    WHERE p.status = 'approved' AND sa.quiz_variant IN ('A','B','C','D','E')
    GROUP BY 1
  ),
  unattributed AS (
    SELECT
      COUNT(DISTINCT sa.session_id) AS visitors,
      COALESCE((SELECT COUNT(DISTINCT p.id) FROM enriched_purchases p
        LEFT JOIN public.session_attribution sa2 ON sa2.session_id = p.effective_session_id
        WHERE p.status = 'approved' AND p.funnel_step LIKE 'front%'
          AND (sa2.quiz_variant IS NULL OR sa2.quiz_variant NOT IN ('A','B','C','D','E'))
      ), 0) AS orphan_sales
    FROM public.session_attribution sa CROSS JOIN tz
    WHERE sa.created_at >= tz.day_start AND sa.created_at < tz.day_end
      AND (sa.quiz_variant IS NULL OR sa.quiz_variant NOT IN ('A','B','C','D','E'))
  ),
  ab_combined AS (
    SELECT
      v.variant, v.visitors,
      COALESCE(cta.cta_clicks, 0) AS cta_clicks,
      COALESCE(q.quiz_complete, 0) AS quiz_complete,
      COALESCE(ck.checkouts, 0) AS checkouts,
      COALESCE(s.front_sales, 0) AS front_sales,
      COALESCE(s.front_revenue, 0) AS front_revenue,
      COALESCE(s.upsell_sales, 0) AS upsell_sales,
      COALESCE(s.upsell_revenue, 0) AS upsell_revenue,
      COALESCE(s.total_sales, 0) AS total_sales,
      COALESCE(s.total_revenue, 0) AS total_revenue
    FROM ab_visitors v
    LEFT JOIN ab_sales_data s ON v.variant = s.variant
    LEFT JOIN ab_cta cta ON cta.variant = v.variant
    LEFT JOIN ab_quiz q ON q.variant = v.variant
    LEFT JOIN ab_checkouts ck ON ck.variant = v.variant
  ),
  ab_sales_only AS (
    SELECT s.variant, 0::bigint AS visitors, 0::bigint AS cta_clicks, 0::bigint AS quiz_complete, 0::bigint AS checkouts,
      s.front_sales, s.front_revenue, s.upsell_sales, s.upsell_revenue, s.total_sales, s.total_revenue
    FROM ab_sales_data s
    WHERE NOT EXISTS (SELECT 1 FROM ab_visitors v WHERE v.variant = s.variant)
  ),
  ab_final AS (
    SELECT * FROM ab_combined
    UNION ALL
    SELECT * FROM ab_sales_only
  )
  SELECT json_build_object(
    'date', target_date,
    'ab_sales', COALESCE((SELECT json_agg(json_build_object(
      'variant', variant, 'visitors', visitors, 'cta_clicks', cta_clicks,
      'quiz_complete', quiz_complete, 'checkouts', checkouts,
      'front_sales', front_sales, 'front_revenue', front_revenue,
      'upsell_sales', upsell_sales, 'upsell_revenue', upsell_revenue,
      'total_sales', total_sales, 'total_revenue', total_revenue
    )) FROM ab_final), '[]'::json),
    'unattributed_visitors', (SELECT visitors FROM unattributed),
    'unattributed_sales', (SELECT orphan_sales FROM unattributed)
  ) INTO result;
  RETURN result;
END;
$function$;
