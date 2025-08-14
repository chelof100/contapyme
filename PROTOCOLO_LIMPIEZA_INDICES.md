# 🧹 PROTOCOLO DE LIMPIEZA DE ÍNDICES NO UTILIZADOS

## **OBJETIVO**
Eliminar índices no utilizados para mejorar el rendimiento de escritura y reducir el uso de almacenamiento.

## **ÍNDICES CANDIDATOS PARA ELIMINACIÓN**

### **⚠️ PRECAUCIÓN: VERIFICAR ANTES DE ELIMINAR**
Estos índices no han sido utilizados según las estadísticas actuales, pero podrían ser necesarios en el futuro.

### **Categoría 1: Índices de Empresa (Probablemente seguros de eliminar)**
```sql
-- Estos índices pueden ser redundantes si siempre filtramos por empresa_id en RLS
DROP INDEX IF EXISTS idx_productos_empresa_id;
DROP INDEX IF EXISTS idx_categorias_empresa_id;
DROP INDEX IF EXISTS idx_contactos_empresa_id;
DROP INDEX IF EXISTS idx_interacciones_empresa_id;
DROP INDEX IF EXISTS idx_actividades_empresa_id;
DROP INDEX IF EXISTS idx_oportunidades_empresa_id;
DROP INDEX IF EXISTS idx_empleados_empresa_id;
DROP INDEX IF EXISTS idx_campanas_empresa_id;
```

### **Categoría 2: Índices de Auditoría (Evaluar uso)**
```sql
-- Solo eliminar si no se usan reportes de auditoría
DROP INDEX IF EXISTS idx_user_actions_created_at;
DROP INDEX IF EXISTS idx_user_actions_empresa_id; -- CUIDADO: Recién creamos uno nuevo
```

### **Categoría 3: Índices de Fechas (Evaluar reportes)**
```sql
-- Solo eliminar si no se hacen reportes por fecha
DROP INDEX IF EXISTS idx_transacciones_fecha;
DROP INDEX IF EXISTS idx_cash_flow_proyecciones_fecha;
DROP INDEX IF EXISTS idx_presupuestos_ano_mes;
```

### **Categoría 4: Índices de Estado/Tipo (Evaluar filtros)**
```sql
-- Solo eliminar si no se filtran por estos campos
DROP INDEX IF EXISTS idx_transacciones_tipo;
DROP INDEX IF EXISTS idx_transacciones_estado;
```

## **PROCESO DE ELIMINACIÓN SEGURA**

### **Paso 1: Análisis de Uso (OBLIGATORIO)**
```sql
-- Verificar estadísticas de uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "Veces usado",
    idx_tup_read as "Filas leídas",
    idx_tup_fetch as "Filas obtenidas"
FROM pg_stat_user_indexes 
WHERE indexname IN (
    'idx_productos_empresa_id',
    'idx_categorias_empresa_id',
    'idx_contactos_empresa_id'
    -- Agregar otros índices a verificar
)
ORDER BY idx_scan DESC;
```

### **Paso 2: Backup de Definiciones**
```sql
-- Guardar definiciones de índices antes de eliminar
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
AND indexname IN (
    -- Lista de índices a eliminar
);
```

### **Paso 3: Eliminación Gradual**
```sql
-- SEMANA 1: Eliminar índices de empresa menos críticos
DROP INDEX IF EXISTS idx_categorias_empresa_id;
DROP INDEX IF EXISTS idx_contactos_empresa_id;
DROP INDEX IF EXISTS idx_interacciones_empresa_id;

-- SEMANA 2: Evaluar impacto y continuar
-- Solo si no hay problemas de rendimiento
```

### **Paso 4: Monitoreo Post-Eliminación**
```sql
-- Monitorear consultas lentas después de eliminar índices
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 100 -- Consultas que toman más de 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

## **CRITERIOS DE DECISIÓN**

### **✅ SEGURO ELIMINAR SI:**
- `idx_scan = 0` (nunca usado)
- Existe otro índice que cubre la misma consulta
- Es un índice de empresa_id y RLS ya filtra por empresa
- No hay consultas que ordenen por ese campo

### **⚠️ EVALUAR CUIDADOSAMENTE SI:**
- Es un índice de fecha (reportes mensuales/anuales)
- Es un índice de estado/tipo (filtros en UI)
- Es un índice de foreign key (joins frecuentes)

### **❌ NO ELIMINAR SI:**
- `idx_scan > 0` (se ha usado)
- Es un índice único (constraint)
- Es un índice de primary key
- Soporta una consulta crítica del negocio

## **CRONOGRAMA RECOMENDADO**

### **Mes 1: Preparación**
- [ ] Analizar estadísticas de uso
- [ ] Backup de definiciones
- [ ] Identificar índices seguros

### **Mes 2: Eliminación Fase 1**
- [ ] Eliminar índices de empresa menos críticos
- [ ] Monitorear rendimiento
- [ ] Documentar cambios

### **Mes 3: Eliminación Fase 2**
- [ ] Evaluar impacto de Fase 1
- [ ] Eliminar índices de auditoría si no se usan
- [ ] Continuar monitoreo

### **Mes 4: Evaluación Final**
- [ ] Revisar todas las eliminaciones
- [ ] Recrear índices si es necesario
- [ ] Documentar lecciones aprendidas

## **SCRIPT DE RECUPERACIÓN**

En caso de necesitar recrear índices eliminados:

```sql
-- Recrear índices críticos si es necesario
CREATE INDEX idx_productos_empresa_id ON productos (empresa_id);
CREATE INDEX idx_transacciones_fecha ON transacciones_financieras (fecha_transaccion);
CREATE INDEX idx_transacciones_tipo ON transacciones_financieras (tipo_transaccion);
-- ... otros según necesidad
```

## **MÉTRICAS DE ÉXITO**

### **Objetivos:**
- Reducir uso de almacenamiento en 10-20%
- Mejorar velocidad de INSERT/UPDATE en 5-15%
- Mantener velocidad de SELECT sin degradación

### **Monitoreo:**
- Tamaño de base de datos antes/después
- Tiempo promedio de escrituras
- Tiempo promedio de consultas críticas
- Número de consultas lentas (>100ms)
