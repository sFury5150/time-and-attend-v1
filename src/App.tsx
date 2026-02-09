import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useEffect } from "react";
import { initializeRateLimitCleanup } from "@/utils/rateLimiter";
import { initializeNotifications } from "@/utils/notifications";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import TimeTracking from "./pages/TimeTracking";
import Schedules from "./pages/Schedules";
import Employees from "./pages/Employees";
import Locations from "./pages/Locations";
import Reports from "./pages/Reports";
import Companies from "./pages/Companies";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import CustomerInteractions from "./pages/CustomerInteractions";
import AdminSettings from "./pages/AdminSettings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import EmployeeMobileApp from "./pages/EmployeeMobileApp";
import ManagerDashboard from "./pages/ManagerDashboard";

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Initialize rate limiting cleanup
    initializeRateLimitCleanup();
    
    // Initialize push notifications
    initializeNotifications();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/time" element={<TimeTracking />} />
      <Route path="/dashboard/schedules" element={<Schedules />} />
      <Route path="/dashboard/employees" element={<Employees />} />
      <Route path="/dashboard/locations" element={<Locations />} />
      <Route path="/dashboard/reports" element={<Reports />} />
      <Route path="/dashboard/companies" element={<Companies />} />
      <Route path="/dashboard/customers" element={<Customers />} />
      <Route path="/dashboard/invoices" element={<Invoices />} />
      <Route path="/dashboard/invoices/:id" element={<InvoiceDetail />} />
      <Route path="/dashboard/interactions" element={<CustomerInteractions />} />
      <Route path="/dashboard/admin" element={<AdminSettings />} />
      
      {/* Phase 2 Routes */}
      <Route path="/mobile" element={<EmployeeMobileApp />} />
      <Route path="/mobile/clock-in" element={<EmployeeMobileApp />} />
      <Route path="/dashboard/manager" element={<ManagerDashboard />} />
      
      <Route path="/auth" element={<Auth />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
