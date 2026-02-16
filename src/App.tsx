import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Live from "./pages/Live";
import NotFound from "./pages/NotFound";
import UpsellFunnel from "./components/upsell/UpsellFunnel";
import Upsell2Page from "./components/upsell/Upsell2Page";
import Upsell3Page from "./components/upsell/Upsell3Page";
import Upsell4Page from "./components/upsell/Upsell4Page";
import FunnelGuard from "./components/upsell/FunnelGuard";
import QuizGuard from "./components/quiz/QuizGuard";
import RedirectWithParams from "./components/RedirectWithParams";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RedirectWithParams />} />
          <Route path="/live" element={<Live />} />
          <Route path="/upsell1" element={<FunnelGuard><UpsellFunnel /></FunnelGuard>} />
          <Route path="/upsell2" element={<FunnelGuard><Upsell2Page /></FunnelGuard>} />
          <Route path="/upsell3" element={<FunnelGuard><Upsell3Page /></FunnelGuard>} />
          <Route path="/upsell4" element={<FunnelGuard><Upsell4Page /></FunnelGuard>} />
          <Route path="/:slug" element={<QuizGuard><Index /></QuizGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
