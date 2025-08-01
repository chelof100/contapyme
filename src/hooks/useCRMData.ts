import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseSupabaseDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any[]) => void;
  onError?: (error: string) => void;
}

interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
}

export function useSupabaseData<T>(
  table: string,
  select: string = '*',
  filters?: Record<string, any>,
  options: UseSupabaseDataOptions = {}
): QueryState<T> {
  const { enabled = true, refetchInterval, onSuccess, onError } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user || !profile?.empresa_id || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from(table).select(select);

      // Aplicar filtro automático por empresa
      query = query.eq('empresa_id', profile.empresa_id);

      // Aplicar filtros adicionales
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      const { data: result, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const finalData = result || [];
      setData(finalData);
      
      if (onSuccess) {
        onSuccess(finalData);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table, select, JSON.stringify(filters), user?.id, profile?.empresa_id, enabled]);

  const create = useCallback(async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> => {
    if (!user || !profile?.empresa_id) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const dataWithEmpresa = {
        ...data,
        empresa_id: profile.empresa_id
      };

      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert(dataWithEmpresa)
        .select()
        .single();

      if (insertError) throw insertError;

      // Actualizar datos locales
      setData(prev => [result, ...prev]);
      toast.success('Registro creado exitosamente');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear registro';
      toast.error(errorMessage);
      console.error(`Error creating ${table}:`, err);
      return null;
    }
  }, [table, user?.id, profile?.empresa_id]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    if (!user || !profile?.empresa_id) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .eq('empresa_id', profile.empresa_id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Actualizar datos locales
      setData(prev => prev.map(item => 
        (item as any).id === id ? result : item
      ));
      
      toast.success('Registro actualizado exitosamente');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar registro';
      toast.error(errorMessage);
      console.error(`Error updating ${table}:`, err);
      return null;
    }
  }, [table, user?.id, profile?.empresa_id]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    if (!user || !profile?.empresa_id) {
      toast.error('Usuario no autenticado');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('empresa_id', profile.empresa_id);

      if (deleteError) throw deleteError;

      // Actualizar datos locales
      setData(prev => prev.filter(item => (item as any).id !== id));
      toast.success('Registro eliminado exitosamente');
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar registro';
      toast.error(errorMessage);
      console.error(`Error deleting ${table}:`, err);
      return false;
    }
  }, [table, user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchData();

    // Configurar refetch automático si se especifica
    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    remove
  };
}

// Hook específico para clientes
export function useClientes() {
  return useSupabaseData<{
    id: string;
    cuit: string;
    razon_social: string;
    nombre_fantasia: string;
    email: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    codigo_postal: string;
    condicion_iva: string;
    categoria: string;
    estado: string;
    notas: string;
    fecha_primera_compra: string;
    monto_total_compras: number;
    created_at: string;
    updated_at: string;
  }>('clientes');
}

// Hook específico para contactos
export function useContactos(clienteId?: string) {
  const filters = clienteId ? { cliente_id: clienteId } : undefined;
  return useSupabaseData<{
    id: string;
    cliente_id: string;
    nombre: string;
    apellido: string;
    cargo: string;
    email: string;
    telefono: string;
    es_principal: boolean;
    notas: string;
    created_at: string;
  }>('contactos', '*', filters);
}

// Hook específico para interacciones
export function useInteracciones(clienteId?: string) {
  const filters = clienteId ? { cliente_id: clienteId } : undefined;
  return useSupabaseData<{
    id: string;
    cliente_id: string;
    usuario_id: string;
    tipo: string;
    descripcion: string;
    resultado: string;
    fecha_interaccion: string;
    fecha_seguimiento: string;
    created_at: string;
  }>('interacciones', '*', filters);
}

// Hook específico para etapas del pipeline
export function useEtapasPipeline() {
  return useSupabaseData<{
    id: string;
    nombre: string;
    descripcion: string;
    orden: number;
    color: string;
    activa: boolean;
    created_at: string;
  }>('etapas_pipeline', '*', { activa: true });
}

// Hook específico para oportunidades
export function useOportunidades() {
  return useSupabaseData<{
    id: string;
    cliente_id: string;
    etapa_id: string;
    titulo: string;
    descripcion: string;
    valor_estimado: number;
    probabilidad: number;
    fecha_creacion: string;
    fecha_cierre_estimada: string;
    fecha_cierre_real: string;
    estado: string;
    motivo_perdida: string;
    fuente: string;
    assigned_to: string;
    created_at: string;
    updated_at: string;
  }>('oportunidades');
}

// Hook específico para actividades
export function useActividades(filters?: { assigned_to?: string; completada?: boolean }) {
  return useSupabaseData<{
    id: string;
    oportunidad_id: string;
    cliente_id: string;
    tipo: string;
    titulo: string;
    descripcion: string;
    fecha_vencimiento: string;
    completada: boolean;
    fecha_completada: string;
    prioridad: string;
    assigned_to: string;
    created_at: string;
  }>('actividades', '*', filters);
}

// Hook para datos del dashboard CRM
export function useCRMDashboard() {
  const { data: clientes } = useClientes();
  const { data: oportunidades } = useOportunidades();
  const { data: actividades } = useActividades();

  const clientesActivos = clientes.filter(c => c.estado === 'activo').length;
  const clientesProspectos = clientes.filter(c => c.estado === 'prospecto').length;
  const oportunidadesAbiertas = oportunidades.filter(o => o.estado === 'abierta').length;
  const valorPipeline = oportunidades
    .filter(o => o.estado === 'abierta')
    .reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
  const actividadesPendientes = actividades.filter(a => !a.completada).length;
  const actividadesVencidas = actividades.filter(a => 
    !a.completada && 
    new Date(a.fecha_vencimiento) < new Date()
  ).length;

  return {
    clientes: {
      activos: clientesActivos,
      prospectos: clientesProspectos,
      total: clientes.length
    },
    oportunidades: {
      abiertas: oportunidadesAbiertas,
      valorTotal: valorPipeline,
      valorPromedio: oportunidadesAbiertas > 0 ? valorPipeline / oportunidadesAbiertas : 0
    },
    actividades: {
      pendientes: actividadesPendientes,
      vencidas: actividadesVencidas,
      completadas: actividades.filter(a => a.completada).length
    }
  };
}