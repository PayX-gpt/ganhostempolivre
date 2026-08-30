import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Globe, RefreshCw, MapPin, DollarSign, Loader2 } from "lucide-react";

interface Loc { tz: string; sales: number; revenue: number; last_sale: string | null; }
interface GeoData { period_days: number; total_sales: number; located: Loc[]; unknown_sales: number; }

const PERIODS = [{ label: "Hoje", days: 1 }, { label: "7 dias", days: 7 }, { label: "30 dias", days: 30 }];

// Fuso horário (IANA) → coordenadas aproximadas + nome amigável.
const TZ_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  "America/Sao_Paulo": { lat: -23.5, lng: -46.6, label: "São Paulo / Sudeste" },
  "America/Bahia": { lat: -12.9, lng: -38.5, label: "Bahia" },
  "America/Fortaleza": { lat: -3.7, lng: -38.5, label: "Fortaleza / NE" },
  "America/Recife": { lat: -8.0, lng: -34.9, label: "Recife" },
  "America/Maceio": { lat: -9.6, lng: -35.7, label: "Maceió" },
  "America/Belem": { lat: -1.4, lng: -48.5, label: "Belém" },
  "America/Manaus": { lat: -3.1, lng: -60.0, label: "Manaus" },
  "America/Cuiaba": { lat: -15.6, lng: -56.1, label: "Cuiabá" },
  "America/Campo_Grande": { lat: -20.4, lng: -54.6, label: "Campo Grande" },
  "America/Porto_Velho": { lat: -8.8, lng: -63.9, label: "Porto Velho" },
  "America/Boa_Vista": { lat: 2.8, lng: -60.7, label: "Boa Vista" },
  "America/Rio_Branco": { lat: -9.9, lng: -67.8, label: "Rio Branco" },
  "America/Araguaina": { lat: -7.2, lng: -48.2, label: "Araguaína" },
  "America/Santarem": { lat: -2.4, lng: -54.7, label: "Santarém" },
  "America/Noronha": { lat: -3.8, lng: -32.4, label: "F. de Noronha" },
  "Europe/Lisbon": { lat: 38.7, lng: -9.1, label: "Portugal" },
  "Europe/London": { lat: 51.5, lng: -0.1, label: "Reino Unido" },
  "Europe/Madrid": { lat: 40.4, lng: -3.7, label: "Espanha" },
  "Europe/Paris": { lat: 48.9, lng: 2.3, label: "França" },
  "Europe/Berlin": { lat: 52.5, lng: 13.4, label: "Alemanha" },
  "Europe/Rome": { lat: 41.9, lng: 12.5, label: "Itália" },
  "America/New_York": { lat: 40.7, lng: -74.0, label: "EUA (Leste)" },
  "America/Chicago": { lat: 41.9, lng: -87.6, label: "EUA (Central)" },
  "America/Los_Angeles": { lat: 34.0, lng: -118.2, label: "EUA (Oeste)" },
  "America/Buenos_Aires": { lat: -34.6, lng: -58.4, label: "Argentina" },
  "America/Argentina/Buenos_Aires": { lat: -34.6, lng: -58.4, label: "Argentina" },
  "America/Montevideo": { lat: -34.9, lng: -56.2, label: "Uruguai" },
  "America/Asuncion": { lat: -25.3, lng: -57.6, label: "Paraguai" },
  "America/Santiago": { lat: -33.4, lng: -70.6, label: "Chile" },
  "America/Bogota": { lat: 4.7, lng: -74.1, label: "Colômbia" },
  "America/Lima": { lat: -12.0, lng: -77.0, label: "Peru" },
  "America/Mexico_City": { lat: 19.4, lng: -99.1, label: "México" },
  "Africa/Luanda": { lat: -8.8, lng: 13.2, label: "Angola" },
  "Africa/Maputo": { lat: -25.9, lng: 32.6, label: "Moçambique" },
  "Asia/Tokyo": { lat: 35.7, lng: 139.7, label: "Japão" },
  "Australia/Sydney": { lat: -33.9, lng: 151.2, label: "Austrália" },
};

// Silhuetas aproximadas dos continentes (lng,lat) — projeção equirretangular.
const CONTINENTS: [number, number][][] = [
  [[-81,10],[-70,12],[-60,6],[-50,0],[-35,-5],[-38,-15],[-48,-25],[-58,-35],[-66,-45],[-73,-52],[-75,-44],[-70,-30],[-72,-18],[-78,-5],[-81,2]],
  [[-168,66],[-140,70],[-95,70],[-80,63],[-60,50],[-52,47],[-65,45],[-80,25],[-97,18],[-105,23],[-118,30],[-125,40],[-132,55],[-168,66]],
  [[-17,15],[-5,35],[10,37],[32,31],[43,12],[51,12],[41,-5],[40,-26],[20,-35],[12,-18],[8,4],[-8,5],[-17,15]],
  [[-10,36],[-5,43],[3,51],[-3,58],[10,60],[28,60],[42,55],[45,46],[28,40],[20,42],[12,45],[3,43],[-10,36]],
  [[45,46],[60,56],[90,70],[140,72],[170,66],[140,54],[135,35],[122,30],[120,22],[105,10],[95,6],[78,8],[70,25],[58,26],[45,40]],
  [[113,-22],[130,-12],[142,-11],[150,-25],[153,-32],[140,-38],[129,-32],[115,-35],[113,-22]],
];

const px = (lng: number) => lng + 180;      // 0..360
const py = (lat: number) => 90 - lat;        // 0..180
const brl = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const friendly = (tz: string) => TZ_COORDS[tz]?.label || tz.split("/").pop()?.replace(/_/g, " ") || tz;
const isRecent = (iso: string | null) => { if (!iso) return false; const t = new Date(iso).getTime(); return Number.isFinite(t) && (Date.now() - t) < 15 * 60 * 1000; };

export default function LiveSalesWorldMap() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc("get_sales_geo" as any, { p_days: d });
      if (!error && res) setData(res as any);
    } catch (e) { console.error("[SalesGeo]", e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(days); }, [days, fetchData]);
  useEffect(() => { const t = setInterval(() => fetchData(days), 60_000); return () => clearInterval(t); }, [days, fetchData]);

  const located = data?.located || [];
  const plotted = located.map(l => ({ ...l, c: TZ_COORDS[l.tz] })).filter(l => l.c);
  const maxSales = Math.max(1, ...plotted.map(l => l.sales));
  const totalLocated = plotted.reduce((s, l) => s + l.sales, 0);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 shrink-0"><Globe className="w-4 h-4 text-emerald-400" /></div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">Mapa de Vendas — Mundo</h3>
            <p className="text-[10px] text-[#666]">de onde vendem, em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#111] border border-[#2a2a2a] rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setDays(p.days)}
                className={cn("px-2.5 py-1 rounded-md text-xs", days === p.days ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-[#888] hover:text-white")}>{p.label}</button>
            ))}
          </div>
          <button onClick={() => fetchData(days)} className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
          {/* Mapa */}
          <div className="rounded-xl overflow-hidden border border-[#222] bg-[#0a1118]">
            <svg viewBox="0 0 360 180" className="w-full h-auto block" style={{ aspectRatio: "2 / 1" }}>
              <defs>
                <radialGradient id="salePulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="360" height="180" fill="#0a1118" />
              {/* graticule */}
              {[30,60,90,120,150].map(y => <line key={"h"+y} x1="0" y1={y} x2="360" y2={y} stroke="#12202b" strokeWidth="0.4" />)}
              {[60,120,180,240,300].map(x => <line key={"v"+x} x1={x} y1="0" x2={x} y2="180" stroke="#12202b" strokeWidth="0.4" />)}
              {/* continentes */}
              {CONTINENTS.map((poly, i) => (
                <polygon key={i} points={poly.map(([lng,lat]) => `${px(lng)},${py(lat)}`).join(" ")} fill="#17323a" stroke="#1f4048" strokeWidth="0.5" />
              ))}
              {/* pontos de venda */}
              {plotted.map((l, i) => {
                const cx = px(l.c!.lng), cy = py(l.c!.lat);
                const r = 1.6 + (l.sales / maxSales) * 4.5;
                const recent = isRecent(l.last_sale);
                return (
                  <g key={i}>
                    {recent && <circle cx={cx} cy={cy} r={r * 3} fill="url(#salePulse)"><animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite" /></circle>}
                    <circle cx={cx} cy={cy} r={r + 1.2} fill="#34d399" opacity="0.25" />
                    <circle cx={cx} cy={cy} r={r} fill="#10b981" stroke="#d1fae5" strokeWidth="0.4" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[#111] border border-[#2a2a2a] p-2 text-center">
                <div className="text-[9px] text-[#888]">Vendas ({data?.period_days}d)</div>
                <div className="text-lg font-black text-emerald-400 tabular-nums">{data?.total_sales ?? 0}</div>
              </div>
              <div className="rounded-lg bg-[#111] border border-[#2a2a2a] p-2 text-center">
                <div className="text-[9px] text-[#888]">Locais</div>
                <div className="text-lg font-black text-white tabular-nums">{located.length}</div>
              </div>
            </div>
            <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
              {located.length === 0 ? (
                <p className="text-[11px] text-[#666] text-center py-6">Sem vendas com localização ainda.<br /><span className="text-[10px]">Novas vendas passam a aparecer aqui.</span></p>
              ) : located.map((l, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-[#111] border border-[#222] px-2 py-1.5">
                  <MapPin className={cn("w-3 h-3 shrink-0", isRecent(l.last_sale) ? "text-emerald-400 animate-pulse" : "text-[#666]")} />
                  <span className="text-[11px] text-white font-medium truncate flex-1">{friendly(l.tz)}</span>
                  <span className="text-[11px] font-bold text-emerald-400 tabular-nums">{l.sales}</span>
                  <span className="text-[10px] text-[#888] tabular-nums flex items-center"><DollarSign className="w-2.5 h-2.5" />{Math.round(l.revenue)}</span>
                </div>
              ))}
            </div>
            {(data?.unknown_sales ?? 0) > 0 && (
              <p className="text-[10px] text-[#666] text-center">+{data?.unknown_sales} venda(s) sem localização (antes do rastreio).</p>
            )}
          </div>
        </div>
      )}
      <p className="text-[9px] text-[#555] mt-2">Localização estimada pelo fuso horário do navegador do comprador (sem IP/dados pessoais). Vendas anteriores ao rastreio aparecem como "sem localização".</p>
    </div>
  );
}
