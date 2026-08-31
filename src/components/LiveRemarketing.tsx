import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Send, MessageCircle, Mail, RefreshCw, Download, Loader2, Eye } from "lucide-react";

interface Row { channel: string; segment: string; qtd: number; }
interface Lead { contact: string; name: string | null; created_at: string; }

const SEGMENTS = [
  { key: "no_purchase", label: "Não comprou nada", color: "text-red-300", ring: "border-red-500/30", bg: "bg-red-500/5",
    intent: "Convencer a comprar — dor, prova social, link do front e gatilhos de urgência." },
  { key: "front_only", label: "Comprou o front (sem upsell)", color: "text-amber-300", ring: "border-amber-500/30", bg: "bg-amber-500/5",
    intent: "Puxar o oficial/upsell — acelerador, 'muito mais resultado', link do upsell." },
  { key: "buyer_full", label: "Comprou tudo", color: "text-emerald-300", ring: "border-emerald-500/30", bg: "bg-emerald-500/5",
    intent: "Nutrir / suporte / pedir indicação. (normalmente não recebe oferta)" },
];
const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle, color: "text-emerald-400" },
  { key: "email", label: "Email", Icon: Mail, color: "text-sky-400" },
];

export default function LiveRemarketing() {
  const [summary, setSummary] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<{ channel: string; segment: string } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [exporting, setExporting] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_remarketing_summary" as any);
    if (data) { setSummary((data as any).by || []); setTotal((data as any).total || 0); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const qtd = (channel: string, segment: string) => summary.find(r => r.channel === channel && r.segment === segment)?.qtd || 0;

  const viewLeads = async (channel: string, segment: string) => {
    setOpen({ channel, segment }); setLoadingLeads(true); setLeads([]);
    const { data } = await supabase.rpc("get_remarketing_leads" as any, { p_channel: channel, p_segment: segment, p_limit: 200 });
    setLeads((data as any) || []); setLoadingLeads(false);
  };

  const exportCsv = async (channel: string, segment: string) => {
    setExporting(`${channel}-${segment}`);
    try {
      const { data } = await supabase.rpc("get_remarketing_leads" as any, { p_channel: channel, p_segment: segment, p_limit: 50000 });
      const rows = ((data as any) || []) as Lead[];
      const csv = "contato,nome\n" + rows.map(r => `${r.contact},${(r.name || "").replace(/[,\n]/g, " ")}`).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `remarketing_${channel}_${segment}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setExporting("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Remarketing — audiência segmentada</h3>
          <span className="text-[11px] text-[#888]">{total.toLocaleString("pt-BR")} leads</span>
        </div>
        <button onClick={fetchSummary} className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></button>
      </div>

      {loading && summary.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {SEGMENTS.map(seg => (
            <div key={seg.key} className={cn("rounded-xl border p-3", seg.ring, seg.bg)}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={cn("text-sm font-bold", seg.color)}>{seg.label}</span>
                <span className="text-[11px] text-[#888]">{(qtd("whatsapp", seg.key) + qtd("email", seg.key)).toLocaleString("pt-BR")} leads</span>
              </div>
              <p className="text-[11px] text-[#999] mb-2">{seg.intent}</p>
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map(ch => (
                  <div key={ch.key} className="rounded-lg bg-[#0d0d0d] border border-[#222] p-2.5">
                    <div className="flex items-center gap-1.5 mb-1"><ch.Icon className={cn("w-3.5 h-3.5", ch.color)} /><span className="text-[11px] text-[#aaa]">{ch.label}</span></div>
                    <div className="text-xl font-black text-white tabular-nums">{qtd(ch.key, seg.key).toLocaleString("pt-BR")}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <button onClick={() => viewLeads(ch.key, seg.key)} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border border-[#2a2a2a] text-[#888] hover:text-white"><Eye className="w-3 h-3" />ver</button>
                      <button onClick={() => exportCsv(ch.key, seg.key)} disabled={exporting === `${ch.key}-${seg.key}`} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border border-[#2a2a2a] text-[#888] hover:text-white">
                        {exporting === `${ch.key}-${seg.key}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">{open.channel} · {SEGMENTS.find(s => s.key === open.segment)?.label} <span className="text-[#666]">(amostra 200)</span></span>
            <button onClick={() => setOpen(null)} className="text-[11px] text-[#888] hover:text-white">fechar</button>
          </div>
          {loadingLeads ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /></div>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
              {leads.length === 0 ? <p className="text-[11px] text-[#666] text-center py-4">Sem leads.</p> : leads.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] rounded bg-[#111] border border-[#222] px-2 py-1">
                  <span className="text-white font-mono">{l.contact}</span>
                  {l.name && <span className="text-[#888] truncate">· {l.name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[9px] text-[#555]">Segmentação dirigida pelo webhook (status de compra por contato). Exporte o CSV pra usar já em qualquer ferramenta, ou conecte o disparo automático (WhatsApp/email) depois.</p>
    </div>
  );
}
