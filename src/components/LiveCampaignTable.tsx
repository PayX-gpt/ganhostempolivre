import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { BarChart3, RefreshCw, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { deriveCampaignLabel } from "./CampaignFilter";

interface CampaignRow {
  campaign: string;
  leads: number;
  checkouts: number;
  sales: number;
  revenue: number;
  refunds: number;
  convRate: number;
}

// Paginated fetch
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

export default function LiveCampaignTable() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [adSpend, setAdSpend] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [attributions, purchases, checkoutEvents] = await Promise.all([
      fetchAllRows("session_attribution", "session_id, utm_campaign, utm_source, ttclid, fbclid, referrer", (q: any) => q.gte("created_at", todayISO)),
      fetchAllRows("purchase_tracking", "session_id, amount, status, email", (q: any) => q.gte("created_at", todayISO)),
      fetchAllRows("funnel_events", "session_id", (q: any) => q.in("event_name", ["checkout_click", "capi_ic_sent"]).gte("created_at", todayISO)),
    ]);

    const sessionToCampaign: Record<string, string> = {};
    const campaignLeads: Record<string, Set<string>> = {};
    attributions.forEach((a: any) => {
      const camp = deriveCampaignLabel(a);
      sessionToCampaign[a.session_id] = camp;
      if (!campaignLeads[camp]) campaignLeads[camp] = new Set();
      campaignLeads[camp].add(a.session_id);
    });

    const campaignCheckouts: Record<string, Set<string>> = {};
    checkoutEvents.forEach((e: any) => {
      const camp = sessionToCampaign[e.session_id] || "Direto";
      if (!campaignCheckouts[camp]) campaignCheckouts[camp] = new Set();
      campaignCheckouts[camp].add(e.session_id);
    });

    const campaignSales: Record<string, { sales: number; revenue: number; refunds: number }> = {};
    purchases.forEach((p: any) => {
      const camp = sessionToCampaign[p.session_id || ""] || "Direto";
      if (!campaignSales[camp]) campaignSales[camp] = { sales: 0, revenue: 0, refunds: 0 };
      if (["approved", "completed", "purchased", "redirected"].includes(p.status)) {
        campaignSales[camp].sales++;
        campaignSales[camp].revenue += Number(p.amount) || 0;
      }
      if (p.status === "refunded" || p.status === "canceled") {
        campaignSales[camp].refunds++;
      }
    });

    const allCamps = new Set([...Object.keys(campaignLeads), ...Object.keys(campaignSales)]);
    const rows: CampaignRow[] = Array.from(allCamps).map(camp => {
      const leads = campaignLeads[camp]?.size || 0;
      const checkouts = campaignCheckouts[camp]?.size || 0;
      const s = campaignSales[camp] || { sales: 0, revenue: 0, refunds: 0 };
      return {
        campaign: camp,
        leads,
        checkouts,
        sales: s.sales,
        revenue: s.revenue,
        refunds: s.refunds,
        convRate: leads > 0 ? (s.sales / leads) * 100 : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    setCampaigns(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSpendChange = (camp: string, value: string) => {
    setAdSpend(prev => ({ ...prev, [camp]: Number(value) || 0 }));
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm">Campanhas — Comparativo</h3>
          <p className="text-[10px] text-[#666]">{campaigns.length} campanhas hoje</p>
        </div>
        <button onClick={fetchData} className="w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a]">
          <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left py-2 px-2 text-[#888] font-medium">Campanha</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">Leads</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">CK</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">Vendas</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">Conv%</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">Receita</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">Reemb.</th>
              <th className="text-center py-2 px-1 text-[#888] font-medium">Gasto</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">CPL</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">CPA</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">ROI</th>
              <th className="text-right py-2 px-1 text-[#888] font-medium">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const spend = adSpend[c.campaign] || 0;
              const cpl = spend > 0 && c.leads > 0 ? (spend / c.leads) : null;
              const cpa = spend > 0 && c.sales > 0 ? (spend / c.sales) : null;
              const roi = spend > 0 ? ((c.revenue - spend) / spend) * 100 : null;
              const roas = spend > 0 ? (c.revenue / spend) : null;
              const refundRate = c.sales > 0 ? (c.refunds / (c.sales + c.refunds)) * 100 : 0;
              const isTop = i < 3 && campaigns.length > 3;
              const isBottom = i >= campaigns.length - 3 && campaigns.length > 6;

              return (
                <tr key={c.campaign} className={cn(
                  "border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50",
                  isTop && "bg-emerald-500/5",
                  isBottom && "bg-red-500/5",
                )}>
                  <td className="py-1.5 px-2 text-white font-medium max-w-[140px] truncate">{c.campaign}</td>
                  <td className="py-1.5 px-1 text-right text-white tabular-nums">{c.leads}</td>
                  <td className="py-1.5 px-1 text-right text-amber-400 tabular-nums">{c.checkouts}</td>
                  <td className="py-1.5 px-1 text-right text-emerald-400 tabular-nums font-bold">{c.sales}</td>
                  <td className="py-1.5 px-1 text-right text-white tabular-nums">{c.convRate.toFixed(1)}%</td>
                  <td className="py-1.5 px-1 text-right text-emerald-400 tabular-nums font-bold">R${c.revenue.toFixed(0)}</td>
                  <td className={cn("py-1.5 px-1 text-right tabular-nums", refundRate > 10 ? "text-red-400 font-bold" : "text-[#888]")}>
                    {c.refunds}{refundRate > 0 ? ` (${refundRate.toFixed(0)}%)` : ""}
                  </td>
                  <td className="py-1.5 px-1">
                    <Input
                      type="number"
                      placeholder="R$"
                      value={spend || ""}
                      onChange={(e) => handleSpendChange(c.campaign, e.target.value)}
                      className="h-5 w-16 text-[9px] bg-[#0d0d0d] border-[#2a2a2a] text-white rounded px-1 text-right"
                    />
                  </td>
                  <td className="py-1.5 px-1 text-right text-[#888] tabular-nums">{cpl ? `R$${cpl.toFixed(0)}` : "—"}</td>
                  <td className="py-1.5 px-1 text-right text-[#888] tabular-nums">{cpa ? `R$${cpa.toFixed(0)}` : "—"}</td>
                  <td className={cn("py-1.5 px-1 text-right tabular-nums font-bold",
                    roi !== null ? (roi > 0 ? "text-emerald-400" : "text-red-400") : "text-[#888]"
                  )}>{roi !== null ? `${roi.toFixed(0)}%` : "—"}</td>
                  <td className="py-1.5 px-1 text-right text-[#888] tabular-nums">{roas ? `${roas.toFixed(1)}x` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
