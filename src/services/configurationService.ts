import { supabase } from '@/integrations/supabase/client';
import { webhookService } from './webhookService';
import { afipValidationService } from './afipValidationService';
import { configManager } from '@/config/app';
import { errorHandler } from '@/utils/errorHandler';
import { toast } from 'sonner';

export interface ConfigurationBackup {
  id: string;
  backup_name: string;
  backup_type: 'manual' | 'automatic' | 'pre_change';
  configuration_data: any;
  created_at: string;
  description?: string;
}

export interface ConfigurationChange {
  id: string;
  configuration_type: string;
  configuration_name: string;
  old_value: any;
  new_value: any;
  change_reason?: string;
  is_rollback: boolean;
  created_at: string;
}

export interface ConnectivityTest {
  id: string;
  test_type: string;
  endpoint_url: string;
  test_status: 'success' | 'failure' | 'timeout';
  response_time_ms?: number;
  status_code?: number;
  response_data?: any;
  error_message?: string;
  created_at: string;
}

export interface TestStats {
  test_type: string;
  total_tests: number;
  successful_tests: number;
  failed_tests: number;
  avg_response_time: number;
  success_rate: number;
  last_test_time: string;
}

class ConfigurationService {
  private readonly BACKUP_RETENTION_DAYS = 180;
  private readonly HISTORY_RETENTION_DAYS = 90;
  private readonly TEST_RETENTION_DAYS = 30;

  // Crear backup de configuración
  async createBackup(
    backupName: string,
    backupType: 'manual' | 'automatic' | 'pre_change',
    description?: string
  ): Promise<string | null> {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Usuario no autenticado');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.empresa_id) throw new Error('Empresa no asignada');

      // Obtener configuración actual
      const currentConfig = {
        app_config: configManager.getConfig(),
        webhook_endpoints: webhookService.getEndpoints(),
        n8n_config: webhookService.getConfig(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      const { data, error } = await supabase.rpc('create_configuration_backup', {
        p_empresa_id: userProfile.empresa_id,
        p_backup_name: backupName,
        p_backup_type: backupType,
        p_configuration_data: currentConfig,
        p_created_by: profile.user.id,
        p_description: description
      });

      if (error) throw error;

      toast.success(`Backup "${backupName}" creado exitosamente`);
      return data;

    } catch (error) {
      console.error('Error creating backup:', error);
      errorHandler.handle(error, 'configuration-backup');
      return null;
    }
  }

  // Obtener lista de backups
  async getBackups(): Promise<ConfigurationBackup[]> {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return [];

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.empresa_id) return [];

      const { data, error } = await supabase
        .from('configuration_backups')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  // Restaurar desde backup
  async restoreFromBackup(backupId: string, reason?: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Usuario no autenticado');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.empresa_id) throw new Error('Empresa no asignada');

      // Obtener backup
      const { data: backup, error: backupError } = await supabase
        .from('configuration_backups')
        .select('*')
        .eq('id', backupId)
        .eq('empresa_id', userProfile.empresa_id)
        .single();

      if (backupError) throw backupError;
      if (!backup) throw new Error('Backup no encontrado');

      // Crear backup automático antes del rollback
      await this.createBackup(
        `Pre-Rollback ${new Date().toISOString()}`,
        'automatic',
        'Backup automático antes de rollback'
      );

      // Obtener configuración actual para el log
      const currentConfig = configManager.getConfig();

      // Aplicar configuración del backup
      const backupConfig = backup.configuration_data;
      
      if (backupConfig.app_config) {
        configManager.updateConfig(backupConfig.app_config);
      }

      if (backupConfig.webhook_endpoints) {
        webhookService.updateEndpoints(backupConfig.webhook_endpoints);
      }

      // Registrar el cambio
      await this.logConfigurationChange(
        'system',
        'full_restore',
        currentConfig,
        backupConfig,
        reason || 'Restauración desde backup',
        true
      );

      toast.success(`Configuración restaurada desde "${backup.backup_name}"`);
      return true;

    } catch (error) {
      console.error('Error restoring backup:', error);
      errorHandler.handle(error, 'configuration-restore');
      return false;
    }
  }

  // Registrar cambio de configuración
  async logConfigurationChange(
    configurationType: string,
    configurationName: string,
    oldValue: any,
    newValue: any,
    reason?: string,
    isRollback: boolean = false
  ): Promise<void> {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.empresa_id) return;

      await supabase.rpc('log_configuration_change', {
        p_empresa_id: userProfile.empresa_id,
        p_configuration_type: configurationType,
        p_configuration_name: configurationName,
        p_old_value: oldValue,
        p_new_value: newValue,
        p_changed_by: profile.user.id,
        p_change_reason: reason,
        p_is_rollback: isRollback
      });

    } catch (error) {
      console.error('Error logging configuration change:', error);
    }
  }

  // Obtener historial de cambios
  async getConfigurationHistory(): Promise<ConfigurationChange[]> {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return [];

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.empresa_id) return [];

      const { data, error } = await supabase
        .from('endpoint_configurations_history')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting configuration history:', error);
      return [];
    }
  }

  // Test de conectividad
  async testConnectivity(
    testType: string,
    endpointUrl: string,
    options: {
      timeout?: number;
      expectedStatus?: number[];
      headers?: Record<string, string>;
    } = {}
  ): Promise<ConnectivityTest | null> {
    const startTime = Date.now();
    let testResult: ConnectivityTest | null = null;

    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Usuario no autenticado');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.empresa_id) throw new Error('Empresa no asignada');

      const { timeout = 10000, expectedStatus = [200, 201], headers = {} } = options;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          source: 'ContaPYME-ConfigTest'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const responseData = await response.json().catch(() => ({}));

      const testStatus = expectedStatus.includes(response.status) ? 'success' : 'failure';

      // Registrar test en base de datos
      const { data: testId } = await supabase.rpc('log_connectivity_test', {
        p_empresa_id: userProfile.empresa_id,
        p_test_type: testType,
        p_endpoint_url: endpointUrl,
        p_test_status: testStatus,
        p_response_time_ms: responseTime,
        p_status_code: response.status,
        p_response_data: responseData,
        p_tested_by: profile.user.id
      });

      testResult = {
        id: testId || crypto.randomUUID(),
        test_type: testType,
        endpoint_url: endpointUrl,
        test_status: testStatus,
        response_time_ms: responseTime,
        status_code: response.status,
        response_data: responseData,
        created_at: new Date().toISOString()
      };

      if (testStatus === 'success') {
        toast.success(`Test ${testType} exitoso (${responseTime}ms)`);
      } else {
        toast.error(`Test ${testType} falló - HTTP ${response.status}`);
      }

      return testResult;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Determinar tipo de error
      let testStatus: 'failure' | 'timeout' = 'failure';
      if (error instanceof Error && error.name === 'AbortError') {
        testStatus = 'timeout';
      }

      try {
        const { data: profile } = await supabase.auth.getUser();
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', profile.user!.id)
          .single();

        if (userProfile?.empresa_id) {
          const { data: testId } = await supabase.rpc('log_connectivity_test', {
            p_empresa_id: userProfile.empresa_id,
            p_test_type: testType,
            p_endpoint_url: endpointUrl,
            p_test_status: testStatus,
            p_response_time_ms: responseTime,
            p_error_message: errorMessage,
            p_tested_by: profile.user!.id
          });

          testResult = {
            id: testId || crypto.randomUUID(),
            test_type: testType,
            endpoint_url: endpointUrl,
            test_status: testStatus,
            response_time_ms: responseTime,
            error_message: errorMessage,
            created_at: new Date().toISOString()
          };
        }
      } catch (logError) {
        console.error('Error logging test result:', logError);
      }

      toast.error(`Test ${testType} falló: ${errorMessage}`);
      return testResult;
    }
  }

  // Test múltiples endpoints
  async testAllEndpoints(): Promise<ConnectivityTest[]> {
    const results: ConnectivityTest[] = [];
    const config = configManager.getConfig();

    // Test n8n health check
    if (config.api.n8n.baseUrl && config.api.n8n.baseUrl !== 'https://n8n.n8ncloud.top') {
      const healthResult = await this.testConnectivity(
        'n8n_health',
        `${config.api.n8n.baseUrl}/webhook/health-check`,
        {
          headers: config.api.n8n.apiKey ? { 'X-N8N-API-KEY': config.api.n8n.apiKey } : {}
        }
      );
      if (healthResult) results.push(healthResult);
    }

    // Test AFIP connection
    const afipResult = await this.testConnectivity(
      'afip_connection',
      `${config.api.n8n.baseUrl}/webhook/afip-health-check`
    );
    if (afipResult) results.push(afipResult);

    // Test Supabase
    const supabaseResult = await this.testConnectivity(
      'supabase_connection',
      `${config.api.supabase.url}/rest/v1/`,
      {
        headers: {
          'apikey': config.api.supabase.anonKey,
          'Authorization': `Bearer ${config.api.supabase.anonKey}`
        },
        expectedStatus: [200, 401] // 401 es OK para este endpoint
      }
    );
    if (supabaseResult) results.push(supabaseResult);

    return results;
  }

  // Obtener estadísticas de tests
  async getTestStats(hours: number = 24): Promise<TestStats[]> {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return [];

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.empresa_id) return [];

      const { data, error } = await supabase.rpc('get_connectivity_test_stats', {
        p_empresa_id: userProfile.empresa_id,
        p_hours: hours
      });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting test stats:', error);
      return [];
    }
  }

  // Obtener tests recientes
  async getRecentTests(limit: number = 50): Promise<ConnectivityTest[]> {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return [];

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.empresa_id) return [];

      const { data, error } = await supabase
        .from('configuration_tests')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting recent tests:', error);
      return [];
    }
  }

  // Exportar configuración
  async exportConfiguration(): Promise<string> {
    try {
      const config = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        app_config: configManager.getConfig(),
        webhook_endpoints: webhookService.getEndpoints(),
        n8n_config: webhookService.getConfig(),
        export_metadata: {
          exported_by: (await supabase.auth.getUser()).data.user?.email,
          export_date: new Date().toISOString(),
          system_version: configManager.getConfig().app.version
        }
      };

      return JSON.stringify(config, null, 2);

    } catch (error) {
      console.error('Error exporting configuration:', error);
      throw error;
    }
  }

  // Importar configuración
  async importConfiguration(configJson: string, createBackup: boolean = true): Promise<boolean> {
    try {
      const importedConfig = JSON.parse(configJson);

      // Validar estructura básica
      if (!importedConfig.app_config || !importedConfig.webhook_endpoints) {
        throw new Error('Formato de configuración inválido');
      }

      // Crear backup antes de importar
      if (createBackup) {
        await this.createBackup(
          `Pre-Import ${new Date().toISOString()}`,
          'pre_change',
          'Backup automático antes de importar configuración'
        );
      }

      // Obtener configuración actual para el log
      const currentConfig = configManager.getConfig();

      // Aplicar configuración importada
      if (importedConfig.app_config) {
        configManager.updateConfig(importedConfig.app_config);
      }

      if (importedConfig.webhook_endpoints) {
        webhookService.updateEndpoints(importedConfig.webhook_endpoints);
      }

      // Registrar el cambio
      await this.logConfigurationChange(
        'system',
        'import',
        currentConfig,
        importedConfig,
        'Importación de configuración'
      );

      toast.success('Configuración importada exitosamente');
      return true;

    } catch (error) {
      console.error('Error importing configuration:', error);
      errorHandler.handle(error, 'configuration-import');
      return false;
    }
  }

  // Limpiar datos antiguos
  async cleanupOldData(): Promise<void> {
    try {
      await supabase.rpc('cleanup_old_configuration_data');
      toast.success('Datos antiguos limpiados exitosamente');
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      toast.error('Error al limpiar datos antiguos');
    }
  }

  // Validar configuración actual
  async validateCurrentConfiguration(): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      const config = configManager.getConfig();

      // Validar URL de n8n
      if (!config.api.n8n.baseUrl || 
          config.api.n8n.baseUrl === 'https://n8n.n8ncloud.top') {
        issues.push('URL de n8n no configurada');
      } else {
        try {
          new URL(config.api.n8n.baseUrl);
        } catch {
          issues.push('URL de n8n inválida');
        }
      }

      // Validar API Key
      if (!config.api.n8n.apiKey) {
        warnings.push('API Key de n8n no configurada');
      }

      // Validar Supabase
      if (!config.api.supabase.url || !config.api.supabase.anonKey) {
        issues.push('Configuración de Supabase incompleta');
      }

      // Test de conectividad básico
      if (issues.length === 0) {
        try {
          const testResults = await this.testAllEndpoints();
          const failedTests = testResults.filter(t => t.test_status !== 'success');
          
          if (failedTests.length > 0) {
            warnings.push(`${failedTests.length} servicios no responden correctamente`);
          }
        } catch (error) {
          warnings.push('No se pudo verificar conectividad');
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        issues: ['Error validando configuración'],
        warnings: []
      };
    }
  }

  // Auto-test periódico
  async startPeriodicTesting(intervalMinutes: number = 15): Promise<() => void> {
    const interval = setInterval(async () => {
      try {
        await this.testAllEndpoints();
      } catch (error) {
        console.error('Error in periodic testing:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Retornar función para detener
    return () => clearInterval(interval);
  }
}

export const configurationService = new ConfigurationService();
export default configurationService;