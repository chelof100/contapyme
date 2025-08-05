import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import Dashboard from '@/pages/Dashboard';

// Mock de los servicios
vi.mock('@/services/webhookService', () => ({
  webhookService: {
    healthCheck: vi.fn().mockResolvedValue({ success: true }),
    getMetrics: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
  WebhookService: vi.fn(),
}));

vi.mock('@/services/userAnalyticsService', () => ({
  userAnalyticsService: {
    trackPageView: vi.fn(),
    getQuickActions: vi.fn().mockResolvedValue([]),
  },
}));

describe('Dashboard', () => {
  it('debería renderizar el título del dashboard', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('debería mostrar el estado del sistema', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Sistema')).toBeInTheDocument();
    });
  });

  it('debería mostrar la sección de acciones rápidas', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
    });
  });

  it('debería mostrar la sección de facturas emitidas', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Facturas Emitidas')).toBeInTheDocument();
    });
  });

    it('debería manejar errores de carga graciosamente', async () => {
    // Mock de error
    const { webhookService } = await import('@/services/webhookService');
    vi.mocked(webhookService.healthCheck)
      .mockRejectedValueOnce(new Error('Network error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
}); 