import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstallPrompt } from "@/components/InstallPrompt";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes for smaller initial bundle
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const ChildDashboard = lazy(() => import("./pages/ChildDashboard"));
const FamilySettings = lazy(() => import("./pages/FamilySettings"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TwoFactorVerify = lazy(() => import("./pages/TwoFactorVerify"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Install = lazy(() => import("./pages/Install"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

const queryClient = new QueryClient();

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="nomiro-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPrompt />
        <BrowserRouter>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/2fa-verify" element={<TwoFactorVerify />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/install" element={<Install />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/parent" element={<ParentDashboard />} />
              <Route path="/parent/settings" element={<FamilySettings />} />
              <Route path="/child" element={<ChildDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
