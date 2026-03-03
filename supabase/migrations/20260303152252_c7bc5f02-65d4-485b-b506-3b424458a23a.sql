CREATE OR REPLACE FUNCTION get_campaign_stats_today()
RETURNS TABLE (
  campaign TEXT,
  leads BIGINT,
  checkouts BIGINT,
  sales BIGINT,
  revenue NUMERIC,
  refunds BIGINT,
  conv_rate NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
WITH tz AS (
  SELECT date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' AS day_start
),
sa_campaigns AS (
  SELECT
    sa.session_id,
    TRIM(split_part(sa.utm_campaign, '|', 1)) AS campaign_label
  FROM public.session_attribution sa
  CROSS JOIN tz
  WHERE sa.created_at >= tz.day_start
    AND sa.utm_campaign IS NOT NULL AND sa.utm_campaign != ''
),
leads_agg AS (
  SELECT campaign_label, COUNT(DISTINCT session_id) AS lead_count
  FROM sa_campaigns
  GROUP BY 1
),
checkout_agg AS (
  SELECT
    COALESCE(sc.campaign_label, 'Direto') AS campaign_label,
    COUNT(DISTINCT fe.session_id) AS ck_count
  FROM public.funnel_events fe
  LEFT JOIN sa_campaigns sc ON sc.session_id = fe.session_id
  CROSS JOIN tz
  WHERE fe.created_at >= tz.day_start
    AND fe.event_name IN ('checkout_click', 'capi_ic_sent')
  GROUP BY 1
),
sale_details AS (
  SELECT
    COALESCE(
      sc.campaign_label,
      NULLIF(TRIM(split_part(p.utm_campaign, '|', 1)), ''),
      'Direto'
    ) AS campaign_label,
    p.amount,
    p.status,
    p.funnel_step
  FROM public.purchase_tracking p
  LEFT JOIN sa_campaigns sc ON sc.session_id = p.session_id
  CROSS JOIN tz
  WHERE p.created_at >= tz.day_start
),
sales_agg AS (
  SELECT
    campaign_label,
    -- Only count front sales for the main sales/conv columns
    COUNT(*) FILTER (WHERE status = 'approved' AND funnel_step LIKE 'front%') AS sale_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'approved' AND funnel_step LIKE 'front%'), 0) AS front_revenue,
    -- Total revenue including upsells
    COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS total_revenue,
    COUNT(*) FILTER (WHERE status IN ('refunded', 'canceled')) AS refund_count
  FROM sale_details
  GROUP BY 1
),
all_labels AS (
  SELECT campaign_label FROM leads_agg
  UNION
  SELECT campaign_label FROM checkout_agg
  UNION
  SELECT campaign_label FROM sales_agg
)
SELECT
  al.campaign_label AS campaign,
  COALESCE(la.lead_count, 0) AS leads,
  COALESCE(ca.ck_count, 0) AS checkouts,
  COALESCE(sa.sale_count, 0) AS sales,
  COALESCE(sa.total_revenue, 0) AS revenue,
  COALESCE(sa.refund_count, 0) AS refunds,
  CASE WHEN COALESCE(la.lead_count, 0) > 0
    THEN ROUND((COALESCE(sa.sale_count, 0)::numeric / la.lead_count::numeric) * 100, 1)
    ELSE 0 END AS conv_rate
FROM all_labels al
LEFT JOIN leads_agg la ON la.campaign_label = al.campaign_label
LEFT JOIN checkout_agg ca ON ca.campaign_label = al.campaign_label
LEFT JOIN sales_agg sa ON sa.campaign_label = al.campaign_label
ORDER BY COALESCE(sa.sale_count, 0) DESC, COALESCE(sa.total_revenue, 0) DESC;
$$;

-- New RPC: get_dashboard_summary_today - returns front/upsell breakdown + A/B + buyer profile
CREATE OR REPLACE FUNCTION get_dashboard_summary_today()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSON;
BEGIN
  WITH tz AS (
    SELECT date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' AS day_start
  ),
  -- Front vs Upsell
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
  -- Upsell breakdown by step
  upsell_detail AS (
    SELECT
      funnel_step,
      COUNT(*) AS cnt,
      COALESCE(SUM(amount), 0) AS rev
    FROM public.purchase_tracking
    CROSS JOIN tz
    WHERE created_at >= tz.day_start
      AND status = 'approved'
      AND funnel_step NOT LIKE 'front%'
    GROUP BY funnel_step
    ORDER BY rev DESC
  ),
  -- A/B by variant (front sales only)
  ab_data AS (
    SELECT
      COALESCE(sa.quiz_variant, 'sem_variante') AS variant,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step LIKE 'front%'), 0) AS front_revenue,
      COUNT(DISTINCT p.id) AS total_sales,
      COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM public.purchase_tracking p
    LEFT JOIN public.session_attribution sa ON sa.session_id = p.session_id
    CROSS JOIN tz
    WHERE p.created_at >= tz.day_start
      AND p.status = 'approved'
    GROUP BY 1
  ),
  -- Buyer profile: age from quiz_answers
  buyer_profile AS (
    SELECT
      COALESCE(lb.quiz_answers->>'age', 'unknown') AS age_range,
      COALESCE(lb.quiz_answers->>'device', 'unknown') AS device,
      extract(hour from p.created_at AT TIME ZONE 'America/Sao_Paulo') AS purchase_hour,
      extract(dow from p.created_at AT TIME ZONE 'America/Sao_Paulo') AS purchase_dow,
      p.amount,
      p.funnel_step
    FROM public.purchase_tracking p
    LEFT JOIN public.lead_behavior lb ON lb.session_id = p.session_id
    CROSS JOIN tz
    WHERE p.created_at >= tz.day_start
      AND p.status = 'approved'
      AND p.funnel_step LIKE 'front%'
  ),
  age_stats AS (
    SELECT age_range, COUNT(*) AS cnt
    FROM buyer_profile
    GROUP BY 1
    ORDER BY cnt DESC
  ),
  hour_stats AS (
    SELECT purchase_hour::int AS hr, COUNT(*) AS cnt
    FROM buyer_profile
    GROUP BY 1
    ORDER BY cnt DESC
    LIMIT 3
  ),
  device_stats AS (
    SELECT device, COUNT(*) AS cnt
    FROM buyer_profile
    GROUP BY 1
    ORDER BY cnt DESC
  )
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
    'ab_sales', COALESCE((SELECT json_agg(json_build_object('variant', variant, 'front_sales', front_sales, 'front_revenue', front_revenue, 'total_sales', total_sales, 'total_revenue', total_revenue)) FROM ab_data), '[]'::json),
    'buyer_age', COALESCE((SELECT json_agg(json_build_object('age', age_range, 'count', cnt)) FROM age_stats), '[]'::json),
    'buyer_hours', COALESCE((SELECT json_agg(json_build_object('hour', hr, 'count', cnt)) FROM hour_stats), '[]'::json),
    'buyer_devices', COALESCE((SELECT json_agg(json_build_object('device', device, 'count', cnt)) FROM device_stats), '[]'::json),
    'front_ticket_avg', (SELECT CASE WHEN front_sales > 0 THEN ROUND(front_revenue / front_sales, 2) ELSE 0 END FROM sales_breakdown),
    'total_ticket_avg', (SELECT CASE WHEN total_sales > 0 THEN ROUND(total_revenue / total_sales, 2) ELSE 0 END FROM sales_breakdown)
  ) INTO result;
  
  RETURN result;
END;
$$;