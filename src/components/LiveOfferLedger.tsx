import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Receipt, RefreshCw, Loader2, Crown, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * Painel de vendas da oferta — LINHA POR LINHA, batendo com a Hubla.
 *
 * Fonte: RPC get_sales_ledger (mesma atribuição venda-a-venda):
 *  - o FRONT define o braço (front_47/front_66 => "current" R$47; front_147 => "v147" R$147);
 *  - o UPSELL herda o braço do MESMO email (pelo front que a pessoa comprou);
 *  - valor = valor cheio pago (com parcelamento), status = approved (Paga).
 * Fronteira do dia = meia-noite América/São_Paulo (igual ao relatório da Hubla).
 */
interface LedgerRow {
  created_at: string; email: string; buyer_name: string | null; product_name: string | null;
  amount: number; funnel_step: string | null; kind: "front" | "upsell"; arm: "current" | "v147";
  upsell_sem_front: boolean;
}
interface ArmSummary {
  visitors: number; fronts: number; front_rev: number; upsells: number; upsell_rev: number;
  total_rev: number; ticket: number; conv: number; rpv: number;
}
interface Ledger {
  rows: LedgerRow[];
  summary: Record<string, ArmSummary>;
  integrity: { upsells_sem_front: number };
}

const PERIODS = [{ label: "Hoje", d: 1 }, { label: "7 dias", d: 7 }, { label: "30 dias", d: 30 }];
const ARMS = [
  { key: "current", label: "Atual — R$47", color: "text-sky-300", ring: "border-sky-500/25", chip: "bg-sky-500/15" },
  { key: "v147", label: "VSL R$147", color: "text-amber-300", ring: "border-amber-500/25", chip: "bg-amber-500/15" },
] as const;
const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const EMPTY: ArmSummary = { visitors: 0, fronts: 0, front_rev: 0, upsells: 0, upsell_rev: 0, total_rev: 0, ticket: 0, conv: 0, rpv: 0 };
const hora = (iso: string) => {
  try { return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
};

export default function LiveOfferLedger() {
  const [days, setDays] = useState(1);
  const [led, setLed] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // `silent` = atualização automática (não mostra o spinner, evita piscar).
  const fetchData = useCallback(async (d: number, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_sales_ledger" as any, { p_days: d });
      if (!error && data) { setLed(data as any); setLastUpdate(new Date()); }
    } catch { /* mantém os dados atuais — nunca quebra */ }
    if (!silent) setLoading(false);
  }, []);

  // Carrega ao abrir/trocar período + AUTO-ATUALIZA em tempo real (a cada 15s),
  // e assim que a aba volta ao foco. À prova de falha: erro não derruba o painel.
  useEffect(() => {
    fetchData(days);
    const iv = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return; // não gasta requisição com a aba escondida
      fetchData(days, true);
    }, 15000);
    const onFocus = () => fetchData(days, true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { clearInterval(iv); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [days, fetchData]);

  const sum = (k: string): ArmSummary => (led?.summary?.[k] as ArmSummary) || EMPTY;
  const A = sum("current"), B = sum("v147");
  const rows = led?.rows || [];
  const grossTotal = A.total_rev + B.total_rev;
  const enough = A.visitors >= 30 && B.visitors >= 30;
  const winner = !enough ? null : (B.rpv > A.rpv ? "v147" : A.rpv > B.rpv ? "current" : null);
  const semFront = led?.integrity?.upsells_sem_front || 0;

  const Metric = ({ label, a, b, hl }: { label: string; a: string; b: string; hl?: boolean }) => (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center py-1 border-t border-[#1c1c1c] text-[11px]">
      <span className="text-[#999]">{label}</span>
      <span className={cn("w-24 text-right font-bold tabular-nums", hl ? "text-sky-300" : "text-sky-300/90")}>{a}</span>
      <span className={cn("w-24 text-right font-bold tabular-nums", hl ? "text-amber-300" : "text-amber-300/90")}>{b}</span>
    </div>
  );

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25"><Receipt className="w-4 h-4 text-emerald-400" /></div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Vendas da Oferta — venda por venda (bate com a Hubla)
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
                AO VIVO
              </span>
            </h3>
            <p className="text-[10px] text-[#666]">
              front define o braço · upsell herda por email · valor cheio
              {lastUpdate && <span className="text-[#555]"> · atualizado {lastUpdate.toLocaleTimeString("pt-BR")}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#111] border border-[#2a2a2a] rounded-lg p-0.5">
            {PERIODS.map(p => <button key={p.d} onClick={() => setDays(p.d)} className={cn("px-2.5 py-1 rounded-md text-xs", days === p.d ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-[#888] hover:text-white")}>{p.label}</button>)}
          </div>
          <button onClick={() => fetchData(days)} className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></button>
        </div>
      </div>

      {loading && !led ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : grossTotal === 0 && rows.length === 0 ? (
        <div className="text-center py-8"><p className="text-[12px] text-[#888]">Nenhuma venda no período.</p></div>
      ) : (
        <>
          {/* Integridade */}
          <div className={cn("rounded-lg border p-2 mb-3 flex items-center gap-2", semFront === 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")}>
            {semFront === 0
              ? <><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><p className="text-[11px] text-[#ccc]">Conferido: toda venda casada. Bruto total <b className="text-white">{brl(grossTotal)}</b> em <b className="text-white">{rows.length}</b> transações.</p></>
              : <><AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /><p className="text-[11px] text-[#ccc]"><b className="text-amber-300">{semFront}</b> upsell(s) sem front no banco (o webhook da Hubla dropou o front). Marcado abaixo — me avise pra eu fazer o backfill.</p></>}
          </div>

          {winner && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-[12px] text-[#ddd]">Liderando por RPV: <b className={winner === "current" ? "text-sky-300" : "text-amber-300"}>{winner === "current" ? "Atual R$47" : "VSL R$147"}</b> ({brl((winner === "current" ? A : B).rpv)} vs {brl((winner === "current" ? B : A).rpv)}).</p>
            </div>
          )}

          {/* Resumo por braço */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end mb-1">
            <span />
            <span className="w-24 text-right text-[10px] font-bold text-sky-300">ATUAL R$47</span>
            <span className="w-24 text-right text-[10px] font-bold text-amber-300">VSL R$147</span>
          </div>
          <Metric label="Visitantes na oferta" a={String(A.visitors)} b={String(B.visitors)} />
          <Metric label="Vendas front" a={String(A.fronts)} b={String(B.fronts)} />
          <Metric label="Conversão" a={`${A.conv}%`} b={`${B.conv}%`} />
          <Metric label="Ticket do front" a={brl(A.ticket)} b={brl(B.ticket)} />
          <Metric label="Upsells (qtd)" a={String(A.upsells)} b={String(B.upsells)} />
          <Metric label="Receita upsell" a={brl(A.upsell_rev)} b={brl(B.upsell_rev)} />
          <Metric label="Receita total (bruto)" a={brl(A.total_rev)} b={brl(B.total_rev)} />
          <Metric label="RPV (receita ÷ visitante)" a={brl(A.rpv)} b={brl(B.rpv)} hl />
          {!enough && <p className="text-[10px] text-[#666] mt-2">Amostra ainda pequena (mín. 30 visitantes por lado pra cravar vencedor).</p>}

          {/* Linha por linha */}
          <div className="mt-4">
            <p className="text-[11px] font-bold text-[#ccc] mb-1.5">Todas as vendas do período ({rows.length})</p>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-[#222]">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-[#111] text-[#777]">
                  <tr>
                    <th className="text-left font-medium px-2 py-1.5">Hora</th>
                    <th className="text-left font-medium px-2 py-1.5">Cliente</th>
                    <th className="text-left font-medium px-2 py-1.5">Produto</th>
                    <th className="text-right font-medium px-2 py-1.5">Valor</th>
                    <th className="text-center font-medium px-2 py-1.5">Braço</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={cn("border-t border-[#1a1a1a]", r.upsell_sem_front && "bg-amber-500/5")}>
                      <td className="px-2 py-1.5 text-[#888] whitespace-nowrap tabular-nums">{hora(r.created_at)}</td>
                      <td className="px-2 py-1.5 text-[#ddd] max-w-[130px] truncate" title={r.buyer_name || r.email}>{r.buyer_name || r.email}</td>
                      <td className="px-2 py-1.5 text-[#aaa]">
                        <span className={cn("inline-block px-1.5 py-0.5 rounded text-[9px] mr-1", r.kind === "front" ? "bg-emerald-500/15 text-emerald-300" : "bg-violet-500/15 text-violet-300")}>{r.kind === "front" ? "FRONT" : "UPSELL"}</span>
                        <span className="text-[#888] max-w-[120px] truncate inline-block align-bottom" title={r.product_name || ""}>{r.product_name}</span>
                        {r.upsell_sem_front && <span className="ml-1 text-amber-400" title="upsell sem front no banco">⚠</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-white tabular-nums whitespace-nowrap">{brl(r.amount)}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", r.arm === "current" ? "bg-sky-500/15 text-sky-300" : "bg-amber-500/15 text-amber-300")}>{r.arm === "current" ? "R$47" : "R$147"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[9px] text-[#555] mt-2">Bate 1:1 com o export "Vendas" da Hubla (mesma janela de dia, valor cheio, status Paga). RPV decide o vencedor porque o custo por visitante é igual nos dois braços.</p>
        </>
      )}
    </div>
  );
}
