import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, RefreshCw, Search, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadRow {
  id: string;
  session_id: string;
  created_at: string;
  quiz_answers: Record<string, string> | null;
  time_on_page_ms: number;
  max_scroll_depth: number;
  cta_views: number;
  cta_clicks: number;
  cta_hesitation_count: number;
  checkout_clicked: boolean;
  checkout_click_count: number;
  intent_score: number | null;
  intent_label: string | null;
  account_balance: string | null;
  sections_viewed: string[] | null;
  video_started: boolean;
  video_watch_time_ms: number;
}

const INTENT_COLORS: Record<string, string> = {
  buyer: "#22c55e", hot: "#f59e0b", warm: "#3b82f6", cold: "#6b7280",
};

const LiveLeadsTable = () => {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("lead_behavior")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100);
    setLeads((data as LeadRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const filtered = search
    ? leads.filter(l => l.session_id.toLowerCase().includes(search.toLowerCase()) ||
        (l.quiz_answers?.age || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.account_balance || "").toLowerCase().includes(search.toLowerCase()))
    : leads;

  const formatTime = (ms: number) => {
    const s = Math.round(ms / 1000);
    return s > 60 ? `${(s / 60).toFixed(1)}min` : `${s}s`;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex-shrink-0">
          <Users className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">Leads & Respostas</h3>
          <p className="text-[10px] text-[#666]">{filtered.length} leads (24h)</p>
        </div>
        <button onClick={fetchLeads}
          className="w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors flex-shrink-0">
          <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#666]" />
        <Input
          placeholder="Buscar por sessão, idade, saldo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-[#666] rounded-lg text-xs h-8"
        />
      </div>

      {/* Leads list */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          {filtered.map((lead) => {
            const isExpanded = expandedId === lead.id;
            const answers = lead.quiz_answers || {};
            return (
              <div key={lead.id}
                className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] overflow-hidden transition-all hover:border-[#3a3a3a]">
                {/* Row summary */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  className="w-full p-3 flex items-center gap-2 text-left"
                >
                  {/* Score badge */}
                  <div className="flex-shrink-0">
                    {lead.intent_score != null ? (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: `${INTENT_COLORS[lead.intent_label || "cold"]}15`,
                          color: INTENT_COLORS[lead.intent_label || "cold"],
                          border: `1px solid ${INTENT_COLORS[lead.intent_label || "cold"]}30`
                        }}>
                        {lead.intent_score}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#333] text-sm">—</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <code className="text-[10px] text-[#888] font-mono">{lead.session_id.slice(-8)}</code>
                      {lead.intent_label && (
                        <Badge className="text-[8px] px-1 py-0 rounded"
                          style={{
                            backgroundColor: `${INTENT_COLORS[lead.intent_label]}15`,
                            color: INTENT_COLORS[lead.intent_label],
                            border: `1px solid ${INTENT_COLORS[lead.intent_label]}30`
                          }}>
                          {lead.intent_label}
                        </Badge>
                      )}
                      {lead.checkout_clicked && (
                        <Badge className="text-[8px] px-1 py-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 rounded">
                          ✓ checkout
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#666]">
                      <span>{lead.max_scroll_depth}% scroll</span>
                      <span>·</span>
                      <span>{formatTime(lead.time_on_page_ms)}</span>
                      <span>·</span>
                      <span>{lead.cta_views}/{lead.cta_clicks} CTAs</span>
                    </div>
                  </div>

                  {/* Expand */}
                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#666]" /> : <ChevronDown className="w-4 h-4 text-[#666]" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-[#1a1a1a] pt-3 space-y-3">
                    {/* Quiz Answers */}
                    {Object.keys(answers).length > 0 && (
                      <div>
                        <p className="text-[9px] text-[#666] uppercase tracking-wider mb-1.5 font-medium">Respostas do Quiz</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.entries(answers).map(([key, val]) => (
                            <div key={key} className="rounded-lg bg-[#1a1a1a] p-2">
                              <p className="text-[9px] text-[#666] uppercase">{key}</p>
                              <p className="text-xs text-white font-medium truncate">{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interaction metrics */}
                    <div>
                      <p className="text-[9px] text-[#666] uppercase tracking-wider mb-1.5 font-medium">Interação</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: "Scroll", value: `${lead.max_scroll_depth}%` },
                          { label: "Tempo", value: formatTime(lead.time_on_page_ms) },
                          { label: "CTA Views", value: lead.cta_views },
                          { label: "CTA Clicks", value: lead.cta_clicks },
                          { label: "Hesitações", value: lead.cta_hesitation_count },
                          { label: "Checkout", value: lead.checkout_clicked ? `✓ ${lead.checkout_click_count}x` : "—" },
                          { label: "Vídeo", value: lead.video_started ? formatTime(lead.video_watch_time_ms) : "Não" },
                          { label: "Seções", value: lead.sections_viewed?.length || 0 },
                          { label: "Saldo", value: lead.account_balance || "—" },
                        ].map((m, i) => (
                          <div key={i} className="rounded-lg bg-[#1a1a1a] p-2">
                            <p className="text-[9px] text-[#666] uppercase">{m.label}</p>
                            <p className="text-xs text-white font-medium">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sections viewed */}
                    {lead.sections_viewed && lead.sections_viewed.length > 0 && (
                      <div>
                        <p className="text-[9px] text-[#666] uppercase tracking-wider mb-1.5 font-medium">Seções Vistas</p>
                        <div className="flex flex-wrap gap-1">
                          {lead.sections_viewed.map((s, i) => (
                            <Badge key={i} className="text-[9px] bg-[#1a1a1a] text-[#888] border-[#2a2a2a] rounded px-1.5 py-0.5">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-[9px] text-[#555]">
                      {new Date(lead.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#666]">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum lead encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LiveLeadsTable;
