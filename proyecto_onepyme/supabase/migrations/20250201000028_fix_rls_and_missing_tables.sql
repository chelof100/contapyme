-- Corregir RLS para profiles y empresa
-- Primero deshabilitar RLS temporalmente para corregir
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresa DISABLE ROW LEVEL SECURITY;

-- Crear tablas faltantes que el frontend necesita
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    cargo VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'activo',
    presupuesto DECIMAL(15,2),
    costo_real DECIMAL(15,2),
    facturado DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tiempo_trabajado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID REFERENCES empleados(id),
    proyecto_id UUID REFERENCES proyectos(id),
    fecha DATE NOT NULL,
    horas DECIMAL(5,2) NOT NULL,
    facturable BOOLEAN DEFAULT true,
    facturado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES profiles(id),
    accion VARCHAR(255) NOT NULL,
    detalles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oportunidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'prospecto',
    valor_estimado DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presupuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    monto_presupuestado DECIMAL(15,2),
    monto_real DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_flow_proyecciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_empresa_activa ON empresa(activa);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_empleados_estado ON empleados(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_tiempo_trabajado_fecha ON tiempo_trabajado(fecha);
CREATE INDEX IF NOT EXISTS idx_user_actions_usuario_fecha ON user_actions(usuario_id, created_at);

-- Habilitar RLS nuevamente con políticas correctas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiempo_trabajado ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_proyecciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios autenticados
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view empresa" ON empresa
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON clientes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON empleados
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON proyectos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON tiempo_trabajado
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON user_actions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON actividades
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON oportunidades
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON presupuestos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all tables" ON cash_flow_proyecciones
    FOR ALL USING (auth.role() = 'authenticated');

-- Insertar datos de prueba básicos
INSERT INTO empresa (id, nombre, activa) 
VALUES ('06e35346-7ca5-4c91-8f9a-1a8354b471c7', 'OnePYME Demo', true)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, activa = EXCLUDED.activa;

-- Verificar que el usuario developer existe y tiene el perfil correcto
INSERT INTO profiles (id, email, role, empresa_id)
VALUES (
    'e55b6657-5bb1-4b5c-a3f2-9a322b081cbf',
    'developer@onepyme.pro',
    'developer',
    '06e35346-7ca5-4c91-8f9a-1a8354b471c7'
)
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    empresa_id = EXCLUDED.empresa_id;
