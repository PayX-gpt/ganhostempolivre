import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollData {
  step: string;
  label: string;
  avgScroll: number;
  count: number;
}

const STEP_LABELS: Record<string, string> = {
  "step-1": "Intro", "step-2": "Idade", "step-3": "Nome", "step-4": "Prova Social",
  "step-5": "Online?", "step-6": "Meta", "step-7": "Obstáculo", "step-8": "Mentor",
  "step-9": "Saldo", "step-10": "Tempo", "step-11": "Demo", "step-12": "WhatsApp",
  "step-13": "Contato", "step-14": "Input", "step-15": "Análise", "step-16": "Projeção",
  "step-17": "Oferta",
};

export default function LiveScrollHeatmap() {
  const [scrollData, setScrollData] = useState<ScrollData[]>([]);

  const fetch = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data } = await supabase.from("lead_behavior")
      .select("session_id, max_scroll_depth, section_times, sections_viewed")
      .gte("created_at", todayStart.toISOString());

    if (!data || data.length === 0) return;

    // Aggregate scroll depth from section_times which has per-step data
    const stepScrolls: Record<string, number[]> = {};
    
    data.forEach((row: any) => {
      const scrollDepth = row.max_scroll_depth || 0;
      const sections = (row.sections_viewed as string[]) || [];
      
      // Map sections viewed to step labels
      sections.forEach(section => {
        const stepMatch = section.match(/step-(\d+)/);
        if (stepMatch) {
          const key = `step-${stepMatch[1]}`;
          if (!stepScrolls[key]) stepScrolls[key] = [];
          stepScrolls[key].push(scrollDepth);
        }
      });

      // Also parse section_times for more granular data
      const sectionTimes = row.section_times as Record<string, number> | null;
      if (sectionTimes) {
        Object.keys(sectionTimes).forEach(key => {
          const stepMatch = key.match(/step-(\d+)/);
          if (stepMatch) {
            const stepKey = `step-${stepMatch[1]}`;
            if (!stepScrolls[stepKey]) stepScrolls[stepKey] = [];
            // Use time as engagement proxy if scroll depth not available per step
          }
        });
      }
    });

    // Fallback: use global scroll depth distributed across steps
    if (Object.keys(stepScrolls).length === 0 && data.length > 0) {
      const avgScroll = data.reduce((s: number, r: any) => s + (r.max_scroll_depth || 0), 0) / data.length;
      Object.keys(STEP_LABELS).forEach(key => {
        stepScrolls[key] = [avgScroll];
      });
    }

    const result: ScrollData[] = Object.entries(stepScrolls)
      .map(([step, depths]) => ({
        step,
        label: STEP_LABELS[step] || step,
        avgScroll: Math.round(depths.reduce((a, b) => a + b, 0) / depths.length),
        count: depths.length,
      }))
      .sort((a, b) => {
        const numA = parseInt(a.step.replace("step-", ""));
        const numB = parseInt(b.step.replace("step-", ""));
        return numA - numB;
      });

    setScrollData(result);
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [fetch]);

  if (scrollData.length === 0) return null;

  const maxScroll = Math.max(...scrollData.map(s => s.avgScroll), 1);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">Scroll Heatmap</h3>
          <p className="text-[10px] text-[#666]">Profundidade média de scroll por etapa</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {scrollData.map((s) => {
          const pct = Math.min((s.avgScroll / maxScroll) * 100, 100);
          const heat = s.avgScroll >= 80 ? "bg-emerald-500" : s.avgScroll >= 50 ? "bg-amber-500" : "bg-red-500";
          return (
            <div key={s.step} className="flex items-center gap-2 text-[10px]">
              <span className="text-[#888] w-16 truncate font-medium">{s.label}</span>
              <div className="flex-1 h-3 bg-[#0d0d0d] rounded-full overflow-hidden relative">
                <div className={cn("h-full rounded-full transition-all duration-500", heat)}
                  style={{ width: `${pct}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/70 font-bold tabular-nums">
                  {s.avgScroll}%
                </span>
              </div>
              <span className="text-[#555] w-8 text-right tabular-nums">{s.count}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 text-[9px] text-[#666]">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> ≥80%</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> 50-79%</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> &lt;50%</div>
      </div>
    </div>
  );
}
