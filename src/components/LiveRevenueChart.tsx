import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { RefreshCw, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HourlyData {
  hour: string;
  revenue: number;
  sales: number;
}

export default function LiveRevenueChart({ usdToBrl = 1 }: { usdToBrl?: number }) {
  const [data, setData] = useState<HourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, sales: 0 });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: salesData } = await supabase
      .from("purchase_tracking")
      .select("created_at, amount")
      .in("status", ["completed", "purchased", "approved", "redirected"])
      .gte("created_at", todayStart.toISOString());

    const hourlyMap: Record<number, { revenue: number; sales: number }> = {};
    for (let i = 0; i <= 23; i++) {
      hourlyMap[i] = { revenue: 0, sales: 0 };
    }

    let totalRevenue = 0;
    let totalSales = 0;
    
    salesData?.forEach((sale) => {
      const hour = new Date(sale.created_at).getHours();
      const amountUsd = Number(sale.amount) || 0;
      const amountBrl = amountUsd * (usdToBrl || 1);
      hourlyMap[hour].revenue += amountBrl;
      hourlyMap[hour].sales += 1;
      totalRevenue += amountBrl;
      totalSales += 1;
    });

    const chartData = Object.entries(hourlyMap).map(([hour, values]) => ({
      hour: `${hour.padStart(2, '0')}h`,
      revenue: values.revenue,
      sales: values.sales,
    }));

    setData(chartData);
    setTotals({ revenue: totalRevenue, sales: totalSales });
    setIsLoading(false);
  }, [usdToBrl]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 shadow-xl">
          <p className="text-xs text-[#888] mb-1">{label}</p>
          <p className="text-sm font-bold text-emerald-400">
            R$ {payload[0]?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#666]">{payload[1]?.value || 0} vendas</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Performance 24h</h3>
            <p className="text-xs text-[#666]">Receita e vendas por hora</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-[#888]">Receita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-xs text-[#888]">Vendas</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-[#888] hover:text-white hover:bg-white/5 rounded-lg"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-[#888] truncate">Receita 24h</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white truncate tabular-nums">
            R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="text-xs text-[#888] truncate">Vendas 24h</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{totals.sales}</p>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis 
              dataKey="hour" 
              stroke="#666" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#666" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
