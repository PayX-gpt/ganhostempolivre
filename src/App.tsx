import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/lib/i18n";
import Index from "./pages/Index";
import Live from "./pages/Live";
import NotFound from "./pages/NotFound";
import UpsellFunnel from "./components/upsell/UpsellFunnel";
import Upsell2Page from "./components/upsell/Upsell2Page";
import Upsell3Page from "./components/upsell/Upsell3Page";
import Upsell4Page from "./components/upsell/Upsell4Page";
import Upsell5Page from "./components/upsell/Upsell5Page";
import Upsell6Page from "./components/upsell/Upsell6Page";

const queryClient = new QueryClient();

const RootToStep1Redirect = () => {
  const location = useLocation();
  return <Navigate to={`/step-1${location.search}${location.hash}`} replace />;
};

const App = () => (
  <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootToStep1Redirect />} />
            <Route path="/live" element={<Live />} />
            <Route path="/upsell1" element={<UpsellFunnel />} />
            <Route path="/upsell2" element={<Upsell2Page />} />
            <Route path="/upsell3" element={<Upsell3Page />} />
            <Route path="/upsell4" element={<Upsell4Page />} />
            <Route path="/upsell5" element={<Upsell5Page />} />
            <Route path="/upsell6" element={<Upsell6Page />} />
            <Route path="/:slug" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </LanguageProvider>
);

export default App;
