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
      COUNT(*) FILTER (WHERE status = 'approved' AND session_id IS NULL) AS orphan_sales
    FROM public.purchase_tracking
    CROSS JOIN tz
    WHERE created_at >= tz.day_start
  ),
  upsell_detail AS (
    SELECT funnel_step, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS rev
    FROM public.purchase_tracking CROSS JOIN tz
    WHERE created_at >= tz.day_start AND status = 'approved' AND funnel_step NOT LIKE 'front%'
    GROUP BY funnel_step ORDER BY rev DESC
  ),
  ab_visitors AS (
    SELECT
      COALESCE(quiz_variant, 'sem_variante') AS variant,
      COUNT(DISTINCT session_id) AS visitors
    FROM public.session_attribution CROSS JOIN tz
    WHERE created_at >= tz.day_start
    GROUP BY 1
  ),
  ab_cta AS (
    SELECT
      COALESCE(sa.quiz_variant, 'sem_variante') AS variant,
      COUNT(DISTINCT fe.session_id) AS cta_clicks
    FROM public.funnel_events fe
    LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start
      AND fe.event_name = 'step_completed'
      AND (fe.event_data->>'step') = 'step-1'
    GROUP BY 1
  ),
  ab_quiz AS (
    SELECT
      COALESCE(sa.quiz_variant, 'sem_variante') AS variant,
      COUNT(DISTINCT fe.session_id) AS quiz_complete
    FROM public.funnel_events fe
    LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start
      AND fe.event_name = 'step_viewed'
      AND (fe.event_data->>'step') IN ('step-15', 'step-16', 'step-17')
    GROUP BY 1
  ),
  ab_checkouts AS (
    SELECT
      COALESCE(sa.quiz_variant, 'sem_variante') AS variant,
      COUNT(DISTINCT fe.session_id) AS checkouts
    FROM public.funnel_events fe
    LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id
    CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start
      AND fe.event_name IN ('checkout_click', 'capi_ic_sent')
    GROUP BY 1
  ),
  ab_sales_data AS (
    SELECT
      COALESCE(sa.quiz_variant, 'sem_variante') AS variant,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step LIKE 'front%'), 0) AS front_revenue,
      COUNT(DISTINCT p.id) AS total_sales,
      COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM public.purchase_tracking p
    LEFT JOIN public.session_attribution sa ON sa.session_id = p.session_id
    CROSS JOIN tz
    WHERE p.created_at >= tz.day_start AND p.status = 'approved'
    GROUP BY 1
  ),
  ab_combined AS (
    SELECT
      COALESCE(v.variant, s.variant) AS variant,
      COALESCE(v.visitors, 0) AS visitors,
      COALESCE(cta.cta_clicks, 0) AS cta_clicks,
      COALESCE(q.quiz_complete, 0) AS quiz_complete,
      COALESCE(ck.checkouts, 0) AS checkouts,
      COALESCE(s.front_sales, 0) AS front_sales,
      COALESCE(s.front_revenue, 0) AS front_revenue,
      COALESCE(s.total_sales, 0) AS total_sales,
      COALESCE(s.total_revenue, 0) AS total_revenue
    FROM ab_visitors v
    FULL OUTER JOIN ab_sales_data s ON v.variant = s.variant
    LEFT JOIN ab_cta cta ON cta.variant = COALESCE(v.variant, s.variant)
    LEFT JOIN ab_quiz q ON q.variant = COALESCE(v.variant, s.variant)
    LEFT JOIN ab_checkouts ck ON ck.variant = COALESCE(v.variant, s.variant)
    WHERE COALESCE(v.variant, s.variant) IN ('A', 'B', 'C', 'D')
  ),
  buyer_profile AS (
    SELECT
      COALESCE(lb.quiz_answers->>'age', 'unknown') AS age_range,
      COALESCE(lb.quiz_answers->>'device', 'unknown') AS device,
      extract(hour from p.created_at AT TIME ZONE 'America/Sao_Paulo') AS purchase_hour,
      p.amount, p.funnel_step
    FROM public.purchase_tracking p
    LEFT JOIN public.lead_behavior lb ON lb.session_id = p.session_id
    CROSS JOIN tz
    WHERE p.created_at >= tz.day_start AND p.status = 'approved' AND p.funnel_step LIKE 'front%'
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
      'total_sales', total_sales, 'total_revenue', total_revenue
    )) FROM ab_combined), '[]'::json),
    'buyer_age', COALESCE((SELECT json_agg(json_build_object('age', age_range, 'count', cnt)) FROM age_stats), '[]'::json),
    'buyer_hours', COALESCE((SELECT json_agg(json_build_object('hour', hr, 'count', cnt)) FROM hour_stats), '[]'::json),
    'buyer_devices', COALESCE((SELECT json_agg(json_build_object('device', device, 'count', cnt)) FROM device_stats), '[]'::json),
    'front_ticket_avg', (SELECT CASE WHEN front_sales > 0 THEN ROUND(front_revenue / front_sales, 2) ELSE 0 END FROM sales_breakdown),
    'total_ticket_avg', (SELECT CASE WHEN total_sales > 0 THEN ROUND(total_revenue / total_sales, 2) ELSE 0 END FROM sales_breakdown)
  ) INTO result;
  RETURN result;
END;
$function$