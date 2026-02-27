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
      .select("utm_campaign")
      .gte("created_at", todayStart.toISOString());
    
    const campaignSet = new Set<string>();
    (data || []).forEach(a => {
      const camp = a.utm_campaign ? cleanCampaignName(a.utm_campaign) : "Direto";
      campaignSet.add(camp);
    });
    campaignSet.add("Direto");
    setAllCampaigns(Array.from(campaignSet).sort());
  }, []);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 60000);
    return () => clearInterval(interval);
  }, [fetchCampaigns]);

  const displayCampaigns = useMemo(() => {
    const set = new Set(allCampaigns);
    set.add("Direto");
    return Array.from(set).sort();
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

export { CAMPAIGN_COLORS, cleanCampaignName };
