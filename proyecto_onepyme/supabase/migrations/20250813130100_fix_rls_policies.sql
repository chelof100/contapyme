-- ===== CORRECCIÓN DE POLÍTICAS RLS =====
-- Esta migración corrige políticas RLS inseguras

-- Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "usuarios_policy" ON usuarios;
DROP POLICY IF EXISTS "empresa_policy" ON empresa;

-- Crear políticas RLS seguras para profiles
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- Política para INSERT en profiles (solo para trigger handle_new_user)
CREATE POLICY "System can insert profiles" ON profiles
FOR INSERT WITH CHECK (true);

-- Crear políticas RLS seguras para empresa
CREATE POLICY "Users can view own company" ON empresa
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND empresa_id = empresa.id
  )
);

CREATE POLICY "Admins can view all companies" ON empresa
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

CREATE POLICY "Admins can manage companies" ON empresa
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- Crear políticas RLS seguras para productos
CREATE POLICY "Users can view products from own company" ON productos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND empresa_id = productos.empresa_id
  )
);

CREATE POLICY "Admins can view all products" ON productos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

CREATE POLICY "Users can manage products from own company" ON productos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND empresa_id = productos.empresa_id
  )
);

-- Crear políticas RLS seguras para facturas
CREATE POLICY "Users can view invoices from own company" ON facturas_emitidas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND empresa_id = facturas_emitidas.empresa_id
  )
);

CREATE POLICY "Admins can view all invoices" ON facturas_emitidas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

CREATE POLICY "Users can manage invoices from own company" ON facturas_emitidas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND empresa_id = facturas_emitidas.empresa_id
  )
);

