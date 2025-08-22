import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ConfigProvider } from '@/contexts/ConfigContext';

// Crear QueryClient para testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

// Props para el wrapper de testing
interface AllTheProvidersProps {
  children: React.ReactNode;
}

// Wrapper que incluye todos los providers necesarios
const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

// Función personalizada de render que incluye todos los providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-exportar todo de testing-library
export * from '@testing-library/react';
export { customRender as render };

// Mock de Supabase
export const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
};

// Mock de datos de prueba
export const mockData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    empresa_id: 'test-empresa-id',
    role: 'admin' as const,
  },
  empresa: {
    id: 'test-empresa-id',
    razon_social: 'Empresa Test S.A.',
    cuit: '20304050607',
  },
  facturas: [
    {
      id: 'test-factura-1',
      numero_factura: '0001-00000001',
      total: 1000,
      estado: 'pendiente',
    },
  ],
  productos: [
    {
      id: 'test-producto-1',
      sku: 'PROD001',
      nombre: 'Producto Test',
      stock_actual: 10,
      stock_minimo: 5,
    },
  ],
};

// Helper para simular usuario autenticado
export const renderWithAuth = (
  ui: React.ReactElement,
  user = mockData.user,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Mock de localStorage con datos de usuario
  localStorage.setItem('user', JSON.stringify(user));
  
  return customRender(ui, options);
};

// Helper para simular usuario no autenticado
export const renderWithoutAuth = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Limpiar localStorage
  localStorage.clear();
  
  return customRender(ui, options);
};

// Helper para esperar que se complete una operación asíncrona
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para simular eventos de usuario
export const userEvent = {
  click: (element: Element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true })),
  type: (element: HTMLInputElement, text: string) => {
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  },
  submit: (form: HTMLFormElement) => form.dispatchEvent(new Event('submit', { bubbles: true })),
}; 