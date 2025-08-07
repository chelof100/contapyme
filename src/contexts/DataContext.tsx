import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { n8nService } from '@/services/n8nService';
import { errorHandler } from '@/utils/errorHandler';
import { toast } from 'sonner';
import { configManager } from '@/config/app';

interface DataContextType {
  // Estados de sincronización
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  // Funciones de sincronización
  syncWithN8n: () => Promise<void>;
  queueOperation: (operation: PendingOperation) => void;
  retryFailedOperations: () => Promise<void>;
  clearPendingOperations: () => void;
  
  // Cache de datos
  clearCache: () => void;
  refreshData: () => Promise<void>;
  
  // Métricas de rendimiento
  getMetrics: () => SyncMetrics;
}

interface PendingOperation {
  id: string;
  type: 'factura' | 'orden' | 'pago' | 'stock';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retries: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
  lastError?: string;
  scheduledFor?: Date;
}

interface SyncMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  lastSyncDuration: number;
  uptime: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');
  const [metrics, setMetrics] = useState<SyncMetrics>({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageResponseTime: 0,
    lastSyncDuration: 0,
    uptime: 0
  });

  // Cargar operaciones pendientes del localStorage al inicializar
  useEffect(() => {
    const stored = localStorage.getItem('pendingOperations');
    if (stored) {
      try {
        const operations = JSON.parse(stored);
        setPendingOperations(operations.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp),
          scheduledFor: op.scheduledFor ? new Date(op.scheduledFor) : undefined
        })));
      } catch (error) {
        console.error('Error loading pending operations:', error);
        localStorage.removeItem('pendingOperations');
      }
    }
  }, []);
  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      testConnectionQuality();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test inicial de calidad de conexión
    if (navigator.onLine) {
      testConnectionQuality();
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Probar calidad de conexión
  const testConnectionQuality = async () => {
    if (!navigator.onLine) {
      setConnectionQuality('offline');
      return;
    }

    try {
      const startTime = Date.now();
      const response = await n8nService.testConnection();
      const responseTime = Date.now() - startTime;

      if (response.success && response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        if (responseTime < 500) {
          setConnectionQuality('excellent');
        } else if (responseTime < 1500) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('poor');
        }
      } else if (response.error && response.error.includes('n8n URL not configured')) {
        // n8n not configured properly - this is expected, set to offline silently
        setConnectionQuality('offline');
        console.log('n8n not configured properly, connection quality set to offline');
      } else {
        console.warn('n8n connection failed:', response.error);
        setConnectionQuality('offline');
      }
    } catch (error) {
      console.warn('Connection quality test failed:', error);
      setConnectionQuality('offline');
    }
  };
  // Procesar operaciones pendientes cuando se recupera la conexión
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      processPendingOperations();
    }
  }, [isOnline]);

  // Procesar operaciones programadas
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const readyOperations = pendingOperations.filter(op => 
        op.scheduledFor && op.scheduledFor <= now
      );
      
      if (readyOperations.length > 0 && isOnline) {
        processPendingOperations();
      }
    }, 10000); // Verificar cada 10 segundos

    return () => clearInterval(interval);
  }, [pendingOperations, isOnline]);
  const queueOperation = (operation: PendingOperation) => {
    const enhancedOperation: PendingOperation = {
      ...operation,
      maxRetries: operation.maxRetries || 3,
      priority: operation.priority || 'medium',
      retries: 0
    };
    
    setPendingOperations(prev => {
      const updated = [...prev, enhancedOperation];
      // Ordenar por prioridad
      return updated.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    });
    
    // Guardar en localStorage para persistencia
    savePendingOperations([...pendingOperations, enhancedOperation]);
    
    // Procesar inmediatamente si está online
    if (isOnline && syncStatus === 'idle') {
      processPendingOperations();
    }
  };

  const savePendingOperations = (operations: PendingOperation[]) => {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(operations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  };
  const processPendingOperations = async () => {
    if (syncStatus === 'syncing' || !isOnline) return;
    
    setSyncStatus('syncing');
    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;
    
    const operations = [...pendingOperations].filter(op => {
      // Solo procesar operaciones que no estén programadas para el futuro
      return !op.scheduledFor || op.scheduledFor <= new Date();
    });
    
    for (const operation of operations) {
      try {
        await executeOperation(operation);
        
        // Remover operación exitosa
        setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
        successCount++;
        
      } catch (error) {
        const appError = errorHandler.handle(error, `pending-operation-${operation.type}`);
        failCount++;
        
        // Incrementar reintentos
        if (operation.retries < operation.maxRetries) {
          setPendingOperations(prev => prev.map(op => 
            op.id === operation.id 
              ? { 
                  ...op, 
                  retries: op.retries + 1,
                  lastError: appError.message,
                  scheduledFor: new Date(Date.now() + Math.pow(2, op.retries) * 1000) // Backoff exponencial
                }
              : op
          ));
        } else {
          // Remover operación después de máximo de intentos
          setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
          toast.error(`Operación ${operation.type} falló después de ${operation.maxRetries} intentos`);
        }
      }
    }
    
    // Actualizar localStorage
    savePendingOperations(pendingOperations);
    
    // Actualizar métricas
    const duration = Date.now() - startTime;
    setMetrics(prev => ({
      ...prev,
      totalOperations: prev.totalOperations + operations.length,
      successfulOperations: prev.successfulOperations + successCount,
      failedOperations: prev.failedOperations + failCount,
      lastSyncDuration: duration,
      averageResponseTime: prev.totalOperations > 0 
        ? (prev.averageResponseTime * prev.totalOperations + duration) / (prev.totalOperations + operations.length)
        : duration
    }));
    
    setSyncStatus(failCount > 0 ? 'error' : 'idle');
  };

  const executeOperation = async (operation: PendingOperation) => {
    const startTime = Date.now();

    switch (operation.type) {
      case 'factura':
        if (operation.action === 'create') {
          const response = await n8nService.emitirFactura(operation.data);
          if (!response.success) throw new Error(response.error);
          return response;
        }
        break;
      case 'orden':
        if (operation.action === 'create') {
          const response = await n8nService.crearOrdenCompra(operation.data);
          if (!response.success) throw new Error(response.error);
          return response;
        }
        break;
      case 'pago':
        if (operation.action === 'create') {
          const response = await n8nService.registrarPago(operation.data);
          if (!response.success) throw new Error(response.error);
          return response;
        }
        break;
      case 'stock':
        if (operation.action === 'update') {
          const response = await n8nService.registrarMovimientoStock(operation.data);
          if (!response.success) throw new Error(response.error);
          return response;
        }
        break;
      default:
        throw new Error(`Tipo de operación no soportado: ${operation.type}`);
    }
  };

  const syncWithN8n = async () => {
    if (syncStatus === 'syncing') return;
    
    try {
      setSyncStatus('syncing');
      const startTime = Date.now();
      
      // Probar conexión primero
      const connectionTest = await n8nService.testConnection();
      if (!connectionTest.success) {
        throw new Error('No se pudo conectar con n8n');
      }
      
      await processPendingOperations();
      
      const duration = Date.now() - startTime;
      setLastSync(new Date());
      
      setMetrics(prev => ({
        ...prev,
        lastSyncDuration: duration
      }));
      
      setSyncStatus('idle');
      toast.success('Sincronización completada exitosamente');
    } catch (error) {
      setSyncStatus('error');
      errorHandler.handle(error, 'sync-with-n8n');
      throw error;
    }
  };

  const retryFailedOperations = async () => {
    const failedOperations = pendingOperations.filter(op => op.retries > 0);
    
    if (failedOperations.length === 0) {
      toast.info('No hay operaciones fallidas para reintentar');
      return;
    }
    
    // Resetear reintentos y programar para procesamiento inmediato
    setPendingOperations(prev => prev.map(op => 
      op.retries > 0 
        ? { ...op, retries: 0, scheduledFor: undefined, lastError: undefined }
        : op
    ));
    
    await processPendingOperations();
  };

  const clearPendingOperations = () => {
    setPendingOperations([]);
    localStorage.removeItem('pendingOperations');
    toast.success('Operaciones pendientes eliminadas');
  };
  const clearCache = () => {
    localStorage.removeItem('pendingOperations');
    setPendingOperations([]);
    // Limpiar otros caches si es necesario
    const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('cache-'));
    cacheKeys.forEach(key => localStorage.removeItem(key));
  };

  const refreshData = async () => {
    try {
      setSyncStatus('syncing');
      
      // Limpiar cache
      clearCache();
      
      // Forzar re-fetch de datos críticos
      await syncWithN8n();
      
      // Emitir evento para que los componentes se actualicen
      window.dispatchEvent(new CustomEvent('data-refresh'));
      
      toast.success('Datos actualizados');
    } catch (error) {
      errorHandler.handle(error, 'refresh-data');
    } finally {
      setSyncStatus('idle');
    }
  };

  const getMetrics = (): SyncMetrics => {
    return {
      ...metrics,
      uptime: Date.now() - (metrics.uptime || Date.now())
    };
  };

  // Monitoreo de salud de conexión cada 5 minutos
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (isOnline) {
        testConnectionQuality();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(healthCheck);
  }, [isOnline]);
  return (
    <DataContext.Provider value={{
      isOnline,
      lastSync,
      pendingOperations: pendingOperations.length,
      syncStatus,
      connectionQuality,
      syncWithN8n,
      queueOperation,
      retryFailedOperations,
      clearPendingOperations,
      clearCache,
      refreshData,
      getMetrics
    }}>
      {children}
    </DataContext.Provider>
  );
};