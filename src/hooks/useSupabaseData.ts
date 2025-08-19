import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Hook simple para cualquier tabla
export function useTableData(tableName: string) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Consulta simple sin order problemático
      const { data: result, error: queryError } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(100); // Limitar resultados para evitar timeouts

      if (queryError) throw queryError;

      setData(result || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error al cargar ${tableName}`;
      setError(errorMessage);
      console.error(`Error fetching ${tableName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, tableName]);

  const create = useCallback(async (itemData: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const { data: result, error: insertError } = await supabase
        .from(tableName as any)
        .insert(itemData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (result) {
        setData(prev => [result, ...prev]);
        toast.success(`${tableName} creado exitosamente`);
        return result;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error al crear ${tableName}`;
      toast.error(errorMessage);
      console.error(`Error creating ${tableName}:`, err);
      return null;
    }
  }, [user?.id, tableName]);

  const update = useCallback(async (id: string, itemData: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const { data: result, error: updateError } = await supabase
        .from(tableName as any)
        .update(itemData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (result) {
        setData(prev => prev.map(item => 
          item.id === id ? result : item
        ));
        toast.success(`${tableName} actualizado exitosamente`);
        return result;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error al actualizar ${tableName}`;
      toast.error(errorMessage);
      console.error(`Error updating ${tableName}:`, err);
      return null;
    }
  }, [user?.id, tableName]);

  const remove = useCallback(async (id: string) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setData(prev => prev.filter(item => item.id !== id));
      toast.success(`${tableName} eliminado exitosamente`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error al eliminar ${tableName}`;
      toast.error(errorMessage);
      console.error(`Error deleting ${tableName}:`, err);
      return false;
    }
  }, [user?.id, tableName]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

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

// Hooks específicos usando el hook genérico
export const useUsers = () => useTableData('profiles');
export const useClientes = () => useTableData('clientes');
export const useProductos = () => useTableData('productos');
// Hook para facturas usando función RPC
export const useFacturas = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data: result, error: queryError } = await (supabase as any)
        .rpc('get_facturas_data');

      if (queryError) throw queryError;
      setData(result || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar facturas';
      setError(errorMessage);
      console.error('Error fetching facturas:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const create = useCallback(async (facturaData: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const { data: result, error: insertError } = await (supabase as any)
        .from('facturas')
        .insert(facturaData)
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchData(); // Recargar datos
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear factura';
      toast.error(errorMessage);
      console.error('Error creating factura:', err);
      return null;
    }
  }, [user?.id, fetchData]);

  const update = useCallback(async (id: string, updates: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const { data: result, error: updateError } = await (supabase as any)
        .from('facturas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchData(); // Recargar datos
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar factura';
      toast.error(errorMessage);
      console.error('Error updating factura:', err);
      return null;
    }
  }, [user?.id, fetchData]);

  const remove = useCallback(async (id: string) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return false;
    }

    try {
      const { error: deleteError } = await (supabase as any)
        .from('facturas')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchData(); // Recargar datos
      toast.success('Factura eliminada exitosamente');
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar factura';
      toast.error(errorMessage);
      console.error('Error deleting factura:', err);
      return false;
    }
  }, [user?.id, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, create, update, remove, refetch: fetchData };
};

export const useFacturasEmitidas = () => useTableData('facturas_emitidas');
export const useFacturasRecibidas = () => useTableData('facturas_recibidas');

// Hook para movimientos de stock usando función RPC
export const useMovimientosStock = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data: result, error: queryError } = await (supabase as any)
        .rpc('get_movimientos_stock_data');

      if (queryError) throw queryError;
      setData(result || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar movimientos de stock';
      setError(errorMessage);
      console.error('Error fetching movimientos stock:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const create = useCallback(async (movimientoData: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const { data: result, error: insertError } = await supabase
        .from('movimientos_stock')
        .insert(movimientoData)
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchData(); // Recargar datos
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear movimiento de stock';
      toast.error(errorMessage);
      console.error('Error creating movimiento stock:', err);
      return null;
    }
  }, [user?.id, fetchData]);

  const update = useCallback(async (id: string, updates: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const { data: result, error: updateError } = await supabase
        .from('movimientos_stock')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchData(); // Recargar datos
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar movimiento de stock';
      toast.error(errorMessage);
      console.error('Error updating movimiento stock:', err);
      return null;
    }
  }, [user?.id, fetchData]);

  const remove = useCallback(async (id: string) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('movimientos_stock')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchData(); // Recargar datos
      toast.success('Movimiento de stock eliminado exitosamente');
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar movimiento de stock';
      toast.error(errorMessage);
      console.error('Error deleting movimiento stock:', err);
      return false;
    }
  }, [user?.id, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, create, update, remove, refetch: fetchData };
};
export const useAlertasStock = () => useTableData('alertas_stock');
export const useRecetas = () => useTableData('recetas');
export const usePagos = () => useTableData('pagos');
export const useOrdenesCompra = () => useTableData('ordenes_compra');
export const useProveedores = () => useTableData('proveedores');
export const useEmpleados = () => useTableData('empleados');
export const useProyectos = () => useTableData('proyectos');
export const useOportunidades = () => useTableData('oportunidades');
export const useActividades = () => useTableData('actividades');
export const useCampanas = () => useTableData('campanas');
export const useTareas = () => useTableData('tareas');
export const usePresupuestos = () => useTableData('presupuestos');
export const useCashFlowProyecciones = () => useTableData('cash_flow_proyecciones');
export const useTransaccionesFinancieras = () => useTableData('transacciones_financieras');
export const useTiempoTrabajado = () => useTableData('tiempo_trabajado');
export const useIngredientesReceta = () => useTableData('ingredientes_receta');
export const useVentasRecetas = () => useTableData('ventas_recetas');
export const useOrdenCompraProductos = () => useTableData('orden_compra_productos');
export const useEmpresa = () => useTableData('empresa');
export const useContactos = () => useTableData('contactos');
export const useInteracciones = () => useTableData('interacciones');
export const useEtapasPipeline = () => useTableData('etapas_pipeline');
export const useDashboardData = () => useTableData('dashboard_data');
export const useCRMDashboard = () => useTableData('crm_dashboard');
export const useERPDashboard = () => useTableData('erp_dashboard');
export const useCashFlow = () => useTableData('cash_flow');
export const useKPIs = () => useTableData('kpis');
export const useEmpresas = () => useTableData('empresas');
export const useAsistencia = () => useTableData('asistencia');

// Hooks para contabilidad
export const useCuentasContables = () => useTableData('cuentas_contables');
export const useAsientosContables = () => useTableData('asientos_contables');

// Hooks para servicios
export const useServicios = () => useTableData('servicios');

// Hooks para logs del sistema
export const useSystemLogs = () => useTableData('system_logs');

// Hook especial para factura_productos con filtro
export function useFacturaProductos(facturaId?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Usar función RPC para evitar problemas de RLS
      const { data: result, error: queryError } = await (supabase as any)
        .rpc('get_factura_productos_data', { factura_id_param: facturaId || null });

      if (queryError) throw queryError;
      setData(result || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar productos de factura';
      setError(errorMessage);
      console.error('Error fetching factura productos:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, facturaId]);

  const create = useCallback(async (productoData: any) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const { data: result, error: insertError } = await supabase
        .from('factura_productos' as any)
        .insert(productoData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (result) {
        setData(prev => [result, ...prev]);
        toast.success('Producto de factura creado exitosamente');
        return result;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear producto de factura';
      toast.error(errorMessage);
      console.error('Error creating factura producto:', err);
      return null;
    }
  }, [user?.id]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    create
  };
}
