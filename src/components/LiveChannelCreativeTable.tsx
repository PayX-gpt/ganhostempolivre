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

export default function LiveChannelCreativeTable() {
  const [channelRows, setChannelRows] = useState<RowData[]>([]);
  const [creativeRows, setCreativeRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_creative_stats_today" as any);
      if (error || !data) {
        console.warn("[CreativeTable] RPC error:", error);
        setLoading(false);
        return;
      }

      const rows = data as any[];
      const channels: RowData[] = [];
      const creatives: RowData[] = [];

      rows.forEach((r: any) => {
        const row: RowData = {
          name: r.channel || r.creative || "—",
          leads: Number(r.leads) || 0,
          checkouts: Number(r.checkouts) || 0,
          sales: Number(r.sales) || 0,
          revenue: Number(r.revenue) || 0,
          convRate: Number(r.conv_rate) || 0,
        };
        if (r.channel && r.channel !== "") {
          channels.push(row);
        } else if (r.creative && r.creative !== "") {
          creatives.push(row);
        }
      });

      setChannelRows(channels.sort((a, b) => b.revenue - a.revenue));
      setCreativeRows(creatives.sort((a, b) => b.revenue - a.revenue));
    } catch (err) {
      console.warn("[CreativeTable] fetch error:", err);
    }
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
