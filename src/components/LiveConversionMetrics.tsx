import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Users, ShoppingCart, TrendingUp, RefreshCw } from "lucide-react";

interface MetricsData {
  totalICs: number;
  uniqueICSessions: number;
  utmifyPurchases: number;
  uniqueBuyers: number;
  conversionRate: number;
  ratio: string;
  lastUpdated: Date;
}

const LiveConversionMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const { data: icData } = await supabase
        .from("funnel_audit_logs")
        .select("session_id")
        .eq("event_type", "checkout_initiated")
        .gte("created_at", new Date().toISOString().split("T")[0]);

      const { data: purchaseData } = await supabase
        .from("purchase_tracking")
        .select("session_id")
        .eq("utmify_sent", true)
        .gte("created_at", new Date().toISOString().split("T")[0]);

      const totalICs = icData?.length || 0;
      const uniqueICSessions = new Set(icData?.map(r => r.session_id)).size;
      const utmifyPurchases = purchaseData?.length || 0;
      const uniqueBuyers = new Set(purchaseData?.map(r => r.session_id)).size;

      const conversionRate = uniqueICSessions > 0 
        ? (uniqueBuyers / uniqueICSessions) * 100 
        : 0;

      const ratio = uniqueBuyers > 0 
        ? `1:${Math.round(uniqueICSessions / uniqueBuyers)}`
        : "0:0";

      setMetrics({
        totalICs,
        uniqueICSessions,
        utmifyPurchases,
        uniqueBuyers,
        conversionRate,
        ratio,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.warn("[Metrics] Failed to fetch:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const handleTripleClick = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  if (!isVisible) {
    return (
      <div 
        className="fixed bottom-0 right-0 w-12 h-12 z-50 cursor-pointer"
        onClick={handleTripleClick}
        title="Click to show metrics"
      />
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs z-50">
        <RefreshCw className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-4 right-4 bg-black/95 text-white p-4 rounded-xl text-xs z-50 min-w-[200px] shadow-2xl border border-white/10"
      onClick={handleTripleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="font-bold text-green-400">LIVE</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); fetchMetrics(); }}
          className="text-white/60 hover:text-white"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <ShoppingCart className="w-3 h-3" />
            <span>ICs (sessões)</span>
          </div>
          <span className="font-mono font-bold text-yellow-400">
            {metrics.uniqueICSessions}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <Users className="w-3 h-3" />
            <span>Compras UTMify</span>
          </div>
          <span className="font-mono font-bold text-green-400">
            {metrics.uniqueBuyers}
          </span>
        </div>

        <div className="border-t border-white/20 my-2" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <TrendingUp className="w-3 h-3" />
            <span>Conversão</span>
          </div>
          <span className="font-mono font-bold text-cyan-400">
            {metrics.conversionRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-[10px]">📊</span>
            <span>Ratio IC:Compra</span>
          </div>
          <span className="font-mono font-bold text-purple-400">
            {metrics.ratio}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-white/40 text-center">
        Atualizado: {metrics.lastUpdated.toLocaleTimeString('pt-BR')}
      </div>
    </div>
  );
};

export default LiveConversionMetrics;
