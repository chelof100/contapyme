# 🗄️ GUÍA DE MIGRACIÓN - BASE DE DATOS CONTAPYME

## 📋 **Descripción**

Esta guía explica cómo migrar la base de datos de ContaPYME en Supabase, incluyendo todas las tablas, funciones y triggers necesarios para el funcionamiento completo del sistema.

## 🎯 **Requisitos Previos**

- ✅ Proyecto Supabase creado
- ✅ Acceso al SQL Editor de Supabase
- ✅ Permisos de administrador en el proyecto

## 📊 **Estructura de la Migración**

### **Archivos de Migración:**
- `database/migration.sql` - Estructura principal de tablas
- `database/functions.sql` - Funciones y triggers automáticos

### **Tablas que se Crean:**
1. **`factura_productos`** - Integración productos-facturas
2. **`historial_precios`** - Auditoría de cambios de precios
3. **`proveedores`** - Gestión de proveedores
4. **`clientes`** - Gestión de clientes
5. **`categorias`** - Categorización de productos
6. **`endpoint_configurations_history`** - Historial de configuraciones
7. **`configuration_backups`** - Sistema de backups
8. **`configuration_tests`** - Tests de conectividad

### **Campos Agregados a Productos:**
- `nombre` - Nombre del producto
- `codigo_barras` - Código de barras para escaneo
- `imagen_url` - URL de imagen del producto
- `peso_kg` - Peso en kilogramos
- `volumen_l` - Volumen en litros
- `fecha_vencimiento` - Control de calidad
- `numero_lote` - Trazabilidad de lotes

## 🚀 **Pasos de Migración**

### **Paso 1: Acceder al SQL Editor**
1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Ir a **SQL Editor** en el menú lateral

### **Paso 2: Ejecutar Migración Principal**
1. Crear nueva consulta en SQL Editor
2. Copiar contenido de `database/migration.sql`
3. Ejecutar la consulta
4. Verificar que no hay errores

### **Paso 3: Ejecutar Funciones y Triggers**
1. Crear nueva consulta en SQL Editor
2. Copiar contenido de `database/functions.sql`
3. Ejecutar la consulta
4. Verificar que no hay errores

### **Paso 4: Verificar Migración**
```bash
# Ejecutar script de verificación
node scripts/verify.js
```

## 🔧 **Funciones Automáticas Creadas**

### **1. `calcular_subtotal_factura()`**
- Calcula el subtotal de una factura basado en sus productos
- Se ejecuta automáticamente al modificar productos

### **2. `actualizar_totales_factura()`**
- Actualiza totales de factura (subtotal, IVA, total)
- Se ejecuta automáticamente al cambiar productos

### **3. `procesar_venta_productos()`**
- Procesa la venta de productos al confirmar factura
- Actualiza stock automáticamente

### **4. `registrar_cambio_precio()`**
- Registra cambios de precios en el historial
- Se ejecuta automáticamente al modificar precios

## ⚡ **Triggers Automáticos Creados**

### **1. `tr_factura_productos_totales`**
- **Tabla:** `factura_productos`
- **Evento:** INSERT, UPDATE, DELETE
- **Función:** `actualizar_totales_factura()`
- **Propósito:** Actualiza totales al modificar productos

### **2. `tr_facturas_emitidas_procesar_venta`**
- **Tabla:** `facturas`
- **Evento:** UPDATE
- **Función:** `procesar_venta_productos()`
- **Propósito:** Procesa venta al confirmar factura

### **3. `tr_productos_cambio_precio`**
- **Tabla:** `productos`
- **Evento:** UPDATE
- **Función:** `registrar_cambio_precio()`
- **Propósito:** Registra cambios de precios

## 🔒 **Políticas RLS (Row Level Security)**

### **Políticas Automáticas:**
- **Usuarios pueden ver productos de su empresa**
- **Usuarios pueden insertar productos en su empresa**
- **Usuarios pueden actualizar productos de su empresa**
- **Usuarios pueden eliminar productos de su empresa**
- **Políticas similares para todas las tablas**

### **Verificar Políticas:**
1. Ir a **Authentication > Policies**
2. Verificar que todas las tablas tienen políticas activas
3. Verificar que las políticas incluyen `empresa_id`

## 🚨 **Solución de Problemas**

### **Error: "relation already exists"**
```sql
-- Eliminar tabla si existe
DROP TABLE IF EXISTS nombre_tabla CASCADE;
```

### **Error: "function already exists"**
```sql
-- Reemplazar función
CREATE OR REPLACE FUNCTION nombre_funcion()...
```

### **Error: "trigger already exists"**
```sql
-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS nombre_trigger ON nombre_tabla;
```

### **Error: "policy already exists"**
```sql
-- Eliminar política si existe
DROP POLICY IF EXISTS nombre_politica ON nombre_tabla;
```

## 📊 **Verificación Post-Migración**

### **Script de Verificación:**
```bash
node scripts/verify.js
```

### **Verificación Manual:**
1. ✅ Todas las tablas creadas
2. ✅ Todos los campos agregados
3. ✅ Todas las funciones funcionando
4. ✅ Todos los triggers activos
5. ✅ Todas las políticas RLS activas

### **Comandos SQL de Verificación:**
```sql
-- Verificar tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('factura_productos', 'proveedores', 'clientes', 'categorias');

-- Verificar funciones
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- Verificar triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## 🔄 **Rollback (Si es Necesario)**

### **Eliminar Migración:**
```sql
-- Eliminar triggers
DROP TRIGGER IF EXISTS tr_factura_productos_totales ON factura_productos;
DROP TRIGGER IF EXISTS tr_facturas_emitidas_procesar_venta ON facturas;
DROP TRIGGER IF EXISTS tr_productos_cambio_precio ON productos;

-- Eliminar funciones
DROP FUNCTION IF EXISTS calcular_subtotal_factura();
DROP FUNCTION IF EXISTS actualizar_totales_factura();
DROP FUNCTION IF EXISTS procesar_venta_productos();
DROP FUNCTION IF EXISTS registrar_cambio_precio();

-- Eliminar tablas
DROP TABLE IF EXISTS factura_productos CASCADE;
DROP TABLE IF EXISTS historial_precios CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS endpoint_configurations_history CASCADE;
DROP TABLE IF EXISTS configuration_backups CASCADE;
DROP TABLE IF EXISTS configuration_tests CASCADE;

-- Eliminar columnas de productos
ALTER TABLE productos DROP COLUMN IF EXISTS nombre;
ALTER TABLE productos DROP COLUMN IF EXISTS codigo_barras;
ALTER TABLE productos DROP COLUMN IF EXISTS imagen_url;
ALTER TABLE productos DROP COLUMN IF EXISTS peso_kg;
ALTER TABLE productos DROP COLUMN IF EXISTS volumen_l;
ALTER TABLE productos DROP COLUMN IF EXISTS fecha_vencimiento;
ALTER TABLE productos DROP COLUMN IF EXISTS numero_lote;
```

## 📝 **Notas Importantes**

- **Backup:** Siempre hacer backup antes de migrar
- **Idempotencia:** Los scripts son idempotentes (se pueden ejecutar múltiples veces)
- **RLS:** Las políticas RLS son esenciales para la seguridad
- **Triggers:** Los triggers son críticos para la funcionalidad automática

---

**¡Migración completada exitosamente! 🎉** 