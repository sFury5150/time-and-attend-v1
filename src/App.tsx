import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
