import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadABConfig } from "./lib/abConfigServer";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("💥 React Error Boundary caught:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: "#ff4444", background: "#111", minHeight: "100vh", fontFamily: "monospace" }}>
          <h1>⚠️ Erro na aplicação</h1>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, fontSize: 12, color: "#888" }}>{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: "8px 16px", cursor: "pointer" }}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function mount() {
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

// Carrega a config A/B (server-side) ANTES de renderizar o funil, para que
// novos visitantes já caiam no split/vencedor definido no painel /live.
// Corre contra um timeout curto para NUNCA bloquear a página (cai no cache).
const abTimeout = new Promise<void>((resolve) => setTimeout(resolve, 800));
Promise.race([loadABConfig().then(() => undefined), abTimeout]).finally(mount);
