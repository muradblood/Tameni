import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Step1BasicInfo from "./pages/insurance/Step1BasicInfo";
import Step2VehicleInfo from "./pages/insurance/Step2VehicleInfo";
import Step3Plans from "./pages/insurance/Step3Plans";
import Step4Addons from "./pages/insurance/Step4Addons";
import Step5Summary from "./pages/insurance/Step5Summary";
import PaymentPage from "./pages/insurance/PaymentPage";
import OtpPage from "./pages/insurance/OtpPage";
import BannedPage from "./pages/BannedPage";
import AdminDashboard from "./pages/admin/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/insurance/step1" component={Step1BasicInfo} />
      <Route path="/insurance/step2" component={Step2VehicleInfo} />
      <Route path="/insurance/step3" component={Step3Plans} />
      <Route path="/insurance/step4" component={Step4Addons} />
      <Route path="/insurance/step5" component={Step5Summary} />
      <Route path="/insurance/payment" component={PaymentPage} />
      <Route path="/insurance/otp" component={OtpPage} />
      <Route path="/banned" component={BannedPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
