import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ConfigProvider } from '@/contexts/ConfigContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard_mejorado'
import Index from '@/pages/Index'
import NotFound from '@/pages/NotFound'

// Importar páginas faltantes
import Facturas from '@/pages/Facturas'
import OrdenesCompra from '@/pages/OrdenesCompra'
import OrdenesRecepcion from '@/pages/OrdenesRecepcion'
import Stock from '@/pages/Stock'
import Pagos from '@/pages/Pagos'
import Recetas from '@/pages/Recetas'
import Configuracion from '@/pages/Configuracion'
import Clientes from '@/pages/crm/Clientes'
import Oportunidades from '@/pages/crm/Oportunidades'
import Actividades from '@/pages/crm/Actividades'
import Campanas from '@/pages/crm/Campanas'
import Finanzas from '@/pages/erp/Finanzas'
import Empleados from '@/pages/erp/Empleados'
import Proyectos from '@/pages/erp/Proyectos'
import Rentabilidad from '@/pages/erp/Rentabilidad'
import UsuariosAdmin from '@/pages/admin/Usuarios'
import TestingDashboard from '@/pages/TestingDashboard'
import Monitoreo from '@/pages/Monitoreo'
import AdminResetPassword from '@/pages/AdminResetPassword'

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Login />} />
          <Route path="/admin-reset-password" element={<AdminResetPassword />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Accounting routes */}
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
          <Route path="/stock" element={
            <ProtectedRoute>
              <Layout>
                <Stock />
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
          <Route path="/recetas" element={
            <ProtectedRoute>
              <Layout>
                <Recetas />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* CRM routes */}
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
          
          {/* ERP routes */}
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
          <Route path="/erp/rentabilidad" element={
            <ProtectedRoute>
              <Layout>
                <Rentabilidad />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/usuarios" element={
            <ProtectedRoute>
              <Layout>
                <UsuariosAdmin />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* System routes */}
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
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
