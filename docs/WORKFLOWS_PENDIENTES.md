# Workflows Pendientes - ContaPYME

## 📋 Resumen Ejecutivo

Este documento describe los workflows pendientes de implementación para completar la funcionalidad de ContaPYME. Estos workflows complementan el sistema de facturación y automatizan procesos críticos del negocio.

## 🎯 Workflows Identificados

### **1. 🔍 Validación de CUIT Independiente**
**Estado**: ⚠️ Pendiente de Evaluación  
**Prioridad**: Baja  
**Dependencias**: Ninguna

#### **Descripción**
Workflow separado para validar CUITs de clientes y proveedores de forma independiente al proceso de facturación.

#### **Justificación**
- **Pro**: Validación previa antes de crear facturas
- **Contra**: AFIP SDK ya valida CUITs durante la facturación
- **Recomendación**: Evaluar si es realmente necesario

#### **Funcionalidad Propuesta**
```json
{
  "cuit": "20304050607",
  "tipo": "cliente|proveedor",
  "empresa_id": "uuid-empresa"
}
```

#### **Respuesta Esperada**
```json
{
  "success": true,
  "cuit": "20304050607",
  "es_valido": true,
  "razon_social": "EMPRESA EJEMPLO S.A.",
  "condicion_iva": "Responsable Inscripto",
  "estado": "ACTIVO"
}
```

---

### **2. 📦 Actualización de Stock**
**Estado**: 🔄 Pendiente de Implementación  
**Prioridad**: Alta  
**Dependencias**: Workflow de Emitir Facturas

#### **Descripción**
Workflow automatizado para actualizar el inventario cuando se emiten facturas con productos.

#### **Funcionalidad**
- **Trigger**: Factura emitida exitosamente
- **Proceso**: Actualizar stock de productos vendidos
- **Validación**: Verificar stock disponible
- **Registro**: Crear movimiento de stock

#### **Datos de Entrada**
```json
{
  "factura_id": "uuid-factura",
  "empresa_id": "uuid-empresa",
  "productos": [
    {
      "producto_id": "uuid-producto",
      "sku": "PROD001",
      "cantidad_vendida": 5,
      "stock_actual": 20
    }
  ]
}
```

#### **Proceso Detallado**
1. **Validación de Stock**: Verificar que hay stock suficiente
2. **Actualización de Productos**: Reducir stock_actual
3. **Registro de Movimiento**: Crear entrada en movimientos_stock
4. **Verificación de Alertas**: Verificar si se activan alertas de stock bajo
5. **Confirmación**: Retornar estado de actualización

#### **Configuración de Nodos n8n**
- **Trigger**: Webhook desde workflow de facturación
- **Validación**: Code Node para verificar stock
- **Actualización**: Supabase Node para productos
- **Movimientos**: Supabase Node para movimientos_stock
- **Alertas**: Trigger de workflow de alertas (si aplica)

---

### **3. 💰 Registro de Pagos**
**Estado**: 🔄 Pendiente de Implementación  
**Prioridad**: Alta  
**Dependencias**: Workflow de Emitir Facturas

#### **Descripción**
Workflow para procesar pagos automáticamente y registrar transacciones financieras.

#### **Funcionalidad**
- **Trigger**: Pago recibido (manual o automático)
- **Proceso**: Registrar pago y actualizar estado de factura
- **Validación**: Verificar monto y factura asociada
- **Notificación**: Informar sobre pago recibido

#### **Datos de Entrada**
```json
{
  "factura_id": "uuid-factura",
  "numero_factura": "0001-00000001",
  "tipo_factura": "emitida|recibida",
  "monto": 1210.00,
  "metodo_pago": "transferencia|efectivo|tarjeta|cheque",
  "transaccion_id": "TXN123456",
  "fecha_pago": "2024-01-01",
  "empresa_id": "uuid-empresa"
}
```

#### **Proceso Detallado**
1. **Validación**: Verificar factura y monto
2. **Registro**: Crear entrada en tabla pagos
3. **Actualización**: Cambiar estado de factura a "pagada"
4. **Notificación**: Enviar confirmación de pago
5. **Reporte**: Actualizar métricas financieras

#### **Configuración de Nodos n8n**
- **Trigger**: Webhook para pagos
- **Validación**: Code Node para verificar datos
- **Registro**: Supabase Node para tabla pagos
- **Actualización**: Supabase Node para facturas
- **Notificación**: Gmail Node para confirmación

---

### **4. ⚠️ Alertas de Stock**
**Estado**: 🔄 Pendiente de Implementación  
**Prioridad**: Media  
**Dependencias**: Workflow de Actualización de Stock

#### **Descripción**
Sistema de notificaciones automáticas para alertar sobre stock bajo o agotado.

#### **Funcionalidad**
- **Trigger**: Stock actualizado o verificación periódica
- **Proceso**: Verificar productos con stock bajo
- **Notificación**: Enviar alertas por email
- **Registro**: Mantener historial de alertas

#### **Datos de Entrada**
```json
{
  "empresa_id": "uuid-empresa",
  "producto_id": "uuid-producto",
  "sku": "PROD001",
  "stock_actual": 3,
  "stock_minimo": 10,
  "diferencia": 7
}
```

#### **Proceso Detallado**
1. **Detección**: Identificar productos con stock bajo
2. **Filtrado**: Evitar alertas duplicadas
3. **Notificación**: Enviar email al responsable
4. **Registro**: Actualizar estado de alerta
5. **Seguimiento**: Programar verificación de reposición

#### **Configuración de Nodos n8n**
- **Trigger**: Cron job diario o webhook desde actualización de stock
- **Consulta**: Supabase Node para productos con stock bajo
- **Filtrado**: Code Node para evitar duplicados
- **Notificación**: Gmail Node para alertas
- **Registro**: Supabase Node para actualizar alertas_stock

---

## 🏗️ Arquitectura de Integración

### **Flujo de Workflows Integrados**
```
Emitir Factura → Actualización de Stock → Alertas de Stock
                ↓
            Registro de Pagos
```

### **Dependencias entre Workflows**
- **Emitir Factura**: Workflow base, dispara otros workflows
- **Actualización de Stock**: Depende de Emitir Factura
- **Alertas de Stock**: Depende de Actualización de Stock
- **Registro de Pagos**: Independiente, puede ejecutarse manualmente

## 📊 Priorización de Implementación

### **Fase 1: Funcionalidades Críticas**
1. **Actualización de Stock** (Alta prioridad)
   - Impacto directo en operaciones
   - Necesario para control de inventario
   - Tiempo estimado: 2-3 días

2. **Registro de Pagos** (Alta prioridad)
   - Control financiero esencial
   - Automatización de procesos
   - Tiempo estimado: 2-3 días

### **Fase 2: Funcionalidades de Soporte**
3. **Alertas de Stock** (Media prioridad)
   - Mejora la experiencia operativa
   - Previene problemas de stock
   - Tiempo estimado: 1-2 días

### **Fase 3: Funcionalidades Opcionales**
4. **Validación de CUIT Independiente** (Baja prioridad)
   - Evaluar necesidad real
   - Implementar solo si es requerido
   - Tiempo estimado: 1 día

## 🔧 Configuración Técnica

### **Variables de Entorno Adicionales**
```bash
# Configuración de alertas
ALERTAS_EMAIL_DESTINATARIO=admin@tuempresa.com
ALERTAS_STOCK_MINIMO_PORCENTAJE=20

# Configuración de pagos
PAGOS_NOTIFICACION_EMAIL=contabilidad@tuempresa.com
PAGOS_AUTOCONFIRMACION=true

# Configuración de stock
STOCK_ALERTA_DUPLICADOS_HORAS=24
STOCK_VERIFICACION_CRON="0 9 * * *"  # Diario a las 9 AM
```

### **Tablas de Base de Datos**
- **pagos**: Ya existe, requiere ajustes menores
- **movimientos_stock**: Ya existe, funcional
- **alertas_stock**: Ya existe, funcional
- **productos**: Ya existe, requiere trigger de actualización

## 🚨 Consideraciones de Implementación

### **Validaciones Críticas**
- **Stock**: Verificar disponibilidad antes de vender
- **Pagos**: Validar monto y factura asociada
- **Alertas**: Evitar spam de notificaciones
- **Integridad**: Mantener consistencia de datos

### **Manejo de Errores**
- **Stock insuficiente**: Rechazar facturación
- **Pago inválido**: Registrar error y notificar
- **Alerta fallida**: Log de error y reintento
- **Timeout**: Reintentos automáticos

### **Performance**
- **Consultas optimizadas**: Usar índices existentes
- **Procesamiento asíncrono**: Para operaciones pesadas
- **Caché**: Para validaciones frecuentes
- **Rate limiting**: Para APIs externas

## 📈 Métricas y Monitoreo

### **KPIs a Monitorear**
- **Tiempo de respuesta**: Por workflow
- **Tasa de éxito**: Porcentaje de ejecuciones exitosas
- **Stock accuracy**: Precisión del inventario
- **Alertas enviadas**: Volumen de notificaciones
- **Pagos procesados**: Eficiencia del proceso

### **Logs Requeridos**
- **Ejecución de workflows**: Timestamps y resultados
- **Errores**: Detalles y contexto
- **Validaciones**: Datos de entrada y salida
- **Notificaciones**: Estado de envío

## 🔒 Seguridad

### **Medidas de Seguridad**
- **Validación de datos**: Sanitización de entradas
- **Autenticación**: Verificación de empresa
- **Autorización**: Permisos por rol
- **Auditoría**: Logs de todas las operaciones
- **Encriptación**: Datos sensibles protegidos

## 🧪 Testing

### **Casos de Prueba por Workflow**

#### **Actualización de Stock**
1. Stock suficiente → Actualización exitosa
2. Stock insuficiente → Error y rechazo
3. Producto inexistente → Error de validación
4. Múltiples productos → Actualización batch

#### **Registro de Pagos**
1. Pago válido → Registro exitoso
2. Pago duplicado → Detección y rechazo
3. Factura inexistente → Error de validación
4. Monto incorrecto → Error de validación

#### **Alertas de Stock**
1. Stock bajo → Alerta enviada
2. Alerta duplicada → Filtrado
3. Email inválido → Log de error
4. Múltiples productos → Alerta consolidada

## 📚 Recursos Adicionales

### **Documentación Relacionada**
- [Workflow: Emitir Facturas](./WORKFLOW_EMITIR_FACTURAS.md)
- [Configuración de n8n](./N8N_WORKFLOWS.md)
- [Estructura de Base de Datos](../supabase/migrations/)

### **Herramientas de Desarrollo**
- **n8n**: Plataforma de workflows
- **Supabase**: Base de datos y APIs
- **Gmail**: Notificaciones por email
- **AFIP SDK**: Validaciones fiscales

---

**Última actualización**: Enero 2024  
**Responsable**: Equipo de Desarrollo ContaPYME  
**Estado**: 📋 Planificado y Documentado 