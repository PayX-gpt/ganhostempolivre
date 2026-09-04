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

type WaKind = "boasvindas" | "duvidas" | "acesso";
const MEMBERS_LINK = "https://guardiao.blackboxmembers.com.br/login";

/** Mensagens humanizadas por situação (SEM travessão). Gerente do Guardião.
    Servem pra cliente novo OU antigo. Não fala de depósito de cara: abre conversa. */
function waMessage(name: string, kind: WaKind) {
  const f = firstName(name);
  const ola = f ? `Oi ${f}, tudo bem?` : "Oi, tudo bem?";
  if (kind === "acesso") {
    return `${ola} 😊 Aqui é o seu gerente do Guardião. Passando pra garantir que você já está com tudo em mãos. É neste link que você acessa suas aulas e o Guardião: ${MEMBERS_LINK} . Consegue entrar e me dizer se apareceu tudo certinho? Qualquer coisa eu te ajudo na hora. 🤝`;
  }
  if (kind === "duvidas") {
    return `${ola} 😊 Aqui é o seu gerente do Guardião e fiquei responsável por te acompanhar de perto. Me conta uma coisa: o que você mais quer entender sobre a plataforma agora? Assim eu já te explico certinho e a gente avança juntos. 🚀`;
  }
  return `${ola} 😊 Aqui é o seu gerente do Guardião. Passei aqui pra te dar as boas vindas e saber como você está se sentindo com a plataforma. Já conseguiu entender como funciona ou ainda ficou com alguma dúvida? Estou por aqui pra te ajudar no que precisar. 🤝`;
}
function waLink(c: Client, kind: WaKind) {
  const digits = (c.wa || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(waMessage(c.name, kind))}`;
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

  // refs pra o polling SEMPRE usar os valores atuais (à prova de closure velha)
  const searchRef = useRef(search); searchRef.current = search;
  const fromRef = useRef(fromISO); fromRef.current = fromISO;

  // AUTO-REFRESH em tempo real: a cada 8s + ao voltar o foco/aba. Roda 1x, refs
  // garantem período/busca atuais. À prova de erro (fetchData nunca lança).
  useEffect(() => {
    const pull = () => { if (document.visibilityState !== "hidden") fetchData(searchRef.current, fromRef.current, true); };
    const iv = window.setInterval(pull, 8000);
    window.addEventListener("focus", pull);
    document.addEventListener("visibilitychange", pull);
    return () => { clearInterval(iv); window.removeEventListener("focus", pull); document.removeEventListener("visibilitychange", pull); };
  }, []); // eslint-disable-line

  // carga inicial + refetch imediato ao trocar o período
  useEffect(() => { fetchData(searchRef.current, fromISO, false); }, [fromISO]); // eslint-disable-line

  // busca com debounce
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => fetchData(search, fromRef.current, true), 350);
    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); };
  }, [search]); // eslint-disable-line

  const toggleContacted = useCallback(async (client: Client, value: boolean) => {
    setClients((prev) => prev.map((c) => c.key === client.key ? { ...c, contacted: value, contacted_at: value ? new Date().toISOString() : null } : c));
    setStats((s) => ({ ...s, contacted: (s.contacted || 0) + (value ? 1 : -1), pending: (s.pending || 0) + (value ? -1 : 1) }));
    try { await supabase.rpc("set_client_contacted" as any, { p_key: client.key, p_contacted: value }); } catch { /* ignore */ }
  }, []);

  const openWhats = useCallback((client: Client, kind: WaKind = "boasvindas") => {
    if (client.wa) window.open(waLink(client, kind), "_blank");
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
                {!c.wa ? (
                  <div style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, background: C.card2, color: C.dim, fontWeight: 800, fontSize: 13.5, textAlign: "center" }}>Sem telefone</div>
                ) : (
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    {([
                      { k: "boasvindas" as const, label: "👋 Boas-vindas", primary: true },
                      { k: "duvidas" as const,    label: "💬 Dúvidas",     primary: false },
                      { k: "acesso" as const,     label: "🔑 Acesso",      primary: false },
                    ]).map((b) => (
                      <button key={b.k} onClick={() => openWhats(c, b.k)}
                        style={{ flex: 1, padding: "11px 4px", borderRadius: 10,
                          border: b.primary ? "none" : `1px solid ${C.border}`,
                          background: b.primary ? (c.contacted ? C.card2 : "linear-gradient(180deg,#2ee06a,#16a34a)") : C.card2,
                          color: b.primary ? (c.contacted ? C.text : "#04210f") : C.text,
                          fontWeight: 800, fontSize: 12.5, lineHeight: 1.15, cursor: "pointer" }}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
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
