import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Target, AlertTriangle, Sparkles, RefreshCw, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface LeadBehaviorRow {
  id: string;
  session_id: string;
  created_at: string;
  quiz_answers: Record<string, string> | null;
  time_on_page_ms: number;
  max_scroll_depth: number;
  sections_viewed: string[] | null;
  section_times: Record<string, number> | null;
  cta_views: number;
  cta_clicks: number;
  cta_hesitation_count: number;
  video_started: boolean;
  video_watch_time_ms: number;
  faq_opened: string[] | null;
  checkout_clicked: boolean;
  checkout_click_count: number;
  intent_score: number | null;
  intent_label: string | null;
  ai_insights: string | null;
  segment_tags: string[] | null;
  dynamic_price: number | null;
  account_balance: string | null;
}

const INTENT_COLORS: Record<string, string> = {
  buyer: "#22c55e", hot: "#f59e0b", warm: "#3b82f6", cold: "#6b7280",
};
const PIE_COLORS = ["#6b7280", "#3b82f6", "#f59e0b", "#22c55e"];

const LiveIntelligence = () => {
  const [leads, setLeads] = useState<LeadBehaviorRow[]>([]);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from("lead_behavior").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(200);
    setLeads((data as LeadBehaviorRow[]) || []);
    setLoading(false);
  }, []);

  const triggerScoring = useCallback(async () => {
    try {
      await supabase.functions.invoke("analyze-leads", { body: { action: "score" } });
      fetchLeads();
    } catch (e) { console.warn("Scoring failed:", e); }
  }, [fetchLeads]);

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-leads", { body: { action: "insights" } });
      if (error) throw error;
      setAiInsights(data?.insights || "");
    } catch (e) {
      console.warn("Insights failed:", e);
      setAiInsights("Erro ao gerar insights. Tente novamente.");
    }
    setInsightsLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
    triggerScoring();
    const interval = setInterval(() => { fetchLeads(); triggerScoring(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads, triggerScoring]);

  useEffect(() => {
    const channel = supabase.channel("lead-behavior-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_behavior" }, () => { fetchLeads(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const totalLeads = leads.length;
  const scoredLeads = leads.filter(l => l.intent_score != null);
  const avgScore = scoredLeads.length > 0 ? Math.round(scoredLeads.reduce((a, l) => a + (l.intent_score || 0), 0) / scoredLeads.length) : 0;
  const checkoutRate = totalLeads > 0 ? ((leads.filter(l => l.checkout_clicked).length / totalLeads) * 100).toFixed(1) : "0";
  const avgScroll = totalLeads > 0 ? Math.round(leads.reduce((a, l) => a + (l.max_scroll_depth || 0), 0) / totalLeads) : 0;
  const avgTimeMin = totalLeads > 0 ? (leads.reduce((a, l) => a + (l.time_on_page_ms || 0), 0) / totalLeads / 60000).toFixed(1) : "0";

  const scoreDist = [
    { name: "Cold", value: scoredLeads.filter(l => (l.intent_score || 0) < 35).length },
    { name: "Warm", value: scoredLeads.filter(l => (l.intent_score || 0) >= 35 && (l.intent_score || 0) < 60).length },
    { name: "Hot", value: scoredLeads.filter(l => (l.intent_score || 0) >= 60 && (l.intent_score || 0) < 80).length },
    { name: "Buyer", value: scoredLeads.filter(l => (l.intent_score || 0) >= 80).length },
  ];

  const segmentConversion = (key: string) => {
    const groups: Record<string, { total: number; checkout: number }> = {};
    leads.forEach(l => {
      const val = (l.quiz_answers as any)?.[key] || "—";
      if (!groups[val]) groups[val] = { total: 0, checkout: 0 };
      groups[val].total++;
      if (l.checkout_clicked) groups[val].checkout++;
    });
    return Object.entries(groups)
      .map(([name, { total, checkout }]) => ({ name, total, checkout, rate: total > 0 ? ((checkout / total) * 100).toFixed(1) : "0" }))
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
  };

  const tooltipStyle = { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", color: "#e2e8f0", fontSize: "12px", padding: "8px 12px" };

  const avgHesitations = totalLeads > 0 ? (leads.reduce((a, l) => a + (l.cta_hesitation_count || 0), 0) / totalLeads).toFixed(1) : "0";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex-shrink-0">
          <Brain className="w-4 h-4 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">Inteligência Comportamental</h3>
          <p className="text-[10px] text-[#666]">{totalLeads} leads (24h)</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <Button size="sm" onClick={fetchInsights} disabled={insightsLoading}
            className="h-7 text-[10px] gap-1 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 px-2">
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">{insightsLoading ? "..." : "IA"}</span>
          </Button>
          <button onClick={fetchLeads}
            className="w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors flex-shrink-0">
            <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ROW 1: Scroll horizontal - Stats + Distribuição + AI Insights */}
      <div className="overflow-x-auto -mx-5 px-5 pb-3" style={{ maxWidth: 'calc(100% + 2.5rem)' }}>
        <div className="flex gap-3 w-max">
          {/* Stats Cards */}
          {[
            { label: "Score Médio", value: `${avgScore}/100`, icon: <Target className="w-4 h-4" />, accent: true },
            { label: "Taxa Checkout", value: `${checkoutRate}%`, icon: <TrendingUp className="w-4 h-4" /> },
            { label: "Scroll Médio", value: `${avgScroll}%`, icon: <BarChart3 className="w-4 h-4" /> },
            { label: "Tempo Médio", value: `${avgTimeMin}min`, icon: <AlertTriangle className="w-4 h-4" /> },
            { label: "Hesitações", value: avgHesitations, icon: <AlertTriangle className="w-4 h-4" /> },
          ].map((s, i) => (
            <div key={i} className={cn(
              "rounded-xl border p-3 flex flex-col gap-1.5 min-w-[140px] w-[140px] flex-shrink-0",
              s.accent ? "border-emerald-500/30 bg-emerald-500/5" : "border-[#2a2a2a] bg-[#0d0d0d]"
            )}>
              <div className="flex items-center gap-1.5 text-[#888]">
                {s.icon}
                <span className="text-[10px] font-medium uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={cn("text-lg font-bold tabular-nums", s.accent ? "text-emerald-400" : "text-white")}>{s.value}</p>
            </div>
          ))}

          {/* Distribuição de Intenção */}
          <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3 min-w-[280px] w-[280px] flex-shrink-0">
            <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> Distribuição de Intenção
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={scoreDist} dataKey="value" cx="50%" cy="50%" outerRadius={40} innerRadius={24}>
                      {scoreDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {scoreDist.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-[#888]">{d.name}</span>
                    <span className="font-bold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights inline */}
          {aiInsights && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 min-w-[280px] w-[280px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Insights da IA</h4>
              </div>
              <div className="text-[11px] text-[#ccc] leading-relaxed max-h-20 overflow-y-auto whitespace-pre-wrap">{aiInsights}</div>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: Scroll horizontal - Segmentação */}
      <div className="overflow-x-auto -mx-5 px-5 pb-3" style={{ maxWidth: 'calc(100% + 2.5rem)' }}>
        <div className="flex gap-3 w-max">
          {[
            { label: "Por Faixa Etária", data: segmentConversion("age") },
            { label: "Por Obstáculo", data: segmentConversion("obstacle") },
            { label: "Por Saldo", data: segmentConversion("accountBalance") },
          ].map((seg, si) => (
            <div key={si} className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3 min-w-[240px] w-[240px] flex-shrink-0">
              <p className="text-[10px] text-[#888] uppercase tracking-wider mb-2 font-medium">{seg.label}</p>
              <div className="space-y-1.5">
                {seg.data.slice(0, 4).map((row, ri) => (
                  <div key={ri} className="flex items-center gap-2 text-xs">
                    <span className="text-[#888] w-16 truncate">{row.name}</span>
                    <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(parseFloat(row.rate), 100)}%` }} />
                    </div>
                    <span className="text-white font-bold tabular-nums w-10 text-right">{row.rate}%</span>
                    <span className="text-[#555] tabular-nums w-4 text-right">{row.total}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Leads table inline como card scrollável */}
          <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3 min-w-[480px] w-[480px] flex-shrink-0">
            <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2">Leads Recentes</h4>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[#2a2a2a] text-[#666]">
                    <th className="text-left py-1.5 px-2">Lead</th>
                    <th className="text-left py-1.5 px-2">Score</th>
                    <th className="text-right py-1.5 px-2">Scroll</th>
                    <th className="text-right py-1.5 px-2">Tempo</th>
                    <th className="text-center py-1.5 px-2">CK</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 15).map((lead) => (
                    <tr key={lead.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-1.5 px-2 font-mono text-[#888]">{lead.session_id.slice(-5)}</td>
                      <td className="py-1.5 px-2">
                        {lead.intent_score != null ? (
                          <span className="font-bold" style={{ color: INTENT_COLORS[lead.intent_label || "cold"] }}>
                            {lead.intent_score}
                          </span>
                        ) : <span className="text-[#333]">—</span>}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-white">{lead.max_scroll_depth}%</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-white">{Math.round((lead.time_on_page_ms || 0) / 1000)}s</td>
                      <td className="py-1.5 px-2 text-center">
                        {lead.checkout_clicked ? (
                          <span className="text-emerald-400">✓</span>
                        ) : <span className="text-[#333]">—</span>}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-center text-[#666] text-[10px]">Sem dados ainda</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveIntelligence;
