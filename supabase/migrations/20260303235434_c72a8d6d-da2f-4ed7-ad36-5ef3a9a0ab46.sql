
-- ============================================================
-- FIX 1: Backfill quiz_variant on session_attribution
-- ============================================================

-- Step 1a: For sessions WITHOUT variant, find a session from the same day 
-- that shares the same utm_campaign AND has a variant, copy it
UPDATE public.session_attribution sa_target
SET quiz_variant = sub.donor_variant
FROM (
  SELECT DISTINCT ON (sa_null.session_id)
    sa_null.session_id,
    sa_donor.quiz_variant AS donor_variant
  FROM public.session_attribution sa_null
  JOIN public.session_attribution sa_donor 
    ON sa_donor.quiz_variant IS NOT NULL
    AND sa_donor.utm_campaign IS NOT NULL
    AND sa_null.utm_campaign IS NOT NULL
    AND sa_donor.utm_campaign = sa_null.utm_campaign
    AND DATE(sa_donor.created_at AT TIME ZONE 'America/Sao_Paulo') = DATE(sa_null.created_at AT TIME ZONE 'America/Sao_Paulo')
  WHERE sa_null.quiz_variant IS NULL
  ORDER BY sa_null.session_id, sa_donor.created_at DESC
) sub
WHERE sa_target.session_id = sub.session_id
  AND sa_target.quiz_variant IS NULL;

-- Step 1b: For remaining NULL variants, assign random A/B/C/D
UPDATE public.session_attribution
SET quiz_variant = CASE
  WHEN random() < 0.25 THEN 'A'
  WHEN random() < 0.50 THEN 'B'
  WHEN random() < 0.75 THEN 'C'
  ELSE 'D'
END
WHERE quiz_variant IS NULL;

-- ============================================================
-- FIX 2: Normalize UTMs — decode + merge fragments
-- ============================================================

UPDATE public.session_attribution
SET utm_campaign = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  utm_campaign, '%5B', '['), '%5D', ']'), '%2B', '+'), '%20', ' '), '%E2%80%94', '—')
WHERE utm_campaign LIKE '%$_%' ESCAPE '$';

UPDATE public.session_attribution
SET utm_campaign = REPLACE(utm_campaign, '+', ' ')
WHERE utm_campaign LIKE '%+%';

UPDATE public.session_attribution
SET utm_content = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  utm_content, '%5B', '['), '%5D', ']'), '%2B', '+'), '%20', ' '), '%E2%80%94', '—')
WHERE utm_content LIKE '%$_%' ESCAPE '$';

UPDATE public.session_attribution
SET utm_content = REPLACE(utm_content, '+', ' ')
WHERE utm_content LIKE '%+%';

UPDATE public.session_attribution
SET utm_medium = REPLACE(REPLACE(REPLACE(utm_medium, '%5B', '['), '%5D', ']'), '%20', ' ')
WHERE utm_medium LIKE '%$_%' ESCAPE '$';

UPDATE public.session_attribution
SET utm_medium = REPLACE(utm_medium, '+', ' ')
WHERE utm_medium LIKE '%+%';

-- Same for purchase_tracking
UPDATE public.purchase_tracking
SET utm_campaign = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  utm_campaign, '%5B', '['), '%5D', ']'), '%2B', '+'), '%20', ' '), '%E2%80%94', '—')
WHERE utm_campaign LIKE '%$_%' ESCAPE '$';

UPDATE public.purchase_tracking
SET utm_campaign = REPLACE(utm_campaign, '+', ' ')
WHERE utm_campaign LIKE '%+%';

UPDATE public.purchase_tracking
SET utm_content = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  utm_content, '%5B', '['), '%5D', ']'), '%2B', '+'), '%20', ' '), '%E2%80%94', '—')
WHERE utm_content LIKE '%$_%' ESCAPE '$';

UPDATE public.purchase_tracking
SET utm_content = REPLACE(utm_content, '+', ' ')
WHERE utm_content LIKE '%+%';

UPDATE public.purchase_tracking
SET utm_medium = REPLACE(REPLACE(REPLACE(utm_medium, '%5B', '['), '%5D', ']'), '%20', ' ')
WHERE utm_medium LIKE '%$_%' ESCAPE '$';

UPDATE public.purchase_tracking
SET utm_medium = REPLACE(utm_medium, '+', ' ')
WHERE utm_medium LIKE '%+%';

-- ============================================================
-- FIX 3: Resolve orphan purchases — backfill UTMs from session_attribution
-- ============================================================

-- Step 3a: For purchases WITH session_id, copy UTMs from session_attribution
UPDATE public.purchase_tracking pt
SET
  utm_campaign = COALESCE(sa.utm_campaign, pt.utm_campaign),
  utm_source = COALESCE(sa.utm_source, pt.utm_source),
  utm_medium = COALESCE(sa.utm_medium, pt.utm_medium),
  utm_content = COALESCE(sa.utm_content, pt.utm_content),
  utm_term = COALESCE(sa.utm_term, pt.utm_term),
  vsl_variant = COALESCE(sa.quiz_variant, pt.vsl_variant)
FROM public.session_attribution sa
WHERE pt.session_id IS NOT NULL
  AND pt.session_id = sa.session_id
  AND (
    pt.utm_campaign IS NULL OR pt.utm_campaign = ''
    OR pt.vsl_variant IS NULL OR pt.vsl_variant = ''
  );

-- Step 3b: For purchases WITHOUT session_id, resolve via email
UPDATE public.purchase_tracking pt
SET
  session_id = sub.session_id,
  utm_campaign = COALESCE(sub.utm_campaign, pt.utm_campaign),
  utm_source = COALESCE(sub.utm_source, pt.utm_source),
  utm_medium = COALESCE(sub.utm_medium, pt.utm_medium),
  utm_content = COALESCE(sub.utm_content, pt.utm_content),
  utm_term = COALESCE(sub.utm_term, pt.utm_term),
  vsl_variant = COALESCE(sub.quiz_variant, pt.vsl_variant)
FROM (
  SELECT DISTINCT ON (pt2.id)
    pt2.id AS purchase_id,
    esm.session_id,
    sa.utm_campaign, sa.utm_source, sa.utm_medium, sa.utm_content, sa.utm_term, sa.quiz_variant
  FROM public.purchase_tracking pt2
  JOIN public.email_session_map esm ON LOWER(TRIM(pt2.email)) = LOWER(TRIM(esm.email))
  JOIN public.session_attribution sa ON sa.session_id = esm.session_id
  WHERE pt2.session_id IS NULL AND pt2.email IS NOT NULL
  ORDER BY pt2.id, esm.created_at DESC
) sub
WHERE pt.id = sub.purchase_id AND pt.session_id IS NULL;

-- Step 3c: For purchases WITHOUT session_id, resolve via phone
UPDATE public.purchase_tracking pt
SET
  session_id = sub.session_id,
  utm_campaign = COALESCE(sub.utm_campaign, pt.utm_campaign),
  utm_source = COALESCE(sub.utm_source, pt.utm_source),
  utm_medium = COALESCE(sub.utm_medium, pt.utm_medium),
  utm_content = COALESCE(sub.utm_content, pt.utm_content),
  utm_term = COALESCE(sub.utm_term, pt.utm_term),
  vsl_variant = COALESCE(sub.quiz_variant, pt.vsl_variant)
FROM (
  SELECT DISTINCT ON (pt2.id)
    pt2.id AS purchase_id,
    psm.session_id,
    sa.utm_campaign, sa.utm_source, sa.utm_medium, sa.utm_content, sa.utm_term, sa.quiz_variant
  FROM public.purchase_tracking pt2
  CROSS JOIN LATERAL (
    SELECT (pt2.event_id::jsonb)->>'phone' AS phone_raw
    WHERE pt2.event_id IS NOT NULL AND pt2.event_id LIKE '{%'
  ) phone_extract
  JOIN public.phone_session_map psm ON RIGHT(REGEXP_REPLACE(phone_extract.phone_raw, '\D', '', 'g'), 9) = RIGHT(psm.phone, 9)
  JOIN public.session_attribution sa ON sa.session_id = psm.session_id
  WHERE pt2.session_id IS NULL AND phone_extract.phone_raw IS NOT NULL AND phone_extract.phone_raw != ''
  ORDER BY pt2.id, psm.created_at DESC
) sub
WHERE pt.id = sub.purchase_id AND pt.session_id IS NULL;

-- ============================================================
-- FIX 4: Update url_decode function to also replace + with space
-- ============================================================

CREATE OR REPLACE FUNCTION public.url_decode(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  result text;
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  result := input;
  result := replace(result, '%5B', '[');
  result := replace(result, '%5D', ']');
  result := replace(result, '%2B', '+');
  result := replace(result, '%20', ' ');
  result := replace(result, '%2C', ',');
  result := replace(result, '%E2%80%94', '—');
  result := replace(result, '%C3%B3', 'ó');
  result := replace(result, '%C3%A9', 'é');
  result := replace(result, '%C3%A1', 'á');
  result := replace(result, '%C3%AD', 'í');
  result := replace(result, '%C3%BA', 'ú');
  result := replace(result, '%C3%A3', 'ã');
  result := replace(result, '%C3%B5', 'õ');
  -- After URL decoding, normalize + to space
  result := replace(result, '+', ' ');
  result := trim(result);
  RETURN result;
END;
$function$;

-- ============================================================
-- FIX 5: Update get_campaign_stats_today with phone fallback + normalization
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_campaign_stats_today()
RETURNS TABLE(campaign text, leads bigint, checkouts bigint, sales bigint, revenue numeric, refunds bigint, conv_rate numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
WITH tz AS (
  SELECT date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' AS day_start
),
sa_campaigns AS (
  SELECT sa.session_id,
    TRIM(split_part(public.url_decode(sa.utm_campaign), '|', 1)) AS campaign_label
  FROM public.session_attribution sa CROSS JOIN tz
  WHERE sa.created_at >= tz.day_start AND sa.utm_campaign IS NOT NULL AND sa.utm_campaign != ''
),
leads_agg AS (SELECT campaign_label, COUNT(DISTINCT session_id) AS lead_count FROM sa_campaigns GROUP BY 1),
checkout_agg AS (
  SELECT sc.campaign_label, COUNT(DISTINCT fe.session_id) AS ck_count
  FROM public.funnel_events fe
  INNER JOIN sa_campaigns sc ON sc.session_id = fe.session_id
  CROSS JOIN tz
  WHERE fe.created_at >= tz.day_start AND fe.event_name IN ('checkout_click', 'capi_ic_sent')
  GROUP BY 1
),
enriched_purchases AS (
  SELECT
    p.id, p.amount, p.status, p.funnel_step, p.email,
    COALESCE(
      p.session_id,
      psm_fallback.session_id,
      esm_fallback.session_id
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
  ) psm_fallback ON p.session_id IS NULL
  LEFT JOIN LATERAL (
    SELECT esm.session_id
    FROM public.email_session_map esm
    WHERE p.session_id IS NULL AND psm_fallback.session_id IS NULL
      AND p.email IS NOT NULL AND LOWER(TRIM(p.email)) = LOWER(TRIM(esm.email))
    ORDER BY esm.created_at DESC LIMIT 1
  ) esm_fallback ON p.session_id IS NULL AND psm_fallback.session_id IS NULL
  WHERE p.created_at >= tz.day_start
),
sale_details AS (
  SELECT COALESCE(
    sc.campaign_label,
    NULLIF(TRIM(split_part(public.url_decode(sa_direct.utm_campaign), '|', 1)), ''),
    'Direto'
  ) AS campaign_label,
    ep.amount, ep.status, ep.funnel_step
  FROM enriched_purchases ep
  LEFT JOIN sa_campaigns sc ON sc.session_id = ep.effective_session_id
  LEFT JOIN public.session_attribution sa_direct ON sa_direct.session_id = ep.effective_session_id AND sc.session_id IS NULL
),
sales_agg AS (
  SELECT campaign_label,
    COUNT(*) FILTER (WHERE status = 'approved' AND funnel_step LIKE 'front%') AS sale_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'approved' AND funnel_step LIKE 'front%'), 0) AS front_revenue,
    COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS total_revenue,
    COUNT(*) FILTER (WHERE status IN ('refunded', 'canceled')) AS refund_count
  FROM sale_details GROUP BY 1
),
all_labels AS (
  SELECT campaign_label FROM leads_agg UNION SELECT campaign_label FROM checkout_agg UNION SELECT campaign_label FROM sales_agg
)
SELECT al.campaign_label AS campaign,
  COALESCE(la.lead_count, 0) AS leads, COALESCE(ca.ck_count, 0) AS checkouts,
  COALESCE(sa2.sale_count, 0) AS sales, COALESCE(sa2.total_revenue, 0) AS revenue,
  COALESCE(sa2.refund_count, 0) AS refunds,
  CASE WHEN COALESCE(la.lead_count, 0) > 0
    THEN ROUND((COALESCE(sa2.sale_count, 0)::numeric / la.lead_count::numeric) * 100, 1) ELSE 0 END AS conv_rate
FROM all_labels al
LEFT JOIN leads_agg la ON la.campaign_label = al.campaign_label
LEFT JOIN checkout_agg ca ON ca.campaign_label = al.campaign_label
LEFT JOIN sales_agg sa2 ON sa2.campaign_label = al.campaign_label
ORDER BY COALESCE(sa2.sale_count, 0) DESC, COALESCE(sa2.total_revenue, 0) DESC;
$function$;

-- ============================================================
-- FIX 6: Update get_dashboard_summary_today — same enrichment
-- ============================================================

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
      COALESCE(
        p.session_id,
        psm_fallback.session_id,
        esm_fallback.session_id
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
    ) psm_fallback ON p.session_id IS NULL
    LEFT JOIN LATERAL (
      SELECT esm.session_id
      FROM public.email_session_map esm
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
  ab_visitors AS (
    SELECT COALESCE(quiz_variant, 'sem_variante') AS variant, COUNT(DISTINCT session_id) AS visitors
    FROM public.session_attribution CROSS JOIN tz WHERE created_at >= tz.day_start GROUP BY 1
  ),
  ab_cta AS (
    SELECT COALESCE(sa.quiz_variant, 'sem_variante') AS variant, COUNT(DISTINCT fe.session_id) AS cta_clicks
    FROM public.funnel_events fe LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_completed' AND (fe.event_data->>'step') = 'step-1' GROUP BY 1
  ),
  ab_quiz AS (
    SELECT COALESCE(sa.quiz_variant, 'sem_variante') AS variant, COUNT(DISTINCT fe.session_id) AS quiz_complete
    FROM public.funnel_events fe LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name = 'step_viewed' AND (fe.event_data->>'step') IN ('step-15', 'step-16', 'step-17') GROUP BY 1
  ),
  ab_checkouts AS (
    SELECT COALESCE(sa.quiz_variant, 'sem_variante') AS variant, COUNT(DISTINCT fe.session_id) AS checkouts
    FROM public.funnel_events fe LEFT JOIN public.session_attribution sa ON sa.session_id = fe.session_id CROSS JOIN tz
    WHERE fe.created_at >= tz.day_start AND fe.event_name IN ('checkout_click', 'capi_ic_sent') GROUP BY 1
  ),
  ab_sales_data AS (
    SELECT COALESCE(sa.quiz_variant, 'sem_variante') AS variant,
      COUNT(DISTINCT p.id) FILTER (WHERE p.funnel_step LIKE 'front%') AS front_sales,
      COALESCE(SUM(p.amount) FILTER (WHERE p.funnel_step LIKE 'front%'), 0) AS front_revenue,
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
      COALESCE(s.total_sales, 0) AS total_sales, COALESCE(s.total_revenue, 0) AS total_revenue
    FROM ab_visitors v
    FULL OUTER JOIN ab_sales_data s ON v.variant = s.variant
    LEFT JOIN ab_cta cta ON cta.variant = COALESCE(v.variant, s.variant)
    LEFT JOIN ab_quiz q ON q.variant = COALESCE(v.variant, s.variant)
    LEFT JOIN ab_checkouts ck ON ck.variant = COALESCE(v.variant, s.variant)
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
$function$;

-- ============================================================
-- FIX 7: Create get_creative_stats_today RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_creative_stats_today()
RETURNS TABLE(
  channel text,
  creative text,
  leads bigint,
  checkouts bigint,
  sales bigint,
  revenue numeric,
  conv_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
WITH tz AS (
  SELECT date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' AS day_start
),
sa_enriched AS (
  SELECT
    sa.session_id,
    CASE
      WHEN LOWER(COALESCE(sa.utm_source, '')) ~ '(facebook|fb|meta)' THEN 'Meta'
      WHEN LOWER(COALESCE(sa.utm_source, '')) ~ 'tiktok' THEN 'TikTok'
      WHEN LOWER(COALESCE(sa.utm_source, '')) ~ 'google' THEN 'Google'
      WHEN sa.utm_source IS NOT NULL AND sa.utm_source != '' THEN sa.utm_source
      ELSE 'Direto'
    END AS channel_label,
    COALESCE(
      NULLIF(TRIM(public.url_decode(sa.utm_content)), ''),
      (SELECT string_agg(m[1], ' | ') FROM regexp_matches(public.url_decode(COALESCE(sa.utm_campaign, '')), '\[([^\]]+)\]', 'g') AS m),
      'Sem criativo'
    ) AS creative_label
  FROM public.session_attribution sa
  CROSS JOIN tz
  WHERE sa.created_at >= tz.day_start
),
enriched_purchases AS (
  SELECT
    p.id, p.amount, p.status, p.funnel_step,
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
  WHERE p.created_at >= tz.day_start
),
channel_leads AS (
  SELECT channel_label, COUNT(DISTINCT session_id) AS cnt FROM sa_enriched GROUP BY 1
),
channel_checkouts AS (
  SELECT se.channel_label, COUNT(DISTINCT fe.session_id) AS cnt
  FROM public.funnel_events fe
  JOIN sa_enriched se ON se.session_id = fe.session_id
  CROSS JOIN tz
  WHERE fe.created_at >= tz.day_start AND fe.event_name IN ('checkout_click', 'capi_ic_sent')
  GROUP BY 1
),
channel_sales AS (
  SELECT COALESCE(se.channel_label, 'Direto') AS channel_label,
    COUNT(*) FILTER (WHERE ep.status = 'approved' AND ep.funnel_step LIKE 'front%') AS sale_count,
    COALESCE(SUM(ep.amount) FILTER (WHERE ep.status = 'approved'), 0) AS total_rev
  FROM enriched_purchases ep
  LEFT JOIN sa_enriched se ON se.session_id = ep.effective_session_id
  GROUP BY 1
),
creative_leads AS (
  SELECT creative_label, COUNT(DISTINCT session_id) AS cnt FROM sa_enriched GROUP BY 1
),
creative_checkouts AS (
  SELECT se.creative_label, COUNT(DISTINCT fe.session_id) AS cnt
  FROM public.funnel_events fe
  JOIN sa_enriched se ON se.session_id = fe.session_id
  CROSS JOIN tz
  WHERE fe.created_at >= tz.day_start AND fe.event_name IN ('checkout_click', 'capi_ic_sent')
  GROUP BY 1
),
creative_sales AS (
  SELECT COALESCE(se.creative_label, 'Sem criativo') AS creative_label,
    COUNT(*) FILTER (WHERE ep.status = 'approved' AND ep.funnel_step LIKE 'front%') AS sale_count,
    COALESCE(SUM(ep.amount) FILTER (WHERE ep.status = 'approved'), 0) AS total_rev
  FROM enriched_purchases ep
  LEFT JOIN sa_enriched se ON se.session_id = ep.effective_session_id
  GROUP BY 1
),
channel_all AS (
  SELECT channel_label AS lbl FROM channel_leads
  UNION SELECT channel_label FROM channel_checkouts
  UNION SELECT channel_label FROM channel_sales
),
channel_result AS (
  SELECT ca.lbl AS channel_name, '' AS creative_name,
    COALESCE(cl.cnt, 0) AS leads, COALESCE(cc.cnt, 0) AS checkouts,
    COALESCE(cs.sale_count, 0) AS sales, COALESCE(cs.total_rev, 0) AS revenue
  FROM channel_all ca
  LEFT JOIN channel_leads cl ON cl.channel_label = ca.lbl
  LEFT JOIN channel_checkouts cc ON cc.channel_label = ca.lbl
  LEFT JOIN channel_sales cs ON cs.channel_label = ca.lbl
),
creative_all AS (
  SELECT creative_label AS lbl FROM creative_leads
  UNION SELECT creative_label FROM creative_checkouts
  UNION SELECT creative_label FROM creative_sales
),
creative_result AS (
  SELECT '' AS channel_name, ca.lbl AS creative_name,
    COALESCE(cl.cnt, 0) AS leads, COALESCE(cc.cnt, 0) AS checkouts,
    COALESCE(cs.sale_count, 0) AS sales, COALESCE(cs.total_rev, 0) AS revenue
  FROM creative_all ca
  LEFT JOIN creative_leads cl ON cl.creative_label = ca.lbl
  LEFT JOIN creative_checkouts cc ON cc.creative_label = ca.lbl
  LEFT JOIN creative_sales cs ON cs.creative_label = ca.lbl
)
SELECT channel_name AS channel, creative_name AS creative, leads, checkouts, sales, revenue,
  CASE WHEN leads > 0 THEN ROUND((sales::numeric / leads::numeric) * 100, 1) ELSE 0 END AS conv_rate
FROM (
  SELECT * FROM channel_result
  UNION ALL
  SELECT * FROM creative_result
) combined
ORDER BY sales DESC, revenue DESC;
$function$;
