import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignRow {
  campaign: string;
  leads: number;
  checkouts: number;
  sales: number;
  revenue: number;
  refunds: number;
  convRate: number;
}

export default function LiveCampaignTable() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [adSpend, setAdSpend] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_campaign_stats_today" as any);
      if (error) throw error;
      const rows: CampaignRow[] = ((data as any[]) || []).map((r: any) => ({
        campaign: r.campaign || "Direto",
        leads: Number(r.leads) || 0,
        checkouts: Number(r.checkouts) || 0,
        sales: Number(r.sales) || 0,
        revenue: Number(r.revenue) || 0,
        refunds: Number(r.refunds) || 0,
        convRate: Number(r.conv_rate) || 0,
      })).sort((a, b) => b.revenue - a.revenue);
      setCampaigns(rows);
    } catch (e) {
      console.error("Campaign stats error:", e);
    }
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
          <p className="text-[10px] text-[#666]">{campaigns.length} campanhas hoje (via RPC)</p>
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
