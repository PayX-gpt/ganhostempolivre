import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─────────────────────────────────────────────────────────────
   CRM de Atendimento — Guardião
   Painel mobile-first pra dar boas-vindas aos compradores no WhatsApp.
   Puxa todo o histórico de vendas (agrupado por cliente), mostra
   nome/região/produtos/valor, botão de 1 clique -> WhatsApp com
   mensagem pronta de gerente, e marca quem já foi contatado (salvo).
   Protegido por senha (no nível do banco). Abastece automático.
   ───────────────────────────────────────────────────────────── */

type Client = {
  key: string; name: string; phone: string | null; email: string | null;
  currency: string; total: number; products: string[]; region: string;
  contacted: boolean; contacted_at: string | null; last_at: string; n: number;
};
type Stats = { total_clients?: number; contacted?: number; pending?: number; revenue_brl?: number; exterior?: number; locked?: boolean };

const TOKEN_KEY = "crm_token";

const CUR_SYM: Record<string, string> = { BRL: "R$", EUR: "€", USD: "$" };
function money(total: number, cur: string) {
  const sym = CUR_SYM[cur] || "R$";
  return `${sym}${(total || 0).toLocaleString(cur === "BRL" ? "pt-BR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function firstName(name: string) { return (name || "").trim().split(/\s+/)[0] || ""; }

/** Mensagem de gerente de investimentos dando boas-vindas ao Guardião. */
function waMessage(name: string) {
  const f = firstName(name);
  const ola = f ? `Olá ${f}` : "Olá";
  return (
`${ola}! 👋 Aqui é o seu gerente do *Guardião* — o nosso sistema de inteligência artificial que opera no mercado financeiro por você. 🎉

Parabéns por ativar! Eu vou te acompanhar de perto nos seus primeiros passos pra você já começar a ver resultado o quanto antes.

Posso te explicar em 2 minutinhos como fazer o seu primeiro depósito e destravar o Guardião? Qualquer dúvida é só me chamar por aqui. Tô à disposição. 😊`
  );
}
function waLink(client: Client) {
  const digits = (client.key || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(waMessage(client.name))}`;
}

const C = {
  bg: "#0a0a0a", card: "#151515", card2: "#1c1c1c", border: "#2a2a2a",
  text: "#f3f3f3", dim: "#9a9a9a", green: "#22c55e", gold: "#FFD700", blue: "#3b82f6",
};

export default function Clientes() {
  const [token, setToken] = useState<string>(() => { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } });
  const [pass, setPass] = useState("");
  const [locked, setLocked] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "pendentes" | "contatados" | "exterior">("todos");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const searchTimer = useRef<number | null>(null);

  const fetchData = useCallback(async (tok: string, q: string, silent = false) => {
    if (!tok) return;
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.rpc("crm_clients" as any, { p_token: tok, p_search: q || null, p_limit: 600 });
      if (!error && data) {
        const d = data as any;
        if (d?.stats?.locked) { setLocked(true); setClients([]); setStats({ locked: true }); }
        else { setLocked(false); setClients((d.clients || []) as Client[]); setStats((d.stats || {}) as Stats); setLastUpdate(new Date()); }
      }
    } catch { /* mantém dados */ }
    if (!silent) setLoading(false);
  }, []);

  // primeira carga + auto-refresh (a cada 25s, e ao voltar o foco)
  useEffect(() => {
    if (!token) return;
    fetchData(token, search);
    const iv = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      fetchData(token, search, true);
    }, 25000);
    const onFocus = () => fetchData(token, search, true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { clearInterval(iv); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [token]); // eslint-disable-line

  // busca com debounce
  useEffect(() => {
    if (!token) return;
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => fetchData(token, search, true), 350);
    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); };
  }, [search]); // eslint-disable-line

  const entrar = () => {
    const t = pass.trim();
    if (!t) return;
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ }
    setToken(t);
  };

  const toggleContacted = useCallback(async (client: Client, value: boolean) => {
    // otimista
    setClients((prev) => prev.map((c) => c.key === client.key ? { ...c, contacted: value, contacted_at: value ? new Date().toISOString() : null } : c));
    setStats((s) => ({ ...s, contacted: (s.contacted || 0) + (value ? 1 : -1), pending: (s.pending || 0) + (value ? -1 : 1) }));
    try { await supabase.rpc("crm_set_contacted" as any, { p_token: token, p_key: client.key, p_contacted: value }); } catch { /* ignore */ }
  }, [token]);

  const openWhats = useCallback((client: Client) => {
    window.open(waLink(client), "_blank");
    if (!client.contacted) toggleContacted(client, true);
  }, [toggleContacted]);

  const view = useMemo(() => {
    let list = clients;
    if (filter === "pendentes") list = list.filter((c) => !c.contacted);
    else if (filter === "contatados") list = list.filter((c) => c.contacted);
    else if (filter === "exterior") list = list.filter((c) => c.region.length > 2);
    return list;
  }, [clients, filter]);

  /* ── Tela de senha ── */
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 340, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 26 }}>
          <div style={{ fontSize: 26, fontWeight: 900, textAlign: "center", marginBottom: 4 }}>🛡️ CRM Guardião</div>
          <div style={{ fontSize: 13, color: C.dim, textAlign: "center", marginBottom: 20 }}>Atendimento aos clientes</div>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()}
            placeholder="Senha de acesso" autoFocus
            style={{ width: "100%", padding: "13px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card2, color: C.text, fontSize: 15, marginBottom: 12, boxSizing: "border-box" }} />
          <button onClick={entrar} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: `linear-gradient(180deg,#2ee06a,#16a34a)`, color: "#04210f", fontWeight: 900, fontSize: 15, cursor: "pointer" }}>Entrar</button>
          {locked && <div style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", marginTop: 12 }}>Senha incorreta.</div>}
        </div>
      </div>
    );
  }

  const stat = (label: string, val: string | number, color = C.text) => (
    <div style={{ flex: "1 1 30%", minWidth: 90, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 12px" }}>
      <div style={{ fontSize: 19, fontWeight: 900, color }}>{val}</div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui,-apple-system,sans-serif", paddingBottom: 40 }}>
      {/* Topo */}
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
        {/* Stats */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {stat("Clientes", (stats.total_clients ?? 0).toLocaleString("pt-BR"))}
          {stat("Já contatei", (stats.contacted ?? 0).toLocaleString("pt-BR"), C.green)}
          {stat("Faltam", (stats.pending ?? 0).toLocaleString("pt-BR"), C.gold)}
          {stat("Faturamento", `R$${Math.round(stats.revenue_brl ?? 0).toLocaleString("pt-BR")}`)}
          {stat("Exterior 🌎", (stats.exterior ?? 0).toLocaleString("pt-BR"), C.blue)}
        </div>

        {/* Busca */}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou região…"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }} />

        {/* Filtros */}
        <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {([["todos", "Todos"], ["pendentes", "Faltam falar"], ["contatados", "Já falei"], ["exterior", "Exterior"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ whiteSpace: "nowrap", padding: "8px 13px", borderRadius: 20, border: `1px solid ${filter === k ? C.green : C.border}`, background: filter === k ? "rgba(34,197,94,.15)" : C.card, color: filter === k ? C.green : C.dim, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        {loading && clients.length === 0 && <div style={{ color: C.dim, textAlign: "center", padding: 30 }}>Carregando clientes…</div>}
        {!loading && view.length === 0 && <div style={{ color: C.dim, textAlign: "center", padding: 30 }}>Nenhum cliente aqui.</div>}

        {/* Lista de clientes */}
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
                <button onClick={() => openWhats(c)}
                  style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, border: "none", background: c.contacted ? C.card2 : "linear-gradient(180deg,#2ee06a,#16a34a)", color: c.contacted ? C.text : "#04210f", fontWeight: 900, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.3A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1A7.9 7.9 0 0 0 12 20a7.94 7.94 0 0 0 5.6-13.7ZM12 18.5a6.6 6.6 0 0 1-3.4-.9l-.24-.15-2.5.66.67-2.43-.16-.25A6.56 6.56 0 1 1 12 18.5Zm3.6-4.9c-.2-.1-1.17-.58-1.35-.64s-.31-.1-.44.1-.5.63-.62.76-.23.15-.43.05a5.4 5.4 0 0 1-2.7-2.35c-.2-.35.2-.32.58-1.07a.36.36 0 0 0 0-.34c0-.1-.44-1.06-.6-1.45s-.32-.33-.44-.34h-.38a.72.72 0 0 0-.52.24 2.18 2.18 0 0 0-.68 1.62 3.8 3.8 0 0 0 .8 2 8.7 8.7 0 0 0 3.33 2.94c1.87.72 1.87.48 2.2.45a1.86 1.86 0 0 0 1.24-.87 1.53 1.53 0 0 0 .1-.87c-.05-.08-.18-.13-.38-.23Z"/></svg>
                  {c.contacted ? "Falar de novo" : "Falar no WhatsApp"}
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
