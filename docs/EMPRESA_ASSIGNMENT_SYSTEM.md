# Sistema de Asignación Automática de Empresa

## 🎯 **Objetivo**
Implementar un sistema centralizado que asigne automáticamente `empresa_id` a usuarios basado en CUIT, evitando duplicados y conflictos entre múltiples usuarios de la misma empresa.

## 🔄 **Flujo de Funcionamiento**

### **1. Usuario Nuevo (Primera Vez)**
```
Usuario se registra → empresa_id = NULL → Va a Configuración → 
Completa datos de empresa → Sistema busca empresa por CUIT → 
Si existe → Asigna empresa_id existente → 
Si no existe → Crea nueva empresa y asigna nuevo empresa_id
```

### **2. Usuario Existente**
```
Usuario ya tiene empresa_id asignado → Puede actualizar datos de su empresa → 
Sistema mantiene asociación existente
```

### **3. Múltiples Usuarios de la Misma Empresa**
```
Usuario A completa datos con CUIT "30-12345678-9" → Sistema crea empresa
Usuario B completa datos con CUIT "30-12345678-9" → Sistema asigna misma empresa
Usuario C completa datos con CUIT "30-12345678-9" → Sistema asigna misma empresa
```

## 🏗️ **Arquitectura Técnica**

### **Base de Datos**

#### **Tabla `empresa` (Cliente)**
```sql
- id (UUID, PRIMARY KEY)
- nombre (TEXT, NOT NULL)
- razon_social (TEXT)
- cuit (TEXT, UNIQUE) ← CLAVE PARA BÚSQUEDA
- email (TEXT)
- telefono (TEXT)
- direccion (TEXT)
- ciudad (TEXT)
- provincia (TEXT)
- codigo_postal (TEXT)
- condicion_iva (TEXT)
- ingresos_brutos (TEXT)
- fecha_inicio_actividades (DATE)
- logo_url (TEXT)
- configuracion (JSONB)
- activa (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### **Tabla `profiles` (Usuarios)**
```sql
- id (UUID, PRIMARY KEY, REFERENCES auth.users)
- empresa_id (UUID, REFERENCES empresa(id)) ← A ASIGNAR
- email (TEXT)
- username (TEXT)
- first_name (TEXT)
- last_name (TEXT)
- avatar_url (TEXT)
- role (user_role)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### **Función SQL Principal**

#### **`asignar_o_crear_empresa(datos_empresa, usuario_id)`**
```sql
-- Busca empresa existente por CUIT
-- Si no existe, crea nueva empresa
-- Asigna empresa_id al usuario
-- Retorna el empresa_id asignado
```

### **Políticas RLS**
```sql
-- Permitir que usuarios autenticados creen empresa
CREATE POLICY "Any authenticated user can create company" ON empresa
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Usuarios pueden ver/actualizar su empresa
CREATE POLICY "Users can view/update their company" ON empresa
  FOR SELECT/UPDATE USING (id = get_current_user_empresa_id());
```

## 🔧 **Implementación Frontend**

### **Hook `useEmpresa`**
```typescript
const { 
  data: empresaData, 
  loading, 
  error, 
  update: updateEmpresa,
  createOrUpdate: createOrUpdateEmpresa 
} = useEmpresa();
```

### **Función `createOrUpdateEmpresa`**
```typescript
// Si usuario no tiene empresa_id → Crea/asigna empresa
// Si usuario tiene empresa_id → Actualiza empresa existente
const createOrUpdateEmpresa = async (data: any) => {
  return await supabase.rpc('asignar_o_crear_empresa', {
    datos_empresa: data,
    usuario_id: user.id
  });
};
```

### **Página de Configuración**
```typescript
const handleSaveEmpresa = async () => {
  if (!profile?.empresa_id) {
    // Usuario sin empresa → Crear/asignar
    await createOrUpdateEmpresa(localEmpresaData);
  } else {
    // Usuario con empresa → Actualizar
    await updateEmpresa(localEmpresaData);
  }
};
```

## 📋 **Casos de Uso**

### **Caso 1: Primera Instalación**
1. **Usuario A** se registra en `contapyme.com`
2. **Usuario A** va a Configuración → Empresa
3. **Usuario A** completa datos: CUIT "30-12345678-9"
4. **Sistema** crea empresa nueva con ID `abc-123`
5. **Sistema** asigna `empresa_id = abc-123` al usuario A

### **Caso 2: Usuario Adicional**
1. **Usuario B** se registra en `contapyme.com`
2. **Usuario B** va a Configuración → Empresa
3. **Usuario B** completa datos: CUIT "30-12345678-9"
4. **Sistema** encuentra empresa existente con ID `abc-123`
5. **Sistema** asigna `empresa_id = abc-123` al usuario B
6. **Ambos usuarios** ven los mismos datos (productos, facturas, etc.)

### **Caso 3: Actualización de Datos**
1. **Usuario A** actualiza datos de empresa
2. **Sistema** actualiza empresa existente
3. **Usuario B** ve los cambios automáticamente

## ⚠️ **Reglas Importantes**

### **1. CUIT Único**
- **CUIT debe ser único** por empresa
- **No se pueden crear** dos empresas con el mismo CUIT
- **Todos los usuarios** de la misma empresa deben usar el mismo CUIT

### **2. Asignación Automática**
- **Sistema asigna automáticamente** `empresa_id`
- **No intervención manual** requerida
- **Evita errores** de asignación incorrecta

### **3. Aislamiento de Datos**
- **Todos los datos** se filtran por `empresa_id`
- **Usuarios de diferentes empresas** no ven datos de otros
- **Row Level Security (RLS)** garantiza aislamiento

## 🚨 **Problemas que Resuelve**

### **Antes (Problemático)**
```
Usuario A: empresa_id = abc-123
Usuario B: empresa_id = def-456 (misma empresa, diferente ID)
→ Productos duplicados
→ Facturas separadas
→ Datos inconsistentes
→ Error 409 al crear productos
```

### **Después (Solución)**
```
Usuario A: empresa_id = abc-123
Usuario B: empresa_id = abc-123 (misma empresa, mismo ID)
→ Productos compartidos
→ Facturas unificadas
→ Datos consistentes
→ Sin errores de duplicación
```

## 🔍 **Troubleshooting**

### **Error: "CUIT es requerido"**
- **Causa:** Campo CUIT vacío
- **Solución:** Completar CUIT en formulario

### **Error: "Usuario no autenticado"**
- **Causa:** Usuario no logueado
- **Solución:** Hacer login antes de configurar empresa

### **Error: "Empresa no encontrada"**
- **Causa:** Problema en búsqueda por CUIT
- **Solución:** Verificar que CUIT esté correctamente formateado

### **Error: "No se pudo asignar empresa"**
- **Causa:** Problema en función SQL
- **Solución:** Verificar logs de base de datos

## 📝 **Logs de Debug**

### **Frontend**
```javascript
🔍 [useEmpresa] Creando/asignando empresa con datos: {...}
✅ [useEmpresa] Empresa asignada/creada: abc-123
❌ [useEmpresa] Error en RPC: {...}
```

### **Backend**
```sql
NOTICE: Nueva empresa creada con ID: abc-123
NOTICE: Empresa existente encontrada con ID: abc-123
NOTICE: Empresa abc-123 asignada al usuario def-456
```

## 🎯 **Beneficios**

1. **Consistencia de Datos:** Todos los usuarios de la misma empresa ven los mismos datos
2. **Evita Duplicados:** No se crean empresas duplicadas
3. **Asignación Automática:** Sin intervención manual
4. **Escalabilidad:** Funciona con múltiples usuarios
5. **Mantenibilidad:** Lógica centralizada y documentada

## 🔮 **Futuras Mejoras**

1. **Validación de CUIT:** Verificar formato y validez
2. **Migración de Datos:** Herramienta para consolidar empresas duplicadas
3. **Auditoría:** Log de cambios en asignación de empresa
4. **Notificaciones:** Alertar cuando se asigna empresa existente
5. **Backup:** Respaldo automático antes de cambios críticos
