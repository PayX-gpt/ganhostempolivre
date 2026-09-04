import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─────────────────────────────────────────────────────────────
   CRM de Atendimento — Guardião  (sem senha, mobile-first)
   Puxa todo o histórico de vendas (Hubla) agrupado por cliente,
   com filtro de data, botão WhatsApp com mensagem pronta e
   marcação de "já contatei". Abastece automático a cada venda.
   ───────────────────────────────────────────────────────────── */

type Client = {
  key: string; name: string; wa: string | null; email: string | null;
  currency: string; total: number; products: string[]; region: string;
  contacted: boolean; contacted_at: string | null; last_at: string; n: number;
};
type Stats = { total_clients?: number; contacted?: number; pending?: number; revenue_brl?: number; exterior?: number };

const CUR_SYM: Record<string, string> = { BRL: "R$", EUR: "€", USD: "$" };
function money(total: number, cur: string) {
  const sym = CUR_SYM[cur] || "R$";
  return `${sym}${(total || 0).toLocaleString(cur === "BRL" ? "pt-BR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function firstName(name: string) { return (name || "").trim().split(/\s+/)[0] || ""; }

/** Mensagem curta, humana e irresistível (gerente do Guardião).
    Serve pra cliente novo OU antigo (não assume que "acabou de entrar").
    Gancho: a "dica" puxa a resposta; a pergunta do depósito é fácil de responder. */
function waMessage(name: string) {
  const f = firstName(name);
  const ola = f ? `Oi ${f}, tudo bem?` : "Oi, tudo bem?";
  return `${ola} 😊 Aqui é o seu gerente do Guardião — tô aqui pra te acompanhar de perto. Rapidinho: você já entendeu certinho como o Guardião funciona, ou ficou com alguma dúvida que eu possa te ajudar? 👀`;
}
function waLink(c: Client) {
  const digits = (c.wa || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(waMessage(c.name))}`;
}

// filtros de data
const PERIODS = [
  { k: "tudo", label: "Tudo" },
  { k: "hoje", label: "Hoje" },
  { k: "7d", label: "7 dias" },
  { k: "30d", label: "30 dias" },
] as const;
type Period = typeof PERIODS[number]["k"];
function periodFrom(p: Period): string | null {
  const now = Date.now();
  if (p === "hoje") { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  if (p === "7d") return new Date(now - 7 * 864e5).toISOString();
  if (p === "30d") return new Date(now - 30 * 864e5).toISOString();
  return null; // tudo
}

const C = {
  bg: "#0a0a0a", card: "#151515", card2: "#1c1c1c", border: "#2a2a2a",
  text: "#f3f3f3", dim: "#9a9a9a", green: "#22c55e", gold: "#FFD700", blue: "#3b82f6",
};

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("tudo");
  const [customFrom, setCustomFrom] = useState<string>(""); // yyyy-mm-dd
  const [filter, setFilter] = useState<"todos" | "pendentes" | "contatados" | "exterior">("todos");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const searchTimer = useRef<number | null>(null);

  const fromISO = useMemo(() => {
    if (customFrom) { const d = new Date(customFrom + "T00:00:00"); return isNaN(+d) ? null : d.toISOString(); }
    return periodFrom(period);
  }, [period, customFrom]);

  const fetchData = useCallback(async (q: string, from: string | null, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_clients_crm" as any, { p_search: q || null, p_from: from, p_limit: 800 });
      if (!error && data) {
        const d = data as any;
        setClients((d.clients || []) as Client[]);
        setStats((d.stats || {}) as Stats);
        setLastUpdate(new Date());
      }
    } catch { /* mantém dados */ }
    if (!silent) setLoading(false);
  }, []);

  // carga + auto-refresh (25s e ao voltar o foco)
  useEffect(() => {
    fetchData(search, fromISO);
    const iv = window.setInterval(() => { if (document.visibilityState !== "hidden") fetchData(search, fromISO, true); }, 25000);
    const onFocus = () => fetchData(search, fromISO, true);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(iv); window.removeEventListener("focus", onFocus); };
  }, [fromISO]); // eslint-disable-line

  // busca com debounce
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => fetchData(search, fromISO, true), 350);
    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); };
  }, [search]); // eslint-disable-line

  const toggleContacted = useCallback(async (client: Client, value: boolean) => {
    setClients((prev) => prev.map((c) => c.key === client.key ? { ...c, contacted: value, contacted_at: value ? new Date().toISOString() : null } : c));
    setStats((s) => ({ ...s, contacted: (s.contacted || 0) + (value ? 1 : -1), pending: (s.pending || 0) + (value ? -1 : 1) }));
    try { await supabase.rpc("set_client_contacted" as any, { p_key: client.key, p_contacted: value }); } catch { /* ignore */ }
  }, []);

  const openWhats = useCallback((client: Client) => {
    if (client.wa) window.open(waLink(client), "_blank");
    if (!client.contacted) toggleContacted(client, true);
  }, [toggleContacted]);

  const view = useMemo(() => {
    let list = clients;
    if (filter === "pendentes") list = list.filter((c) => !c.contacted);
    else if (filter === "contatados") list = list.filter((c) => c.contacted);
    else if (filter === "exterior") list = list.filter((c) => c.region.length > 2);
    return list;
  }, [clients, filter]);

  const stat = (label: string, val: string | number, color = C.text) => (
    <div style={{ flex: "1 1 30%", minWidth: 90, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 12px" }}>
      <div style={{ fontSize: 19, fontWeight: 900, color }}>{val}</div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{label}</div>
    </div>
  );
  const chip = (active: boolean) => ({
    whiteSpace: "nowrap" as const, padding: "8px 13px", borderRadius: 20,
    border: `1px solid ${active ? C.green : C.border}`, background: active ? "rgba(34,197,94,.15)" : C.card,
    color: active ? C.green : C.dim, fontSize: 13, fontWeight: 700, cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui,-apple-system,sans-serif", paddingBottom: 40 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(10,10,10,.96)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}`, padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>🛡️ CRM Guardião</div>
          <div style={{ fontSize: 11, color: C.dim, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block", animation: "pulse 1.5s infinite" }} />
            {lastUpdate ? `atualizado ${lastUpdate.toLocaleTimeString("pt-BR").slice(0, 5)}` : "ao vivo"}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 14px 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {stat("Clientes", (stats.total_clients ?? 0).toLocaleString("pt-BR"))}
          {stat("Já contatei", (stats.contacted ?? 0).toLocaleString("pt-BR"), C.green)}
          {stat("Faltam", (stats.pending ?? 0).toLocaleString("pt-BR"), C.gold)}
          {stat("Faturamento", `R$${Math.round(stats.revenue_brl ?? 0).toLocaleString("pt-BR")}`)}
          {stat("Exterior 🌎", (stats.exterior ?? 0).toLocaleString("pt-BR"), C.blue)}
        </div>

        {/* Período (data) */}
        <div style={{ display: "flex", gap: 7, marginBottom: 10, overflowX: "auto", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.dim, whiteSpace: "nowrap" }}>📅</span>
          {PERIODS.map((p) => (
            <button key={p.k} onClick={() => { setPeriod(p.k); setCustomFrom(""); }} style={chip(!customFrom && period === p.k)}>{p.label}</button>
          ))}
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            title="A partir de uma data"
            style={{ padding: "7px 10px", borderRadius: 20, border: `1px solid ${customFrom ? C.green : C.border}`, background: C.card, color: customFrom ? C.green : C.dim, fontSize: 12.5 }} />
        </div>

        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou região…"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }} />

        {/* Status */}
        <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {([["todos", "Todos"], ["pendentes", "Faltam falar"], ["contatados", "Já falei"], ["exterior", "Exterior"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} style={chip(filter === k)}>{label}</button>
          ))}
        </div>

        {loading && clients.length === 0 && <div style={{ color: C.dim, textAlign: "center", padding: 30 }}>Carregando clientes…</div>}
        {!loading && view.length === 0 && <div style={{ color: C.dim, textAlign: "center", padding: 30 }}>Nenhum cliente nesse período.</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {view.map((c) => {
            const exterior = c.region.length > 2;
            return (
              <div key={c.key} style={{ background: C.card, border: `1px solid ${c.contacted ? "rgba(34,197,94,.35)" : C.border}`, borderRadius: 14, padding: "13px 14px", opacity: c.contacted ? 0.72 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: exterior ? "rgba(59,130,246,.16)" : "rgba(255,255,255,.06)", color: exterior ? C.blue : C.dim }}>📍 {c.region}</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: C.green }}>{money(c.total, c.currency)}</span>
                      {c.n > 1 && <span style={{ fontSize: 11, color: C.dim }}>· {c.n} compras</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.dim, marginTop: 6, lineHeight: 1.45 }}>{(c.products || []).join(" · ")}</div>
                  </div>
                  <label title="Marcar como já contatado" style={{ flex: "0 0 auto", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <input type="checkbox" checked={c.contacted} onChange={(e) => toggleContacted(c, e.target.checked)} style={{ width: 22, height: 22, accentColor: C.green, cursor: "pointer" }} />
                    <span style={{ fontSize: 9, color: c.contacted ? C.green : C.dim }}>{c.contacted ? "feito" : "marcar"}</span>
                  </label>
                </div>
                <button onClick={() => openWhats(c)} disabled={!c.wa}
                  style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, border: "none", background: !c.wa ? C.card2 : c.contacted ? C.card2 : "linear-gradient(180deg,#2ee06a,#16a34a)", color: !c.wa ? C.dim : c.contacted ? C.text : "#04210f", fontWeight: 900, fontSize: 14.5, cursor: c.wa ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.3A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1A7.9 7.9 0 0 0 12 20a7.94 7.94 0 0 0 5.6-13.7ZM12 18.5a6.6 6.6 0 0 1-3.4-.9l-.24-.15-2.5.66.67-2.43-.16-.25A6.56 6.56 0 1 1 12 18.5Zm3.6-4.9c-.2-.1-1.17-.58-1.35-.64s-.31-.1-.44.1-.5.63-.62.76-.23.15-.43.05a5.4 5.4 0 0 1-2.7-2.35c-.2-.35.2-.32.58-1.07a.36.36 0 0 0 0-.34c0-.1-.44-1.06-.6-1.45s-.32-.33-.44-.34h-.38a.72.72 0 0 0-.52.24 2.18 2.18 0 0 0-.68 1.62 3.8 3.8 0 0 0 .8 2 8.7 8.7 0 0 0 3.33 2.94c1.87.72 1.87.48 2.2.45a1.86 1.86 0 0 0 1.24-.87 1.53 1.53 0 0 0 .1-.87c-.05-.08-.18-.13-.38-.23Z"/></svg>
                  {!c.wa ? "Sem telefone" : c.contacted ? "Falar de novo" : "Falar no WhatsApp"}
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", color: C.dim, fontSize: 11, padding: "22px 0 10px" }}>{view.length} de {clients.length} mostrados · atualiza sozinho a cada venda</div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} *{-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}
