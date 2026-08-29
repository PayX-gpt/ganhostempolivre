-- Campanhas no /live: agrupar pelo ID ESTÁVEL da campanha (parte após '|' no
-- utm_campaign, ex: "...[CBO 1-2-X]|120254118805480368") e exibir o NOME MAIS
-- RECENTE (URL-decodificado). Antes agrupava pelo nome cru — então renomear a
-- campanha no Meta (ou variações de URL-encode) fragmentava a MESMA campanha em
-- várias linhas com nomes antigos. Agora renomear não quebra: o ID une tudo e o
-- painel mostra o nome atual.

-- Decodifica percent-encoding (%5B, %2F, %E2%80%94…) e '+' → espaço. Byte a byte
-- para lidar corretamente com sequências multibyte (ex: — = %E2%80%94).
CREATE OR REPLACE FUNCTION public.url_decode(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  ret bytea := '';
  i int := 1;
  c text;
  n int;
  data text := input;
BEGIN
  IF data IS NULL THEN RETURN NULL; END IF;
  data := replace(data, '+', ' ');
  n := length(data);
  WHILE i <= n LOOP
    c := substr(data, i, 1);
    IF c = '%' AND i + 2 <= n AND substr(data, i+1, 2) ~ '^[0-9A-Fa-f]{2}$' THEN
      ret := ret || decode(substr(data, i+1, 2), 'hex');
      i := i + 3;
    ELSE
      ret := ret || convert_to(c, 'UTF8');
      i := i + 1;
    END IF;
  END LOOP;
  RETURN convert_from(ret, 'UTF8');
EXCEPTION WHEN OTHERS THEN
  RETURN input;
END;
$$;

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
  -- Leads de hoje: chave = ID estável (se houver) senão o nome decodificado.
  campaign_leads AS (
    SELECT
      COALESCE(
        NULLIF(split_part(sa.utm_campaign, '|', 2), ''),                       -- ID estável
        NULLIF(public.url_decode(split_part(sa.utm_campaign, '|', 1)), ''),    -- nome decodificado
        CASE WHEN sa.fbclid IS NOT NULL THEN 'Meta (fbclid)'
             WHEN sa.ttclid IS NOT NULL THEN 'TikTok (ttclid)'
             ELSE 'Direto' END
      ) AS camp_key,
      NULLIF(public.url_decode(split_part(sa.utm_campaign, '|', 1)), '') AS camp_name,
      sa.session_id,
      sa.created_at
    FROM public.session_attribution sa, today_start t
    WHERE sa.created_at >= t.ts
  ),
  -- Nome de exibição por chave = o MAIS RECENTE visto hoje para aquela chave.
  name_by_key AS (
    SELECT DISTINCT ON (camp_key) camp_key, camp_name AS display_name
    FROM campaign_leads
    WHERE camp_name IS NOT NULL
    ORDER BY camp_key, created_at DESC
  ),
  lead_counts AS (
    SELECT camp_key, COUNT(DISTINCT session_id) AS lead_count
    FROM campaign_leads
    GROUP BY camp_key
  ),
  checkout_counts AS (
    SELECT camp_key, COUNT(DISTINCT session_id) AS ck_count
    FROM (
      SELECT COALESCE(cl.camp_key, 'Direto') AS camp_key, fe.session_id
      FROM public.funnel_events fe
      LEFT JOIN campaign_leads cl ON fe.session_id = cl.session_id
      CROSS JOIN today_start t
      WHERE fe.event_name IN ('checkout_click', 'capi_ic_sent')
        AND fe.created_at >= t.ts
    ) x
    GROUP BY camp_key
  ),
  -- Vendas: resolve o utm (session > cross-email > purchase) e depois a chave.
  sale_stats AS (
    SELECT
      COALESCE(
        NULLIF(split_part(r.utm, '|', 2), ''),
        NULLIF(public.url_decode(split_part(r.utm, '|', 1)), ''),
        'Direto'
      ) AS camp_key,
      r.amount,
      r.status
    FROM (
      SELECT
        COALESCE(NULLIF(sa.utm_campaign, ''), NULLIF(sa2.utm_campaign, ''), NULLIF(p.utm_campaign, '')) AS utm,
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
    ) r
  ),
  sale_agg AS (
    SELECT
      camp_key,
      COUNT(*) FILTER (WHERE status IN ('approved','completed','purchased','redirected')) AS sale_count,
      COALESCE(SUM(amount) FILTER (WHERE status IN ('approved','completed','purchased','redirected')), 0) AS total_revenue,
      COUNT(*) FILTER (WHERE status IN ('refunded','canceled')) AS refund_count
    FROM sale_stats
    GROUP BY camp_key
  ),
  all_camps AS (
    SELECT camp_key FROM lead_counts
    UNION
    SELECT camp_key FROM sale_agg
  )
  SELECT
    COALESCE(nbk.display_name, ac.camp_key) AS campaign,
    COALESCE(lc.lead_count, 0) AS leads,
    COALESCE(cc.ck_count, 0) AS checkouts,
    COALESCE(sa.sale_count, 0) AS sales,
    COALESCE(sa.total_revenue, 0) AS revenue,
    COALESCE(sa.refund_count, 0) AS refunds,
    CASE WHEN COALESCE(lc.lead_count, 0) > 0
      THEN ROUND((COALESCE(sa.sale_count, 0)::numeric / lc.lead_count) * 100, 1)
      ELSE 0 END AS conv_rate
  FROM all_camps ac
  LEFT JOIN name_by_key nbk ON ac.camp_key = nbk.camp_key
  LEFT JOIN lead_counts lc ON ac.camp_key = lc.camp_key
  LEFT JOIN checkout_counts cc ON ac.camp_key = cc.camp_key
  LEFT JOIN sale_agg sa ON ac.camp_key = sa.camp_key
  ORDER BY COALESCE(sa.total_revenue, 0) DESC;
$$;
