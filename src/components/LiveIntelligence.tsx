import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Target, AlertTriangle, Sparkles, RefreshCw, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

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
  buyer: "#22c55e",
  hot: "#f59e0b",
  warm: "#3b82f6",
  cold: "#6b7280",
};

const PIE_COLORS = ["#6b7280", "#3b82f6", "#f59e0b", "#22c55e"];

const LiveIntelligence = () => {
  const [leads, setLeads] = useState<LeadBehaviorRow[]>([]);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("lead_behavior")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);
    setLeads((data as LeadBehaviorRow[]) || []);
    setLoading(false);
  }, []);

  // Score unscored leads
  const triggerScoring = useCallback(async () => {
    try {
      await supabase.functions.invoke("analyze-leads", {
        body: { action: "score" },
      });
      fetchLeads();
    } catch (e) {
      console.warn("Scoring failed:", e);
    }
  }, [fetchLeads]);

  // Get AI insights
  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-leads", {
        body: { action: "insights" },
      });
      if (error) throw error;
      setAiInsights(data?.insights || "");
      setStats(data?.stats || null);
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("lead-behavior-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_behavior" }, () => {
        fetchLeads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  // Computed stats
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

  // Segment analysis
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

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" /> INTELIGÊNCIA COMPORTAMENTAL
          <Badge variant="secondary" className="text-[10px]">{totalLeads} leads</Badge>
        </h2>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={fetchInsights} disabled={insightsLoading} className="h-7 text-xs gap-1">
            <Sparkles className="w-3 h-3" />
            {insightsLoading ? "Analisando..." : "IA Insights"}
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchLeads} className="h-7 w-7 p-0">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: "Score Médio", value: `${avgScore}/100`, icon: <Target className="w-3.5 h-3.5" />, accent: true },
          { label: "Taxa Checkout", value: `${checkoutRate}%`, icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { label: "Scroll Médio", value: `${avgScroll}%`, icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { label: "Tempo Médio", value: `${avgTimeMin}min`, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          { label: "Hesitações", value: totalLeads > 0 ? (leads.reduce((a, l) => a + (l.cta_hesitation_count || 0), 0) / totalLeads).toFixed(1) : "0", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ].map((s, i) => (
          <div key={i} className={cn("rounded-xl border p-3 flex flex-col gap-1", s.accent ? "border-primary/40 bg-primary/5" : "border-border bg-card")}>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {s.icon}
              <span className="text-[10px] font-medium uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={cn("text-lg font-bold tabular-nums", s.accent ? "text-primary" : "text-foreground")}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Score Distribution + Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Pie chart */}
        <div className="rounded-xl border border-border bg-card p-3">
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-primary" /> Distribuição de Intenção
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={scoreDist} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
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
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Segmentation table */}
        <div className="rounded-xl border border-border bg-card p-3">
          <h3 className="text-xs font-semibold mb-2">Conversão por Segmento</h3>
          <div className="space-y-3">
            {[
              { label: "Por Faixa Etária", data: segmentConversion("age") },
              { label: "Por Obstáculo", data: segmentConversion("obstacle") },
              { label: "Por Saldo", data: segmentConversion("accountBalance") },
            ].map((seg, si) => (
              <div key={si}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{seg.label}</p>
                <div className="space-y-0.5">
                  {seg.data.slice(0, 4).map((row, ri) => (
                    <div key={ri} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-20 truncate">{row.name}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(parseFloat(row.rate), 100)}%` }} />
                      </div>
                      <span className="text-foreground font-bold tabular-nums w-10 text-right">{row.rate}%</span>
                      <span className="text-muted-foreground/50 tabular-nums w-6 text-right">{row.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="rounded-xl border border-border bg-card p-3">
        <h3 className="text-xs font-semibold mb-2">Leads Recentes na Oferta</h3>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-1.5 px-2">Lead</th>
                <th className="text-left py-1.5 px-2">Score</th>
                <th className="text-right py-1.5 px-2">Scroll</th>
                <th className="text-right py-1.5 px-2">Tempo</th>
                <th className="text-right py-1.5 px-2">CTAs</th>
                <th className="text-center py-1.5 px-2">Checkout</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 30).map((lead) => (
                <tr key={lead.id} className="border-b border-border/20 hover:bg-muted/10">
                  <td className="py-1.5 px-2 font-mono text-muted-foreground">{lead.session_id.slice(-6)}</td>
                  <td className="py-1.5 px-2">
                    {lead.intent_score != null ? (
                      <span className="font-bold" style={{ color: INTENT_COLORS[lead.intent_label || "cold"] }}>
                        {lead.intent_score} <span className="text-[9px] font-normal">({lead.intent_label})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{lead.max_scroll_depth}%</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{Math.round((lead.time_on_page_ms || 0) / 1000)}s</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">
                    {lead.cta_views}/{lead.cta_clicks}
                    {(lead.cta_hesitation_count || 0) > 0 && (
                      <span className="text-yellow-400 ml-0.5">⚠{lead.cta_hesitation_count}</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {lead.checkout_clicked ? (
                      <Badge variant="default" className="text-[9px] px-1.5 py-0">✓ {lead.checkout_click_count}x</Badge>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Sem dados de comportamento ainda</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary">Insights da IA</h3>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
            {aiInsights}
          </div>
        </div>
      )}
    </section>
  );
};

export default LiveIntelligence;
