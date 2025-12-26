import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { POSProvider, usePOS } from "@/contexts/POSContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Staff from "./pages/Staff";
import Menu from "./pages/Menu";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { currentUser } = usePOS();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <Orders />
        </ProtectedRoute>
      } />
      <Route path="/kitchen" element={
        <ProtectedRoute allowedRoles={['admin', 'chef']}>
          <Kitchen />
        </ProtectedRoute>
      } />
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Staff />
        </ProtectedRoute>
      } />
      <Route path="/menu" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Menu />
        </ProtectedRoute>
      } />
      <Route path="/billing" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <Billing />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <POSProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </POSProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
