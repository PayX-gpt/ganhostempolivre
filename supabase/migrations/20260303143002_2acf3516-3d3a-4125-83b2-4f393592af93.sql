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
sa_base AS (
  SELECT
    sa.session_id,
    NULLIF(split_part(sa.utm_campaign, '|', 2), '') AS campaign_id,
    NULLIF(split_part(sa.utm_campaign, '|', 1), '') AS campaign_name
  FROM public.session_attribution sa
  CROSS JOIN tz
  WHERE sa.created_at >= tz.day_start
),
leads_by_campaign AS (
  SELECT
    COALESCE(campaign_id, 'direct') AS campaign_id,
    COALESCE(MAX(campaign_name), 'Direto') AS campaign_name,
    COUNT(DISTINCT session_id) AS leads
  FROM sa_base
  GROUP BY 1
),
checkout_by_campaign AS (
  SELECT
    COALESCE(sa.campaign_id, 'direct') AS campaign_id,
    COUNT(DISTINCT fe.session_id) AS checkouts
  FROM public.funnel_events fe
  LEFT JOIN sa_base sa ON sa.session_id = fe.session_id
  CROSS JOIN tz
  WHERE fe.created_at >= tz.day_start
    AND fe.event_name IN ('checkout_click', 'capi_ic_sent')
  GROUP BY 1
),
front_sales AS (
  SELECT
    COALESCE(NULLIF(split_part(p.utm_campaign, '|', 2), ''), 'direct') AS campaign_id,
    COALESCE(NULLIF(split_part(p.utm_campaign, '|', 1), ''), 'Direto') AS campaign_name,
    p.amount,
    p.status
  FROM public.purchase_tracking p
  CROSS JOIN tz
  WHERE p.created_at >= tz.day_start
    AND p.funnel_step LIKE 'front_%'
),
sales_by_campaign AS (
  SELECT
    campaign_id,
    MAX(campaign_name) AS campaign_name,
    COUNT(*) FILTER (WHERE status = 'approved') AS sales,
    COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS revenue,
    COUNT(*) FILTER (WHERE status IN ('refunded', 'canceled')) AS refunds
  FROM front_sales
  GROUP BY 1
),
all_keys AS (
  SELECT campaign_id FROM leads_by_campaign
  UNION
  SELECT campaign_id FROM checkout_by_campaign
  UNION
  SELECT campaign_id FROM sales_by_campaign
)
SELECT
  COALESCE(sb.campaign_name, lb.campaign_name, 'Direto') AS campaign,
  COALESCE(lb.leads, 0) AS leads,
  COALESCE(cb.checkouts, 0) AS checkouts,
  COALESCE(sb.sales, 0) AS sales,
  COALESCE(sb.revenue, 0) AS revenue,
  COALESCE(sb.refunds, 0) AS refunds,
  CASE
    WHEN COALESCE(lb.leads, 0) > 0 THEN ROUND((COALESCE(sb.sales, 0)::numeric / lb.leads::numeric) * 100, 1)
    ELSE 0
  END AS conv_rate
FROM all_keys ak
LEFT JOIN leads_by_campaign lb ON lb.campaign_id = ak.campaign_id
LEFT JOIN checkout_by_campaign cb ON cb.campaign_id = ak.campaign_id
LEFT JOIN sales_by_campaign sb ON sb.campaign_id = ak.campaign_id
ORDER BY COALESCE(sb.sales, 0) DESC, COALESCE(sb.revenue, 0) DESC;
$$;