
CREATE OR REPLACE FUNCTION public.get_ab_summary_range(start_date date, end_date date)
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
      (start_date::timestamp AT TIME ZONE 'America/Sao_Paulo') AS range_start,
      ((end_date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo') AS range_end
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
    WHERE p.created_at >= tz.range_start AND p.created_at < tz.range_end
  ),
  ab_range_sessions AS (
    SELECT session_id, quiz_variant AS variant
    FROM public.session_attribution CROSS JOIN tz
    WHERE created_at >= tz.range_start AND created_at < tz.range_end
      AND quiz_variant IN ('A','B','C','D','E')
  ),
  ab_visitors AS (
    SELECT variant, COUNT(DISTINCT session_id) AS visitors
    FROM ab_range_sessions GROUP BY 1
  ),
  ab_cta AS (
    SELECT ars.variant, COUNT(DISTINCT fe.session_id) AS cta_clicks
    FROM public.funnel_events fe
    INNER JOIN ab_range_sessions ars ON ars.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.range_start AND fe.created_at < tz.range_end
      AND fe.event_name = 'step_completed' AND (fe.event_data->>'step') = 'step-1'
    GROUP BY 1
  ),
  ab_quiz AS (
    SELECT ars.variant, COUNT(DISTINCT fe.session_id) AS quiz_complete
    FROM public.funnel_events fe
    INNER JOIN ab_range_sessions ars ON ars.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.range_start AND fe.created_at < tz.range_end
      AND fe.event_name = 'step_viewed' AND (fe.event_data->>'step') IN ('step-15','step-16','step-17')
    GROUP BY 1
  ),
  ab_checkouts AS (
    SELECT ars.variant, COUNT(DISTINCT fe.session_id) AS checkouts
    FROM public.funnel_events fe
    INNER JOIN ab_range_sessions ars ON ars.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.range_start AND fe.created_at < tz.range_end
      AND fe.event_name IN ('checkout_click','capi_ic_sent')
    GROUP BY 1
  ),
  -- FIX: Sales attribution WITHOUT date filter on session_attribution
  -- so cross-midnight sessions get proper credit
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
    WHERE sa.created_at >= tz.range_start AND sa.created_at < tz.range_end
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
  -- Include variants with sales but no visitors in range (cross-midnight)
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
    'start_date', start_date,
    'end_date', end_date,
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
