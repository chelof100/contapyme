-- =====================================================
-- ESQUEMA COMPLETO BASE DE DATOS ONEPYME
-- Sistema Single-Tenant para PYMES Argentinas
-- =====================================================

-- Configuración inicial
SET search_path = public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENUMS Y TIPOS PERSONALIZADOS
-- =====================================================

-- Estados de actividades
CREATE TYPE estado_actividad AS ENUM (
    'pendiente', 'en_progreso', 'completada', 'cancelada', 'vencida'
);

-- Estados de facturas
CREATE TYPE estado_factura AS ENUM (
    'borrador', 'pendiente', 'emitida', 'vencida', 'pagada', 'cancelada'
);

-- Estados de órdenes
CREATE TYPE estado_orden AS ENUM (
    'borrador', 'abierta', 'confirmada', 'en_proceso', 'cerrada', 'cancelada'
);

-- Estados de proyectos
CREATE TYPE estado_proyecto AS ENUM (
    'planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado'
);

-- Prioridades
CREATE TYPE prioridad AS ENUM (
    'baja', 'media', 'alta', 'critica'
);

-- Tipos de actividad
CREATE TYPE tipo_actividad AS ENUM (
    'llamada', 'email', 'reunion', 'tarea', 'demo', 'visita'
);

-- Tipos de movimiento de stock
CREATE TYPE tipo_movimiento AS ENUM (
    'ingreso', 'egreso', 'ajuste', 'transferencia'
);

-- Tipos de pago
CREATE TYPE tipo_pago AS ENUM (
    'efectivo', 'transferencia', 'cheque', 'tarjeta', 'crypto'
);

-- Roles de usuario
CREATE TYPE user_role AS ENUM (
    'developer', 'admin', 'contador', 'usuario'
);

-- =====================================================
-- 2. TABLAS DE AUTENTICACIÓN Y USUARIOS
-- =====================================================

-- Tabla de usuarios (extensión de auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'usuario',
    empresa_id UUID, -- Referencia histórica, no para filtros
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de roles del sistema
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    modulo TEXT NOT NULL,
    accion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación usuarios-roles
CREATE TABLE IF NOT EXISTS usuarios_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, role_id)
);

-- Tabla de relación usuarios-permisos
CREATE TABLE IF NOT EXISTS usuarios_permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    permiso_id UUID REFERENCES permisos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, permiso_id)
);

-- =====================================================
-- 3. TABLAS DE EMPRESA (SINGLE-TENANT)
-- =====================================================

-- Empresa principal del sistema (SINGLE-TENANT)
CREATE TABLE IF NOT EXISTS empresa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    razon_social TEXT,
    nombre_fantasia TEXT,
    cuit TEXT UNIQUE NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,
    codigo_postal TEXT,
    condicion_iva TEXT DEFAULT 'Responsable Inscripto',
    ingresos_brutos TEXT,
    fecha_inicio_actividades DATE,
    logo_url TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Empresas (proveedores y clientes de la empresa principal)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    razon_social TEXT,
    nombre_fantasia TEXT,
    cuit TEXT UNIQUE,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,
    codigo_postal TEXT,
    condicion_iva TEXT DEFAULT 'Responsable Inscripto',
    ingresos_brutos TEXT,
    fecha_inicio_actividades DATE,
    logo_url TEXT,
    tipo TEXT DEFAULT 'proveedor', -- 'proveedor', 'cliente', 'ambos'
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLAS DE PRODUCTOS Y STOCK
-- =====================================================

-- Categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    categoria_padre_id UUID REFERENCES categorias(id),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Productos del inventario
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    codigo TEXT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_costo DECIMAL(15,2) DEFAULT 0,
    precio_venta_sugerido DECIMAL(15,2) DEFAULT 0,
    precio_compra DECIMAL(15,2) DEFAULT 0,
    precio_venta DECIMAL(15,2) DEFAULT 0,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    categoria_id UUID REFERENCES categorias(id),
    proveedor_principal TEXT,
    ubicacion TEXT,
    unidad_medida TEXT DEFAULT 'unidad',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servicios (para facturación)
CREATE TABLE IF NOT EXISTS servicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio DECIMAL(15,2) NOT NULL,
    categoria_id UUID REFERENCES categorias(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movimientos de stock
CREATE TABLE IF NOT EXISTS movimientos_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    tipo_movimiento tipo_movimiento NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    tipo_egreso TEXT, -- 'venta_facturada', 'venta_no_facturada', 'muestra_promocion', 'ajuste_inventario', 'devolucion_proveedor'
    referencia TEXT, -- número de factura, orden, etc.
    observaciones TEXT,
    usuario_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alertas de stock
CREATE TABLE IF NOT EXISTS alertas_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    stock_actual INTEGER NOT NULL,
    stock_minimo INTEGER NOT NULL,
    diferencia INTEGER NOT NULL,
    alerta_enviada BOOLEAN DEFAULT false,
    fecha_alerta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historial de precios
CREATE TABLE IF NOT EXISTS historial_precios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    tipo_precio TEXT NOT NULL, -- 'costo', 'venta_sugerido', 'venta'
    precio_anterior DECIMAL(15,2),
    precio_nuevo DECIMAL(15,2) NOT NULL,
    motivo_cambio TEXT,
    usuario_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categorías financieras
CREATE TABLE IF NOT EXISTS categorias_financieras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL, -- 'ingreso', 'egreso'
    categoria_padre_id UUID REFERENCES categorias_financieras(id),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABLAS DE FACTURACIÓN
-- =====================================================

-- Facturas emitidas
CREATE TABLE IF NOT EXISTS facturas_emitidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_factura TEXT UNIQUE NOT NULL,
    punto_venta TEXT NOT NULL,
    tipo_comprobante TEXT NOT NULL, -- 'Factura A', 'Factura B', 'Factura C'
    cuit_cliente TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    subtotal DECIMAL(15,2) NOT NULL,
    porcentaje_iva DECIMAL(5,2) NOT NULL,
    monto_iva DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    descripcion TEXT,
    condicion_iva TEXT NOT NULL,
    estado estado_factura DEFAULT 'pendiente',
    cae TEXT,
    pdf_url TEXT,
    observaciones TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facturas recibidas
CREATE TABLE IF NOT EXISTS facturas_recibidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_factura TEXT NOT NULL,
    cuit_proveedor TEXT NOT NULL,
    proveedor_nombre TEXT NOT NULL,
    fecha_recepcion DATE NOT NULL,
    fecha_vencimiento DATE,
    monto DECIMAL(15,2) NOT NULL,
    orden_compra_id TEXT,
    estado estado_factura DEFAULT 'pendiente',
    pdf_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Productos de facturas
CREATE TABLE IF NOT EXISTS factura_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID NOT NULL,
    producto_id UUID REFERENCES productos(id),
    sku TEXT NOT NULL,
    nombre_producto TEXT NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    precio_unitario DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pagos
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID NOT NULL,
    numero_factura TEXT NOT NULL,
    tipo_factura TEXT NOT NULL, -- 'emitida', 'recibida'
    monto DECIMAL(15,2) NOT NULL,
    metodo_pago tipo_pago NOT NULL,
    transaccion_id TEXT,
    fecha_pago DATE NOT NULL,
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'confirmado', 'rechazado'
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cobros
CREATE TABLE IF NOT EXISTS cobros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID NOT NULL,
    numero_factura TEXT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    metodo_cobro tipo_pago NOT NULL,
    transaccion_id TEXT,
    fecha_cobro DATE NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TABLAS DE COMPRAS
-- =====================================================

-- Órdenes de compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_orden TEXT UNIQUE NOT NULL,
    cuit_proveedor TEXT NOT NULL,
    proveedor_nombre TEXT NOT NULL,
    fecha_orden DATE NOT NULL,
    fecha_entrega_estimada DATE,
    total DECIMAL(15,2) NOT NULL,
    estado estado_orden DEFAULT 'borrador',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recepción de productos
CREATE TABLE IF NOT EXISTS recepcion_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_compra_id UUID REFERENCES ordenes_compra(id),
    producto_id UUID REFERENCES productos(id),
    cantidad_recibida INTEGER NOT NULL,
    cantidad_ordenada INTEGER NOT NULL,
    fecha_recepcion DATE NOT NULL,
    estado TEXT DEFAULT 'recibido',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. TABLAS DE CRM
-- =====================================================

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuit TEXT UNIQUE NOT NULL,
    razon_social TEXT NOT NULL,
    nombre_fantasia TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,
    codigo_postal TEXT,
    condicion_iva TEXT DEFAULT 'Responsable Inscripto',
    categoria TEXT DEFAULT 'Regular', -- 'VIP', 'Regular', 'Nuevo', 'Importado'
    estado TEXT DEFAULT 'activo', -- 'activo', 'inactivo', 'prospecto'
    fecha_primera_compra DATE,
    monto_total_compras DECIMAL(15,2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contactos de clientes
CREATE TABLE IF NOT EXISTS contactos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    cargo TEXT,
    email TEXT,
    telefono TEXT,
    es_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interacciones con clientes
CREATE TABLE IF NOT EXISTS interacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    tipo tipo_actividad NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_planificada TIMESTAMP WITH TIME ZONE,
    fecha_realizada TIMESTAMP WITH TIME ZONE,
    prioridad prioridad DEFAULT 'media',
    estado estado_actividad DEFAULT 'pendiente',
    usuario_id UUID REFERENCES profiles(id),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Etapas del pipeline de ventas
CREATE TABLE IF NOT EXISTS etapas_pipeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL,
    probabilidad DECIMAL(5,2) DEFAULT 0, -- Porcentaje de probabilidad
    color TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Oportunidades de venta
CREATE TABLE IF NOT EXISTS oportunidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    etapa_id UUID REFERENCES etapas_pipeline(id),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    valor_estimado DECIMAL(15,2),
    probabilidad DECIMAL(5,2),
    fecha_cierre_estimada DATE,
    responsable_id UUID REFERENCES profiles(id),
    estado TEXT DEFAULT 'abierta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actividades de seguimiento
CREATE TABLE IF NOT EXISTS actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oportunidad_id UUID REFERENCES oportunidades(id),
    cliente_id UUID REFERENCES clientes(id),
    tipo tipo_actividad NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_planificada TIMESTAMP WITH TIME ZONE,
    fecha_realizada TIMESTAMP WITH TIME ZONE,
    prioridad prioridad DEFAULT 'media',
    estado estado_actividad DEFAULT 'pendiente',
    responsable_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campañas de marketing
CREATE TABLE IF NOT EXISTS campanas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL, -- 'email', 'whatsapp', 'redes_sociales'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado TEXT DEFAULT 'planificada', -- 'planificada', 'activa', 'pausada', 'finalizada'
    presupuesto DECIMAL(15,2),
    objetivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. TABLAS DE ERP
-- =====================================================

-- Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuil TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE,
    telefono TEXT,
    direccion TEXT,
    fecha_nacimiento DATE,
    cargo TEXT,
    departamento TEXT,
    fecha_ingreso DATE NOT NULL,
    fecha_egreso DATE,
    salario_basico DECIMAL(15,2),
    tipo_contrato TEXT,
    estado TEXT DEFAULT 'activo', -- 'activo', 'inactivo', 'licencia', 'vacaciones'
    banco_cbu TEXT,
    obra_social TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asistencia
CREATE TABLE IF NOT EXISTS asistencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    horas_trabajadas DECIMAL(5,2),
    horas_extra DECIMAL(5,2) DEFAULT 0,
    tipo TEXT DEFAULT 'normal', -- 'normal', 'feriado', 'licencia', 'falta', 'vacaciones'
    justificacion TEXT,
    aprobado BOOLEAN DEFAULT false,
    aprobado_por UUID REFERENCES profiles(id),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proyectos
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE,
    fecha_fin_real DATE,
    presupuesto DECIMAL(15,2),
    costo_real DECIMAL(15,2) DEFAULT 0,
    facturado DECIMAL(15,2) DEFAULT 0,
    estado estado_proyecto DEFAULT 'planificacion',
    responsable_id UUID REFERENCES empleados(id),
    prioridad prioridad DEFAULT 'media',
    progreso_porcentaje DECIMAL(5,2) DEFAULT 0,
    rentabilidad_estimada DECIMAL(5,2),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tareas de proyectos
CREATE TABLE IF NOT EXISTS tareas_proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_inicio_estimada DATE,
    fecha_fin_estimada DATE,
    fecha_inicio_real DATE,
    fecha_fin_real DATE,
    horas_estimadas DECIMAL(5,2),
    horas_reales DECIMAL(5,2) DEFAULT 0,
    prioridad prioridad DEFAULT 'media',
    estado estado_actividad DEFAULT 'pendiente',
    responsable_id UUID REFERENCES empleados(id),
    tarea_padre_id UUID REFERENCES tareas_proyecto(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tiempo trabajado
CREATE TABLE IF NOT EXISTS tiempo_trabajado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    horas DECIMAL(5,2) NOT NULL,
    descripcion_tarea TEXT,
    tarifa_hora DECIMAL(15,2),
    costo_total DECIMAL(15,2),
    facturable BOOLEAN DEFAULT true,
    facturado BOOLEAN DEFAULT false,
    categoria_trabajo TEXT,
    aprobado BOOLEAN DEFAULT false,
    aprobado_por UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    categoria_id UUID REFERENCES categorias_financieras(id),
    categoria TEXT NOT NULL,
    subcategoria TEXT,
    monto_presupuestado DECIMAL(15,2) NOT NULL,
    monto_real DECIMAL(15,2) DEFAULT 0,
    variacion_porcentaje DECIMAL(5,2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash Flow proyecciones
CREATE TABLE IF NOT EXISTS cash_flow_proyecciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    concepto TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'ingreso', 'egreso'
    monto DECIMAL(15,2) NOT NULL,
    estado TEXT DEFAULT 'proyectado', -- 'proyectado', 'confirmado', 'realizado'
    categoria TEXT,
    oportunidad_id UUID REFERENCES oportunidades(id),
    factura_id TEXT,
    recurrente BOOLEAN DEFAULT false,
    frecuencia TEXT, -- 'mensual', 'trimestral', 'anual'
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indicadores KPI
CREATE TABLE IF NOT EXISTS indicadores_kpi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    valor_actual DECIMAL(15,2),
    valor_objetivo DECIMAL(15,2),
    unidad TEXT,
    periodo TEXT,
    fecha_calculo DATE DEFAULT CURRENT_DATE,
    tendencia TEXT, -- 'creciendo', 'estable', 'decreciendo'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Liquidaciones de empleados
CREATE TABLE IF NOT EXISTS liquidaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    salario_basico DECIMAL(15,2),
    horas_extra DECIMAL(15,2),
    bonificaciones DECIMAL(15,2),
    descuentos DECIMAL(15,2),
    neto_a_cobrar DECIMAL(15,2),
    estado TEXT DEFAULT 'calculada', -- 'calculada', 'aprobada', 'pagada'
    fecha_pago DATE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. TABLAS DE RECETAS (RESTAURANTES)
-- =====================================================

-- Recetas
CREATE TABLE IF NOT EXISTS recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_producto_venta_final UUID REFERENCES productos(id),
    nombre_receta TEXT NOT NULL,
    descripcion TEXT,
    precio_venta_sugerido DECIMAL(15,2),
    costo_total DECIMAL(15,2) DEFAULT 0,
    tiempo_preparacion INTEGER, -- en minutos
    categoria TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredientes de recetas
CREATE TABLE IF NOT EXISTS ingredientes_receta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    cantidad_requerida DECIMAL(10,3) NOT NULL,
    unidad_medida TEXT NOT NULL,
    costo_unitario DECIMAL(15,2),
    costo_total DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ventas de recetas
CREATE TABLE IF NOT EXISTS ventas_recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
    cantidad_vendida INTEGER NOT NULL,
    tipo_egreso TEXT NOT NULL, -- 'venta_facturada', 'venta_no_facturada'
    fecha_egreso DATE NOT NULL,
    numero_factura TEXT,
    cliente TEXT,
    precio_venta DECIMAL(15,2),
    descuento DECIMAL(15,2) DEFAULT 0,
    mesa TEXT,
    mozo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. TABLAS DE CONFIGURACIÓN
-- =====================================================

-- Historial de configuraciones de endpoints
CREATE TABLE IF NOT EXISTS endpoint_configurations_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_name TEXT NOT NULL,
    configuration JSONB NOT NULL,
    version TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backups de configuración
CREATE TABLE IF NOT EXISTS configuration_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    configuration_data JSONB NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tests de configuración
CREATE TABLE IF NOT EXISTS configuration_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name TEXT NOT NULL,
    test_type TEXT NOT NULL,
    configuration JSONB,
    resultado BOOLEAN,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. TABLAS DE ANALÍTICAS
-- =====================================================

-- Acciones del usuario
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES profiles(id),
    accion TEXT NOT NULL,
    modulo TEXT,
    detalles JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preferencias del usuario
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    preference_key TEXT NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, preference_key)
);

-- Logs de workflows
CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name TEXT NOT NULL,
    execution_id TEXT,
    status TEXT NOT NULL, -- 'success', 'error', 'running'
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Métricas de workflows
CREATE TABLE IF NOT EXISTS workflow_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,2),
    metric_unit TEXT,
    period TEXT, -- 'daily', 'weekly', 'monthly'
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. TABLAS BANCARIAS
-- =====================================================

-- Cuentas bancarias
CREATE TABLE IF NOT EXISTS cuentas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    banco TEXT NOT NULL,
    tipo_cuenta TEXT NOT NULL, -- 'corriente', 'caja_ahorro'
    numero_cuenta TEXT NOT NULL,
    cbu TEXT UNIQUE,
    saldo_actual DECIMAL(15,2) DEFAULT 0,
    moneda TEXT DEFAULT 'ARS',
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transacciones bancarias
CREATE TABLE IF NOT EXISTS transacciones_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuenta_id UUID REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    concepto TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'ingreso', 'egreso'
    monto DECIMAL(15,2) NOT NULL,
    saldo_anterior DECIMAL(15,2) NOT NULL,
    saldo_nuevo DECIMAL(15,2) NOT NULL,
    referencia TEXT,
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 13. FUNCIONES DEL SISTEMA
-- =====================================================

-- Función para obtener empresa_id del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT empresa_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role::TEXT FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'usuario');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 14. TRIGGERS
-- =====================================================

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresa_updated_at BEFORE UPDATE ON empresa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facturas_emitidas_updated_at BEFORE UPDATE ON facturas_emitidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facturas_recibidas_updated_at BEFORE UPDATE ON facturas_recibidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_compra_updated_at BEFORE UPDATE ON ordenes_compra
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON proyectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recetas_updated_at BEFORE UPDATE ON recetas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 15. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_emitidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_recibidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;

-- Políticas simples para usuarios autenticados (SINGLE-TENANT)
-- NO hay filtros por empresa_id - todos los usuarios ven todos los datos

-- Política para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para todas las demás tablas
CREATE POLICY "Authenticated users can access all data" ON empresa
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON empresas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON productos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON facturas_emitidas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON facturas_recibidas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON ordenes_compra
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON clientes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON empleados
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON proyectos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON recetas
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 16. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices en campos de búsqueda frecuente
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_facturas_emitidas_numero ON facturas_emitidas(numero_factura);
CREATE INDEX idx_facturas_emitidas_cuit_cliente ON facturas_emitidas(cuit_cliente);
CREATE INDEX idx_facturas_emitidas_fecha ON facturas_emitidas(fecha_emision);
CREATE INDEX idx_clientes_cuit ON clientes(cuit);
CREATE INDEX idx_clientes_categoria ON clientes(categoria);
CREATE INDEX idx_empleados_cuil ON empleados(cuil);
CREATE INDEX idx_proyectos_codigo ON proyectos(codigo);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_movimientos_stock_producto ON movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_stock_fecha ON movimientos_stock(created_at);

-- =====================================================
-- 17. DATOS INICIALES
-- =====================================================

-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('developer', 'Desarrollador con acceso total al sistema', '{"all": true}'),
('admin', 'Administrador del sistema', '{"users": true, "config": true, "reports": true}'),
('contador', 'Contador con acceso a módulos contables', '{"accounting": true, "reports": true}'),
('usuario', 'Usuario básico del sistema', '{"basic": true}')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar permisos básicos
INSERT INTO permisos (nombre, descripcion, modulo, accion) VALUES
('users.view', 'Ver usuarios', 'users', 'view'),
('users.create', 'Crear usuarios', 'users', 'create'),
('users.edit', 'Editar usuarios', 'users', 'edit'),
('users.delete', 'Eliminar usuarios', 'users', 'delete'),
('accounting.view', 'Ver módulo contable', 'accounting', 'view'),
('accounting.edit', 'Editar módulo contable', 'accounting', 'edit'),
('crm.view', 'Ver módulo CRM', 'crm', 'view'),
('crm.edit', 'Editar módulo CRM', 'crm', 'edit'),
('erp.view', 'Ver módulo ERP', 'erp', 'view'),
('erp.edit', 'Editar módulo ERP', 'erp', 'edit')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar empresa por defecto
INSERT INTO empresa (id, nombre, razon_social, cuit, email, activa) VALUES
('00000000-0000-0000-0000-000000000001', 'OnePyme Test', 'OnePyme Test S.A.', '30-00000000-0', 'test@onepyme.pro', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar usuario developer por defecto
INSERT INTO profiles (id, email, username, first_name, last_name, role, empresa_id, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'developer@onepyme.pro', 'developer', 'Developer', 'OnePyme', 'developer', '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- Asignar rol developer
INSERT INTO usuarios_roles (usuario_id, role_id) 
SELECT '00000000-0000-0000-0000-000000000001', id FROM roles WHERE nombre = 'developer'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================

-- Comentario final
COMMENT ON SCHEMA public IS 'Esquema completo de OnePyme - Sistema Single-Tenant para PYMES Argentinas';

