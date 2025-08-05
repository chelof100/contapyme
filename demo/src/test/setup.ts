import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de variables de entorno para testing
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('VITE_N8N_WEBHOOK_URL', 'https://test-n8n.com');

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    if (key === 'recetasEnabled') return 'false';
    if (key === 'user') return null;
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Configuración global para testing
beforeEach(() => {
  // Limpiar todos los mocks antes de cada test
  vi.clearAllMocks();
  
  // Limpiar localStorage
  localStorageMock.clear();
  
  // Resetear document body
  document.body.innerHTML = '';
});

afterEach(() => {
  // Limpiar después de cada test
  vi.clearAllMocks();
}); 