-- =====================================================
-- MIGRACIÓN RLS Y SEGURIDAD ONEPYME
-- Fecha: 2025-01-20
-- Descripción: Configuración de RLS, funciones y políticas de seguridad
-- =====================================================

-- =====================================================
-- FUNCIONES DEL SISTEMA
-- =====================================================

-- Función para asignar automáticamente empresa_id
CREATE OR REPLACE FUNCTION assign_empresa_id_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Si no se especifica empresa_id, asignar el de OnePyme
    IF NEW.empresa_id IS NULL THEN
        NEW.empresa_id := '00000000-0000-0000-0000-000000000001';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Función para verificar acceso a sección empresa
CREATE OR REPLACE FUNCTION can_access_empresa_section()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'developer')
    );
END;
$$;

-- Función para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles 
        WHERE profiles.id = auth.uid()
    );
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para asignación automática de empresa_id
DROP TRIGGER IF EXISTS trigger_assign_empresa_id ON profiles;
CREATE TRIGGER trigger_assign_empresa_id
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_empresa_id_to_profile();

-- =====================================================
-- VISTAS SEGURAS
-- =====================================================

-- Vista segura para empresa principal
CREATE OR REPLACE VIEW empresa_secure AS
SELECT 
    e.*,
    can_access_empresa_section() as has_access
FROM empresa e
WHERE can_access_empresa_section();

-- Vista segura para empresas (clientes/proveedores)
CREATE OR REPLACE VIEW empresas_secure AS
SELECT 
    e.*,
    can_access_empresa_section() as has_access
FROM empresas e
WHERE can_access_empresa_section();

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_pipeline ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Políticas para empresa (empresa principal)
DROP POLICY IF EXISTS "Admin and Developer only - empresa" ON empresa;
CREATE POLICY "Admin and Developer only - empresa" ON empresa
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'developer')
    )
);

-- Políticas para empresas (clientes/proveedores)
DROP POLICY IF EXISTS "Authenticated users can view empresas" ON empresas;
DROP POLICY IF EXISTS "Admin and Developer can modify empresas" ON empresas;

CREATE POLICY "Authenticated users can view empresas" ON empresas
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Developer can modify empresas" ON empresas
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'developer')
    )
);

-- Políticas para profiles
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "System can insert profiles" ON profiles
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Políticas para user_preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para user_actions (usando la estructura existente)
CREATE POLICY "Users can view own actions" ON user_actions
FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para productos
CREATE POLICY "Authenticated users can view productos" ON productos
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Developer can modify productos" ON productos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'developer')
    )
);

-- Políticas para categorias
CREATE POLICY "Authenticated users can view categorias" ON categorias
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Developer can modify categorias" ON categorias
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'developer')
    )
);

-- Políticas para etapas_pipeline
CREATE POLICY "Authenticated users can view etapas_pipeline" ON etapas_pipeline
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Developer can modify etapas_pipeline" ON etapas_pipeline
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'developer')
    )
);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar empresa OnePyme por defecto
INSERT INTO empresa (
    id,
    nombre,
    razon_social,
    cuit,
    email,
    condicion_iva,
    activa
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'OnePyme Default',
    'OnePyme S.A.',
    '30-00000000-0',
    'admin@onepyme.pro',
    'Responsable Inscripto',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insertar categorías básicas
INSERT INTO categorias (nombre, descripcion) VALUES
('General', 'Categoría general de productos'),
('Servicios', 'Servicios prestados'),
('Software', 'Productos de software'),
('Hardware', 'Productos de hardware')
ON CONFLICT DO NOTHING;

-- Insertar etapas básicas del pipeline
INSERT INTO etapas_pipeline (nombre, descripcion, orden, color, activa) VALUES
('Prospección', 'Identificación de leads potenciales', 1, '#FF6B6B', true),
('Calificación', 'Evaluación de la viabilidad del lead', 2, '#4ECDC4', true),
('Propuesta', 'Presentación de propuesta comercial', 3, '#45B7D1', true),
('Negociación', 'Discusión de términos y condiciones', 4, '#96CEB4', true),
('Cierre', 'Cierre de la venta', 5, '#FFEAA7', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_empresas_es_cliente ON empresas(es_cliente);
CREATE INDEX IF NOT EXISTS idx_empresas_es_proveedor ON empresas(es_proveedor);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_usuario_id ON user_actions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_usuario_id ON user_preferences(usuario_id);

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION assign_empresa_id_to_profile() IS 'Asigna automáticamente empresa_id a nuevos perfiles';
COMMENT ON FUNCTION can_access_empresa_section() IS 'Verifica si el usuario puede acceder a la sección empresa';
COMMENT ON FUNCTION get_current_user_role() IS 'Obtiene el rol del usuario actual';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
