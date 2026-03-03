import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Timer, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface VelocityData {
  avgFunnelTimeMin: number;
  avgToOfferMin: number;
  avgToCheckoutMin: number;
  fastestSessionMin: number;
  sessionsAnalyzed: number;
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

export default function LiveFunnelVelocity() {
  const [data, setData] = useState<VelocityData | null>(null);

  const compute = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const events = await fetchAllRows(
      "funnel_events", "session_id, event_name, event_data, created_at",
      (q: any) => q.in("event_name", ["step_viewed", "checkout_click", "capi_ic_sent"]).gte("created_at", todayISO)
    );

    // Group by session
    const sessions: Record<string, { firstStep?: Date; offerView?: Date; checkout?: Date }> = {};
    events.forEach((e: any) => {
      const sid = e.session_id;
      if (!sessions[sid]) sessions[sid] = {};
      const ts = new Date(e.created_at);

      if (e.event_name === "step_viewed") {
        const step = (e.event_data as any)?.step as string;
        if (step === "step-1" || step === "/step-1") {
          if (!sessions[sid].firstStep || ts < sessions[sid].firstStep!) sessions[sid].firstStep = ts;
        }
        if (step === "step-17" || step === "/step-17") {
          if (!sessions[sid].offerView || ts > sessions[sid].offerView!) sessions[sid].offerView = ts;
        }
      }
      if (e.event_name === "checkout_click" || e.event_name === "capi_ic_sent") {
        if (!sessions[sid].checkout || ts > sessions[sid].checkout!) sessions[sid].checkout = ts;
      }
    });

    const toOfferTimes: number[] = [];
    const toCheckoutTimes: number[] = [];

    Object.values(sessions).forEach(s => {
      if (s.firstStep && s.offerView) {
        const diffMs = s.offerView.getTime() - s.firstStep.getTime();
        if (diffMs > 0 && diffMs < 3600000) toOfferTimes.push(diffMs);
      }
      if (s.firstStep && s.checkout) {
        const diffMs = s.checkout.getTime() - s.firstStep.getTime();
        if (diffMs > 0 && diffMs < 3600000) toCheckoutTimes.push(diffMs);
      }
    });

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const min = (arr: number[]) => arr.length > 0 ? Math.min(...arr) : 0;

    setData({
      avgToOfferMin: avg(toOfferTimes) / 60000,
      avgToCheckoutMin: avg(toCheckoutTimes) / 60000,
      avgFunnelTimeMin: avg([...toOfferTimes, ...toCheckoutTimes]) / 60000,
      fastestSessionMin: min([...toCheckoutTimes, ...toOfferTimes]) / 60000,
      sessionsAnalyzed: toOfferTimes.length + toCheckoutTimes.length,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(compute, 5000); // Stagger: load 5s after mount
    const interval = setInterval(compute, 120000); // Refresh every 2min
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [compute]);

  if (!data || data.sessionsAnalyzed === 0) return null;

  const fmt = (v: number) => v >= 1 ? `${v.toFixed(1)}min` : `${Math.round(v * 60)}s`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
        <div className="flex items-center gap-2 mb-2">
          <Timer className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-[#888]">Intro → Oferta</span>
        </div>
        <p className="text-2xl font-bold text-white tabular-nums">{fmt(data.avgToOfferMin)}</p>
        <p className="text-[9px] text-[#666] mt-1">Tempo médio step-1 → step-17</p>
      </div>

      <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-[#888]">Intro → Checkout</span>
        </div>
        <p className="text-2xl font-bold text-white tabular-nums">{fmt(data.avgToCheckoutMin)}</p>
        <p className="text-[9px] text-[#666] mt-1">Tempo médio até IC</p>
      </div>

      <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-[#888]">Mais Rápido</span>
        </div>
        <p className="text-2xl font-bold text-white tabular-nums">{fmt(data.fastestSessionMin)}</p>
        <p className="text-[9px] text-[#666] mt-1">Sessão mais rápida</p>
      </div>

      <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
        <div className="flex items-center gap-2 mb-2">
          <Timer className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-medium text-[#888]">Sessões Analisadas</span>
        </div>
        <p className="text-2xl font-bold text-white tabular-nums">{data.sessionsAnalyzed}</p>
        <p className="text-[9px] text-[#666] mt-1">Com dados de velocidade</p>
      </div>
    </div>
  );
}
