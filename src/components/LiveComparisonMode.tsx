import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GitCompareArrows, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodMetrics {
  label: string;
  visits: number;
  leads: number;
  ics: number;
  sales: number;
  revenue: number;
  approvalRate: number;
  avgTicket: number;
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

async function getMetricsForPeriod(startISO: string, endISO: string, label: string): Promise<PeriodMetrics> {
  const [visitEvents, leadEvents, icEvents, purchases] = await Promise.all([
    fetchAllRows("funnel_events", "session_id", (q: any) => q.eq("event_name", "step_viewed").gte("created_at", startISO).lt("created_at", endISO)),
    fetchAllRows("funnel_events", "session_id", (q: any) => q.eq("event_name", "lead_captured").gte("created_at", startISO).lt("created_at", endISO)),
    fetchAllRows("funnel_events", "session_id", (q: any) => q.in("event_name", ["checkout_click", "capi_ic_sent"]).gte("created_at", startISO).lt("created_at", endISO)),
    fetchAllRows("purchase_tracking", "amount, status, email", (q: any) => q.gte("created_at", startISO).lt("created_at", endISO)),
  ]);

  const visits = new Set(visitEvents.map(e => e.session_id)).size;
  const leads = new Set(leadEvents.map(e => e.session_id)).size;
  const ics = new Set(icEvents.map(e => e.session_id)).size;
  const approved = purchases.filter((p: any) => ["approved", "completed", "purchased", "redirected"].includes(p.status));
  const totalAttempts = purchases.filter((p: any) => ["approved", "completed", "purchased", "redirected", "pending", "refused"].includes(p.status));
  const revenue = approved.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

  return {
    label,
    visits,
    leads,
    ics,
    sales: approved.length,
    revenue,
    approvalRate: totalAttempts.length > 0 ? (approved.length / totalAttempts.length) * 100 : 0,
    avgTicket: approved.length > 0 ? revenue / approved.length : 0,
  };
}

export default function LiveComparisonMode() {
  const [periodA, setPeriodA] = useState<PeriodMetrics | null>(null);
  const [periodB, setPeriodB] = useState<PeriodMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"today_vs_yesterday" | "this_week_vs_last">("today_vs_yesterday");

  const compute = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    if (mode === "today_vs_yesterday") {
      const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const [a, b] = await Promise.all([
        getMetricsForPeriod(todayStart.toISOString(), now.toISOString(), "Hoje"),
        getMetricsForPeriod(yesterdayStart.toISOString(), todayStart.toISOString(), "Ontem"),
      ]);
      setPeriodA(a); setPeriodB(b);
    } else {
      const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const [a, b] = await Promise.all([
        getMetricsForPeriod(weekStart.toISOString(), now.toISOString(), "Esta Semana"),
        getMetricsForPeriod(lastWeekStart.toISOString(), weekStart.toISOString(), "Semana Passada"),
      ]);
      setPeriodA(a); setPeriodB(b);
    }
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    const timer = setTimeout(compute, 12000); // Stagger: load 12s after mount
    return () => clearTimeout(timer);
  }, [compute]);

  if (!periodA || !periodB) return null;

  const metrics = [
    { label: "Visitas", a: periodA.visits, b: periodB.visits, fmt: (v: number) => String(v) },
    { label: "Leads", a: periodA.leads, b: periodB.leads, fmt: (v: number) => String(v) },
    { label: "ICs", a: periodA.ics, b: periodB.ics, fmt: (v: number) => String(v) },
    { label: "Vendas", a: periodA.sales, b: periodB.sales, fmt: (v: number) => String(v) },
    { label: "Receita", a: periodA.revenue, b: periodB.revenue, fmt: (v: number) => `R$ ${v.toFixed(0)}` },
    { label: "Aprovação", a: periodA.approvalRate, b: periodB.approvalRate, fmt: (v: number) => `${v.toFixed(0)}%` },
    { label: "Ticket Médio", a: periodA.avgTicket, b: periodB.avgTicket, fmt: (v: number) => `R$ ${v.toFixed(0)}` },
  ];

  const variation = (a: number, b: number) => {
    if (b === 0) return a > 0 ? { pct: "+∞", trend: "up" as const } : { pct: "—", trend: "neutral" as const };
    const diff = ((a - b) / b) * 100;
    return { pct: `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`, trend: diff > 0 ? "up" as const : diff < 0 ? "down" as const : "neutral" as const };
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/20">
          <GitCompareArrows className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">Comparação de Períodos</h3>
          <p className="text-[10px] text-[#666]">{periodA.label} vs {periodB.label}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMode("today_vs_yesterday")}
            className={cn("px-2 py-1 rounded text-[10px] font-medium border",
              mode === "today_vs_yesterday" ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-[#0d0d0d] border-[#2a2a2a] text-[#666]")}>
            Hoje vs Ontem
          </button>
          <button onClick={() => setMode("this_week_vs_last")}
            className={cn("px-2 py-1 rounded text-[10px] font-medium border",
              mode === "this_week_vs_last" ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-[#0d0d0d] border-[#2a2a2a] text-[#666]")}>
            Semana vs Anterior
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-[#666] py-4 text-xs">Carregando...</p>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left text-[#666] font-medium pb-2 pr-4">Métrica</th>
                <th className="text-right text-[#888] font-medium pb-2 px-3">{periodA.label}</th>
                <th className="text-right text-[#666] font-medium pb-2 px-3">{periodB.label}</th>
                <th className="text-right text-[#666] font-medium pb-2 pl-3">Variação</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(m => {
                const v = variation(m.a, m.b);
                return (
                  <tr key={m.label} className="border-b border-[#1a1a1a]">
                    <td className="py-2 pr-4 text-[#888] font-medium">{m.label}</td>
                    <td className="py-2 px-3 text-right text-white font-bold tabular-nums">{m.fmt(m.a)}</td>
                    <td className="py-2 px-3 text-right text-[#666] tabular-nums">{m.fmt(m.b)}</td>
                    <td className={cn("py-2 pl-3 text-right font-bold tabular-nums",
                      v.trend === "up" ? "text-emerald-400" : v.trend === "down" ? "text-red-400" : "text-[#666]")}>
                      {v.pct}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
