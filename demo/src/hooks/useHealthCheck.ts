import { useState, useEffect } from 'react';
import { webhookService } from '@/services/webhookService';

export interface HealthCheckResult {
  id: string;
  service_name: string;
  status: 'healthy' | 'unhealthy' | 'offline';
  response_time_ms: number;
  last_check: string;
  error_message?: string;
  details?: any;
}

export interface HealthStatus {
  supabase: boolean;
  n8n: boolean;
  afip: boolean;
  mercado_pago: boolean;
}

export const useHealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [history, setHistory] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runManualCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simular health checks de diferentes servicios
      const checks = await Promise.allSettled([
        checkSupabaseHealth(),
        checkN8nHealth(),
        checkAfipHealth(),
        checkMercadoPagoHealth()
      ]);

      const results: HealthStatus = {
        supabase: checks[0].status === 'fulfilled' && checks[0].value,
        n8n: checks[1].status === 'fulfilled' && checks[1].value,
        afip: checks[2].status === 'fulfilled' && checks[2].value,
        mercado_pago: checks[3].status === 'fulfilled' && checks[3].value
      };

      setHealthStatus(results);

      // Agregar a historial
      const newHistoryEntry: HealthCheckResult = {
        id: Date.now().toString(),
        service_name: 'all_services',
        status: Object.values(results).every(Boolean) ? 'healthy' : 'unhealthy',
        response_time_ms: Math.random() * 1000 + 100, // Simular tiempo de respuesta
        last_check: new Date().toISOString(),
        details: results
      };

      setHistory(prev => [newHistoryEntry, ...prev.slice(0, 49)]); // Mantener solo los últimos 50

    } catch (err) {
      console.error('Error during health check:', err);
      setError('Error al realizar el health check');
    } finally {
      setLoading(false);
    }
  };

  const checkSupabaseHealth = async (): Promise<boolean> => {
    try {
      // Simular verificación de Supabase
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      return Math.random() > 0.1; // 90% de probabilidad de éxito
    } catch {
      return false;
    }
  };

  const checkN8nHealth = async (): Promise<boolean> => {
    try {
      // Simular verificación de n8n
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));
      return Math.random() > 0.05; // 95% de probabilidad de éxito
    } catch {
      return false;
    }
  };

  const checkAfipHealth = async (): Promise<boolean> => {
    try {
      // Simular verificación de AFIP (más propenso a fallos)
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
      return Math.random() > 0.15; // 85% de probabilidad de éxito
    } catch {
      return false;
    }
  };

  const checkMercadoPagoHealth = async (): Promise<boolean> => {
    try {
      // Simular verificación de Mercado Pago
      await new Promise(resolve => setTimeout(resolve, 120 + Math.random() * 250));
      return Math.random() > 0.02; // 98% de probabilidad de éxito
    } catch {
      return false;
    }
  };

  const start = () => {
    setIsRunning(true);
    // Ejecutar health check inicial
    runManualCheck();
  };

  const stop = () => {
    setIsRunning(false);
  };

  const loadMetrics = async () => {
    // Cargar métricas históricas simuladas
    const mockHistory: HealthCheckResult[] = [
      {
        id: '1',
        service_name: 'all_services',
        status: 'healthy',
        response_time_ms: 245,
        last_check: new Date(Date.now() - 300000).toISOString(),
        details: {
          supabase: true,
          n8n: true,
          afip: true,
          mercado_pago: true
        }
      },
      {
        id: '2',
        service_name: 'all_services',
        status: 'unhealthy',
        response_time_ms: 850,
        last_check: new Date(Date.now() - 600000).toISOString(),
        details: {
          supabase: true,
          n8n: true,
          afip: false,
          mercado_pago: true
        },
        error_message: 'AFIP service timeout'
      },
      {
        id: '3',
        service_name: 'all_services',
        status: 'healthy',
        response_time_ms: 320,
        last_check: new Date(Date.now() - 900000).toISOString(),
        details: {
          supabase: true,
          n8n: true,
          afip: true,
          mercado_pago: true
        }
      }
    ];

    setHistory(mockHistory);
  };

  const getHistory = async (hours: number = 24): Promise<HealthCheckResult[]> => {
    // Simular obtener historial de las últimas N horas
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return history.filter(entry => new Date(entry.last_check).getTime() > cutoffTime);
  };

  // Auto-refresh cuando está corriendo
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      runManualCheck();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [isRunning]);

  // Cargar datos iniciales
  useEffect(() => {
    loadMetrics();
    runManualCheck();
  }, []);

  return {
    healthStatus,
    history,
    loading,
    error,
    isRunning,
    runManualCheck,
    start,
    stop,
    loadMetrics,
    getHistory
  };
};