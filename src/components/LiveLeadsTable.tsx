import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, RefreshCw, Search, Download, ChevronDown, ChevronUp,
  Eye, MousePointerClick, CheckCircle2, Calendar, Filter,
  ChevronLeft, ChevronRight
} from "lucide-react";
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

const QUIZ_KEYS = [
  { key: "age", label: "Idade" },
  { key: "name", label: "Nome" },
  { key: "triedOnline", label: "Tentou Online" },
  { key: "incomeGoal", label: "Meta Renda" },
  { key: "obstacle", label: "Obstáculo" },
  { key: "financialDream", label: "Sonho" },
  { key: "accountBalance", label: "Saldo" },
  { key: "device", label: "Dispositivo" },
  { key: "availability", label: "Disponibilidade" },
  { key: "contactMethod", label: "Contato" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
];

type DatePreset = "today" | "yesterday" | "7d" | "custom";

function getDateRange(preset: DatePreset, customStart?: string, customEnd?: string) {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  
  switch (preset) {
    case "today":
      return { start: todayStart.toISOString(), end: now.toISOString() };
    case "yesterday": {
      const yStart = new Date(todayStart); yStart.setDate(yStart.getDate() - 1);
      return { start: yStart.toISOString(), end: todayStart.toISOString() };
    }
    case "7d": {
      const s = new Date(todayStart); s.setDate(s.getDate() - 7);
      return { start: s.toISOString(), end: now.toISOString() };
    }
    case "custom":
      return {
        start: customStart ? new Date(customStart).toISOString() : new Date(Date.now() - 7 * 86400000).toISOString(),
        end: customEnd ? new Date(customEnd + "T23:59:59").toISOString() : now.toISOString(),
      };
  }
}

const formatTime = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s > 60 ? `${(s / 60).toFixed(1)}min` : `${s}s`;
};

const LiveLeadsTable = ({ onLeadClick }: { onLeadClick?: (sessionId: string) => void }) => {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange(datePreset, customStart, customEnd);
    const { data } = await supabase
      .from("lead_behavior")
      .select("*")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false })
      .limit(500);
    setLeads((data as LeadRow[]) || []);
    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const filtered = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter(l => {
      const answers = l.quiz_answers || {};
      return l.session_id.toLowerCase().includes(q) ||
        Object.values(answers).some(v => v?.toLowerCase().includes(q)) ||
        (l.account_balance || "").toLowerCase().includes(q) ||
        (l.intent_label || "").toLowerCase().includes(q);
    });
  }, [leads, search]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, datePreset, customStart, customEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, PAGE_SIZE]);

  // KPIs
  const totalLeads = filtered.length;
  const checkoutLeads = filtered.filter(l => l.checkout_clicked).length;
  const qualifiedLeads = filtered.filter(l => (l.intent_score || 0) >= 50).length;
  const interactionRate = totalLeads > 0
    ? ((filtered.filter(l => l.cta_clicks > 0).length / totalLeads) * 100).toFixed(1)
    : "0";

  const exportCSV = useCallback(() => {
    const headers = [
      "ID Lead", "Data", "Score", "Intenção",
      ...QUIZ_KEYS.map(k => k.label),
      "Scroll %", "Tempo", "CTA Views", "CTA Clicks", "Hesitações",
      "Checkout", "Checkout Clicks", "Vídeo Iniciou", "Vídeo Tempo",
      "Saldo", "Seções Vistas"
    ];

    const rows = filtered.map(l => {
      const a = l.quiz_answers || {};
      return [
        l.session_id.slice(-8),
        new Date(l.created_at).toLocaleString("pt-BR"),
        l.intent_score ?? "",
        l.intent_label ?? "",
        ...QUIZ_KEYS.map(k => a[k.key] || ""),
        l.max_scroll_depth,
        formatTime(l.time_on_page_ms),
        l.cta_views,
        l.cta_clicks,
        l.cta_hesitation_count,
        l.checkout_clicked ? "Sim" : "Não",
        l.checkout_click_count,
        l.video_started ? "Sim" : "Não",
        formatTime(l.video_watch_time_ms),
        l.account_balance || "",
        (l.sections_viewed || []).join("; "),
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${datePreset}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filtered, datePreset]);

  const dateLabel = datePreset === "today" ? "Hoje" : datePreset === "yesterday" ? "Ontem" : datePreset === "7d" ? "7 dias" : "Personalizado";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 sm:p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex-shrink-0">
          <Users className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">Leads & Respostas</h3>
          <p className="text-[10px] text-[#666]">{totalLeads} leads · {dateLabel}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button size="sm" onClick={exportCSV}
            className="h-7 text-[10px] gap-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-2">
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <button onClick={fetchLeads}
            className="w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors flex-shrink-0">
            <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: "Visitas", value: totalLeads, icon: Eye, color: "text-sky-400" },
          { label: "Interação", value: `${interactionRate}%`, icon: MousePointerClick, color: "text-amber-400" },
          { label: "Qualificados", value: qualifiedLeads, icon: Users, color: "text-violet-400" },
          { label: "Checkout", value: checkoutLeads, icon: CheckCircle2, color: "text-emerald-400" },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] p-2.5 sm:p-3 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className={cn("w-3.5 h-3.5 flex-shrink-0", kpi.color)} />
              <span className="text-[10px] text-[#888] truncate uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white tabular-nums truncate">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        {/* Date presets */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(["today", "yesterday", "7d", "custom"] as DatePreset[]).map(p => (
            <button key={p} onClick={() => { setDatePreset(p); setShowCustom(p === "custom"); }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all",
                datePreset === p
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-[#0d0d0d] text-[#888] border border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
              )}>
              {p === "today" ? "Hoje" : p === "yesterday" ? "Ontem" : p === "7d" ? "7 dias" : "Personalizado"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#666]" />
          <Input
            placeholder="Buscar por nome, idade, sessão..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-[#666] rounded-lg text-xs h-8"
          />
        </div>
      </div>

      {/* Custom date inputs */}
      {showCustom && datePreset === "custom" && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#888] flex-shrink-0" />
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-lg text-xs px-2.5 py-1.5 outline-none focus:border-emerald-500/50" />
          </div>
          <span className="text-[#666] text-xs">até</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-lg text-xs px-2.5 py-1.5 outline-none focus:border-emerald-500/50" />
          <Button size="sm" onClick={fetchLeads}
            className="h-7 text-[10px] rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-2.5">
            <Filter className="w-3 h-3 mr-1" /> Filtrar
          </Button>
        </div>
      )}

      {/* Desktop table (hidden on small screens) */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#141414] border-b border-[#2a2a2a]">
                  <th className="text-left py-2.5 px-2 text-[#888] font-medium whitespace-nowrap">#</th>
                  <th className="text-left py-2.5 px-2 text-[#888] font-medium whitespace-nowrap">ID Lead</th>
                  <th className="text-left py-2.5 px-2 text-[#888] font-medium whitespace-nowrap">Data</th>
                  <th className="text-center py-2.5 px-2 text-[#888] font-medium whitespace-nowrap">Score</th>
                  {QUIZ_KEYS.map(k => (
                    <th key={k.key} className="text-left py-2.5 px-2 text-[#888] font-medium whitespace-nowrap">{k.label}</th>
                  ))}
                  <th className="text-right py-2.5 px-2 text-[#888] font-medium whitespace-nowrap">Scroll</th>
                  <th className="text-right py-2.5 px-2 text-[#888] font-medium whitespace-nowrap">Tempo</th>
                  <th className="text-center py-2.5 px-2 text-[#888] font-medium whitespace-nowrap">CK</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((lead, idx) => {
                  const a = lead.quiz_answers || {};
                  const globalIdx = (page - 1) * PAGE_SIZE + idx;
                  return (
                    <tr key={lead.id}
                      className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors cursor-pointer"
                      onClick={() => onLeadClick ? onLeadClick(lead.session_id) : setExpandedId(expandedId === lead.id ? null : lead.id)}>
                      <td className="py-2 px-2 text-[#555] tabular-nums">{globalIdx + 1}</td>
                      <td className="py-2 px-2">
                        <code className="text-[#aaa] font-mono text-[10px]">{lead.session_id.slice(-6)}</code>
                      </td>
                      <td className="py-2 px-2 text-[#888] whitespace-nowrap tabular-nums">
                        {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {lead.intent_score != null ? (
                          <span className="font-bold tabular-nums" style={{ color: INTENT_COLORS[lead.intent_label || "cold"] }}>
                            {lead.intent_score}
                          </span>
                        ) : <span className="text-[#333]">—</span>}
                      </td>
                      {QUIZ_KEYS.map(k => (
                        <td key={k.key} className="py-2 px-2 text-white max-w-[120px] truncate">
                          {a[k.key] || <span className="text-[#333]">—</span>}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-right text-white tabular-nums">{lead.max_scroll_depth}%</td>
                      <td className="py-2 px-2 text-right text-white tabular-nums whitespace-nowrap">{formatTime(lead.time_on_page_ms)}</td>
                      <td className="py-2 px-2 text-center">
                        {lead.checkout_clicked ? (
                          <span className="text-emerald-400">✓</span>
                        ) : <span className="text-[#333]">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={16 + QUIZ_KEYS.length} className="py-12 text-center text-[#666]">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum lead encontrado</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Mobile card list */}
      <div className="md:hidden">
        <div className="space-y-2">
            {paginated.map((lead, idx) => {
              const isExpanded = expandedId === lead.id;
              const answers = lead.quiz_answers || {};
              return (
                <div key={lead.id}
                  className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] overflow-hidden transition-all hover:border-[#3a3a3a]">
                  <button
                    onClick={() => onLeadClick ? onLeadClick(lead.session_id) : setExpandedId(isExpanded ? null : lead.id)}
                    className="w-full p-3 flex items-center gap-2 text-left">
                    {/* Score badge */}
                    <div className="flex-shrink-0">
                      {lead.intent_score != null ? (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold tabular-nums"
                          style={{
                            backgroundColor: `${INTENT_COLORS[lead.intent_label || "cold"]}15`,
                            color: INTENT_COLORS[lead.intent_label || "cold"],
                            border: `1px solid ${INTENT_COLORS[lead.intent_label || "cold"]}30`
                          }}>
                          {lead.intent_score}
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#333] text-sm">—</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] text-[#888] tabular-nums">#{(page - 1) * PAGE_SIZE + idx + 1}</span>
                        <code className="text-[10px] text-[#aaa] font-mono">{lead.session_id.slice(-6)}</code>
                        {answers.name && <span className="text-xs text-white font-medium truncate">{answers.name}</span>}
                        {lead.checkout_clicked && (
                          <Badge className="text-[8px] px-1 py-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 rounded">✓ CK</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#666]">
                        <span className="tabular-nums">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
                        <span>·</span>
                        <span className="tabular-nums">{lead.max_scroll_depth}%</span>
                        <span>·</span>
                        <span className="tabular-nums">{formatTime(lead.time_on_page_ms)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#666]" /> : <ChevronDown className="w-4 h-4 text-[#666]" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-[#1a1a1a] pt-3 space-y-3">
                      {/* Quiz Answers */}
                      <div>
                        <p className="text-[9px] text-[#666] uppercase tracking-wider mb-1.5 font-medium">Respostas do Quiz</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {QUIZ_KEYS.map(k => (
                            <div key={k.key} className="rounded-lg bg-[#1a1a1a] p-2 overflow-hidden">
                              <p className="text-[9px] text-[#666] uppercase truncate">{k.label}</p>
                              <p className="text-xs text-white font-medium truncate">{answers[k.key] || "—"}</p>
                            </div>
                          ))}
                        </div>
                      </div>

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
                            <div key={i} className="rounded-lg bg-[#1a1a1a] p-2 overflow-hidden">
                              <p className="text-[9px] text-[#666] uppercase truncate">{m.label}</p>
                              <p className="text-xs text-white font-medium truncate">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-[9px] text-[#555] tabular-nums">
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a1a] gap-2">
        <span className="text-[10px] text-[#666] tabular-nums flex-shrink-0">{filtered.length} leads</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors border",
              page <= 1 ? "border-[#1a1a1a] text-[#333] cursor-not-allowed" : "border-[#2a2a2a] text-[#888] hover:text-white hover:bg-[#1a1a1a]")}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) { pageNum = i + 1; }
              else if (page <= 3) { pageNum = i + 1; }
              else if (page >= totalPages - 2) { pageNum = totalPages - 4 + i; }
              else { pageNum = page - 2 + i; }
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={cn("w-7 h-7 rounded-lg text-[11px] font-medium tabular-nums transition-colors",
                    pageNum === page
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-[#888] hover:text-white hover:bg-[#1a1a1a]")}>
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors border",
              page >= totalPages ? "border-[#1a1a1a] text-[#333] cursor-not-allowed" : "border-[#2a2a2a] text-[#888] hover:text-white hover:bg-[#1a1a1a]")}>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-[10px] text-[#666] tabular-nums flex-shrink-0">{page}/{totalPages}</span>
      </div>
    </div>
  );
};

export default LiveLeadsTable;