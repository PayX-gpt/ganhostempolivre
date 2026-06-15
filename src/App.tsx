import { lazy, Suspense, useEffect } from "react";
import { initButtonTracker } from "@/lib/buttonTracker";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/i18n";
import Index from "./pages/Index";
const Live = lazy(() => import("./pages/Live"));
const LiveDemo = lazy(() => import("./pages/LiveDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TikTokQuizFunnel = lazy(() => import("./components/quiz/TikTokQuizFunnel"));
const TikTokEsQuizFunnel = lazy(() => import("./components/quiz/TikTokEsQuizFunnel"));
const UpsellFunnel = lazy(() => import("./components/upsell/UpsellFunnel"));
const Upsell2Page = lazy(() => import("./components/upsell/Upsell2Page"));
const Upsell3Page = lazy(() => import("./components/upsell/Upsell3Page"));
const Upsell4Page = lazy(() => import("./components/upsell/Upsell4Page"));
const Upsell5Page = lazy(() => import("./components/upsell/Upsell5Page"));
const Upsell6Page = lazy(() => import("./components/upsell/Upsell6Page"));
const Oferta = lazy(() => import("./pages/Oferta"));
const GoCheckout = lazy(() => import("./pages/GoCheckout"));

const LazyFallback = <div className="min-h-screen bg-background" />;

const queryClient = new QueryClient();

// Match Vite's base so the app routes correctly when served from a subpath
// (e.g. GitHub Pages at /ganhostempolivre/). In dev this resolves to "/".
const routerBasename = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

const App = () => {
  useEffect(() => {
    initButtonTracker();
  }, []);
  return (
  <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/live" element={<Suspense fallback={LazyFallback}><Live /></Suspense>} />
            <Route path="/live-demo" element={<Suspense fallback={LazyFallback}><LiveDemo /></Suspense>} />
            <Route path="/oferta" element={<Suspense fallback={LazyFallback}><Oferta /></Suspense>} />
            <Route path="/go/:plan" element={<Suspense fallback={LazyFallback}><GoCheckout /></Suspense>} />
            <Route path="/tiktok" element={<Suspense fallback={LazyFallback}><TikTokQuizFunnel /></Suspense>} />
            <Route path="/tiktok/:slug" element={<Suspense fallback={LazyFallback}><TikTokQuizFunnel /></Suspense>} />
            <Route path="/tiktok-es" element={<Suspense fallback={LazyFallback}><TikTokEsQuizFunnel /></Suspense>} />
            <Route path="/tiktok-es/:slug" element={<Suspense fallback={LazyFallback}><TikTokEsQuizFunnel /></Suspense>} />
            <Route path="/upsell1" element={<Suspense fallback={LazyFallback}><UpsellFunnel /></Suspense>} />
            <Route path="/upsell2" element={<Suspense fallback={LazyFallback}><Upsell2Page /></Suspense>} />
            <Route path="/upsell3" element={<Suspense fallback={LazyFallback}><Upsell3Page /></Suspense>} />
            <Route path="/upsell4" element={<Suspense fallback={LazyFallback}><Upsell4Page /></Suspense>} />
            <Route path="/upsell5" element={<Suspense fallback={LazyFallback}><Upsell5Page /></Suspense>} />
            <Route path="/upsell6" element={<Suspense fallback={LazyFallback}><Upsell6Page /></Suspense>} />
            <Route path="/:slug" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Suspense fallback={LazyFallback}><NotFound /></Suspense>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </LanguageProvider>
);

export default App;
