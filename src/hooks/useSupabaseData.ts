import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Hook genérico OPTIMIZADO - Sin RPC, solo consultas directas
function useTableData(tableName: string) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // No hacer nada si no hay usuario autenticado
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 [useTableData] Fetching data from ${tableName}...`);
      
      // CONSULTA DIRECTA OPTIMIZADA con orden por fecha
      const query = supabase
        .from(tableName as any)
        .select('*');

      // Agregar orden por created_at si la tabla lo tiene, sino por id
      let { data: result, error: queryError } = await query
        .order('created_at', { ascending: false, nullsFirst: false });

      // Si falla con created_at, intentar con updated_at
      if (queryError) {
        const { data: result2, error: queryError2 } = await query
          .order('updated_at', { ascending: false, nullsFirst: false });
        
        if (queryError2) {
          // Si falla con updated_at, usar id
          const { data: result3, error: queryError3 } = await query.order('id', { ascending: false });
          result = result3;
          queryError = queryError3;
        } else {
          result = result2;
          queryError = queryError2;
        }
      }

      if (queryError) {
        console.error(`❌ [useTableData] Error fetching ${tableName}:`, queryError);
        throw queryError;
      }
      
      console.log(`✅ [useTableData] Successfully fetched ${result?.length || 0} records from ${tableName}`);
      setData(result || []);
      
    } catch (err: any) {
      const errorMessage = err.message || `Error al cargar ${tableName}`;
      setError(errorMessage);
      console.error(`Error fetching ${tableName}:`, err);
      
      // Solo mostrar toast para errores no relacionados con permisos
      if (!errorMessage.includes('permission') && 
          !errorMessage.includes('RLS') && 
          !errorMessage.includes('policy')) {
        toast.error(`Error cargando ${tableName}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, tableName]);

  const create = useCallback(async (newData: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      console.log(`🔍 [useTableData] Creating record in ${tableName}...`);
      
      const { data: result, error: insertError } = await supabase
        .from(tableName as any)
        .insert(newData)
        .select()
        .single();

      if (insertError) throw insertError;

      console.log(`✅ [useTableData] Record created in ${tableName}:`, (result as any)?.id);
      
      // Actualizar estado local
      setData(prev => [result, ...prev]);
      toast.success(`${getTableDisplayName(tableName)} creado exitosamente`);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || `Error al crear ${tableName}`;
      console.error(`Error creating ${tableName}:`, err);
      toast.error(`Error creando ${getTableDisplayName(tableName)}: ${errorMessage}`);
      return null;
    }
  }, [user?.id, tableName]);

  const update = useCallback(async (id: string, updates: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      console.log(`🔍 [useTableData] Updating record ${id} in ${tableName}...`);
      
      const { data: result, error: updateError } = await supabase
        .from(tableName as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log(`✅ [useTableData] Record updated in ${tableName}:`, (result as any)?.id);
      
      // Actualizar estado local
      if (result) {
        setData(prev => prev.map(item => 
          item.id === id ? result : item
        ));
        toast.success(`${getTableDisplayName(tableName)} actualizado exitosamente`);
        return result;
      }

      return null;
    } catch (err: any) {
      const errorMessage = err.message || `Error al actualizar ${tableName}`;
      console.error(`Error updating ${tableName}:`, err);
      toast.error(`Error actualizando ${getTableDisplayName(tableName)}: ${errorMessage}`);
      return null;
    }
  }, [user?.id, tableName]);

  const remove = useCallback(async (id: string) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return false;
    }

    try {
      console.log(`🔍 [useTableData] Deleting record ${id} from ${tableName}...`);
      
      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      console.log(`✅ [useTableData] Record deleted from ${tableName}:`, id);
      
      // Actualizar estado local
      setData(prev => prev.filter(item => item.id !== id));
      toast.success(`${getTableDisplayName(tableName)} eliminado exitosamente`);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || `Error al eliminar ${tableName}`;
      console.error(`Error deleting ${tableName}:`, err);
      toast.error(`Error eliminando ${getTableDisplayName(tableName)}: ${errorMessage}`);
      return false;
    }
  }, [user?.id, tableName]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Efecto simple sin dependencias problemáticas
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    create,
    update,
    remove
  };
}

// Función helper para nombres de display
function getTableDisplayName(tableName: string): string {
  const displayNames: Record<string, string> = {
    'profiles': 'Usuario',
    'clientes': 'Cliente',
    'productos': 'Producto',
    'proveedores': 'Proveedor',
    'facturas_emitidas': 'Factura Emitida',
    'facturas_recibidas': 'Factura Recibida',
    'ordenes_compra': 'Orden de Compra',
    'pagos': 'Pago',
    'proyectos': 'Proyecto',
    'empleados': 'Empleado',
    'empresa': 'Empresa',
    'servicios': 'Servicio',
    'inventario': 'Producto de Inventario',
    'movimientos_stock': 'Movimiento de Stock',
    'actividades': 'Actividad',
    'oportunidades': 'Oportunidad',
    'presupuestos': 'Presupuesto',
    'recetas': 'Receta',
    'ventas_recetas': 'Venta de Receta'
  };
  
  return displayNames[tableName] || tableName;
}

// HOOKS ESPECÍFICOS OPTIMIZADOS
export const useUsers = () => useTableData('profiles');
export const useClientes = () => useTableData('clientes');
export const useProductos = () => useTableData('productos');
export const useProveedores = () => useTableData('proveedores');
export const useFacturasEmitidas = () => useTableData('facturas_emitidas');
export const useFacturasRecibidas = () => useTableData('facturas_recibidas');
export const useOrdenesCompra = () => useTableData('ordenes_compra');
export const usePagos = () => useTableData('pagos');
export const useProyectos = () => useTableData('proyectos');
export const useEmpleados = () => useTableData('empleados');
export const useEmpresa = () => useTableData('empresa');
export const useServicios = () => useTableData('servicios');
export const useInventario = () => useTableData('inventario');
export const useActividades = () => useTableData('actividades');
export const useOportunidades = () => useTableData('oportunidades');
export const usePresupuestos = () => useTableData('presupuestos');
export const useRecetas = () => useTableData('recetas');
export const useVentasRecetas = () => useTableData('ventas_recetas');

// Hook especializado para movimientos de stock con información adicional
export const useMovimientosStock = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useMovimientosStock] Fetching stock movements with product info...');
      
      // Consulta con JOIN para obtener información del producto
      const { data: result, error: queryError } = await supabase
        .from('movimientos_stock')
        .select(`
          *,
          productos:producto_id (
            nombre,
            descripcion,
            codigo
          )
        `)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      
      console.log(`✅ [useMovimientosStock] Successfully fetched ${result?.length || 0} movements`);
      setData(result || []);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar movimientos de stock';
      setError(errorMessage);
      console.error('Error fetching movimientos_stock:', err);
      
      if (!errorMessage.includes('permission')) {
        toast.error(`Error cargando movimientos: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook especializado para dashboard con métricas
export const useDashboardMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useDashboardMetrics] Fetching dashboard metrics...');
      
      // Obtener métricas básicas de diferentes tablas
      const [
        clientesRes,
        productosRes,
        facturasEmitidasRes,
        facturasRecibidasRes,
        proyectosRes
      ] = await Promise.allSettled([
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('productos').select('id', { count: 'exact', head: true }),
        supabase.from('facturas_emitidas').select('id', { count: 'exact', head: true }),
        supabase.from('facturas_recibidas').select('id', { count: 'exact', head: true }),
        supabase.from('proyectos').select('id', { count: 'exact', head: true })
      ]);
      
      const metricsData = {
        clientes: clientesRes.status === 'fulfilled' ? clientesRes.value.count || 0 : 0,
        productos: productosRes.status === 'fulfilled' ? productosRes.value.count || 0 : 0,
        facturasEmitidas: facturasEmitidasRes.status === 'fulfilled' ? facturasEmitidasRes.value.count || 0 : 0,
        facturasRecibidas: facturasRecibidasRes.status === 'fulfilled' ? facturasRecibidasRes.value.count || 0 : 0,
        proyectos: proyectosRes.status === 'fulfilled' ? proyectosRes.value.count || 0 : 0
      };
      
      console.log('✅ [useDashboardMetrics] Metrics fetched successfully:', metricsData);
      setMetrics(metricsData);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar métricas del dashboard';
      setError(errorMessage);
      console.error('Error fetching dashboard metrics:', err);
      toast.error(`Error cargando métricas: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};

// Hook para búsqueda avanzada
export const useSearchData = (tableName: string, searchTerm: string) => {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!user || !searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 [useSearchData] Searching in ${tableName} for: ${searchTerm}`);
      
      // Búsqueda básica por nombre, email, descripción
      const { data: result, error: searchError } = await supabase
        .from(tableName as any)
        .select('*')
        .or(`nombre.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
        .limit(10);

      if (searchError) throw searchError;
      
      console.log(`✅ [useSearchData] Found ${result?.length || 0} results in ${tableName}`);
      setResults(result || []);
      
    } catch (err: any) {
      const errorMessage = err.message || `Error al buscar en ${tableName}`;
      setError(errorMessage);
      console.error(`Error searching ${tableName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, tableName, searchTerm]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      search();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(debounceTimer);
  }, [search]);

  return { results, loading, error, search };
};
