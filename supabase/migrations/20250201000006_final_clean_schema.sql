-- MIGRACIÓN LIMPIA Y FINAL CONTAPYME
-- Fecha: Agosto 2025
-- Versión: 2.0
-- ESTE ES EL ESQUEMA DEFINITIVO Y LIMPIO

-- ===== LIMPIEZA INICIAL =====
-- Eliminar funciones y triggers problemáticos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_empresa_id() CASCADE;

-- ===== TIPOS ENUM =====
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'usuario', 'contador');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_movimiento AS ENUM ('ingreso', 'egreso');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_factura AS ENUM ('borrador', 'emitida', 'pagada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ===== TABLA EMPRESAS =====
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  condicion_iva TEXT,
  ingresos_brutos TEXT,
  fecha_inicio_actividades DATE,
  logo_url TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id),
  email TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'usuario',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA PRODUCTOS =====
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  sku TEXT NOT NULL,
  codigo TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  unidad_medida TEXT,
  precio_costo DECIMAL(10,2) DEFAULT 0,
  precio_venta DECIMAL(10,2) DEFAULT 0,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, sku),
  UNIQUE(empresa_id, codigo)
);

-- ===== TABLA CLIENTES =====
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  cuit_cuil TEXT,
  condicion_iva TEXT DEFAULT 'Consumidor Final',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== FUNCIONES Y TRIGGERS =====
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT empresa_id 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role::TEXT FROM profiles WHERE id = auth.uid()),
    'usuario'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ===== RLS POLICIES =====
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their company" ON empresas
  FOR SELECT USING (id = get_current_user_empresa_id());

CREATE POLICY "Users can view products from their company" ON productos
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage products from their company" ON productos
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- ===== DATOS INICIALES =====
INSERT INTO empresas (nombre, razon_social, cuit, email, condicion_iva, activa) 
VALUES (
  'ContaPYME Default',
  'ContaPYME Default S.A.',
  '30-00000000-0',
  'admin@contapyme.com',
  'Responsable Inscripto',
  true
) ON CONFLICT (cuit) DO NOTHING;
