import { useState, useEffect, useCallback } from 'react';
import { configManager, AppConfig } from '@/config/app';
import { toast } from 'sonner';

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(configManager.getConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suscribirse a cambios de configuración
  useEffect(() => {
    const unsubscribe = configManager.subscribe((newConfig) => {
      setConfig(newConfig);
    });

    return unsubscribe;
  }, []);

  const updateConfig = useCallback(async (updates: Partial<AppConfig>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      configManager.updateConfig(updates);
      toast.success('Configuración actualizada exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar configuración';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateN8nConfig = useCallback(async (n8nConfig: Partial<AppConfig['api']['n8n']>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validar URL si se está actualizando
      if (n8nConfig.baseUrl && n8nConfig.baseUrl !== 'https://n8n.n8ncloud.top' && !configManager.validateN8nUrl(n8nConfig.baseUrl)) {
        throw new Error('URL de n8n inválida');
      }
      
      configManager.updateN8nConfig(n8nConfig);
      toast.success('Configuración de n8n actualizada');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar configuración de n8n';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFeatures = useCallback(async (features: Partial<AppConfig['features']>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      configManager.updateFeatures(features);
      toast.success('Características actualizadas');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar características';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSection = useCallback(async <K extends keyof AppConfig>(
    section: K, 
    updates: Partial<AppConfig[K]>
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      configManager.updateSection(section, updates);
      toast.success(`Configuración de ${section} actualizada`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error al actualizar ${section}`;
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      configManager.resetToDefaults();
      toast.success('Configuración restablecida a valores por defecto');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al restablecer configuración';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportConfig = useCallback(() => {
    try {
      const configJson = configManager.exportConfig();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contapyme-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Configuración exportada exitosamente');
    } catch (error) {
      toast.error('Error al exportar configuración');
    }
  }, []);

  const importConfig = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      configManager.importConfig(text);
      toast.success('Configuración importada exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al importar configuración';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Getters específicos para facilitar el uso
  const isFeatureEnabled = useCallback((feature: keyof AppConfig['features']) => {
    return configManager.isFeatureEnabled(feature);
  }, []);

  const getN8nConfig = useCallback(() => {
    return config.api.n8n;
  }, [config]);

  const getSupabaseConfig = useCallback(() => {
    return config.api.supabase;
  }, [config]);

  const getUIConfig = useCallback(() => {
    return configManager.getUIConfig();
  }, []);

  const getSecurityConfig = useCallback(() => {
    return configManager.getSecurityConfig();
  }, []);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    updateN8nConfig,
    updateFeatures,
    updateSection,
    resetToDefaults,
    exportConfig,
    importConfig,
    isFeatureEnabled,
    getN8nConfig,
    getSupabaseConfig,
    getUIConfig,
    getSecurityConfig,
    // Getters de conveniencia
    isProduction: configManager.isProduction,
    isDevelopment: configManager.isDevelopment,
    isDebugMode: configManager.isDebugMode,
    n8nBaseUrl: configManager.n8nBaseUrl
  };
}