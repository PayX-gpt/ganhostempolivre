import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FunnelStepModalProps {
  stepRoute: string;
  stepLabel: string;
  onClose: () => void;
}

export default function FunnelStepModal({ stepRoute, stepLabel, onClose }: FunnelStepModalProps) {
  const [data, setData] = useState<{
    today: number; week: number; month: number;
    avgTimeMs: number; dropOff: number;
    ageBreakdown: Record<string, number>;
    obstacleBreakdown: Record<string, number>;
    balanceBreakdown: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(todayStart); monthStart.setDate(monthStart.getDate() - 30);

      const stepKey = stepRoute.startsWith("/") ? stepRoute.slice(1) : stepRoute;

      const [todayEvts, weekEvts, monthEvts, completedEvts] = await Promise.all([
        supabase.from("funnel_events").select("session_id").eq("event_name", "step_viewed").gte("created_at", todayStart.toISOString())
          .contains("event_data", { step: stepKey } as any),
        supabase.from("funnel_events").select("session_id").eq("event_name", "step_viewed").gte("created_at", weekStart.toISOString())
          .contains("event_data", { step: stepKey } as any),
        supabase.from("funnel_events").select("session_id").eq("event_name", "step_viewed").gte("created_at", monthStart.toISOString())
          .contains("event_data", { step: stepKey } as any),
        supabase.from("funnel_events").select("session_id, event_data").eq("event_name", "step_completed").gte("created_at", todayStart.toISOString())
          .contains("event_data", { step: stepKey } as any),
      ]);

      const todaySessions = new Set((todayEvts.data || []).map((e: any) => e.session_id));
      const weekSessions = new Set((weekEvts.data || []).map((e: any) => e.session_id));
      const monthSessions = new Set((monthEvts.data || []).map((e: any) => e.session_id));

      // Avg time
      const times = (completedEvts.data || [])
        .map((e: any) => (e.event_data as any)?.time_spent_ms as number)
        .filter((t: any) => t > 0 && t < 600000);
      const avgTimeMs = times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0;

      // Get lead profiles for people who viewed this step today
      const sessionIds = Array.from(todaySessions).slice(0, 200);
      const { data: leadsData } = await supabase.from("lead_behavior")
        .select("quiz_answers, account_balance")
        .in("session_id", sessionIds.length > 0 ? sessionIds : ["__none__"]);

      const ageBreakdown: Record<string, number> = {};
      const obstacleBreakdown: Record<string, number> = {};
      const balanceBreakdown: Record<string, number> = {};

      (leadsData || []).forEach((l: any) => {
        const qa = (l.quiz_answers as Record<string, string>) || {};
        if (qa.age) ageBreakdown[qa.age] = (ageBreakdown[qa.age] || 0) + 1;
        if (qa.obstacle) obstacleBreakdown[qa.obstacle] = (obstacleBreakdown[qa.obstacle] || 0) + 1;
        if (l.account_balance) balanceBreakdown[l.account_balance] = (balanceBreakdown[l.account_balance] || 0) + 1;
      });

      setData({
        today: todaySessions.size,
        week: weekSessions.size,
        month: monthSessions.size,
        avgTimeMs,
        dropOff: 0,
        ageBreakdown,
        obstacleBreakdown,
        balanceBreakdown,
      });
    }
    load();
  }, [stepRoute]);

  const formatTime = (ms: number) => {
    const s = ms / 1000;
    return s > 60 ? `${(s / 60).toFixed(1)}min` : `${Math.round(s)}s`;
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#0d0d0d] border-[#2a2a2a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">📊 {stepLabel} <code className="text-[10px] text-[#666] ml-1">{stepRoute}</code></DialogTitle>
        </DialogHeader>

        {!data ? (
          <p className="text-center text-[#666] py-6 text-xs">Carregando...</p>
        ) : (
          <div className="space-y-4">
            {/* Counts */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Hoje", value: data.today },
                { label: "7 dias", value: data.week },
                { label: "30 dias", value: data.month },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-3 text-center">
                  <p className="text-[9px] text-[#666] uppercase">{item.label}</p>
                  <p className="text-xl font-bold text-white tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Avg time */}
            {data.avgTimeMs > 0 && (
              <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-3">
                <p className="text-[9px] text-[#666] uppercase mb-1">Tempo médio nesta etapa</p>
                <p className="text-lg font-bold text-amber-400">~{formatTime(data.avgTimeMs)}</p>
              </div>
            )}

            {/* Breakdowns */}
            {Object.keys(data.ageBreakdown).length > 0 && (
              <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-3">
                <p className="text-[9px] text-[#666] uppercase mb-2">Perfil por Idade</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(data.ageBreakdown).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <span key={k} className="text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg">{k}: {v}</span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(data.obstacleBreakdown).length > 0 && (
              <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-3">
                <p className="text-[9px] text-[#666] uppercase mb-2">Perfil por Obstáculo</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(data.obstacleBreakdown).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <span key={k} className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg">{k}: {v}</span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(data.balanceBreakdown).length > 0 && (
              <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-3">
                <p className="text-[9px] text-[#666] uppercase mb-2">Perfil por Saldo</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(data.balanceBreakdown).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <span key={k} className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">{k}: {v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
