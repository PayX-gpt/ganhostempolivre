
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
      COALESCE(
        p.session_id,
        psm_fb.session_id,
        esm_fb.session_id
      ) AS effective_session_id
    FROM public.purchase_tracking p
    CROSS JOIN tz
    LEFT JOIN LATERAL (
      SELECT psm.session_id
      FROM public.phone_session_map psm
      WHERE p.session_id IS NULL
        AND p.event_id IS NOT NULL AND p.event_id LIKE '{%'
        AND RIGHT(REGEXP_REPLACE((p.event_id::jsonb)->>'phone', '\D', '', 'g'), 9) = RIGHT(psm.phone, 9)
      ORDER BY psm.created_at DESC LIMIT 1
    ) psm_fb ON p.session_id IS NULL
    LEFT JOIN LATERAL (
      SELECT esm.session_id
      FROM public.email_session_map esm
      WHERE p.session_id IS NULL AND psm_fb.session_id IS NULL
        AND p.email IS NOT NULL AND LOWER(TRIM(p.email)) = LOWER(TRIM(esm.email))
      ORDER BY esm.created_at DESC LIMIT 1
    ) esm_fb ON p.session_id IS NULL AND psm_fb.session_id IS NULL
    WHERE p.created_at >= tz.day_start AND p.created_at < tz.day_end
  ),
  ab_visitors AS (
    SELECT COALESCE(quiz_variant, 'sem_variante') AS variant, COUNT(DISTINCT session_id) AS visitors
    FROM public.session_attribution CROSS JOIN tz
    WHERE created_at >= tz.day_start AND created_at < tz.day_end GROUP BY 1
  ),
  ab_cta AS (
    SELECT COALESCE(sa.quiz_variant, 'sem_variante') AS variant, COUNT(DISTINCT fe.session_id) AS cta_clicks
    FROM public.funnel_events fe LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.created_at < tz.day_end
      AND fe.event_name = 'step_completed' AND (fe.event_data->>'step') = 'step-1' GROUP BY 1
  ),
  ab_quiz AS (
    SELECT COALESCE(sa.quiz_variant, 'sem_variante') AS variant, COUNT(DISTINCT fe.session_id) AS quiz_complete
    FROM public.funnel_events fe LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.created_at < tz.day_end
      AND fe.event_name = 'step_viewed' AND (fe.event_data->>'step') IN ('step-15', 'step-16', 'step-17') GROUP BY 1
  ),
  ab_checkouts AS (
    SELECT COALESCE(sa.quiz_variant, 'sem_variante') AS variant, COUNT(DISTINCT fe.session_id) AS checkouts
    FROM public.funnel_events fe LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.created_at < tz.day_end
      AND fe.event_name IN ('checkout_click', 'capi_ic_sent') GROUP BY 1
  ),
  ab_sales_data AS (
    SELECT COALESCE(sa.quiz_variant, 'sem_variante') AS variant,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step LIKE 'front%'), 0) AS front_revenue,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step NOT LIKE 'front%') AS upsell_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step NOT LIKE 'front%'), 0) AS upsell_revenue,
      COUNT(DISTINCT p.id) AS total_sales,
      COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM enriched_purchases p LEFT JOIN public.session_attribution sa ON sa.session_id = p.effective_session_id
    WHERE p.status = 'approved' GROUP BY 1
  ),
  ab_combined AS (
    SELECT COALESCE(v.variant, s.variant) AS variant,
      COALESCE(v.visitors, 0) AS visitors, COALESCE(cta.cta_clicks, 0) AS cta_clicks,
      COALESCE(q.quiz_complete, 0) AS quiz_complete, COALESCE(ck.checkouts, 0) AS checkouts,
      COALESCE(s.front_sales, 0) AS front_sales, COALESCE(s.front_revenue, 0) AS front_revenue,
      COALESCE(s.upsell_sales, 0) AS upsell_sales, COALESCE(s.upsell_revenue, 0) AS upsell_revenue,
      COALESCE(s.total_sales, 0) AS total_sales, COALESCE(s.total_revenue, 0) AS total_revenue
    FROM ab_visitors v
    FULL OUTER JOIN ab_sales_data s ON v.variant = s.variant
    LEFT JOIN ab_cta cta ON cta.variant = COALESCE(v.variant, s.variant)
    LEFT JOIN ab_quiz q ON q.variant = COALESCE(v.variant, s.variant)
    LEFT JOIN ab_checkouts ck ON ck.variant = COALESCE(v.variant, s.variant)
  )
  SELECT json_build_object(
    'date', target_date,
    'ab_sales', COALESCE((SELECT json_agg(json_build_object(
      'variant', variant, 'visitors', visitors, 'cta_clicks', cta_clicks,
      'quiz_complete', quiz_complete, 'checkouts', checkouts,
      'front_sales', front_sales, 'front_revenue', front_revenue,
      'upsell_sales', upsell_sales, 'upsell_revenue', upsell_revenue,
      'total_sales', total_sales, 'total_revenue', total_revenue
    )) FROM ab_combined), '[]'::json)
  ) INTO result;
  RETURN result;
END;
$function$;
