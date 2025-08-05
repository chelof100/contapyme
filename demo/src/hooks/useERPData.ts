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

// Hook específico para presupuestos
export function usePresupuestos(filters?: { ano?: number; mes?: number }) {
  return useSupabaseData<{
    id: string;
    ano: number;
    mes: number;
    categoria_id: string;
    categoria: string;
    subcategoria: string;
    monto_presupuestado: number;
    monto_real: number;
    variacion_porcentaje: number;
    notas: string;
    created_at: string;
    updated_at: string;
  }>('presupuestos', '*', filters);
}

// Hook específico para cash flow
export function useCashFlow(filters?: { fecha_desde?: string; fecha_hasta?: string }) {
  return useSupabaseData<{
    id: string;
    fecha: string;
    concepto: string;
    tipo: 'ingreso' | 'egreso';
    monto: number;
    estado: 'proyectado' | 'confirmado' | 'realizado';
    categoria: string;
    oportunidad_id: string;
    factura_id: string;
    recurrente: boolean;
    frecuencia: string;
    notas: string;
    created_at: string;
    updated_at: string;
  }>('cash_flow_proyecciones', '*', filters);
}

// Hook específico para empleados
export function useEmpleados() {
  return useSupabaseData<{
    id: string;
    cuil: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    direccion: string;
    fecha_nacimiento: string;
    cargo: string;
    departamento: string;
    fecha_ingreso: string;
    fecha_egreso: string;
    salario_basico: number;
    tipo_contrato: string;
    estado: 'activo' | 'inactivo' | 'licencia' | 'vacaciones';
    banco_cbu: string;
    obra_social: string;
    notas: string;
    created_at: string;
    updated_at: string;
  }>('empleados');
}

// Hook específico para asistencia
export function useAsistencia(empleadoId?: string, filters?: { fecha_desde?: string; fecha_hasta?: string }) {
  const queryFilters = empleadoId ? { empleado_id: empleadoId, ...filters } : filters;
  return useSupabaseData<{
    id: string;
    empleado_id: string;
    fecha: string;
    hora_entrada: string;
    hora_salida: string;
    horas_trabajadas: number;
    horas_extra: number;
    tipo: 'normal' | 'feriado' | 'licencia' | 'falta' | 'vacaciones';
    justificacion: string;
    aprobado: boolean;
    aprobado_por: string;
    notas: string;
    created_at: string;
  }>('asistencia', '*', queryFilters);
}

// Hook específico para proyectos
export function useProyectos() {
  return useSupabaseData<{
    id: string;
    cliente_id: string;
    codigo: string;
    nombre: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin_estimada: string;
    fecha_fin_real: string;
    presupuesto: number;
    costo_real: number;
    facturado: number;
    estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';
    responsable_id: string;
    prioridad: 'alta' | 'media' | 'baja';
    progreso_porcentaje: number;
    rentabilidad_estimada: number;
    notas: string;
    created_at: string;
    updated_at: string;
  }>('proyectos');
}

// Hook específico para tiempo trabajado
export function useTiempoTrabajado(proyectoId?: string, empleadoId?: string) {
  const filters: any = {};
  if (proyectoId) filters.proyecto_id = proyectoId;
  if (empleadoId) filters.empleado_id = empleadoId;
  
  return useSupabaseData<{
    id: string;
    proyecto_id: string;
    empleado_id: string;
    fecha: string;
    horas: number;
    descripcion_tarea: string;
    tarifa_hora: number;
    costo_total: number;
    facturable: boolean;
    facturado: boolean;
    categoria_trabajo: string;
    aprobado: boolean;
    aprobado_por: string;
    created_at: string;
  }>('tiempo_trabajado', '*', filters);
}

// Hook específico para KPIs
export function useKPIs() {
  return useSupabaseData<{
    id: string;
    nombre: string;
    descripcion: string;
    valor_actual: number;
    valor_objetivo: number;
    unidad: string;
    periodo: string;
    fecha_calculo: string;
    tendencia: string;
    created_at: string;
    updated_at: string;
  }>('indicadores_kpi');
}

// Hook para datos del dashboard ERP
export function useERPDashboard() {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    finanzas: {
      cashFlowMes: 0,
      presupuestoVsReal: 0,
      rentabilidad: 0,
      kpisAlerta: 0
    },
    empleados: {
      total: 0,
      activos: 0,
      enLicencia: 0,
      asistenciaPromedio: 0
    },
    proyectos: {
      activos: 0,
      completados: 0,
      facturacionPendiente: 0,
      rentabilidadPromedio: 0
    },
    loading: true
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const [
        cashFlow,
        presupuestos,
        empleados,
        proyectos,
        tiempoTrabajado
      ] = await Promise.all([
        supabase.from('cash_flow_proyecciones')
          .select('tipo, monto, estado')
          .eq('empresa_id', profile.empresa_id)
          .gte('fecha', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('presupuestos')
          .select('monto_presupuestado, monto_real')
          .eq('empresa_id', profile.empresa_id)
          .eq('ano', new Date().getFullYear())
          .eq('mes', new Date().getMonth() + 1),
        supabase.from('empleados')
          .select('estado')
          .eq('empresa_id', profile.empresa_id),
        supabase.from('proyectos')
          .select('estado, presupuesto, costo_real, facturado')
          .eq('empresa_id', profile.empresa_id),
        supabase.from('tiempo_trabajado')
          .select('horas, facturable, facturado')
          .gte('fecha', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      ]);

      // Calcular métricas financieras
      const ingresosMes = cashFlow.data?.filter(cf => cf.tipo === 'ingreso').reduce((sum, cf) => sum + (cf.monto || 0), 0) || 0;
      const egresosMes = cashFlow.data?.filter(cf => cf.tipo === 'egreso').reduce((sum, cf) => sum + (cf.monto || 0), 0) || 0;
      const cashFlowMes = ingresosMes - egresosMes;

      const totalPresupuestado = presupuestos.data?.reduce((sum, p) => sum + (p.monto_presupuestado || 0), 0) || 0;
      const totalReal = presupuestos.data?.reduce((sum, p) => sum + (p.monto_real || 0), 0) || 0;
      const presupuestoVsReal = totalPresupuestado > 0 ? ((totalReal / totalPresupuestado) * 100) : 0;

      // Calcular métricas de empleados
      const totalEmpleados = empleados.data?.length || 0;
      const empleadosActivos = empleados.data?.filter(e => e.estado === 'activo').length || 0;
      const empleadosLicencia = empleados.data?.filter(e => e.estado === 'licencia').length || 0;

      // Calcular métricas de proyectos
      const proyectosActivos = proyectos.data?.filter(p => p.estado === 'en_progreso').length || 0;
      const proyectosCompletados = proyectos.data?.filter(p => p.estado === 'completado').length || 0;
      const facturacionPendiente = tiempoTrabajado.data?.filter(tt => tt.facturable && !tt.facturado)
        .reduce((sum, tt) => sum + (tt.horas || 0), 0) || 0;

      setDashboardData({
        finanzas: {
          cashFlowMes,
          presupuestoVsReal,
          rentabilidad: 0, // Calcular después
          kpisAlerta: 0
        },
        empleados: {
          total: totalEmpleados,
          activos: empleadosActivos,
          enLicencia: empleadosLicencia,
          asistenciaPromedio: 0 // Calcular después
        },
        proyectos: {
          activos: proyectosActivos,
          completados: proyectosCompletados,
          facturacionPendiente,
          rentabilidadPromedio: 0
        },
        loading: false
      });

    } catch (error) {
      console.error('Error fetching ERP dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    ...dashboardData,
    refetch: fetchDashboardData
  };
}