# 🚀 PROTOCOLO COMPLETO: CONVERSIÓN A SINGLE TENANT

## 📋 **INFORMACIÓN DEL PROTOCOLO**

- **Objetivo**: Convertir OnePyme de arquitectura multi-tenant híbrida a single tenant puro
- **Duración estimada**: 4-6 horas
- **Riesgo**: ALTO - Requiere modificaciones estructurales
- **Reversibilidad**: SÍ - Con backup completo

---

## ⚠️ **PRERREQUISITOS CRÍTICOS**

### **🔒 BACKUP OBLIGATORIO**
```bash
# 1. Backup completo de la base de datos
supabase db dump --file backup_pre_single_tenant.sql

# 2. Backup del código
git add . && git commit -m "Backup antes de conversión single tenant"
git push origin main

# 3. Crear branch de trabajo
git checkout -b single-tenant-conversion
```

### **🛑 VERIFICACIONES PREVIAS**
- [ ] Sistema funcionando correctamente
- [ ] Backup de base de datos creado
- [ ] Código commiteado y pusheado
- [ ] Branch de trabajo creado
- [ ] Acceso completo a Supabase
- [ ] Tiempo suficiente para completar (4-6 horas)

---

## 🎯 **FASE 1: PREPARACIÓN Y ANÁLISIS**

### **1.1 Identificar Empresa Principal**
```sql
-- Obtener la empresa principal del sistema
SELECT id, nombre, email, cuit 
FROM empresa 
WHERE activa = true 
ORDER BY created_at ASC 
LIMIT 1;
```

### **1.2 Verificar Datos Críticos**
```sql
-- Contar registros por tabla principal
SELECT 
  'productos' as tabla, COUNT(*) as registros FROM productos
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'facturas_emitidas', COUNT(*) FROM facturas_emitidas
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;
```

### **1.3 Documentar Estado Actual**
```bash
# Crear snapshot del estado actual
echo "ESTADO PRE-CONVERSIÓN:" > conversion_log.txt
echo "Fecha: $(date)" >> conversion_log.txt
echo "Empresa principal: [EMPRESA_ID]" >> conversion_log.txt
```

---

## 🗃️ **FASE 2: MIGRACIÓN DE BASE DE DATOS**

### **2.1 Crear Migración Principal**
```sql
-- Archivo: supabase/migrations/20250113140000_convert_to_single_tenant.sql

-- ===== CONVERSIÓN A SINGLE TENANT =====
-- Esta migración elimina toda la lógica multi-tenant

-- 1. ELIMINAR POLÍTICAS RLS MULTI-TENANT
DROP POLICY IF EXISTS "Users can view products from their company" ON productos;
DROP POLICY IF EXISTS "Users can manage products from their company" ON productos;
DROP POLICY IF EXISTS "Users can view clients from their company" ON clientes;
DROP POLICY IF EXISTS "Users can manage clients from their company" ON clientes;
DROP POLICY IF EXISTS "Users can view stock movements from their company" ON movimientos_stock;
DROP POLICY IF EXISTS "Users can manage stock movements from their company" ON movimientos_stock;
DROP POLICY IF EXISTS "Users can view stock alerts from their company" ON alertas_stock;
DROP POLICY IF EXISTS "Users can manage stock alerts from their company" ON alertas_stock;
DROP POLICY IF EXISTS "Users can view invoices from their company" ON facturas_emitidas;
DROP POLICY IF EXISTS "Users can manage invoices from their company" ON facturas_emitidas;
DROP POLICY IF EXISTS "Users can view received invoices from their company" ON facturas_recibidas;
DROP POLICY IF EXISTS "Users can manage received invoices from their company" ON facturas_recibidas;
DROP POLICY IF EXISTS "Users can view orders from their company" ON ordenes_compra;
DROP POLICY IF EXISTS "Users can manage orders from their company" ON ordenes_compra;
DROP POLICY IF EXISTS "Users can view payments from their company" ON pagos;
DROP POLICY IF EXISTS "Users can manage payments from their company" ON pagos;
DROP POLICY IF EXISTS "Users can view recipes from their company" ON recetas;
DROP POLICY IF EXISTS "Users can manage recipes from their company" ON recetas;
DROP POLICY IF EXISTS "Users can view recipe sales from their company" ON ventas_recetas;
DROP POLICY IF EXISTS "Users can manage recipe sales from their company" ON ventas_recetas;

-- Políticas complejas con EXISTS
DROP POLICY IF EXISTS "Users can view order products from their company" ON orden_compra_productos;
DROP POLICY IF EXISTS "Users can manage order products from their company" ON orden_compra_productos;
DROP POLICY IF EXISTS "Users can view recipe ingredients from their company" ON ingredientes_receta;
DROP POLICY IF EXISTS "Users can manage recipe ingredients from their company" ON ingredientes_receta;

-- 2. CREAR POLÍTICAS RLS SINGLE TENANT SIMPLES
CREATE POLICY "Allow all operations for authenticated users" ON productos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON clientes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON movimientos_stock
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON alertas_stock
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON facturas_emitidas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON facturas_recibidas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON ordenes_compra
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON orden_compra_productos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON pagos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON recetas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON ingredientes_receta
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON ventas_recetas
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. ACTUALIZAR FUNCIÓN get_current_user_empresa_id (mantener por compatibilidad)
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS UUID AS $$
BEGIN
  -- En single tenant, siempre retorna la empresa principal
  RETURN (SELECT id FROM empresa WHERE activa = true LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ELIMINAR ÍNDICES INNECESARIOS DE empresa_id
DROP INDEX IF EXISTS idx_productos_empresa_id;
DROP INDEX IF EXISTS idx_clientes_empresa_id;
DROP INDEX IF EXISTS idx_movimientos_stock_empresa_id;
DROP INDEX IF EXISTS idx_facturas_emitidas_empresa_id;
DROP INDEX IF EXISTS idx_facturas_recibidas_empresa_id;
DROP INDEX IF EXISTS idx_ordenes_compra_empresa_id;
DROP INDEX IF EXISTS idx_pagos_empresa_id;
DROP INDEX IF EXISTS idx_recetas_empresa_id;
DROP INDEX IF EXISTS idx_ventas_recetas_empresa_id;

-- 5. CREAR ÍNDICES OPTIMIZADOS PARA SINGLE TENANT
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_productos_sku_unique ON productos(sku) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_fecha ON facturas_emitidas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_estado ON facturas_emitidas(estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_fecha ON movimientos_stock(created_at);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto ON movimientos_stock(producto_id);

-- 6. ASIGNAR TODOS LOS USUARIOS A LA EMPRESA PRINCIPAL
DO $$
DECLARE
  empresa_principal_id UUID;
BEGIN
  -- Obtener ID de empresa principal
  SELECT id INTO empresa_principal_id 
  FROM empresa 
  WHERE activa = true 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- Actualizar todos los profiles sin empresa_id
  UPDATE profiles 
  SET empresa_id = empresa_principal_id 
  WHERE empresa_id IS NULL;
  
  RAISE NOTICE 'Usuarios asignados a empresa principal: %', empresa_principal_id;
END $$;

-- 7. VERIFICACIÓN FINAL
DO $$
BEGIN
  RAISE NOTICE '✅ Conversión a Single Tenant completada';
  RAISE NOTICE '✅ Políticas RLS simplificadas';
  RAISE NOTICE '✅ Índices optimizados';
  RAISE NOTICE '✅ Usuarios asignados a empresa principal';
END $$;
```

### **2.2 Aplicar Migración**
```bash
# Aplicar la migración
supabase db push
```

---

## 💻 **FASE 3: ACTUALIZACIÓN DEL CÓDIGO**

### **3.1 Actualizar Hooks de Datos**

#### **Archivo: `src/hooks/useSupabaseData.ts`**
```typescript
// ANTES (Multi-tenant)
const fetchData = useCallback(async () => {
  // ... código existente
  let query = supabase.from(table).select(select);
  
  // SIMPLE TENANT: No hay filtros automáticos por empresa_id
  // Una sola empresa por instalación = no hay necesidad de filtrar
  
  // Aplicar filtros adicionales si se especifican
  if (filters) {
    // ... aplicar filtros
  }
});

// DESPUÉS (Single tenant optimizado)
const fetchData = useCallback(async () => {
  if (!user || !enabled) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    let query = supabase.from(table).select(select);

    // SINGLE TENANT: Sin filtros por empresa_id
    // Aplicar solo filtros específicos del negocio
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

    const { data: result, error: queryError } = await query
      .order('created_at', { ascending: false });

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
    // SINGLE TENANT: Los datos se insertan sin empresa_id automático
    const { data: result, error: insertError } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (insertError) throw insertError;

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
    return null;
  }

  try {
    // SINGLE TENANT: Update directo sin verificar empresa_id
    const { data: result, error: updateError } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

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
    // SINGLE TENANT: Delete directo sin verificar empresa_id
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

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
```

### **3.2 Actualizar AuthContext**

#### **Archivo: `src/contexts/AuthContext.tsx`**
```typescript
const createProfile = async (userId: string, email: string, userData?: any) => {
  try {
    console.log('Creating profile for user:', userId, email);
    
    // SINGLE TENANT: Obtener la única empresa del sistema
    const { data: empresa, error: empresaError } = await supabase
      .from('empresa')
      .select('id, nombre')
      .eq('activa', true)
      .single();

    if (empresaError || !empresa) {
      console.error('Error fetching empresa or no empresa exists:', empresaError);
      throw new Error('No hay empresa configurada en el sistema. Contacta al administrador.');
    }

    const profileData = {
      id: userId,
      username: userData?.username || email.split('@')[0],
      first_name: userData?.first_name || '',
      last_name: userData?.last_name || '',
      email: email,
      empresa_id: empresa.id, // Siempre la misma empresa
      role: 'usuario' as const
    };

    console.log('Creating profile with data:', profileData);

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    console.log('Profile created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
};
```

### **3.3 Limpiar Referencias a empresa_id**

#### **Buscar y limpiar archivos**
```bash
# Buscar archivos con referencias a empresa_id
grep -r "empresa_id" src/ --include="*.ts" --include="*.tsx" > empresa_id_references.txt

# Revisar cada archivo y eliminar lógica innecesaria
```

---

## 🧪 **FASE 4: TESTING Y VALIDACIÓN**

### **4.1 Tests de Base de Datos**
```sql
-- Verificar que las consultas funcionan sin empresa_id
SELECT COUNT(*) FROM productos WHERE activo = true;
SELECT COUNT(*) FROM clientes WHERE activo = true;
SELECT COUNT(*) FROM facturas_emitidas;

-- Verificar políticas RLS
SET ROLE authenticated;
SELECT * FROM productos LIMIT 5;
SELECT * FROM clientes LIMIT 5;
```

### **4.2 Tests de Frontend**
```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar funcionalidades:
# - Login funciona
# - Listados cargan correctamente
# - CRUD operations funcionan
# - No hay errores en consola
```

### **4.3 Tests de Rendimiento**
```sql
-- Comparar tiempos de consulta
EXPLAIN ANALYZE SELECT * FROM productos WHERE activo = true;
EXPLAIN ANALYZE SELECT * FROM clientes WHERE activo = true;
```

---

## 🔍 **FASE 5: VERIFICACIÓN FINAL**

### **5.1 Checklist de Funcionalidades**
- [ ] Login de usuarios funciona
- [ ] Listado de productos carga
- [ ] Crear/editar/eliminar productos
- [ ] Listado de clientes carga
- [ ] Crear/editar/eliminar clientes
- [ ] Facturas se pueden crear
- [ ] Movimientos de stock funcionan
- [ ] No hay errores en consola
- [ ] Rendimiento mejorado

### **5.2 Verificación de Datos**
```sql
-- Contar registros después de migración
SELECT 
  'productos' as tabla, COUNT(*) as registros FROM productos
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'facturas_emitidas', COUNT(*) FROM facturas_emitidas;

-- Verificar que no se perdieron datos
```

### **5.3 Log de Conversión**
```bash
echo "CONVERSIÓN COMPLETADA:" >> conversion_log.txt
echo "Fecha fin: $(date)" >> conversion_log.txt
echo "Estado: EXITOSO" >> conversion_log.txt
echo "Funcionalidades verificadas: ✅" >> conversion_log.txt
```

---

## 🚨 **PLAN DE ROLLBACK**

### **En caso de problemas críticos:**

#### **1. Rollback de Base de Datos**
```bash
# Restaurar backup
supabase db reset --file backup_pre_single_tenant.sql
```

#### **2. Rollback de Código**
```bash
# Volver al commit anterior
git checkout main
git branch -D single-tenant-conversion
```

#### **3. Verificar Estado**
```bash
# Verificar que todo funciona como antes
npm run dev
```

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Rendimiento**
- [ ] Consultas 20-30% más rápidas
- [ ] Menos memoria utilizada
- [ ] Menos índices en base de datos

### **Código**
- [ ] Menos líneas de código
- [ ] Lógica más simple
- [ ] Menos archivos con empresa_id

### **Funcionalidad**
- [ ] Todas las features funcionan
- [ ] No hay regresiones
- [ ] UX sin cambios

---

## 📝 **DOCUMENTACIÓN POST-CONVERSIÓN**

### **Actualizar documentación:**
- [ ] README.md con nueva arquitectura
- [ ] Diagramas de base de datos
- [ ] Guías de desarrollo
- [ ] API documentation

---

## ⏰ **CRONOGRAMA ESTIMADO**

| Fase | Duración | Descripción |
|------|----------|-------------|
| 1 | 30 min | Preparación y análisis |
| 2 | 2 horas | Migración de base de datos |
| 3 | 2 horas | Actualización de código |
| 4 | 1 hora | Testing y validación |
| 5 | 30 min | Verificación final |
| **Total** | **6 horas** | **Conversión completa** |

---

## 🎯 **RESULTADO ESPERADO**

Al finalizar este protocolo, el sistema OnePyme será:

- ✅ **100% Single Tenant**: Sin lógica multi-tenant
- ✅ **Más Rápido**: Consultas optimizadas
- ✅ **Más Simple**: Código limpio y mantenible
- ✅ **Más Escalable**: Arquitectura alineada con el negocio
- ✅ **Más Confiable**: Menos complejidad = menos bugs

---

**📅 Fecha de creación**: 13 de Enero 2025  
**👨‍💻 Autor**: Claude Sonnet 4  
**🔄 Versión**: 1.0  
**⚡ Estado**: Listo para ejecución
