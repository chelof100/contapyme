# Workflow: Actualizar Stock - Documentación Completa

## 📋 Resumen Ejecutivo

Este documento describe el workflow de actualización automática de stock en ContaPYME, que se ejecuta cuando se emiten facturas con productos. El workflow valida stock disponible, actualiza inventario, registra movimientos y genera alertas automáticamente.

## 🏗️ Arquitectura del Workflow

### **Componentes Principales**
- **Trigger**: Webhook desde workflow de facturación
- **Validación**: Verificación de stock disponible
- **Actualización**: Reducción automática de stock
- **Registro**: Movimientos de stock con trazabilidad
- **Alertas**: Generación automática de alertas de stock bajo

### **Flujo de Datos**
```
Factura Emitida → Validar Stock → Actualizar Productos → Registrar Movimientos → Generar Alertas
```

## 🔧 Configuración Requerida

### **1. Variables de Entorno en n8n**
```bash
# No se requieren variables específicas para este workflow
# Las credenciales de Supabase se configuran en el nodo correspondiente
```

### **2. Credenciales Necesarias en n8n**
- **Supabase**: Credenciales de la empresa (vienen del frontend)

### **3. Variables de Entorno en ContaPYME (.env.local)**
```bash
# Configuración n8n (ya configurado)
VITE_N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/actualizar-stock
```

## 📊 Estructura de Datos

### **Datos de Entrada (ContaPYME → n8n)**
```json
{
  "factura_id": "uuid-de-la-factura",
  "empresa_id": "uuid-de-la-empresa",
  "productos": [
    {
      "producto_id": "uuid-producto",
      "sku": "PROD001",
      "cantidad_vendida": 5
    },
    {
      "producto_id": "uuid-producto-2",
      "sku": "PROD002",
      "cantidad_vendida": 3
    }
  ]
}
```

### **Datos de Salida (n8n → ContaPYME)**
```json
{
  "success": true,
  "message": "Stock actualizado exitosamente",
  "factura_id": "uuid-de-la-factura",
  "empresa_id": "uuid-de-la-empresa",
  "productos_actualizados": 2,
  "alertas_generadas": 1,
  "productos_con_alerta": ["PROD001"],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "workflow": "actualizar-stock"
}
```

## 🔄 Proceso Detallado

### **Paso 1: Validación de Datos**
- Verificación de campos obligatorios
- Validación de formato de productos
- Verificación de cantidades válidas

### **Paso 2: Consulta de Stock Actual**
- Consulta a base de datos de productos
- Obtención de stock actual y mínimo
- Filtrado por empresa y productos específicos

### **Paso 3: Validación de Stock Disponible**
- Verificación de stock suficiente para cada producto
- Cálculo de nuevo stock después de la venta
- Detección de productos que necesitan alerta

### **Paso 4: Actualización de Productos**
- Reducción de stock_actual en tabla productos
- Actualización de timestamp de modificación
- Procesamiento batch de múltiples productos

### **Paso 5: Registro de Movimientos**
- Creación de entradas en movimientos_stock
- Registro de stock anterior y nuevo
- Trazabilidad completa de la operación

### **Paso 6: Generación de Alertas**
- Detección de productos con stock bajo
- Creación de alertas en alertas_stock
- Preparación para notificaciones

### **Paso 7: Respuesta de Confirmación**
- Confirmación de éxito al frontend
- Resumen de productos actualizados
- Información de alertas generadas

## ⚙️ Configuración de Nodos n8n

### **1. Webhook Trigger**
- **Endpoint**: `/actualizar-stock`
- **Método**: POST
- **Autenticación**: API Key (opcional)

### **2. Validar Datos**
- **Tipo**: Code Node
- **Función**: Validación de campos y formatos
- **Salida**: Datos validados o error

### **3. Consultar Stock Actual**
- **Tipo**: Supabase Node
- **Operación**: Execute Query
- **Query**: Consulta de productos con stock
- **Parámetros**: empresa_id, array de producto_ids

### **4. Validar Stock Disponible**
- **Tipo**: Code Node
- **Función**: Validación de stock y cálculos
- **Salida**: Productos validados con nuevos stocks

### **5. Actualizar Stock de Productos**
- **Tipo**: Supabase Node
- **Operación**: Update
- **Tabla**: productos
- **Condición**: id = producto_id

### **6. Registrar Movimientos de Stock**
- **Tipo**: Supabase Node
- **Operación**: Insert
- **Tabla**: movimientos_stock
- **Datos**: Movimiento de egreso por venta

### **7. Preparar Alertas de Stock**
- **Tipo**: Code Node
- **Función**: Detección de productos con stock bajo
- **Salida**: Lista de alertas a crear

### **8. Crear Alertas de Stock**
- **Tipo**: Supabase Node
- **Operación**: Insert
- **Tabla**: alertas_stock
- **Datos**: Alertas de stock bajo

### **9. Respuesta de Éxito**
- **Tipo**: Respond to Webhook
- **Formato**: JSON
- **Contenido**: Resumen de operación

## 🚨 Manejo de Errores

### **Errores Comunes y Soluciones**

#### **Error: "Campos faltantes"**
- **Causa**: Datos incompletos en la solicitud
- **Solución**: Validar todos los campos obligatorios
- **Acción**: Rechazar solicitud con mensaje claro

#### **Error: "Stock insuficiente"**
- **Causa**: No hay stock suficiente para vender
- **Solución**: Verificar stock antes de facturar
- **Acción**: Rechazar actualización y notificar

#### **Error: "Producto no encontrado"**
- **Causa**: Producto inexistente en la base de datos
- **Solución**: Verificar que el producto existe
- **Acción**: Rechazar solicitud con error específico

#### **Error: "Cantidad inválida"**
- **Causa**: Cantidad vendida menor o igual a 0
- **Solución**: Validar cantidades positivas
- **Acción**: Rechazar solicitud con mensaje claro

## 📈 Métricas y Monitoreo

### **Métricas Capturadas**
- Número de productos actualizados
- Cantidad de alertas generadas
- Tiempo de respuesta del workflow
- Tasa de éxito/fallo

### **Logs Generados**
- Ejecución del workflow
- Errores de validación
- Movimientos de stock realizados
- Alertas creadas

## 🔒 Seguridad

### **Medidas Implementadas**
- Validación de datos de entrada
- Verificación de empresa_id
- Sanitización de parámetros
- Logs de auditoría

### **Consideraciones de Privacidad**
- Datos filtrados por empresa
- Información de stock protegida
- Trazabilidad de operaciones

## 🧪 Testing

### **Casos de Prueba**
1. **Stock suficiente**: Actualización exitosa
2. **Stock insuficiente**: Error y rechazo
3. **Producto inexistente**: Error de validación
4. **Múltiples productos**: Actualización batch
5. **Stock bajo**: Generación de alertas

### **Ambiente de Testing**
- **Supabase**: Base de datos de desarrollo
- **Productos**: Datos de prueba con stock controlado
- **Alertas**: Verificación de generación automática

## 🔗 Integración con Otros Workflows

### **Trigger desde Facturación**
```javascript
// En el workflow de facturación, después de emitir factura exitosamente
if (factura.productos && factura.productos.length > 0) {
  // Llamar al workflow de actualización de stock
  await fetch('/webhook/actualizar-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      factura_id: factura.id,
      empresa_id: factura.empresa_id,
      productos: factura.productos
    })
  });
}
```

### **Trigger de Alertas**
```javascript
// El workflow de alertas puede ser disparado automáticamente
// cuando se crean alertas en alertas_stock
```

## 📚 Recursos Adicionales

### **Documentación Relacionada**
- [Workflow: Emitir Facturas](./WORKFLOW_EMITIR_FACTURAS.md)
- [Workflow: Alertas de Stock](./WORKFLOW_ALERTAS_STOCK.md)
- [Configuración de n8n](./N8N_WORKFLOWS.md)

### **Archivos del Proyecto**
- `n8n-workflows/actualizar-stock.json`: Workflow completo
- `src/services/webhookService.ts`: Servicio de comunicación
- `supabase/migrations/`: Estructura de base de datos

## 🔄 Versiones

### **Versión 1.0 (Actual)**
- ✅ Validación completa de stock disponible
- ✅ Actualización automática de inventario
- ✅ Registro de movimientos con trazabilidad
- ✅ Generación automática de alertas
- ✅ Integración con workflow de facturación
- ✅ Manejo robusto de errores
- ✅ Respuesta detallada al frontend

---

**Última actualización**: Enero 2024  
**Responsable**: Equipo de Desarrollo ContaPYME  
**Estado**: ✅ Completado y Documentado 