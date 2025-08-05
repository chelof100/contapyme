import { useState, useEffect } from 'react';
import { webhookService } from '@/services/webhookService';

export interface SystemMetrics {
  system_health_score: number;
  total_workflows_24h: number;
  successful_workflows_24h: number;
  failed_workflows_24h: number;
  avg_response_time_ms: number;
  total_errors_24h: number;
  critical_errors_24h: number;
  uptime: number;
  active_users: number;
  transactions_per_hour: number;
}

export interface WorkflowPerformance {
  id: string;
  name: string;
  success_rate: number;
  avg_execution_time: number;
  total_executions: number;
  last_execution: string;
}

export interface WorkflowMetric {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running';
  execution_time: number;
  timestamp: string;
  error_message?: string;
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  service: string;
  stack_trace?: string;
}

export interface IntegrationStatus {
  id: string;
  integration_name: string;
  status: 'healthy' | 'unhealthy' | 'offline';
  uptime_percentage: number;
  response_time_ms?: number;
  success_count_24h: number;
  error_count_24h: number;
  health_grade: string;
  last_error_time?: string;
}

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [workflowPerformance, setWorkflowPerformance] = useState<WorkflowPerformance[]>([]);
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowMetric[]>([]);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular datos de métricas del sistema
      const mockMetrics: SystemMetrics = {
        system_health_score: 92.5,
        total_workflows_24h: 1247,
        successful_workflows_24h: 1189,
        failed_workflows_24h: 58,
        avg_response_time_ms: 245,
        total_errors_24h: 23,
        critical_errors_24h: 2,
        uptime: 15,
        active_users: 8,
        transactions_per_hour: 156
      };

      const mockWorkflowPerformance: WorkflowPerformance[] = [
        {
          id: '1',
          name: 'Procesamiento de Facturas',
          success_rate: 98.5,
          avg_execution_time: 1.2,
          total_executions: 456,
          last_execution: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Sincronización de Stock',
          success_rate: 95.2,
          avg_execution_time: 0.8,
          total_executions: 789,
          last_execution: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Validación AFIP',
          success_rate: 99.1,
          avg_execution_time: 2.1,
          total_executions: 234,
          last_execution: new Date().toISOString()
        }
      ];

      const mockRecentWorkflows: WorkflowMetric[] = [
        {
          id: '1',
          name: 'Procesamiento de Facturas',
          status: 'success',
          execution_time: 1.1,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Sincronización de Stock',
          status: 'success',
          execution_time: 0.9,
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: '3',
          name: 'Validación AFIP',
          status: 'failed',
          execution_time: 2.5,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          error_message: 'Timeout en conexión con AFIP'
        }
      ];

      const mockRecentErrors: ErrorLog[] = [
        {
          id: '1',
          level: 'error',
          message: 'Timeout en conexión con AFIP',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          service: 'afip_validation',
          stack_trace: 'Error: ETIMEDOUT at Timeout._onTimeout'
        },
        {
          id: '2',
          level: 'warning',
          message: 'Stock bajo en producto PROD001',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          service: 'stock_management'
        },
        {
          id: '3',
          level: 'info',
          message: 'Backup automático completado',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          service: 'backup_service'
        }
      ];

      const mockIntegrations: IntegrationStatus[] = [
        {
          id: '1',
          integration_name: 'supabase',
          status: 'healthy',
          uptime_percentage: 99.9,
          response_time_ms: 45,
          success_count_24h: 1247,
          error_count_24h: 1,
          health_grade: 'A+'
        },
        {
          id: '2',
          integration_name: 'n8n',
          status: 'healthy',
          uptime_percentage: 99.5,
          response_time_ms: 120,
          success_count_24h: 892,
          error_count_24h: 4,
          health_grade: 'A'
        },
        {
          id: '3',
          integration_name: 'afip',
          status: 'unhealthy',
          uptime_percentage: 95.2,
          response_time_ms: 850,
          success_count_24h: 234,
          error_count_24h: 12,
          health_grade: 'C',
          last_error_time: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: '4',
          integration_name: 'mercado_pago',
          status: 'healthy',
          uptime_percentage: 99.8,
          response_time_ms: 180,
          success_count_24h: 156,
          error_count_24h: 1,
          health_grade: 'A'
        }
      ];

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));

      setMetrics(mockMetrics);
      setWorkflowPerformance(mockWorkflowPerformance);
      setRecentWorkflows(mockRecentWorkflows);
      setRecentErrors(mockRecentErrors);
      setIntegrations(mockIntegrations);

    } catch (err) {
      console.error('Error loading system metrics:', err);
      setError('Error al cargar las métricas del sistema');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await loadMetrics();
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return {
    metrics,
    workflowPerformance,
    recentWorkflows,
    recentErrors,
    integrations,
    loading,
    error,
    refetch,
    loadMetrics
  };
};