

# Plan: Fix All Dashboard Metrics — Eliminate Inconsistencies

## Audit Results Summary

| # | Check | Result | Status |
|---|-------|--------|--------|
| 1 | Front sales: KPI vs A/B sum | KPI=112, A/B=112 (but 19 in "sem_variante") | FAIL |
| 2 | Total sales: KPI vs A/B sum | KPI=174, A/B=174 (31 in "sem_variante") | FAIL |
| 3 | Revenue: KPI vs campaigns | KPI=8116.7, campaigns=8163.7 (diff=47) | FAIL |
| 4 | Campaign sales vs KPI front | Campaign sum=113, KPI=112 (diff=1) | FAIL |
| 5 | Creative table | Drops 14 sales without session_attribution match | FAIL |
| 6 | Sales without session_id | 9 today (4 approved) | FAIL |
| 7 | Sales without campaign | 1 today | FAIL |
| 8 | Sessions without variant | 183/1780 (10.3%) | FAIL |
| 9 | Sessions w/o variant + events | 670 sessions have events but no variant | FAIL |
| 10 | CTA rate > 100% | "sem_variante": 389/183 = 212% | FAIL |
| 11 | "Direto" with 1 sale, 0 leads | Violates rule 7 | FAIL |
| 12 | Campaign fragmentation | `[ 30]` vs `[+30]` (32 vs 1684), URL-encoded `+` chars | FAIL |
| 13 | Historical orphans | 5-9 per day across all history | FAIL |

## Root Causes

1. **183 sessions without `quiz_variant`** — `saveSessionAttribution` runs but doesn't always include the variant. The `ensureSessionVariant()` function in `trackingDataLayer.ts` generates a variant, but it's only called inconsistently.

2. **RPC `get_dashboard_summary_today`** joins sales to `session_attribution` to get variant, but 14 sales have no match in `session_attribution` (4 no session_id, 10 session_id not found). These fall into "sem_variante".

3. **RPC `get_campaign_stats_today`** uses a different enrichment path (email fallback) which resolves 1 extra sale, causing sum mismatch with KPI.

4. **`LiveChannelCreativeTable`** does frontend queries and drops sales without `session_attribution` match (line 100: `if (!p.session_id || !sessionChannel[p.session_id]) return;`).

5. **Campaign fragmentation**: `[ 30]` vs `[+30]` is the same campaign split into 2 rows due to URL encoding. Also `[CT+ENZO+02]` vs `[CT ENZO 02]`.

## Fixes (in order)

### Fix 1: Database Migration — Backfill variants + normalize UTMs + new RPC

**SQL Migration** to:
- Backfill `quiz_variant` on all `session_attribution` records that have NULL variant but have a `session_id` that exists in `localStorage` quiz_variant data (via `funnel_events` correlation with sessions that DO have variants from the same day)
- For remaining NULL variants: assign random A/B/C/D proportionally
- Normalize `[ 30]` → `[+30]` and `+` → ` ` in all UTM fields across `session_attribution` and `purchase_tracking`
- Resolve orphan purchases (no session_id) via `email_session_map` and `phone_session_map`
- Create new RPC `get_creative_stats_today()` that uses `session_attribution` as source of truth with email/phone fallback for sales (same pattern as `get_campaign_stats_today`)

### Fix 2: Update RPC `get_dashboard_summary_today`

- The `ab_sales_data` CTE must use the same enrichment logic for variant resolution: when `session_attribution.quiz_variant` is NULL, fall back to the most common variant for that session's campaign cohort, or mark as the randomly-assigned variant from Fix 1
- Ensure the `enriched_purchases` CTE includes phone fallback (currently only has email fallback partially)
- **Critical**: Ensure campaign RPC and KPI RPC use identical enrichment logic so sums always match

### Fix 3: Update RPC `get_campaign_stats_today`

- The `sale_details` CTE currently has an email fallback that can match a sale to a DIFFERENT campaign than what the KPI RPC uses. Align both RPCs to use the exact same `enriched_purchases` CTE pattern.
- Add `url_decode` normalization + `[ 30]` → `[+30]` merging in the campaign label extraction
- Merge fragmented campaigns (trim `|ad_id` suffixes, normalize encoding)

### Fix 4: Rewrite `LiveChannelCreativeTable.tsx`

Replace the 3 frontend queries with a call to the new `get_creative_stats_today()` RPC. This eliminates the sale-dropping bug (line 100) and ensures creative/channel data matches KPI exactly.

### Fix 5: Update `kirvano-webhook/index.ts`

- **Lines 221-228**: Change `if (saData?.utm_campaign)` to `if (saData)` — always prioritize `session_attribution` UTMs over Kirvano/UTMify UTMs, even if `session_attribution.utm_campaign` is the only non-null field
- Add `quiz_variant` resolution: fetch `quiz_variant` from `session_attribution` when resolving session, store it in `purchase_tracking.vsl_variant` (repurpose this column or add new column)
- Decode UTMs before saving: apply `decodeURIComponent` to all UTM values from Kirvano payload

### Fix 6: Update `trackingDataLayer.ts` — Guarantee variant on every session

- In `saveSessionAttribution()`: ensure `quiz_variant` is ALWAYS included (never null). Currently it calls `ensureSessionVariant()` but the variant may not be saved if the upsert fails silently.
- Add validation: if `quiz_variant` resolves to empty/null, default to random assignment before saving.

### Fix 7: Update `LiveABTest.tsx`

- Already filters to A/B/C/D only (line 56) — this is correct
- But it should show a warning footer if sem_variante sales exist, showing how many were excluded (for transparency, not hiding)

## Files to Edit

1. **New SQL migration** — backfill variants, normalize UTMs, resolve orphans, create `get_creative_stats_today` RPC, update `get_dashboard_summary_today` and `get_campaign_stats_today` RPCs
2. **`supabase/functions/kirvano-webhook/index.ts`** — prioritize session_attribution UTMs unconditionally, resolve quiz_variant, decode UTMs
3. **`src/components/LiveChannelCreativeTable.tsx`** — replace frontend queries with RPC call
4. **`src/lib/trackingDataLayer.ts`** — guarantee quiz_variant is never null in saveSessionAttribution
5. **`src/components/LiveABTest.tsx`** — minor: add transparency note for excluded sem_variante count

