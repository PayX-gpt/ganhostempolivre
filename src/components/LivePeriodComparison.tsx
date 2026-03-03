import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PeriodData {
  revenue: number;
  sales: number;
  leads: number;
  approvalRate: number;
  ics: number;
  refunds: number;
  avgTicket: number;
}

export interface PeriodComparisonData {
  current: PeriodData;
  previous: PeriodData;
}

async function fetchAllRows(table: string, select: string, filters: (q: any) => any, pageSize = 1000): Promise<any[]> {
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table as any).select(select).range(from, from + pageSize - 1);
    q = filters(q);
    const { data, error } = await q;
    if (error || !data || data.length === 0) break;
    all.push(...(data as any[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export function usePeriodComparison(dateFilter: string) {
  const [data, setData] = useState<PeriodComparisonData | null>(null);

  const fetch = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    let currentStart: Date, previousStart: Date, previousEnd: Date;

    switch (dateFilter) {
      case "1h":
        currentStart = new Date(now.getTime() - 3600000);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd.getTime() - 3600000);
        break;
      case "7d":
        currentStart = new Date(todayStart);
        currentStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 7);
        break;
      case "30d":
        currentStart = new Date(todayStart);
        currentStart.setDate(currentStart.getDate() - 30);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 30);
        break;
      default: // 24h
        currentStart = new Date(todayStart);
        previousEnd = new Date(todayStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 1);
        break;
    }

    const curISO = currentStart.toISOString();
    const prevStartISO = previousStart.toISOString();
    const prevEndISO = previousEnd.toISOString();

    const [curPurchases, prevPurchases, curLeads, prevLeads, curICs, prevICs] = await Promise.all([
      fetchAllRows("purchase_tracking", "amount, status, email", (q: any) => q.gte("created_at", curISO)),
      fetchAllRows("purchase_tracking", "amount, status, email", (q: any) => q.gte("created_at", prevStartISO).lt("created_at", prevEndISO)),
      fetchAllRows("lead_behavior", "session_id", (q: any) => q.gte("created_at", curISO)),
      fetchAllRows("lead_behavior", "session_id", (q: any) => q.gte("created_at", prevStartISO).lt("created_at", prevEndISO)),
      fetchAllRows("funnel_events", "session_id", (q: any) => q.in("event_name", ["checkout_click", "capi_ic_sent"]).gte("created_at", curISO)),
      fetchAllRows("funnel_events", "session_id", (q: any) => q.in("event_name", ["checkout_click", "capi_ic_sent"]).gte("created_at", prevStartISO).lt("created_at", prevEndISO)),
    ]);

    const calcPeriod = (purchases: any[], leads: any[], ics: any[]): PeriodData => {
      const approved = purchases.filter((p: any) => ["approved", "completed", "purchased", "redirected"].includes(p.status));
      const totalAttempts = purchases.filter((p: any) => ["approved", "completed", "purchased", "redirected", "pending", "refused"].includes(p.status));
      const refunds = purchases.filter((p: any) => p.status === "refunded" || p.status === "canceled");
      const revenue = approved.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
      const uniqueLeads = new Set(leads.map((l: any) => l.session_id)).size;
      const uniqueICs = new Set(ics.map((e: any) => e.session_id)).size;
      return {
        revenue,
        sales: approved.length,
        leads: uniqueLeads,
        approvalRate: totalAttempts.length > 0 ? (approved.length / totalAttempts.length) * 100 : 0,
        ics: uniqueICs,
        refunds: refunds.length,
        avgTicket: approved.length > 0 ? revenue / approved.length : 0,
      };
    };

    setData({
      current: calcPeriod(curPurchases, curLeads, curICs),
      previous: calcPeriod(prevPurchases, prevLeads, prevICs),
    });
  }, [dateFilter]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  return data;
}

export function getVariation(current: number, previous: number): { pct: string; trend: "up" | "down" | "neutral" } {
  if (previous === 0 && current === 0) return { pct: "0%", trend: "neutral" };
  if (previous === 0) return { pct: "+∞", trend: "up" };
  const diff = ((current - previous) / previous) * 100;
  return {
    pct: `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`,
    trend: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
  };
}
