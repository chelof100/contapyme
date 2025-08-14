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
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from(table).select(select);

      // SIMPLE TENANT: No hay filtros automáticos por empresa_id
      // Una sola empresa por instalación = no hay necesidad de filtrar

      // Aplicar filtros adicionales si se especifican
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
  }, [table, select, JSON.stringify(filters), user?.id, enabled]);

  const create = useCallback(async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      // SIMPLE TENANT: No agregar empresa_id automáticamente
      // Los datos se insertan tal como vienen
      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert(data)
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
  }, [table, user?.id]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return false;
    }

    try {
      // SIMPLE TENANT: No verificar empresa_id en updates
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
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
  }, [table, user?.id]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return false;
    }

    try {
      // SIMPLE TENANT: No verificar empresa_id en deletes
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

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
  }, [table, user?.id]);

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

// Hook específico para empresas (proveedores)
export function useEmpresas() {
  return useSupabaseData<{
    id: string;
    nombre: string;
    razon_social: string | null;
    nombre_fantasia: string | null;
    cuit: string | null;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
    provincia: string | null;
    codigo_postal: string | null;
    condicion_iva: string;
    ingresos_brutos: string | null;
    fecha_inicio_actividades: string | null;
    logo_url: string | null;
    activa: boolean;
    created_at: string;
    updated_at: string;
  }>('empresas');
}

// Hook específico para empresa (cliente)
export function useEmpresa() {
  const { user, profile } = useAuth();
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresa = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Si no hay empresa_id válido, no hacer consulta
    if (!profile?.empresa_id || profile.empresa_id === '00000000-0000-0000-0000-000000000001') {
      setLoading(false);
      setEmpresa(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: queryError } = await supabase
        .from('empresa')
        .select('*')
        .eq('id', profile.empresa_id)
        .single();

      if (queryError) {
        // Si la empresa no existe, limpiar el error y establecer empresa como null
        if (queryError.code === 'PGRST116') {
          console.log('⚠️ [useEmpresa] Empresa no encontrada, estableciendo como null');
          setEmpresa(null);
          setError(null);
        } else {
          throw queryError;
        }
      } else {
        setEmpresa(data);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar empresa';
      setError(errorMessage);
      console.error('Error fetching empresa:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.empresa_id]);

  const updateEmpresa = useCallback(async (data: Partial<any>): Promise<any | null> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    if (!profile?.empresa_id || profile.empresa_id === '00000000-0000-0000-0000-000000000001') {
      toast.error('Usuario sin empresa asignada. Configure la empresa primero.');
      return null;
    }

    try {
      const { data: result, error } = await supabase
        .from('empresa')
        .update(data)
        .eq('id', profile.empresa_id)
        .select()
        .single();

      if (error) {
        // Si la empresa no existe, crear una nueva
        if (error.code === 'PGRST116') {
          console.log('⚠️ [useEmpresa] Empresa no encontrada, creando nueva empresa...');
          
          // Crear nueva empresa directamente
          const { data: newEmpresa, error: createError } = await supabase
            .from('empresa')
            .insert({
              ...data,
              activa: true
            })
            .select()
            .single();

          if (createError) throw createError;

          setEmpresa(newEmpresa);
          toast.success('Empresa creada correctamente');
          return newEmpresa;
        } else {
          throw error;
        }
      }

      setEmpresa(result);
      toast.success('Empresa actualizada correctamente');
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar empresa';
      toast.error(errorMessage);
      console.error('Error updating empresa:', err);
      return null;
    }
  }, [user?.id, profile?.empresa_id]);

  // Nueva función para crear o asignar empresa automáticamente
  const createOrUpdateEmpresa = useCallback(async (data: any): Promise<any | null> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      console.log('🔍 [useEmpresa] Creando/asignando empresa con datos:', data);
      
      // Usar siempre la función RPC (funciona para usuarios mock y reales)
      const { data: result, error } = await supabase
        .rpc('asignar_o_crear_empresa', {
          datos_empresa: data,
          usuario_id: user.id
        });

      if (error) {
        console.error('❌ [useEmpresa] Error en RPC:', error);
        throw error;
      }

      console.log('✅ [useEmpresa] Empresa asignada/creada:', result);

      // Refetch empresa data
      await fetchEmpresa();
      
      toast.success('Empresa configurada correctamente');
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al configurar empresa';
      toast.error(errorMessage);
      console.error('Error creating/updating empresa:', err);
      return null;
    }
  }, [user?.id, fetchEmpresa]);

  useEffect(() => {
    fetchEmpresa();
  }, [fetchEmpresa]);

  return {
    data: empresa,
    loading,
    error,
    refetch: fetchEmpresa,
    update: updateEmpresa,
    createOrUpdate: createOrUpdateEmpresa
  };
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
    if (!user) return;
    
    // Si no hay empresa_id válido, no hacer consultas
    if (!profile?.empresa_id || profile.empresa_id === '00000000-0000-0000-0000-000000000001') {
      setDashboardData(prev => ({ ...prev, loading: false }));
      return;
    }

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

// Hooks CRM
export function useCRMDashboard() {
  const { user, profile } = useAuth();
  const [crmData, setCrmData] = useState({
    clientes: { total: 0, activos: 0 },
    oportunidades: { total: 0, abiertas: 0, valorTotal: 0 },
    actividades: { total: 0, pendientes: 0, completadas: 0 },
    loading: true
  });

  const fetchCRMData = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const [clientes, oportunidades, actividades] = await Promise.all([
        supabase.from('clientes').select('id, activo').eq('empresa_id', profile.empresa_id),
        supabase.from('oportunidades').select('id, estado, valor_estimado').eq('empresa_id', profile.empresa_id),
        supabase.from('actividades').select('id, estado').eq('empresa_id', profile.empresa_id)
      ]);

      const clientesActivos = clientes.data?.filter(c => c.activo).length || 0;
      const oportunidadesAbiertas = oportunidades.data?.filter(o => o.estado === 'abierta').length || 0;
      const valorTotal = oportunidades.data?.reduce((sum, o) => sum + (o.valor_estimado || 0), 0) || 0;
      const actividadesPendientes = actividades.data?.filter(a => a.estado === 'pendiente').length || 0;
      const actividadesCompletadas = actividades.data?.filter(a => a.estado === 'completada').length || 0;

      setCrmData({
        clientes: {
          total: clientes.data?.length || 0,
          activos: clientesActivos
        },
        oportunidades: {
          total: oportunidades.data?.length || 0,
          abiertas: oportunidadesAbiertas,
          valorTotal
        },
        actividades: {
          total: actividades.data?.length || 0,
          pendientes: actividadesPendientes,
          completadas: actividadesCompletadas
        },
        loading: false
      });
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      setCrmData(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchCRMData();
  }, [fetchCRMData]);

  return {
    ...crmData,
    refetch: fetchCRMData
  };
}

export function useClientes() {
  const { user, profile } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return {
    data: clientes,
    loading,
    total: clientes.length,
    refetch: fetchClientes
  };
}

export function useContactos() {
  const { user, profile } = useAuth();
  const [contactos, setContactos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContactos = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactos(data || []);
    } catch (error) {
      console.error('Error fetching contactos:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchContactos();
  }, [fetchContactos]);

  return {
    data: contactos,
    loading,
    total: contactos.length,
    refetch: fetchContactos
  };
}

export function useInteracciones() {
  const { user, profile } = useAuth();
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInteracciones = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('interacciones')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInteracciones(data || []);
    } catch (error) {
      console.error('Error fetching interacciones:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchInteracciones();
  }, [fetchInteracciones]);

  return {
    data: interacciones,
    loading,
    total: interacciones.length,
    refetch: fetchInteracciones
  };
}

export function useOportunidades() {
  const { user, profile } = useAuth();
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOportunidades = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOportunidades(data || []);
    } catch (error) {
      console.error('Error fetching oportunidades:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchOportunidades();
  }, [fetchOportunidades]);

  return {
    data: oportunidades,
    loading,
    total: oportunidades.length,
    refetch: fetchOportunidades
  };
}

export function useActividades() {
  const { user, profile } = useAuth();
  const [actividades, setActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActividades = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('actividades')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActividades(data || []);
    } catch (error) {
      console.error('Error fetching actividades:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  return {
    data: actividades,
    loading,
    total: actividades.length,
    refetch: fetchActividades
  };
}

export function useEtapasPipeline() {
  const { user, profile } = useAuth();
  const [etapas, setEtapas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEtapas = useCallback(async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('etapas_pipeline')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('orden', { ascending: true });

      if (error) throw error;
      setEtapas(data || []);
    } catch (error) {
      console.error('Error fetching etapas pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.empresa_id]);

  useEffect(() => {
    fetchEtapas();
  }, [fetchEtapas]);

  return {
    data: etapas,
    loading,
    total: etapas.length,
    refetch: fetchEtapas
  };
}