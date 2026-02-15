import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Live from "./pages/Live";
import NotFound from "./pages/NotFound";
import UpsellStep1 from "./components/upsell/UpsellStep1";
import UpsellStep2 from "./components/upsell/UpsellStep2";
import UpsellStep3 from "./components/upsell/UpsellStep3";
import UpsellStep4 from "./components/upsell/UpsellStep4";
import UpsellStep5 from "./components/upsell/UpsellStep5";
import UpsellStep6 from "./components/upsell/UpsellStep6";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/step-1" replace />} />
          <Route path="/live" element={<Live />} />
          <Route path="/upsell1.1" element={<UpsellStep1 />} />
          <Route path="/upsell1.2" element={<UpsellStep2 />} />
          <Route path="/upsell1.3" element={<UpsellStep3 />} />
          <Route path="/upsell1.4" element={<UpsellStep4 />} />
          <Route path="/upsell1.5" element={<UpsellStep5 />} />
          <Route path="/upsell1.6" element={<UpsellStep6 />} />
          <Route path="/:slug" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
