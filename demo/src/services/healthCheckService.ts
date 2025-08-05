import { supabase } from '@/integrations/supabase/client';
import { configManager } from '@/config/app';
import { errorHandler } from '@/utils/errorHandler';
import { toast } from 'sonner';

export interface HealthCheckResult {
  service: string;
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'timeout' | 'error';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  totalChecks: number;
  healthyChecks: number;
  unhealthyChecks: number;
  healthPercentage: number;
  avgResponseTime: number;
  lastCheckTime: Date | null;
  isHealthy: boolean;
}

export interface HealthCheckConfig {
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  alertThreshold: number; // consecutive failures before alert
  services: HealthCheckService[];
}

export interface HealthCheckService {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number[];
  timeout?: number;
  critical: boolean; // if true, affects overall system health
}

class HealthCheckManager {
  private config: HealthCheckConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private listeners: Array<(results: HealthCheckResult[]) => void> = [];
  private lastResults: HealthCheckResult[] = [];
  private consecutiveFailures: Map<string, number> = new Map();

  constructor() {
    const appConfig = configManager.getConfig();
    
    this.config = {
      interval: 5 * 60 * 1000, // 5 minutos
      timeout: 10000, // 10 segundos
      retryAttempts: 3,
      retryDelay: 1000, // 1 segundo
      backoffMultiplier: 2,
      alertThreshold: 3,
      services: [
        {
          name: 'n8n-health',
          url: `${appConfig.api.n8n.baseUrl}/webhook/health-check`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(appConfig.api.n8n.apiKey && { 'X-N8N-API-KEY': appConfig.api.n8n.apiKey })
          },
          body: {
            timestamp: new Date().toISOString(),
            source: 'ContaPYME-HealthCheck'
          },
          expectedStatus: [200, 201],
          critical: true
        },
        {
          name: 'supabase-health',
          url: `${appConfig.api.supabase.url}/rest/v1/`,
          method: 'GET',
          headers: {
            'apikey': appConfig.api.supabase.anonKey,
            'Authorization': `Bearer ${appConfig.api.supabase.anonKey}`
          },
          expectedStatus: [200],
          critical: true
        }
      ]
    };
  }

  // Iniciar health checks automáticos
  public start(): void {
    if (this.isRunning) {
      console.warn('Health check manager already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting health check manager...');
    
    // Ejecutar inmediatamente
    this.runHealthChecks();
    
    // Programar ejecuciones periódicas
    this.intervalId = setInterval(() => {
      this.runHealthChecks();
    }, this.config.interval);
  }

  // Detener health checks
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Health check manager stopped');
  }

  // Ejecutar health checks para todos los servicios
  private async runHealthChecks(): Promise<void> {
    console.log('Running health checks...');
    const results: HealthCheckResult[] = [];

    for (const service of this.config.services) {
      try {
        const result = await this.checkService(service);
        results.push(result);
        await this.logHealthCheck(result);
        this.handleServiceResult(service, result);
      } catch (error) {
        console.error(`Health check failed for ${service.name}:`, error);
        const errorResult: HealthCheckResult = {
          service: service.name,
          endpoint: service.url,
          status: 'error',
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        };
        results.push(errorResult);
        await this.logHealthCheck(errorResult);
        this.handleServiceResult(service, errorResult);
      }
    }

    this.lastResults = results;
    this.notifyListeners(results);
    
    // Registrar métricas del sistema
    await this.recordSystemMetrics(results);
  }

  // Verificar un servicio específico con reintentos
  private async checkService(service: HealthCheckService): Promise<HealthCheckResult> {
    let lastError: Error | null = null;
    let currentDelay = this.config.retryDelay;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), service.timeout || this.config.timeout);

        const response = await fetch(service.url, {
          method: service.method,
          headers: service.headers || {},
          body: service.body ? JSON.stringify(service.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        const expectedStatus = service.expectedStatus || [200];
        const isHealthy = expectedStatus.includes(response.status);

        return {
          service: service.name,
          endpoint: service.url,
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime,
          statusCode: response.status,
          timestamp: new Date(),
          metadata: {
            attempt: attempt + 1,
            expectedStatus,
            actualStatus: response.status
          }
        };

      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            service: service.name,
            endpoint: service.url,
            status: 'timeout',
            responseTime: service.timeout || this.config.timeout,
            error: 'Request timeout',
            timestamp: new Date(),
            metadata: { attempt: attempt + 1 }
          };
        }

        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= this.config.backoffMultiplier;
        }
      }
    }

    return {
      service: service.name,
      endpoint: service.url,
      status: 'error',
      responseTime: 0,
      error: lastError?.message || 'Unknown error',
      timestamp: new Date(),
      metadata: { attempts: this.config.retryAttempts + 1 }
    };
  }

  // Manejar resultado de servicio (alertas, etc.)
  private handleServiceResult(service: HealthCheckService, result: HealthCheckResult): void {
    const serviceName = service.name;
    
    if (result.status === 'healthy') {
      // Reset contador de fallos consecutivos
      this.consecutiveFailures.set(serviceName, 0);
    } else {
      // Incrementar contador de fallos
      const failures = (this.consecutiveFailures.get(serviceName) || 0) + 1;
      this.consecutiveFailures.set(serviceName, failures);
      
      // Mostrar alerta si es servicio crítico y supera el umbral
      if (service.critical && failures >= this.config.alertThreshold) {
        this.showCriticalAlert(service, result, failures);
      }
    }
  }

  // Mostrar alerta crítica
  private showCriticalAlert(service: HealthCheckService, result: HealthCheckResult, failures: number): void {
    const alertLevel = failures >= 5 ? 'critical' : 'warning';
    const message = `${service.name} no responde (${failures} fallos consecutivos)`;
    
    if (alertLevel === 'critical') {
      toast.error(message, {
        description: result.error || 'Servicio no disponible',
        duration: 10000,
        action: {
          label: 'Reintentar',
          onClick: () => this.runHealthChecks()
        }
      });
    } else {
      toast.warning(message, {
        description: 'Verificando conectividad...',
        duration: 5000
      });
    }
  }

  // Registrar health check en Supabase
  private async logHealthCheck(result: HealthCheckResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('health_checks_log')
        .insert({
          service_name: result.service,
          endpoint_url: result.endpoint,
          status: result.status,
          response_time_ms: result.responseTime,
          status_code: result.statusCode,
          error_message: result.error,
          metadata: result.metadata || {},
          checked_at: result.timestamp.toISOString()
        });

      if (error) {
        console.error('Error logging health check:', error);
      }
    } catch (error) {
      console.error('Failed to log health check:', error);
    }
  }

  // Registrar métricas del sistema
  private async recordSystemMetrics(results: HealthCheckResult[]): Promise<void> {
    try {
      const healthyCount = results.filter(r => r.status === 'healthy').length;
      const totalCount = results.length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalCount;
      const healthPercentage = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0;

      const metrics = [
        {
          metric_name: 'health_check_total',
          metric_value: totalCount,
          metric_unit: 'count',
          metric_type: 'gauge',
          tags: { check_run: new Date().toISOString() }
        },
        {
          metric_name: 'health_check_healthy',
          metric_value: healthyCount,
          metric_unit: 'count',
          metric_type: 'gauge',
          tags: { check_run: new Date().toISOString() }
        },
        {
          metric_name: 'health_check_percentage',
          metric_value: healthPercentage,
          metric_unit: 'percent',
          metric_type: 'gauge',
          tags: { check_run: new Date().toISOString() }
        },
        {
          metric_name: 'avg_response_time',
          metric_value: avgResponseTime,
          metric_unit: 'milliseconds',
          metric_type: 'gauge',
          tags: { check_run: new Date().toISOString() }
        }
      ];

      const { error } = await supabase
        .from('system_metrics')
        .insert(metrics);

      if (error) {
        console.error('Error recording system metrics:', error);
      }
    } catch (error) {
      console.error('Failed to record system metrics:', error);
    }
  }

  // Obtener métricas del sistema
  public async getSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_health_metrics', { 
          empresa_uuid: (await this.getCurrentEmpresaId()) 
        });

      if (error) {
        console.error('Error getting system metrics:', error);
        return null;
      }

      return {
        totalChecks: data.total_checks || 0,
        healthyChecks: data.healthy_checks || 0,
        unhealthyChecks: data.unhealthy_checks || 0,
        healthPercentage: data.health_percentage || 0,
        avgResponseTime: data.avg_response_time_ms || 0,
        lastCheckTime: data.last_check_time ? new Date(data.last_check_time) : null,
        isHealthy: data.is_healthy || false
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return null;
    }
  }

  // Obtener historial de health checks
  public async getHealthCheckHistory(hours: number = 24): Promise<HealthCheckResult[]> {
    try {
      const { data, error } = await supabase
        .from('health_checks_log')
        .select('*')
        .gte('checked_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('checked_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error getting health check history:', error);
        return [];
      }

      return data.map(record => ({
        service: record.service_name,
        endpoint: record.endpoint_url,
        status: record.status as any,
        responseTime: record.response_time_ms || 0,
        statusCode: record.status_code,
        error: record.error_message,
        timestamp: new Date(record.checked_at),
        metadata: record.metadata
      }));
    } catch (error) {
      console.error('Failed to get health check history:', error);
      return [];
    }
  }

  // Obtener empresa actual
  private async getCurrentEmpresaId(): Promise<string> {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return 'default-empresa-id';

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', data.user.id)
        .single();

      return profile?.empresa_id || 'default-empresa-id';
    } catch (error) {
      return 'default-empresa-id';
    }
  }

  // Suscribirse a cambios de health check
  public subscribe(listener: (results: HealthCheckResult[]) => void): () => void {
    this.listeners.push(listener);
    
    // Enviar resultados actuales inmediatamente
    if (this.lastResults.length > 0) {
      listener(this.lastResults);
    }
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notificar a listeners
  private notifyListeners(results: HealthCheckResult[]): void {
    this.listeners.forEach(listener => {
      try {
        listener(results);
      } catch (error) {
        console.error('Error in health check listener:', error);
      }
    });
  }

  // Ejecutar health check manual
  public async runManualCheck(): Promise<HealthCheckResult[]> {
    await this.runHealthChecks();
    return this.lastResults;
  }

  // Obtener últimos resultados
  public getLastResults(): HealthCheckResult[] {
    return [...this.lastResults];
  }

  // Verificar si el sistema está saludable
  public isSystemHealthy(): boolean {
    if (this.lastResults.length === 0) return false;
    
    const criticalServices = this.config.services.filter(s => s.critical);
    const criticalResults = this.lastResults.filter(r => 
      criticalServices.some(s => s.name === r.service)
    );
    
    return criticalResults.every(r => r.status === 'healthy');
  }

  // Obtener configuración actual
  public getConfig(): HealthCheckConfig {
    return { ...this.config };
  }

  // Actualizar configuración
  public updateConfig(newConfig: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar si está corriendo
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  // Limpiar logs antiguos manualmente
  public async cleanupOldLogs(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_old_health_checks');
      if (error) {
        console.error('Error cleaning up old logs:', error);
      } else {
        console.log('Old health check logs cleaned up');
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

// Instancia singleton
export const healthCheckManager = new HealthCheckManager();

// Auto-iniciar en desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Esperar un poco antes de iniciar para que la app se cargue
  setTimeout(() => {
    //healthCheckManager.start();
  }, 5000);
}

export default healthCheckManager;
// TEMPORALMENTE DESACTIVADO - CORS issues con n8n
// // Auto-iniciar en desarrollo
// if (typeof window !== 'undefined' && import.meta.env.DEV) {
//   // Esperar un poco antes de iniciar para que la app se cargue
//   setTimeout(() => {
//     healthCheckManager.start();
//   }, 5000);
// }