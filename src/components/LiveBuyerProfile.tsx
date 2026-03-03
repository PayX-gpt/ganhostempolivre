import { UserCheck, Clock, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSummary {
  front_sales?: number;
  front_revenue?: number;
  upsell_sales?: number;
  upsell_revenue?: number;
  total_revenue?: number;
  total_ticket_avg?: number;
  front_ticket_avg?: number;
  buyer_age?: { age: string; count: number }[];
  buyer_hours?: { hour: number; count: number }[];
  buyer_devices?: { device: string; count: number }[];
  ab_sales?: { variant: string; front_sales: number; front_revenue: number }[];
}

const AGE_LABELS: Record<string, string> = {
  "18-25": "18-25 anos",
  "26-35": "26-35 anos",
  "36-45": "36-45 anos",
  "46-55": "46-55 anos",
  "56-plus": "56+ anos",
  "unknown": "Não informado",
};

export default function LiveBuyerProfile({ summary, totalVisits }: { summary?: DashboardSummary | null; totalVisits?: number }) {
  if (!summary) return null;

  const frontSales = summary.front_sales || 0;
  const upsellSales = summary.upsell_sales || 0;
  if (frontSales === 0) return null;

  const ages = (summary.buyer_age || []).filter(a => a.age !== 'unknown');
  const totalAged = ages.reduce((s, a) => s + a.count, 0);
  const topAge = ages.length > 0 ? ages[0] : null;
  
  const hours = summary.buyer_hours || [];
  const devices = summary.buyer_devices || [];
  const totalDeviced = devices.reduce((s, d) => s + d.count, 0);

  const abSales = (summary.ab_sales || []).filter(a => a.variant !== 'sem_variante');
  const topAB = abSales.length > 0 ? abSales.reduce((best, a) => a.front_sales > best.front_sales ? a : best) : null;

  const takeRate = frontSales > 0 ? ((upsellSales / frontSales) * 100).toFixed(0) : '0';

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <UserCheck className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Perfil do Comprador</h3>
        <span className="text-[10px] text-[#666] ml-auto">baseado em {frontSales} vendas front</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Age */}
        <div className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-3">
          <p className="text-[10px] text-[#888] mb-2">Faixa Etária</p>
          <div className="space-y-1.5">
            {ages.slice(0, 4).map((a) => {
              const pct = totalAged > 0 ? ((a.count / totalAged) * 100).toFixed(0) : '0';
              return (
                <div key={a.age} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white">{AGE_LABELS[a.age] || a.age}</span>
                    <span className="text-emerald-400 font-bold tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak hours */}
        <div className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-3">
          <p className="text-[10px] text-[#888] mb-2">Horários de Pico</p>
          <div className="space-y-2">
            {hours.map((h) => (
              <div key={h.hour} className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="text-xs text-white">{String(h.hour).padStart(2, '0')}h</span>
                <span className="text-xs text-emerald-400 font-bold tabular-nums ml-auto">{h.count} vendas</span>
              </div>
            ))}
            {hours.length === 0 && <p className="text-[10px] text-[#666]">Sem dados</p>}
          </div>
        </div>

        {/* Devices */}
        <div className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-3">
          <p className="text-[10px] text-[#888] mb-2">Dispositivo</p>
          <div className="space-y-2">
            {devices.filter(d => d.device !== 'unknown').slice(0, 4).map((d) => {
              const pct = totalDeviced > 0 ? ((d.count / totalDeviced) * 100).toFixed(0) : '0';
              return (
                <div key={d.device} className="flex items-center gap-2">
                  <Smartphone className="w-3 h-3 text-sky-400 flex-shrink-0" />
                  <span className="text-xs text-white capitalize">{d.device}</span>
                  <span className="text-xs text-sky-400 font-bold tabular-nums ml-auto">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key stats */}
        <div className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-3">
          <p className="text-[10px] text-[#888] mb-2">Resumo</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#888]">Ticket Front</span>
              <span className="text-white font-bold tabular-nums">R$ {(summary.front_ticket_avg || 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Ticket c/ Upsell</span>
              <span className="text-violet-400 font-bold tabular-nums">R$ {(summary.total_ticket_avg || 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Take Rate Upsell</span>
              <span className="text-amber-400 font-bold tabular-nums">{takeRate}%</span>
            </div>
            {topAB && (
              <div className="flex justify-between">
                <span className="text-[#888]">Top A/B</span>
                <span className="text-emerald-400 font-bold">Variante {topAB.variant}</span>
              </div>
            )}
            {topAge && (
              <div className="flex justify-between">
                <span className="text-[#888]">Top Faixa</span>
                <span className="text-emerald-400 font-bold">{AGE_LABELS[topAge.age] || topAge.age}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
