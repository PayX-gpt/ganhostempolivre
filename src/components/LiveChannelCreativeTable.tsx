import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RowData {
  name: string;
  leads: number;
  checkouts: number;
  sales: number;
  revenue: number;
  convRate: number;
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

/** Extract creative name from utm_content or utm_campaign brackets, e.g. [CT AG] */
function extractCreative(row: { utm_content?: string | null; utm_campaign?: string | null }): string {
  // Try utm_content first
  if (row.utm_content) return row.utm_content.length > 30 ? row.utm_content.slice(0, 27) + "…" : row.utm_content;
  // Try bracket extraction from campaign
  if (row.utm_campaign) {
    const match = row.utm_campaign.match(/\[([^\]]+)\]/g);
    if (match) return match.map(m => m.replace(/[\[\]]/g, "")).join(" | ");
  }
  return "Sem criativo";
}

/** Extract placement/channel from utm_source + utm_medium */
function extractChannel(row: { utm_source?: string | null; utm_medium?: string | null }): string {
  const src = (row.utm_source || "").toLowerCase();
  const med = (row.utm_medium || "").toLowerCase();
  if (!src && !med) return "Direto";
  const parts: string[] = [];
  if (src.includes("facebook") || src.includes("fb") || src.includes("meta")) parts.push("Meta");
  else if (src.includes("tiktok")) parts.push("TikTok");
  else if (src.includes("google")) parts.push("Google");
  else if (src) parts.push(src);
  if (med && med !== "cpc" && med !== "paid") parts.push(med);
  else if (med) parts.push(med);
  return parts.join(" / ") || "Orgânico";
}

export default function LiveChannelCreativeTable() {
  const [channelRows, setChannelRows] = useState<RowData[]>([]);
  const [creativeRows, setCreativeRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [attributions, purchases, checkoutEvents] = await Promise.all([
      fetchAllRows("session_attribution", "session_id, utm_source, utm_medium, utm_content, utm_campaign", (q: any) => q.gte("created_at", todayISO)),
      fetchAllRows("purchase_tracking", "session_id, amount, status", (q: any) => q.gte("created_at", todayISO)),
      fetchAllRows("funnel_events", "session_id", (q: any) => q.in("event_name", ["checkout_click", "capi_ic_sent"]).gte("created_at", todayISO)),
    ]);

    const sessionChannel: Record<string, string> = {};
    const sessionCreative: Record<string, string> = {};
    attributions.forEach((a: any) => {
      sessionChannel[a.session_id] = extractChannel(a);
      sessionCreative[a.session_id] = extractCreative(a);
    });

    const buildRows = (sessionGroupFn: (sid: string) => string) => {
      const groups: Record<string, { leads: Set<string>; checkouts: Set<string>; sales: number; revenue: number }> = {};
      const getGroup = (g: string) => {
        if (!groups[g]) groups[g] = { leads: new Set(), checkouts: new Set(), sales: 0, revenue: 0 };
        return groups[g];
      };

      attributions.forEach((a: any) => getGroup(sessionGroupFn(a.session_id)).leads.add(a.session_id));
      checkoutEvents.forEach((e: any) => {
        const g = sessionGroupFn(e.session_id);
        getGroup(g).checkouts.add(e.session_id);
      });
      purchases.forEach((p: any) => {
        const g = sessionGroupFn(p.session_id || "");
        if (["approved", "completed", "purchased", "redirected"].includes(p.status)) {
          getGroup(g).sales++;
          getGroup(g).revenue += Number(p.amount) || 0;
        }
      });

      return Object.entries(groups).map(([name, d]) => ({
        name,
        leads: d.leads.size,
        checkouts: d.checkouts.size,
        sales: d.sales,
        revenue: d.revenue,
        convRate: d.leads.size > 0 ? (d.sales / d.leads.size) * 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);
    };

    setChannelRows(buildRows(sid => sessionChannel[sid] || "Direto"));
    setCreativeRows(buildRows(sid => sessionCreative[sid] || "Sem criativo"));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const Table = ({ rows }: { rows: RowData[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-[#2a2a2a]">
            <th className="text-left py-2 px-2 text-[#888] font-medium">Nome</th>
            <th className="text-right py-2 px-1 text-[#888]">Leads</th>
            <th className="text-right py-2 px-1 text-[#888]">CK</th>
            <th className="text-right py-2 px-1 text-[#888]">Vendas</th>
            <th className="text-right py-2 px-1 text-[#888]">Conv%</th>
            <th className="text-right py-2 px-1 text-[#888]">Receita</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} className={cn(
              "border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50",
              i < 3 && rows.length > 3 && "bg-emerald-500/5",
              i >= rows.length - 3 && rows.length > 6 && "bg-red-500/5",
            )}>
              <td className="py-1.5 px-2 text-white font-medium max-w-[180px] truncate">{r.name}</td>
              <td className="py-1.5 px-1 text-right text-white tabular-nums">{r.leads}</td>
              <td className="py-1.5 px-1 text-right text-amber-400 tabular-nums">{r.checkouts}</td>
              <td className="py-1.5 px-1 text-right text-emerald-400 tabular-nums font-bold">{r.sales}</td>
              <td className="py-1.5 px-1 text-right text-white tabular-nums">{r.convRate.toFixed(1)}%</td>
              <td className="py-1.5 px-1 text-right text-emerald-400 tabular-nums font-bold">R${r.revenue.toFixed(0)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-[#666]">Sem dados</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm">Canal & Criativo</h3>
          <p className="text-[10px] text-[#666]">Performance por posicionamento e criativo</p>
        </div>
        <button onClick={fetchData} className="w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a]">
          <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
        </button>
      </div>

      <Tabs defaultValue="channel">
        <TabsList className="bg-[#0d0d0d] border border-[#2a2a2a] p-0.5 rounded-lg mb-3">
          <TabsTrigger value="channel" className="text-[10px] data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 rounded px-3 py-1">
            Por Canal
          </TabsTrigger>
          <TabsTrigger value="creative" className="text-[10px] data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 rounded px-3 py-1">
            Por Criativo
          </TabsTrigger>
        </TabsList>
        <TabsContent value="channel"><Table rows={channelRows} /></TabsContent>
        <TabsContent value="creative"><Table rows={creativeRows} /></TabsContent>
      </Tabs>
    </div>
  );
}
