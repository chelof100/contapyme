# Workflow: Alertas de Stock - Documentación Completa

## 📋 Resumen Ejecutivo

Este documento describe el workflow de alertas automáticas de stock en ContaPYME, que detecta productos con stock bajo o agotado, evita alertas duplicadas y envía notificaciones por email. El workflow puede ejecutarse automáticamente o manualmente.

## 🏗️ Arquitectura del Workflow

### **Componentes Principales**
- **Trigger**: Webhook desde actualización de stock + Cron job diario
- **Detección**: Identificación de productos con stock bajo
- **Filtrado**: Evitar alertas duplicadas (últimas 24 horas)
- **Registro**: Creación de alertas en base de datos
- **Notificación**: Envío de email con tabla HTML detallada

### **Flujo de Datos**
```
Trigger → Validar Datos → Consultar Productos Bajo Stock → Consultar Alertas Recientes → Filtrar y Preparar Alertas → Registrar Alertas → Preparar Email → Enviar Alerta Email
```

## 🔧 Configuración Requerida

### **1. Variables de Entorno en n8n**
```bash
# Configuración de Gmail para alertas
GMAIL_FROM=alertas@tuempresa.com
ALERTAS_EMAIL_DESTINATARIO=admin@tuempresa.com

# Configuración de alertas (opcional)
ALERTAS_STOCK_MINIMO_PORCENTAJE=20
ALERTAS_DUPLICADOS_HORAS=24
```

### **2. Credenciales Necesarias en n8n**
- **Supabase**: Credenciales de la empresa (vienen del frontend)
- **Gmail**: OAuth2 para envío de notificaciones

### **3. Variables de Entorno en ContaPYME (.env.local)**
```bash
# Configuración n8n (ya configurado)
VITE_N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/alerta-stock
```

## 📊 Estructura de Datos

### **Datos de Entrada (ContaPYME → n8n)**
```json
{
  "empresa_id": "uuid-de-la-empresa",
  "producto_id": "uuid-producto", // Opcional - para alerta específica
  "sku": "PROD001", // Opcional - para alerta específica
  "stock_actual": 3, // Opcional - para alerta específica
  "stock_minimo": 10, // Opcional - para alerta específica
  "modo": "automatico|manual" // Opcional - por defecto "automatico"
}
```

### **Datos de Salida (n8n → ContaPYME)**
```json
{
  "success": true,
  "message": "Alertas de stock procesadas exitosamente",
  "empresa_id": "uuid-de-la-empresa",
  "productos_analizados": 15,
  "alertas_generadas": 3,
  "email_enviado": true,
  "modo": "automatico",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "workflow": "alerta-stock"
}
```

## 🔄 Proceso Detallado

### **Paso 1: Validación de Datos**
- Verificación de empresa_id obligatorio
- Validación de campos de producto si se especifica
- Determinación del modo de ejecución

### **Paso 2: Consulta de Productos Bajo Stock**
- Búsqueda de productos activos con stock ≤ stock_minimo
- Filtrado por empresa
- Ordenamiento por stock actual (más críticos primero)

### **Paso 3: Consulta de Alertas Recientes**
- Verificación de alertas en las últimas 24 horas
- Evitar spam de notificaciones
- Filtrado por estado "activa"

### **Paso 4: Filtrado y Preparación**
- Eliminación de productos con alertas recientes
- Cálculo de diferencia y porcentaje de stock
- Preparación de datos para registro

### **Paso 5: Registro de Alertas**
- Creación de entradas en alertas_stock
- Estado inicial: "activa"
- Descripción detallada con porcentaje

### **Paso 6: Preparación de Email**
- Generación de tabla HTML con productos
- Colores diferenciados (rojo para agotado, amarillo para bajo)
- Mensaje con acciones recomendadas

### **Paso 7: Envío de Notificación**
- Email HTML con tabla detallada
- Asunto dinámico con cantidad de productos
- Destinatario configurable

## ⚙️ Configuración de Nodos n8n

### **1. Webhook Trigger**
- **Endpoint**: `/alerta-stock`
- **Método**: POST
- **Autenticación**: API Key (opcional)

### **2. Validar Datos**
- **Tipo**: Code Node
- **Función**: Validación de campos y modo
- **Salida**: Datos validados o error

### **3. Consultar Productos Bajo Stock**
- **Tipo**: Supabase Node
- **Operación**: Execute Query
- **Query**: Productos activos con stock bajo
- **Filtros**: empresa_id, stock_actual ≤ stock_minimo

### **4. Consultar Alertas Recientes**
- **Tipo**: Supabase Node
- **Operación**: Execute Query
- **Query**: Alertas de las últimas 24 horas
- **Filtros**: empresa_id, fecha_alerta, estado

### **5. Filtrar y Preparar Alertas**
- **Tipo**: Code Node
- **Función**: Filtrado y cálculos
- **Salida**: Alertas a generar

### **6. Registrar Alertas**
- **Tipo**: Supabase Node
- **Operación**: Insert
- **Tabla**: alertas_stock
- **Datos**: Alertas filtradas

### **7. Preparar Email**
- **Tipo**: Code Node
- **Función**: Generación de HTML
- **Salida**: Email formateado

### **8. Enviar Alerta Email**
- **Tipo**: Gmail Node
- **Operación**: Send Email
- **Formato**: HTML
- **Contenido**: Tabla con productos

### **9. Respuesta de Éxito**
- **Tipo**: Respond to Webhook
- **Formato**: JSON
- **Contenido**: Resumen de procesamiento

## 🚨 Manejo de Errores

### **Errores Comunes y Soluciones**

#### **Error: "Campos faltantes"**
- **Causa**: empresa_id no proporcionado
- **Solución**: Validar empresa_id obligatorio
- **Acción**: Rechazar solicitud con mensaje claro

#### **Error: "No hay productos con stock bajo"**
- **Causa**: Todos los productos tienen stock suficiente
- **Solución**: Verificar configuración de stock_minimo
- **Acción**: Retornar éxito sin alertas

#### **Error: "Alertas duplicadas"**
- **Causa**: Producto ya tiene alerta reciente
- **Solución**: Filtrado automático por 24 horas
- **Acción**: Omitir producto en alerta

#### **Error: "Email no enviado"**
- **Causa**: Configuración de Gmail incorrecta
- **Solución**: Verificar credenciales OAuth2
- **Acción**: Log de error y continuar

## 📈 Métricas y Monitoreo

### **Métricas Capturadas**
- Número de productos analizados
- Cantidad de alertas generadas
- Estado de envío de emails
- Modo de ejecución (automático/manual)

### **Logs Generados**
- Ejecución del workflow
- Productos con stock bajo detectados
- Alertas duplicadas filtradas
- Emails enviados

## 🔒 Seguridad

### **Medidas Implementadas**
- Validación de empresa_id
- Filtrado por productos activos
- Sanitización de datos HTML
- Logs de auditoría

### **Consideraciones de Privacidad**
- Datos filtrados por empresa
- Información de stock protegida
- Emails enviados solo a destinatarios autorizados

## 🧪 Testing

### **Casos de Prueba**
1. **Stock normal**: No generar alertas
2. **Stock bajo**: Generar alerta única
3. **Stock agotado**: Alerta con color rojo
4. **Alerta duplicada**: Filtrar automáticamente
5. **Modo manual**: Procesar producto específico
6. **Múltiples productos**: Tabla HTML completa

### **Ambiente de Testing**
- **Supabase**: Base de datos de desarrollo
- **Productos**: Datos de prueba con stock controlado
- **Gmail**: Cuenta de pruebas para notificaciones

## 🔗 Integración con Otros Workflows

### **Trigger desde Actualización de Stock**
```javascript
// En el workflow de actualización de stock, después de actualizar
if (producto.stock_nuevo <= producto.stock_minimo) {
  // Llamar al workflow de alertas
  await fetch('/webhook/alerta-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empresa_id: factura.empresa_id,
      producto_id: producto.producto_id,
      sku: producto.sku,
      stock_actual: producto.stock_nuevo,
      stock_minimo: producto.stock_minimo,
      modo: 'automatico'
    })
  });
}
```

### **Cron Job Diario**
```javascript
// Configurar en n8n para ejecutar diariamente a las 9 AM
// Cron: "0 9 * * *"
{
  "empresa_id": "uuid-empresa",
  "modo": "automatico"
}
```

### **Trigger Manual desde Frontend**
```javascript
// Llamada manual para verificar stock
await fetch('/webhook/alerta-stock', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    empresa_id: empresa.id,
    modo: 'manual'
  })
});
```

## 📚 Recursos Adicionales

### **Documentación Relacionada**
- [Workflow: Emitir Facturas](./WORKFLOW_EMITIR_FACTURAS.md)
- [Workflow: Actualizar Stock](./WORKFLOW_ACTUALIZAR_STOCK.md)
- [Workflow: Registro de Pagos](./WORKFLOW_REGISTRAR_PAGO.md)
- [Configuración de n8n](./N8N_WORKFLOWS.md)

### **Archivos del Proyecto**
- `n8n-workflows/alerta-stock.json`: Workflow completo
- `src/services/webhookService.ts`: Servicio de comunicación
- `supabase/migrations/`: Estructura de base de datos

## 🔄 Versiones

### **Versión 1.0 (Actual)**
- ✅ Detección automática de productos con stock bajo
- ✅ Filtrado de alertas duplicadas (24 horas)
- ✅ Registro de alertas en base de datos
- ✅ Email HTML con tabla detallada
- ✅ Colores diferenciados por nivel de stock
- ✅ Modo automático y manual
- ✅ Integración con workflow de actualización de stock
- ✅ Configuración flexible de destinatarios

---

**Última actualización**: Enero 2024  
**Responsable**: Equipo de Desarrollo ContaPYME  
**Estado**: ✅ Completado y Documentado 