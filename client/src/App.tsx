import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import Dashboard from "@/pages/dashboard";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";
import ImprintPage from "@/pages/imprint";
import SetupPasswordPage from "@/pages/setup-password";
import OnboardingPage from "@/pages/onboarding";
import ClothesPage from "@/pages/wardrobe/clothes";
import OutfitsPage from "@/pages/wardrobe/outfits";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/setup-password" component={SetupPasswordPage} />
      <Route path="/imprint" component={ImprintPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} />
      <ProtectedRoute path="/wardrobe/clothes" component={ClothesPage} />
      <ProtectedRoute path="/wardrobe/outfits" component={OutfitsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;