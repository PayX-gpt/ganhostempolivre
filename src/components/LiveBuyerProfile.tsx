import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Smartphone, Timer, CreditCard, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSummary {
  buyer_hours: { hour: number; count: number }[];
  buyer_devices: { device: string; count: number }[];
  front_ticket_avg: number;
  front_sales: number;
  front_revenue: number;
}

export default function LiveBuyerProfile() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result } = await supabase.rpc("get_dashboard_summary_today" as any);
      if (result) setData(result as any);
    } catch (e) {
      console.error("Buyer profile error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const peakHour = data?.buyer_hours?.[0];
  const peakHourLabel = peakHour ? `${peakHour.hour}h-${peakHour.hour + 1}h` : "—";

  const topDevice = data?.buyer_devices?.[0];
  const totalDevices = (data?.buyer_devices || []).reduce((s, d) => s + d.count, 0);
  const devicePct = topDevice && totalDevices > 0 ? ((topDevice.count / totalDevices) * 100).toFixed(0) : "0";
  const deviceLabel = topDevice ? `${topDevice.device} ${devicePct}%` : "—";

  const ticketAvg = data?.front_ticket_avg ? `R$ ${Number(data.front_ticket_avg).toFixed(2)}` : "—";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Perfil do Comprador</h3>
        <button onClick={fetchData} className="ml-auto w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a]">
          <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ProfileMini icon={Clock} label="Horario pico" value={peakHourLabel} />
        <ProfileMini icon={Smartphone} label="Dispositivo top" value={deviceLabel} />
        <ProfileMini icon={Timer} label="Vendas front" value={data?.front_sales?.toString() || "0"} />
        <ProfileMini icon={CreditCard} label="Ticket medio (front)" value={ticketAvg} />
      </div>
    </div>
  );
}

function ProfileMini({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        <span className="text-[10px] text-[#888] font-normal">{label}</span>
      </div>
      <p className="text-sm font-bold text-white tabular-nums truncate">{value}</p>
    </div>
  );
}
