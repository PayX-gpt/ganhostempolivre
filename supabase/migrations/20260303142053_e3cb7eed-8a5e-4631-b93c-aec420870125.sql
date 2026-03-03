
-- RPC function for accurate campaign aggregation (server-side, no row limit)
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
  WITH today_start AS (
    SELECT date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' AS ts
  ),
  -- Campaign leads from session_attribution
  campaign_leads AS (
    SELECT 
      COALESCE(
        NULLIF(split_part(sa.utm_campaign, '|', 1), ''),
        CASE WHEN sa.fbclid IS NOT NULL THEN 'Meta (fbclid)' 
             WHEN sa.ttclid IS NOT NULL THEN 'TikTok (ttclid)'
             ELSE 'Direto' END
      ) AS camp,
      sa.session_id
    FROM public.session_attribution sa, today_start t
    WHERE sa.created_at >= t.ts
  ),
  -- Leads count
  lead_counts AS (
    SELECT camp, COUNT(DISTINCT session_id) AS lead_count
    FROM campaign_leads
    GROUP BY camp
  ),
  -- Checkout events
  checkout_counts AS (
    SELECT 
      COALESCE(cl.camp, 'Direto') AS camp,
      COUNT(DISTINCT fe.session_id) AS ck_count
    FROM public.funnel_events fe
    LEFT JOIN campaign_leads cl ON fe.session_id = cl.session_id
    CROSS JOIN today_start t
    WHERE fe.event_name IN ('checkout_click', 'capi_ic_sent')
    AND fe.created_at >= t.ts
    GROUP BY cl.camp
  ),
  -- Sales: prioritize session_attribution > email cross-match > purchase utm_campaign
  sale_stats AS (
    SELECT 
      COALESCE(
        NULLIF(split_part(sa.utm_campaign, '|', 1), ''),
        NULLIF(split_part(sa2.utm_campaign, '|', 1), ''),
        NULLIF(split_part(p.utm_campaign, '|', 1), ''),
        'Direto'
      ) AS camp,
      p.amount,
      p.status
    FROM public.purchase_tracking p
    LEFT JOIN public.session_attribution sa ON p.session_id = sa.session_id
    LEFT JOIN LATERAL (
      SELECT sa3.utm_campaign
      FROM public.purchase_tracking p3
      JOIN public.session_attribution sa3 ON p3.session_id = sa3.session_id
      WHERE p3.email = p.email AND p3.email IS NOT NULL
      AND sa3.utm_campaign IS NOT NULL AND sa3.utm_campaign != ''
      LIMIT 1
    ) sa2 ON sa.utm_campaign IS NULL OR sa.utm_campaign = ''
    CROSS JOIN today_start t
    WHERE p.created_at >= t.ts
  ),
  sale_agg AS (
    SELECT 
      camp,
      COUNT(*) FILTER (WHERE status IN ('approved','completed','purchased','redirected')) AS sale_count,
      COALESCE(SUM(amount) FILTER (WHERE status IN ('approved','completed','purchased','redirected')), 0) AS total_revenue,
      COUNT(*) FILTER (WHERE status IN ('refunded','canceled')) AS refund_count
    FROM sale_stats
    GROUP BY camp
  ),
  -- Combine all campaigns
  all_camps AS (
    SELECT camp FROM lead_counts
    UNION
    SELECT camp FROM sale_agg
  )
  SELECT 
    ac.camp AS campaign,
    COALESCE(lc.lead_count, 0) AS leads,
    COALESCE(cc.ck_count, 0) AS checkouts,
    COALESCE(sa.sale_count, 0) AS sales,
    COALESCE(sa.total_revenue, 0) AS revenue,
    COALESCE(sa.refund_count, 0) AS refunds,
    CASE WHEN COALESCE(lc.lead_count, 0) > 0 
      THEN ROUND((COALESCE(sa.sale_count, 0)::numeric / lc.lead_count) * 100, 1)
      ELSE 0 END AS conv_rate
  FROM all_camps ac
  LEFT JOIN lead_counts lc ON ac.camp = lc.camp
  LEFT JOIN checkout_counts cc ON ac.camp = cc.camp
  LEFT JOIN sale_agg sa ON ac.camp = sa.camp
  ORDER BY COALESCE(sa.total_revenue, 0) DESC;
$$;
