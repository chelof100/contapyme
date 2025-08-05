import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LazyComponent from "./components/LazyComponent";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load all pages
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Facturas = lazy(() => import("./pages/Facturas"));
const OrdenesCompra = lazy(() => import("./pages/OrdenesCompra"));
const OrdenesRecepcion = lazy(() => import("./pages/OrdenesRecepcion"));
const Pagos = lazy(() => import("./pages/Pagos"));
const Stock = lazy(() => import("./pages/Stock"));
const Recetas = lazy(() => import("./pages/Recetas"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Clientes = lazy(() => import("./pages/crm/Clientes"));
const Oportunidades = lazy(() => import("./pages/crm/Oportunidades"));
const Actividades = lazy(() => import("./pages/crm/Actividades"));
const Campanas = lazy(() => import("./pages/crm/Campanas"));
const Finanzas = lazy(() => import("./pages/erp/Finanzas"));
const Empleados = lazy(() => import("./pages/erp/Empleados"));
const Proyectos = lazy(() => import("./pages/erp/Proyectos"));
const UsuariosAdmin = lazy(() => import("./pages/admin/Usuarios"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Index = lazy(() => import("./pages/Index"));
const TestingDashboard = lazy(() => import("./pages/TestingDashboard"));
const Monitoreo = lazy(() => import("./pages/Monitoreo"));

import { lazy } from "react";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/auth" element={
                <LazyComponent>
                  <Auth />
                </LazyComponent>
              } />
              <Route path="/" element={
                <LazyComponent>
                  <Index />
                </LazyComponent>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <LazyComponent>
                      <Dashboard />
                    </LazyComponent>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/facturas" element={
                <ProtectedRoute>
                  <Layout>
                    <LazyComponent>
                      <Facturas />
                    </LazyComponent>
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
  </ErrorBoundary>
);

export default App;