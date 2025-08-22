import { useState, useEffect, useCallback } from 'react';
import { userAnalyticsService, QuickActionRecommendation } from '@/services/userAnalyticsService';

export function useUserAnalytics() {
  const [quickActions, setQuickActions] = useState<QuickActionRecommendation[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar recomendaciones de acciones rápidas
  const loadQuickActions = useCallback(async () => {
    try {
      setLoading(true);
      const recommendations = await userAnalyticsService.getQuickActionRecommendations();
      setQuickActions(recommendations);
    } catch (err) {
      setError('Error cargando acciones rápidas');
      console.error('Error loading quick actions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar actividades recientes
  const loadRecentActivities = useCallback(async () => {
    try {
      const activities = await userAnalyticsService.getRecentActivities(5);
      setRecentActivities(activities);
    } catch (err) {
      console.error('Error loading recent activities:', err);
    }
  }, []);

  // Trackear una acción del usuario
  const trackAction = useCallback(async (
    actionType: 'page_view' | 'create' | 'edit' | 'delete' | 'export' | 'import',
    module: string,
    page: string,
    metadata?: any
  ) => {
    try {
      await userAnalyticsService.trackAction(actionType, module, page, metadata);
      
      // Recargar datos después de trackear una acción
      setTimeout(() => {
        loadQuickActions();
        loadRecentActivities();
      }, 1000);
    } catch (err) {
      console.error('Error tracking action:', err);
    }
  }, [loadQuickActions, loadRecentActivities]);

  // Cargar datos iniciales
  useEffect(() => {
    loadQuickActions();
    loadRecentActivities();
  }, [loadQuickActions, loadRecentActivities]);

  return {
    quickActions,
    recentActivities,
    loading,
    error,
    trackAction,
    refresh: () => {
      loadQuickActions();
      loadRecentActivities();
    }
  };
} 