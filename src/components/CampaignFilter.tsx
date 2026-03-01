import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const CAMPAIGN_COLORS = [
  "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4",
  "#ec4899", "#84cc16", "#f97316", "#6366f1", "#14b8a6",
  "#e879f9", "#fbbf24", "#22d3ee", "#a78bfa", "#fb923c",
];

const cleanCampaignName = (name: string): string => {
  if (!name) return "Direto";
  const clean = name.split("|")[0].trim();
  return clean.length > 25 ? clean.substring(0, 22) + "…" : clean;
};

/** Derive a campaign label from attribution data — only "Direto" when truly direct */
const deriveCampaignLabel = (row: {
  utm_campaign?: string | null;
  utm_source?: string | null;
  ttclid?: string | null;
  fbclid?: string | null;
}): string => {
  if (row.utm_campaign) return cleanCampaignName(row.utm_campaign);
  // Has source but no campaign name — label by source
  if (row.utm_source) {
    const src = row.utm_source.toLowerCase();
    if (src.includes("tiktok")) return "TikTok (sem campanha)";
    if (src.includes("facebook") || src.includes("fb") || src.includes("instagram") || src.includes("meta")) return "Meta (sem campanha)";
    if (src.includes("google")) return "Google (sem campanha)";
    return cleanCampaignName(row.utm_source);
  }
  // Has click IDs but no utm_source
  if (row.ttclid) return "TikTok (sem campanha)";
  if (row.fbclid) return "Meta (sem campanha)";
  return "Direto";
};

export interface CampaignFilterState {
  selectedCampaigns: Set<string>;
  allCampaigns: string[];
  campaignColors: Record<string, string>;
}

interface CampaignFilterProps {
  onChange: (state: CampaignFilterState) => void;
}

export default function CampaignFilter({ onChange }: CampaignFilterProps) {
  const [allCampaigns, setAllCampaigns] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("session_attribution")
      .select("utm_campaign, utm_source, ttclid, fbclid")
      .gte("created_at", todayStart.toISOString());
    
    const campaignSet = new Set<string>();
    (data || []).forEach((a: any) => {
      campaignSet.add(deriveCampaignLabel(a));
    });
    setAllCampaigns(Array.from(campaignSet).sort());
  }, []);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 60000);
    return () => clearInterval(interval);
  }, [fetchCampaigns]);

  const displayCampaigns = useMemo(() => {
    return Array.from(new Set(allCampaigns)).sort();
  }, [allCampaigns]);

  const campaignColors = useMemo(() => {
    const map: Record<string, string> = {};
    displayCampaigns.forEach((camp, i) => {
      map[camp] = CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length];
    });
    return map;
  }, [displayCampaigns]);

  // Notify parent on change
  useEffect(() => {
    onChange({ selectedCampaigns, allCampaigns: displayCampaigns, campaignColors });
  }, [selectedCampaigns, displayCampaigns, campaignColors, onChange]);

  const toggleCampaign = (camp: string) => {
    setSelectedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(camp)) next.delete(camp);
      else next.add(camp);
      return next;
    });
  };

  const campaignMode = selectedCampaigns.size > 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setShowFilter(!showFilter)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all",
            showFilter || campaignMode
              ? "bg-sky-500/20 border-sky-500/40 text-sky-400"
              : "bg-[#0d0d0d] border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444]"
          )}>
          <Filter className="w-3.5 h-3.5" />
          Filtrar por Campanha
          {campaignMode && (
            <span className="bg-sky-500/30 text-sky-300 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
              {selectedCampaigns.size}
            </span>
          )}
        </button>

        {campaignMode && (
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
            {Array.from(selectedCampaigns).map(camp => (
              <span key={camp} className="text-[10px] px-2 py-0.5 rounded-lg border text-white font-medium shrink-0"
                style={{ backgroundColor: campaignColors[camp] + "33", borderColor: campaignColors[camp] }}>
                {camp}
              </span>
            ))}
          </div>
        )}

        {campaignMode && (
          <button onClick={() => setSelectedCampaigns(new Set())}
            className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors shrink-0 px-2">
            Limpar
          </button>
        )}
      </div>

      {showFilter && (
        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
          <div className="flex flex-wrap gap-1.5">
            {displayCampaigns.map(camp => {
              const color = campaignColors[camp];
              const isActive = selectedCampaigns.has(camp);
              return (
                <button key={camp} onClick={() => toggleCampaign(camp)}
                  className={cn(
                    "text-[10px] px-2.5 py-1.5 rounded-lg border transition-all truncate max-w-[180px]",
                    isActive
                      ? "border-transparent text-white font-medium"
                      : "border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444]"
                  )}
                  style={isActive ? { backgroundColor: color + "33", borderColor: color } : {}}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: color }} />
                  {camp}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { CAMPAIGN_COLORS, cleanCampaignName, deriveCampaignLabel };
