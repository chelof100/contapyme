import { toast } from 'sonner';
import { configManager } from '@/config/app';

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  CONFIGURATION = 'CONFIGURATION',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  context?: string;
  userMessage?: string;
  actionable?: boolean;
  retryable?: boolean;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableNotifications: boolean;
  enableRemoteLogging: boolean;
  maxLogSize: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

class ErrorHandler {
  private errorLog: AppError[] = [];
  private config: ErrorHandlerConfig;
  private remoteLoggingQueue: AppError[] = [];
  private isProcessingRemoteQueue = false;

  constructor() {
    const appConfig = configManager.getConfig();
    this.config = {
      enableLogging: appConfig.monitoring.enableErrorTracking,
      enableNotifications: true,
      enableRemoteLogging: appConfig.app.environment === 'production',
      maxLogSize: 1000,
      logLevel: appConfig.app.logLevel as any
    };
    
    this.setupGlobalErrorHandlers();
    this.startRemoteLoggingProcessor();
  }

  private setupGlobalErrorHandlers(): void {
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.handle(event.error, 'global-error');
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handle(event.reason, 'unhandled-promise-rejection');
    });
  }

  private startRemoteLoggingProcessor(): void {
    if (!this.config.enableRemoteLogging) return;
    
    setInterval(() => {
      this.processRemoteLoggingQueue();
    }, 30000); // Procesar cada 30 segundos
  }

  public handle(error: unknown, context?: string): AppError {
    const appError = this.parseError(error, context);
    
    if (this.config.enableLogging) {
      this.logError(appError);
    }
    
    if (this.config.enableNotifications && this.shouldShowNotification(appError)) {
      this.showUserNotification(appError);
    }
    
    if (this.config.enableRemoteLogging && this.shouldLogRemotely(appError)) {
      this.queueForRemoteLogging(appError);
    }
    
    return appError;
  }

  private parseError(error: unknown, context?: string): AppError {
    const timestamp = new Date();
    const config = configManager.getConfig();

    if (error instanceof Error) {
      // Error de configuración
      if (error.message.includes('configuración') || error.message.includes('config')) {
        return {
          type: ErrorType.CONFIGURATION,
          severity: ErrorSeverity.HIGH,
          message: 'Error de configuración del sistema',
          userMessage: 'Hay un problema con la configuración. Ve a Configuración para revisar.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: false
        };
      }

      // Error de rate limiting
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return {
          type: ErrorType.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          message: 'Demasiadas solicitudes. Intenta nuevamente en unos momentos.',
          userMessage: 'Has enviado demasiadas solicitudes. Espera un momento antes de intentar nuevamente.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: true
        };
      }

      // Error de timeout
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        return {
          type: ErrorType.TIMEOUT,
          severity: ErrorSeverity.MEDIUM,
          message: 'La operación tardó demasiado tiempo',
          userMessage: 'La operación tardó demasiado. Verifica tu conexión e intenta nuevamente.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: true
        };
      }

      // Error de red
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.HIGH,
          message: 'Error de conexión. Verifica tu conexión a internet.',
          userMessage: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: true
        };
      }

      // Error de validación
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return {
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.LOW,
          message: 'Datos inválidos. Verifica la información ingresada.',
          userMessage: 'Algunos datos ingresados no son válidos. Revisa el formulario.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: false
        };
      }

      // Error de autenticación
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return {
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          message: 'Error de autenticación. Inicia sesión nuevamente.',
          userMessage: 'Tu sesión ha expirado. Serás redirigido al login.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: false
        };
      }

      // Error HTTP específicos
      if (error.message.includes('HTTP 400')) {
        return {
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          message: 'Solicitud inválida. Verifica los datos enviados.',
          userMessage: 'Los datos enviados no son válidos.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: false
        };
      }

      if (error.message.includes('HTTP 401')) {
        return {
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          message: 'No autorizado. Verifica tus credenciales.',
          userMessage: 'No tienes autorización para realizar esta acción.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: false
        };
      }

      if (error.message.includes('HTTP 403')) {
        return {
          type: ErrorType.AUTHORIZATION,
          severity: ErrorSeverity.HIGH,
          message: 'Sin permisos para realizar esta acción.',
          userMessage: 'No tienes permisos suficientes para esta operación.',
          details: error.message,
          timestamp,
          context,
          actionable: false,
          retryable: false
        };
      }

      if (error.message.includes('HTTP 429')) {
        return {
          type: ErrorType.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          message: 'Demasiadas solicitudes. Intenta más tarde.',
          userMessage: 'Has enviado demasiadas solicitudes. Espera un momento.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: true
        };
      }

      if (error.message.includes('HTTP 500')) {
        return {
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.CRITICAL,
          message: 'Error del servidor. Intenta nuevamente más tarde.',
          userMessage: 'Hay un problema en el servidor. Intenta más tarde.',
          details: error.message,
          timestamp,
          context,
          actionable: true,
          retryable: true
        };
      }

      return {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: 'Ocurrió un error inesperado.',
        timestamp,
        context,
        actionable: false,
        retryable: false
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.LOW,
      message: 'Error desconocido',
      userMessage: 'Ocurrió un error inesperado.',
      details: String(error),
      timestamp,
      context,
      actionable: false,
      retryable: false
    };
  }

  private shouldShowNotification(error: AppError): boolean {
    // No mostrar notificaciones para errores de baja severidad en producción
    if (configManager.isProduction && error.severity === ErrorSeverity.LOW) {
      return false;
    }
    
    // No mostrar notificaciones duplicadas (mismo tipo y contexto en los últimos 30 segundos)
    const recentSimilar = this.errorLog.find(e => 
      e.type === error.type && 
      e.context === error.context &&
      Date.now() - e.timestamp.getTime() < 30000
    );
    
    return !recentSimilar;
  }

  private shouldLogRemotely(error: AppError): boolean {
    // Solo enviar errores de severidad media o alta a logging remoto
    return error.severity === ErrorSeverity.MEDIUM || 
           error.severity === ErrorSeverity.HIGH || 
           error.severity === ErrorSeverity.CRITICAL;
  }
  private logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Mantener solo los últimos N errores según configuración
    if (this.errorLog.length > this.config.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.config.maxLogSize);
    }

    // Log en consola según nivel configurado
    this.logToConsole(error);
  }

  private logToConsole(error: AppError): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp.toISOString(),
      details: error.details
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        if (this.config.logLevel === 'debug') {
          console.info('ℹ️ LOW ERROR:', logData);
        }
        break;
    }
  }

  private queueForRemoteLogging(error: AppError): void {
    this.remoteLoggingQueue.push(error);
    
    // Limitar tamaño de cola
    if (this.remoteLoggingQueue.length > 100) {
      this.remoteLoggingQueue = this.remoteLoggingQueue.slice(-100);
    }
  }

  private async processRemoteLoggingQueue(): Promise<void> {
    if (this.isProcessingRemoteQueue || this.remoteLoggingQueue.length === 0) {
      return;
    }

    this.isProcessingRemoteQueue = true;

    try {
      const errorsToSend = [...this.remoteLoggingQueue];
      this.remoteLoggingQueue = [];

      await this.sendToLoggingService(errorsToSend);
    } catch (error) {
      console.error('Error sending logs to remote service:', error);
      // Re-agregar errores a la cola si falla el envío
      this.remoteLoggingQueue.unshift(...this.remoteLoggingQueue);
    } finally {
      this.isProcessingRemoteQueue = false;
    }
  }
  private showUserNotification(error: AppError): void {
    const duration = this.getNotificationDuration(error.type);
    const message = error.userMessage || error.message;

    switch (error.type) {
      case ErrorType.NETWORK:
        toast.error(message, {
          description: 'Verifica tu conexión a internet',
          duration,
          action: error.retryable ? {
            label: 'Reintentar',
            onClick: () => window.location.reload()
          } : undefined
        });
        break;

      case ErrorType.VALIDATION:
        toast.error(message, {
          description: 'Revisa los datos ingresados',
          duration
        });
        break;

      case ErrorType.AUTHENTICATION:
        toast.error(message, {
          description: 'Serás redirigido al login',
          duration
        });
        // Redirigir al login después de un delay
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
        break;

      case ErrorType.AUTHORIZATION:
        toast.error(message, {
          description: 'Contacta al administrador si necesitas acceso',
          duration
        });
        break;

      case ErrorType.CONFIGURATION:
        toast.error(message, {
          description: 'Ve a Configuración para revisar',
          duration,
          action: {
            label: 'Ir a Configuración',
            onClick: () => window.location.href = '/configuracion'
          }
        });
        break;

      case ErrorType.RATE_LIMIT:
        toast.warning(message, {
          description: 'Espera un momento antes de intentar nuevamente',
          duration
        });
        break;

      case ErrorType.TIMEOUT:
        toast.warning(message, {
          description: 'La operación tardó demasiado tiempo',
          duration,
          action: error.retryable ? {
            label: 'Reintentar',
            onClick: () => window.location.reload()
          } : undefined
        });
        break;

      case ErrorType.BUSINESS_LOGIC:
        toast.warning(message, {
          description: 'Verifica que la operación sea válida',
          duration
        });
        break;

      default:
        toast.error('Error inesperado', {
          description: 'Si el problema persiste, contacta soporte',
          duration,
          action: {
            label: 'Reportar',
            onClick: () => this.reportError(error)
          }
        });
    }
  }

  private getNotificationDuration(type: ErrorType): number {
    switch (type) {
      case ErrorType.AUTHENTICATION:
        return 8000;
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return 6000;
      case ErrorType.CONFIGURATION:
        return 10000;
      default:
        return 4000;
    }
  }

  private async sendToLoggingService(errors: AppError[]): Promise<void> {
    try {
      const config = configManager.getConfig();
      
      // En desarrollo, solo log local
      if (config.app.environment === 'development') {
        console.log('Would send to logging service:', errors);
        return;
      }

      // Implementar envío a servicio de logging real
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors,
          metadata: {
            app_version: config.app.version,
            environment: config.app.environment,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            url: window.location.href
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Logging service responded with ${response.status}`);
      }
    } catch (loggingError) {
      console.error('Error sending to logging service:', loggingError);
    }
  }

  private reportError(error: AppError): void {
    // Implementar reporte de error por parte del usuario
    const reportData = {
      error: {
        type: error.type,
        message: error.message,
        context: error.context,
        timestamp: error.timestamp.toISOString()
      },
      user_feedback: prompt('Describe qué estabas haciendo cuando ocurrió el error (opcional):'),
      browser_info: {
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Error report:', reportData);
    toast.success('Reporte enviado. Gracias por tu feedback.');
  }
  public getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  public getErrorsByType(type: ErrorType): AppError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  public getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  public getRecentErrors(minutes: number = 60): AppError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorLog.filter(error => error.timestamp > cutoff);
  }
  public clearErrorLog(): void {
    this.errorLog = [];
    this.remoteLoggingQueue = [];
  }

  public getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentCount: number;
  } {
    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;
    
    Object.values(ErrorType).forEach(type => byType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => bySeverity[severity] = 0);
    
    this.errorLog.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });
    
    const recentCount = this.getRecentErrors(60).length;
    
    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recentCount
    };
  }

  // Métodos específicos para tipos de error comunes
  public handleNetworkError(error: unknown, context?: string): AppError {
    return this.handle(new Error(`Network error: ${String(error)}`), context);
  }

  public handleValidationError(message: string, context?: string): AppError {
    return this.handle(new Error(`Validation error: ${message}`), context);
  }

  public handleBusinessLogicError(message: string, context?: string): AppError {
    const error: AppError = {
      type: ErrorType.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      message,
      userMessage: message,
      timestamp: new Date(),
      context,
      actionable: true,
      retryable: false
    };
    this.logError(error);
    this.showUserNotification(error);
    return error;
  }

  public handleConfigurationError(message: string, context?: string): AppError {
    const error: AppError = {
      type: ErrorType.CONFIGURATION,
      severity: ErrorSeverity.HIGH,
      message,
      userMessage: 'Hay un problema con la configuración del sistema',
      timestamp: new Date(),
      context,
      actionable: true,
      retryable: false
    };
    this.logError(error);
    this.showUserNotification(error);
    return error;
  }

  public handleTimeoutError(message: string, context?: string): AppError {
    const error: AppError = {
      type: ErrorType.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      message,
      userMessage: 'La operación tardó demasiado tiempo',
      timestamp: new Date(),
      context,
      actionable: true,
      retryable: true
    };
    this.logError(error);
    this.showUserNotification(error);
    return error;
  }
}

export const errorHandler = new ErrorHandler();

// Hook para usar el error handler en componentes
export function useErrorHandler() {
  return {
    handleError: errorHandler.handle.bind(errorHandler),
    handleNetworkError: errorHandler.handleNetworkError.bind(errorHandler),
    handleValidationError: errorHandler.handleValidationError.bind(errorHandler),
    handleBusinessLogicError: errorHandler.handleBusinessLogicError.bind(errorHandler),
    handleConfigurationError: errorHandler.handleConfigurationError.bind(errorHandler),
    handleTimeoutError: errorHandler.handleTimeoutError.bind(errorHandler),
    getErrorLog: errorHandler.getErrorLog.bind(errorHandler),
    getErrorsByType: errorHandler.getErrorsByType.bind(errorHandler),
    getErrorsBySeverity: errorHandler.getErrorsBySeverity.bind(errorHandler),
    getRecentErrors: errorHandler.getRecentErrors.bind(errorHandler),
    getErrorStats: errorHandler.getErrorStats.bind(errorHandler),
    clearErrorLog: errorHandler.clearErrorLog.bind(errorHandler)
  };
}