import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Facturas from "./pages/Facturas";
import OrdenesCompra from "./pages/OrdenesCompra";
import OrdenesRecepcion from "./pages/OrdenesRecepcion";
import Pagos from "./pages/Pagos";
import Stock from "./pages/Stock";
import Recetas from "./pages/Recetas";
import Configuracion from "./pages/Configuracion";
import Clientes from "./pages/crm/Clientes";
import Oportunidades from "./pages/crm/Oportunidades";
import Actividades from "./pages/crm/Actividades";
import Campanas from "./pages/crm/Campanas";
import Finanzas from "./pages/erp/Finanzas";
import Empleados from "./pages/erp/Empleados";
import Proyectos from "./pages/erp/Proyectos";
import UsuariosAdmin from "./pages/admin/Usuarios";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import TestingDashboard from "./pages/TestingDashboard";
import Monitoreo from "./pages/Monitoreo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/facturas" element={
                <ProtectedRoute>
                  <Layout>
                    <Facturas />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/ordenes-compra" element={
                <ProtectedRoute>
                  <Layout>
                    <OrdenesCompra />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/ordenes-recepcion" element={
              <ProtectedRoute>
                <Layout>
                  <OrdenesRecepcion />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/pagos" element={
              <ProtectedRoute>
                <Layout>
                  <Pagos />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock" element={
              <ProtectedRoute>
                <Layout>
                  <Stock />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/recetas" element={
              <ProtectedRoute>
                <Layout>
                  <Recetas />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/crm/clientes" element={
              <ProtectedRoute>
                <Layout>
                  <Clientes />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/crm/oportunidades" element={
              <ProtectedRoute>
                <Layout>
                  <Oportunidades />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/crm/actividades" element={
              <ProtectedRoute>
                <Layout>
                  <Actividades />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/crm/campanas" element={
              <ProtectedRoute>
                <Layout>
                  <Campanas />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/erp/finanzas" element={
              <ProtectedRoute>
                <Layout>
                  <Finanzas />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/erp/empleados" element={
              <ProtectedRoute>
                <Layout>
                  <Empleados />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/erp/proyectos" element={
              <ProtectedRoute>
                <Layout>
                  <Proyectos />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute>
                <Layout>
                  <UsuariosAdmin />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/configuracion" element={
              <ProtectedRoute>
                <Layout>
                  <Configuracion />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/testing" element={
              <ProtectedRoute>
                <Layout>
                  <TestingDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/monitoreo" element={
              <ProtectedRoute>
                <Layout>
                  <Monitoreo />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;