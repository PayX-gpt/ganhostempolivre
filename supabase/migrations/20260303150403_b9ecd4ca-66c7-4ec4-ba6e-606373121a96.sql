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
-- Get campaign label for each session from session_attribution
sa_campaigns AS (
  SELECT
    sa.session_id,
    TRIM(split_part(sa.utm_campaign, '|', 1)) AS campaign_label
  FROM public.session_attribution sa
  CROSS JOIN tz
  WHERE sa.created_at >= tz.day_start
    AND sa.utm_campaign IS NOT NULL AND sa.utm_campaign != ''
),
-- Leads by campaign
leads_agg AS (
  SELECT campaign_label, COUNT(DISTINCT session_id) AS lead_count
  FROM sa_campaigns
  GROUP BY 1
),
-- Checkouts by campaign
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
-- Sales: prioritize session_attribution > Kirvano utm_campaign
sale_details AS (
  SELECT
    COALESCE(
      sc.campaign_label,
      NULLIF(TRIM(split_part(p.utm_campaign, '|', 1)), ''),
      'Direto'
    ) AS campaign_label,
    p.amount,
    p.status
  FROM public.purchase_tracking p
  LEFT JOIN sa_campaigns sc ON sc.session_id = p.session_id
  CROSS JOIN tz
  WHERE p.created_at >= tz.day_start
),
sales_agg AS (
  SELECT
    campaign_label,
    COUNT(*) FILTER (WHERE status = 'approved') AS sale_count,
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