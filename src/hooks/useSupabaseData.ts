import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseSupabaseDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
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
    // Debugging temporal - MÁS VISIBLE
    console.log('🚨🚨🚨 [AUTH DEBUG] ==========================================');
    console.log('🔍 [useSupabaseData] Debugging create:', {
      user: !!user,
      user_id: user?.id,
      profile: !!profile,
      empresa_id: profile?.empresa_id,
      table
    });
    console.log('🚨🚨🚨 [AUTH DEBUG] ==========================================');
    
    if (!user || !profile?.empresa_id) {
      console.error('❌❌❌ [AUTH ERROR] ==========================================');
      console.error('❌ [useSupabaseData] Auth check failed:', {
        user_exists: !!user,
        profile_exists: !!profile,
        empresa_id: profile?.empresa_id
      });
      console.error('❌❌❌ [AUTH ERROR] ==========================================');
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

// Hook específico para facturas emitidas
export function useFacturasEmitidas() {
  return useSupabaseData<{
    id: string;
    numero_factura: string;
    punto_venta: string;
    tipo_comprobante: string;
    cuit_cliente: string;
    cliente_nombre: string;
    fecha_emision: string;
    fecha_vencimiento: string;
    subtotal: number;
    porcentaje_iva: number;
    monto_iva: number;
    total: number;
    descripcion: string;
    condicion_iva: string;
    estado: string;
    cae: string;
    pdf_url: string;
    observaciones: string;
  }>('facturas_emitidas');
}

// Hook específico para facturas recibidas
export function useFacturasRecibidas() {
  return useSupabaseData<{
    id: string;
    numero_factura: string;
    cuit_proveedor: string;
    proveedor_nombre: string;
    fecha_recepcion: string;
    fecha_vencimiento: string;
    monto: number;
    orden_compra_id: string;
    estado: string;
    pdf_url: string;
    observaciones: string;
  }>('facturas_recibidas');
}

// Hook específico para órdenes de compra
export function useOrdenesCompra() {
  return useSupabaseData<{
    id: string;
    numero_orden: string;
    cuit_proveedor: string;
    proveedor_nombre: string;
    fecha_orden: string;
    fecha_entrega_estimada: string;
    total: number;
    estado: string;
    observaciones: string;
  }>('ordenes_compra');
}

// Hook específico para pagos
export function usePagos() {
  return useSupabaseData<{
    id: string;
    factura_id: string;
    numero_factura: string;
    tipo_factura: string;
    monto: number;
    metodo_pago: string;
    transaccion_id: string;
    fecha_pago: string;
    estado: string;
    notas: string;
  }>('pagos');
}

// Hook específico para productos
export function useProductos() {
  return useSupabaseData<{
    id: string;
    empresa_id: string;
    sku: string;
    codigo: string;
    nombre: string;
    descripcion: string;
    precio_costo: number;
    precio_venta_sugerido: number;
    precio_compra: number;
    precio_venta: number;
    stock_actual: number;
    stock_minimo: number;
    categoria: string;
    proveedor_principal: string;
    ubicacion: string;
    unidad_medida: string;
    activo: boolean;
    created_at: string;
    updated_at: string;
  }>('productos');
}

// Hook específico para movimientos de stock
export function useMovimientosStock() {
  return useSupabaseData<{
    id: string;
    producto_id: string;
    sku: string;
    tipo_movimiento: string;
    cantidad: number;
    stock_anterior: number;
    stock_nuevo: number;
    tipo_egreso: string;
    referencia: string;
    observaciones: string;
    usuario_id: string;
  }>('movimientos_stock');
}

// Hook específico para alertas de stock
export function useAlertasStock() {
  return useSupabaseData<{
    id: string;
    producto_id: string;
    sku: string;
    descripcion: string;
    stock_actual: number;
    stock_minimo: number;
    diferencia: number;
    alerta_enviada: boolean;
    fecha_alerta: string;
  }>('alertas_stock', '*', { alerta_enviada: false });
}

// Hook específico para recetas
export function useRecetas() {
  return useSupabaseData<{
    id: string;
    id_producto_venta_final: string;
    nombre_receta: string;
    descripcion: string;
    precio_venta_sugerido: number;
    costo_total: number;
    activa: boolean;
  }>('recetas', '*', { activa: true });
}

// Hook específico para productos de facturas
export function useFacturaProductos(facturaId?: string) {
  return useSupabaseData<{
    id: string;
    factura_id: string;
    empresa_id: string;
    producto_id?: string;
    sku: string;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    descripcion?: string;
    created_at: string;
    updated_at: string;
  }>('factura_productos', '*', facturaId ? { factura_id: facturaId } : undefined);
}

// Hook específico para usuarios
export function useUsers() {
  return useSupabaseData<{
    id: string;
    email: string;
    empresa_id: string;
    role: 'admin' | 'contador' | 'usuario';
    is_active: boolean;
    last_login: string;
    login_attempts: number;
    locked_until: string;
    created_at: string;
    updated_at: string;
  }>('users');
}

// Hook específico para empresas
export function useEmpresas() {
  return useSupabaseData<{
    id: string;
    nombre: string;
    rut: string;
    direccion: string;
    telefono: string;
    email: string;
    sector: string;
    tipo_empresa: string;
    created_at: string;
    updated_at: string;
  }>('empresas');
}

// Hook para obtener datos del dashboard
export function useDashboardData() {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    facturas: { emitidas: 0, recibidas: 0, pendientes: 0, vencidas: 0 },
    ordenes: { abiertas: 0, cerradas: 0 },
    pagos: { total: 0, monto: 0 },
    productos: { total: 0, stockBajo: 0 },
    loading: true
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const [
        facturasEmitidas,
        facturasRecibidas,
        ordenes,
        pagos,
        productos,
        alertasStock
      ] = await Promise.all([
        supabase.from('facturas_emitidas').select('estado, total').eq('empresa_id', profile.empresa_id),
        supabase.from('facturas_recibidas').select('estado, monto').eq('empresa_id', profile.empresa_id),
        supabase.from('ordenes_compra').select('estado').eq('empresa_id', profile.empresa_id),
        supabase.from('pagos').select('monto').eq('empresa_id', profile.empresa_id),
        supabase.from('productos').select('id').eq('empresa_id', profile.empresa_id),
        supabase.from('alertas_stock').select('id').eq('empresa_id', profile.empresa_id).eq('alerta_enviada', false)
      ]);

      const facturasPendientes = facturasEmitidas.data?.filter(f => f.estado === 'pendiente').length || 0;
      const facturasVencidas = facturasEmitidas.data?.filter(f => f.estado === 'vencida').length || 0;
      const ordenesAbiertas = ordenes.data?.filter(o => o.estado === 'abierta').length || 0;
      const ordenesCerradas = ordenes.data?.filter(o => o.estado === 'cerrada').length || 0;
      const totalPagos = pagos.data?.length || 0;
      const montoPagos = pagos.data?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0;

      setDashboardData({
        facturas: {
          emitidas: facturasEmitidas.data?.length || 0,
          recibidas: facturasRecibidas.data?.length || 0,
          pendientes: facturasPendientes,
          vencidas: facturasVencidas
        },
        ordenes: {
          abiertas: ordenesAbiertas,
          cerradas: ordenesCerradas
        },
        pagos: {
          total: totalPagos,
          monto: montoPagos
        },
        productos: {
          total: productos.data?.length || 0,
          stockBajo: alertasStock.data?.length || 0
        },
        loading: false
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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