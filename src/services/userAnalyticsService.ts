import { supabase } from '@/integrations/supabase/client';

export interface UserAction {
  id: string;
  usuario_id: string;
  action_type: 'page_view' | 'create' | 'edit' | 'delete' | 'export' | 'import';
  module: string;
  page: string;
  created_at: string;
  session_id: string;
  metadata?: any;
}

export interface UserPreference {
  id: string;
  usuario_id: string;
  module: string;
  page: string;
  frequency: number;
  last_used: string;
  created_at: string;
}

export interface QuickActionRecommendation {
  name: string;
  href: string;
  icon: string;
  color: string;
  score: number;
  reason: string;
  frequency: number;
}

class UserAnalyticsService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Registrar una acción del usuario
  async trackAction(
    actionType: UserAction['action_type'],
    module: string,
    page: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const action: Omit<UserAction, 'id'> = {
        usuario_id: user.id,
        accion: actionType, // ✅ Campo correcto: 'accion' no 'action_type'
        tabla_afectada: module, // ✅ Campo correcto: 'tabla_afectada' no 'module'
        registro_id: null, // ✅ Campo correcto: 'registro_id' (null por ahora)
        detalles: { // ✅ Campo correcto: 'detalles' no 'metadata'
          page,
          session_id: this.sessionId,
          metadata
        },
        created_at: new Date().toISOString()
      };

      await supabase.from('user_actions').insert(action);
    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  }

  // Obtener estadísticas de uso del usuario
  async getUserStats(days: number = 30): Promise<{
    totalActions: number;
    actionsByModule: Record<string, number>;
    actionsByPage: Record<string, number>;
    mostUsedPages: Array<{ page: string; count: number }>;
    recentActions: UserAction[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.getDefaultStats();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Obtener acciones del usuario
      const { data: actions, error } = await supabase
        .from('user_actions')
        .select('*')
        .eq('usuario_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return this.processUserStats(actions || []);
    } catch (error) {
      console.error('Error getting user stats:', error);
      return this.getDefaultStats();
    }
  }

  // Procesar estadísticas de uso
  private processUserStats(actions: UserAction[]): {
    totalActions: number;
    actionsByModule: Record<string, number>;
    actionsByPage: Record<string, number>;
    mostUsedPages: Array<{ page: string; count: number }>;
    recentActions: UserAction[];
  } {
    const actionsByModule: Record<string, number> = {};
    const actionsByPage: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};

    actions.forEach(action => {
      // Contar por módulo
      actionsByModule[action.module] = (actionsByModule[action.module] || 0) + 1;
      
      // Contar por página
      actionsByPage[action.page] = (actionsByPage[action.page] || 0) + 1;
      
      // Contar vistas de página
      if (action.action_type === 'page_view') {
        pageCounts[action.page] = (pageCounts[action.page] || 0) + 1;
      }
    });

    // Obtener páginas más usadas
    const mostUsedPages = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActions: actions.length,
      actionsByModule,
      actionsByPage,
      mostUsedPages,
      recentActions: actions.slice(0, 20)
    };
  }

  // Obtener estadísticas por defecto para usuarios nuevos
  private getDefaultStats() {
    return {
      totalActions: 0,
      actionsByModule: {},
      actionsByPage: {},
      mostUsedPages: [],
      recentActions: []
    };
  }

  // Generar recomendaciones de acciones rápidas
  async getQuickActionRecommendations(): Promise<QuickActionRecommendation[]> {
    try {
      const stats = await this.getUserStats(7); // Últimos 7 días
      const recommendations: QuickActionRecommendation[] = [];

      // Mapeo de páginas a acciones rápidas
      const pageToActionMap: Record<string, QuickActionRecommendation> = {
        '/facturas': {
          name: 'Nueva Factura',
          href: '/facturas',
          icon: 'FileText',
          color: 'bg-blue-500',
          score: 0,
          reason: 'Basado en uso reciente',
          frequency: 0
        },
        '/crm/clientes': {
          name: 'Nuevo Cliente',
          href: '/crm/clientes',
          icon: 'Users',
          color: 'bg-green-500',
          score: 0,
          reason: 'Basado en uso reciente',
          frequency: 0
        },
        '/crm/oportunidades': {
          name: 'Nueva Oportunidad',
          href: '/crm/oportunidades',
          icon: 'Target',
          color: 'bg-purple-500',
          score: 0,
          reason: 'Basado en uso reciente',
          frequency: 0
        },
        '/erp/proyectos': {
          name: 'Nuevo Proyecto',
          href: '/erp/proyectos',
          icon: 'Folder',
          color: 'bg-orange-500',
          score: 0,
          reason: 'Basado en uso reciente',
          frequency: 0
        },
        '/pagos': {
          name: 'Registrar Pago',
          href: '/pagos',
          icon: 'CreditCard',
          color: 'bg-indigo-500',
          score: 0,
          reason: 'Basado en uso reciente',
          frequency: 0
        },
        '/stock': {
          name: 'Movimiento Stock',
          href: '/stock',
          icon: 'Package',
          color: 'bg-red-500',
          score: 0,
          reason: 'Basado en uso reciente',
          frequency: 0
        },
        '/ordenes-compra': {
          name: 'Nueva Orden',
          href: '/ordenes-compra',
          icon: 'ShoppingCart',
          color: 'bg-yellow-500',
          score: 0,
          reason: 'Basado en uso reciente',
          frequency: 0
        },
        '/recetas': {
          name: 'Nueva Receta',
          href: '/recetas',
          icon: 'ChefHat',
          color: 'bg-pink-500',
          score: 0,
          reason: 'Basado en uso reciente',
          frequency: 0
        }
      };

      // Calcular scores basados en uso
      stats.mostUsedPages.forEach(({ page, count }) => {
        if (pageToActionMap[page]) {
          const action = pageToActionMap[page];
          action.frequency = count;
          action.score = this.calculateScore(count, stats.totalActions);
          action.reason = this.getReason(count, page);
          recommendations.push(action);
        }
      });

      // Agregar acciones por defecto si no hay suficientes recomendaciones
      const defaultActions = [
        pageToActionMap['/facturas'],
        pageToActionMap['/crm/clientes'],
        pageToActionMap['/pagos']
      ];

      defaultActions.forEach(action => {
        if (!recommendations.find(r => r.href === action.href)) {
          action.score = 0.1; // Score bajo para acciones por defecto
          action.reason = 'Acción común';
          recommendations.push(action);
        }
      });

      // Ordenar por score y limitar a 6 acciones
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
    } catch (error) {
      console.error('Error getting quick action recommendations:', error);
      return this.getDefaultQuickActions();
    }
  }

  // Calcular score de recomendación
  private calculateScore(frequency: number, totalActions: number): number {
    if (totalActions === 0) return 0;
    
    // Score basado en frecuencia relativa y absoluta
    const relativeScore = frequency / totalActions;
    const absoluteScore = Math.min(frequency / 10, 1); // Máximo 1.0
    
    return (relativeScore * 0.7) + (absoluteScore * 0.3);
  }

  // Generar razón para la recomendación
  private getReason(frequency: number, page: string): string {
    if (frequency >= 10) return 'Muy usado recientemente';
    if (frequency >= 5) return 'Usado frecuentemente';
    if (frequency >= 2) return 'Usado recientemente';
    return 'Basado en patrones de uso';
  }

  // Acciones rápidas por defecto
  private getDefaultQuickActions(): QuickActionRecommendation[] {
    return [
      {
        name: 'Nueva Factura',
        href: '/facturas',
        icon: 'FileText',
        color: 'bg-blue-500',
        score: 0.1,
        reason: 'Acción común',
        frequency: 0
      },
      {
        name: 'Nuevo Cliente',
        href: '/crm/clientes',
        icon: 'Users',
        color: 'bg-green-500',
        score: 0.1,
        reason: 'Acción común',
        frequency: 0
      },
      {
        name: 'Registrar Pago',
        href: '/pagos',
        icon: 'CreditCard',
        color: 'bg-indigo-500',
        score: 0.1,
        reason: 'Acción común',
        frequency: 0
      }
    ];
  }

  // Obtener actividades recientes basadas en uso real
  async getRecentActivities(limit: number = 5): Promise<Array<{
    type: string;
    description: string;
    time: string;
    icon: string;
    action_type: string;
  }>> {
    try {
      const stats = await this.getUserStats(1); // Último día
      
             return stats.recentActions.slice(0, limit).map(action => {
         const timeAgo = this.getTimeAgo(action.created_at);
         const description = this.getActionDescription(action);
        
        return {
          type: action.module,
          description,
          time: timeAgo,
          icon: this.getActionIcon(action),
          action_type: action.action_type
        };
      });
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  // Generar descripción de acción
  private getActionDescription(action: UserAction): string {
    const moduleNames: Record<string, string> = {
      'facturas': 'Factura',
      'clientes': 'Cliente',
      'oportunidades': 'Oportunidad',
      'pagos': 'Pago',
      'stock': 'Stock',
      'proyectos': 'Proyecto',
      'empleados': 'Empleado',
      'recetas': 'Receta'
    };

    const actionNames: Record<string, string> = {
      'page_view': 'visitó',
      'create': 'creó',
      'edit': 'editó',
      'delete': 'eliminó',
      'export': 'exportó',
      'import': 'importó'
    };

    const moduleName = moduleNames[action.module] || action.module;
    const actionName = actionNames[action.action_type] || action.action_type;

    return `${moduleName} ${actionName}`;
  }

  // Obtener icono de acción
  private getActionIcon(action: UserAction): string {
    const iconMap: Record<string, string> = {
      'facturas': 'FileText',
      'clientes': 'Users',
      'oportunidades': 'Target',
      'pagos': 'CreditCard',
      'stock': 'Package',
      'proyectos': 'Folder',
      'empleados': 'User',
      'recetas': 'ChefHat'
    };

    return iconMap[action.module] || 'Activity';
  }

  // Calcular tiempo transcurrido
  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const actionTime = new Date(timestamp);
    const diffMs = now.getTime() - actionTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} día${diffDays > 1 ? 's' : ''} ago`;
  }

  // Limpiar datos antiguos (ejecutar periódicamente)
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      await supabase
        .from('user_actions')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}

export const userAnalyticsService = new UserAnalyticsService();
export default userAnalyticsService; 