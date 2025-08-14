// Hook simple para datos CRM - sin empresa_id (single tenant)
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCRMDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState({ total: 0, activos: 0, nuevos: 0 });
  const [oportunidades, setOportunidades] = useState({ 
    abiertas: 0, 
    valorTotal: 0, 
    cerradas: 0 
  });
  const [actividades, setActividades] = useState({ 
    pendientes: 0, 
    completadas: 0, 
    vencidas: 0 
  });

  useEffect(() => {
    if (!user) return;

    const fetchCRMData = async () => {
      try {
        setLoading(true);

        // Obtener datos de clientes
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('id, activo, created_at');

        const totalClientes = clientesData?.length || 0;
        const clientesActivos = clientesData?.filter(c => c.activo).length || 0;
        const hoy = new Date();
        const hace30dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        const clientesNuevos = clientesData?.filter(c => 
          new Date(c.created_at) > hace30dias
        ).length || 0;

        setClientes({
          total: totalClientes,
          activos: clientesActivos,
          nuevos: clientesNuevos
        });

        // Obtener datos de oportunidades
        const { data: oportunidadesData } = await supabase
          .from('oportunidades')
          .select('id, estado, valor_estimado');

        const oportunidadesAbiertas = oportunidadesData?.filter(o => o.estado === 'abierta').length || 0;
        const valorTotal = oportunidadesData?.reduce((sum, o) => sum + (o.valor_estimado || 0), 0) || 0;
        const oportunidadesCerradas = oportunidadesData?.filter(o => o.estado === 'cerrada').length || 0;

        setOportunidades({
          abiertas: oportunidadesAbiertas,
          valorTotal,
          cerradas: oportunidadesCerradas
        });

        // Obtener datos de interacciones (actividades)
        const { data: interaccionesData } = await supabase
          .from('interacciones')
          .select('id, seguimiento_requerido, fecha_seguimiento, created_at');

        const hoyStr = hoy.toISOString().split('T')[0];
        const actividadesPendientes = interaccionesData?.filter(i => 
          i.seguimiento_requerido && i.fecha_seguimiento >= hoyStr
        ).length || 0;
        
        const actividadesCompletadas = interaccionesData?.filter(i => 
          !i.seguimiento_requerido
        ).length || 0;
        
        const actividadesVencidas = interaccionesData?.filter(i => 
          i.seguimiento_requerido && i.fecha_seguimiento < hoyStr
        ).length || 0;

        setActividades({
          pendientes: actividadesPendientes,
          completadas: actividadesCompletadas,
          vencidas: actividadesVencidas
        });

      } catch (error) {
        console.error('Error fetching CRM data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCRMData();
  }, [user]);

  return {
    loading,
    clientes,
    oportunidades,
    actividades
  };
}

// Hooks específicos para cada entidad CRM
export function useClientes() {
  return useSupabaseData('clientes', '*', { activo: true });
}

export function useContactos() {
  return useSupabaseData('contactos', '*', { activo: true });
}

export function useInteracciones() {
  return useSupabaseData('interacciones', '*, clientes(razon_social)');
}

export function useOportunidades() {
  return useSupabaseData('oportunidades', '*, clientes(razon_social)', { estado: 'abierta' });
}

// Helper function - importar useSupabaseData del hook principal
function useSupabaseData(table: string, select: string = '*', filters?: Record<string, any>) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let query = supabase.from(table).select(select);
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        const { data: result, error: queryError } = await query;
        
        if (queryError) throw queryError;
        
        setData(result || []);
      } catch (err: any) {
        setError(err.message);
        console.error(`Error fetching ${table}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, select, JSON.stringify(filters)]);

  return { data, loading, error };
}
