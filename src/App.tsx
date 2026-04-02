import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import DashboardPage from "./pages/DashboardPage";
import AssetIntelligencePage from "./pages/AssetIntelligencePage";
import ThreatIntelligencePage from "./pages/ThreatIntelligencePage";
import NetworkAnalyticsPage from "./pages/NetworkAnalyticsPage";
import ReconPentestPage from "./pages/ReconPentestPage";
import AIAgentPage from "./pages/AIAgentPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import BarcodeScannerPage from "./pages/BarcodeScannerPage";
import ImageProcessingPage from "./pages/ImageProcessingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <AppErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/assets" element={<AssetIntelligencePage />} />
                        <Route path="/threats" element={<ThreatIntelligencePage />} />
                        <Route path="/network" element={<NetworkAnalyticsPage />} />
                        <Route path="/recon" element={<ReconPentestPage />} />
                        <Route path="/ai-agent" element={<AIAgentPage />} />
                        <Route path="/barcode" element={<BarcodeScannerPage />} />
                        <Route path="/image-processing" element={<ImageProcessingPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AppErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
