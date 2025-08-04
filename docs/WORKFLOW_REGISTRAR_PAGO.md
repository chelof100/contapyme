# Workflow: Registro de Pagos - Documentación Completa

## 📋 Resumen Ejecutivo

Este documento describe el workflow de registro automático de pagos en ContaPYME, que procesa transacciones financieras, actualiza el estado de las facturas y envía notificaciones automáticas. El workflow maneja tanto facturas emitidas como recibidas.

## 🏗️ Arquitectura del Workflow

### **Componentes Principales**
- **Trigger**: Webhook para pagos recibidos
- **Validación**: Verificación de datos y factura
- **Registro**: Creación de entrada en tabla pagos
- **Actualización**: Cambio de estado de factura
- **Notificación**: Envío de confirmación por email

### **Flujo de Datos**
```
Pago Recibido → Validar Datos → Consultar Factura → Validar Factura → Registrar Pago → Actualizar Factura → Enviar Notificación
```

## 🔧 Configuración Requerida

### **1. Variables de Entorno en n8n**
```bash
# Configuración de Gmail para notificaciones
GMAIL_FROM=facturacion@tuempresa.com
```

### **2. Credenciales Necesarias en n8n**
- **Supabase**: Credenciales de la empresa (vienen del frontend)
- **Gmail**: OAuth2 para envío de notificaciones

### **3. Variables de Entorno en ContaPYME (.env.local)**
```bash
# Configuración n8n (ya configurado)
VITE_N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/registrar-pago
```

## 📊 Estructura de Datos

### **Datos de Entrada (ContaPYME → n8n)**
```json
{
  "factura_id": "uuid-de-la-factura",
  "numero_factura": "0001-00000001",
  "tipo_factura": "emitida|recibida",
  "monto": 1210.00,
  "metodo_pago": "transferencia|efectivo|tarjeta|cheque|mercadopago",
  "transaccion_id": "TXN123456",
  "fecha_pago": "2024-01-01",
  "empresa_id": "uuid-de-la-empresa",
  "notas": "Pago por transferencia bancaria"
}
```

### **Datos de Salida (n8n → ContaPYME)**
```json
{
  "success": true,
  "message": "Pago registrado exitosamente",
  "factura_id": "uuid-de-la-factura",
  "numero_factura": "0001-00000001",
  "tipo_factura": "emitida",
  "monto": 1210.00,
  "total_factura": 1210.00,
  "metodo_pago": "transferencia",
  "fecha_pago": "2024-01-01",
  "nuevo_estado": "pagada",
  "pago_completo": true,
  "notificacion_enviada": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "workflow": "registrar-pago"
}
```

## 🔄 Proceso Detallado

### **Paso 1: Validación de Datos**
- Verificación de campos obligatorios
- Validación de monto (número positivo)
- Validación de tipo de factura (emitida/recibida)
- Validación de método de pago
- Validación de formato de fecha

### **Paso 2: Consulta de Factura**
- Búsqueda en facturas_emitidas y facturas_recibidas
- Obtención de datos de la factura
- Verificación de existencia

### **Paso 3: Validación de Factura**
- Verificación de que la factura existe
- Validación de estado (no pagada, no anulada)
- Verificación de monto (no exceder total)
- Determinación de si el pago es completo o parcial

### **Paso 4: Registro de Pago**
- Creación de entrada en tabla pagos
- Registro de todos los datos del pago
- Estado inicial: "confirmado"

### **Paso 5: Actualización de Factura**
- Actualización de estado según tipo de factura
- Estados posibles: "pagada" o "parcialmente_pagada"
- Actualización de timestamp

### **Paso 6: Envío de Notificación**
- Notificación por email según tipo de factura
- Detalles completos del pago
- Confirmación de procesamiento

### **Paso 7: Respuesta de Confirmación**
- Confirmación de éxito al frontend
- Resumen completo de la operación
- Información de notificación enviada

## ⚙️ Configuración de Nodos n8n

### **1. Webhook Trigger**
- **Endpoint**: `/registrar-pago`
- **Método**: POST
- **Autenticación**: API Key (opcional)

### **2. Validar Datos**
- **Tipo**: Code Node
- **Función**: Validación de campos y formatos
- **Salida**: Datos validados o error

### **3. Consultar Factura**
- **Tipo**: Supabase Node
- **Operación**: Execute Query
- **Query**: Búsqueda en ambas tablas de facturas
- **Parámetros**: empresa_id, numero_factura

### **4. Validar Factura**
- **Tipo**: Code Node
- **Función**: Validación de factura y cálculos
- **Salida**: Datos validados con estado

### **5. Registrar Pago**
- **Tipo**: Supabase Node
- **Operación**: Insert
- **Tabla**: pagos
- **Datos**: Registro completo del pago

### **6. Actualizar Factura Emitida**
- **Tipo**: Supabase Node
- **Operación**: Update
- **Tabla**: facturas_emitidas
- **Condición**: id = factura_id

### **7. Actualizar Factura Recibida**
- **Tipo**: Supabase Node
- **Operación**: Update
- **Tabla**: facturas_recibidas
- **Condición**: id = factura_id

### **8. Preparar Notificación**
- **Tipo**: Code Node
- **Función**: Preparación de datos para email
- **Salida**: Datos formateados para notificación

### **9. Enviar Notificación**
- **Tipo**: Gmail Node
- **Operación**: Send Email
- **Autenticación**: OAuth2
- **Contenido**: Notificación detallada del pago

### **10. Respuesta de Éxito**
- **Tipo**: Respond to Webhook
- **Formato**: JSON
- **Contenido**: Resumen completo de la operación

## 🚨 Manejo de Errores

### **Errores Comunes y Soluciones**

#### **Error: "Campos faltantes"**
- **Causa**: Datos incompletos en la solicitud
- **Solución**: Validar todos los campos obligatorios
- **Acción**: Rechazar solicitud con mensaje claro

#### **Error: "Factura no encontrada"**
- **Causa**: Número de factura inexistente
- **Solución**: Verificar que la factura existe
- **Acción**: Rechazar solicitud con error específico

#### **Error: "Factura ya pagada"**
- **Causa**: Intento de pago a factura pagada
- **Solución**: Verificar estado de la factura
- **Acción**: Rechazar pago y notificar

#### **Error: "Monto excede total"**
- **Causa**: Pago mayor al total de la factura
- **Solución**: Validar monto antes de procesar
- **Acción**: Rechazar pago con mensaje claro

#### **Error: "Método de pago inválido"**
- **Causa**: Método no soportado
- **Solución**: Validar métodos permitidos
- **Acción**: Rechazar solicitud con opciones válidas

## 📈 Métricas y Monitoreo

### **Métricas Capturadas**
- Número de pagos procesados
- Tipos de facturas (emitidas/recibidas)
- Métodos de pago utilizados
- Tiempo de respuesta del workflow
- Tasa de éxito/fallo

### **Logs Generados**
- Ejecución del workflow
- Errores de validación
- Pagos registrados
- Notificaciones enviadas

## 🔒 Seguridad

### **Medidas Implementadas**
- Validación de datos de entrada
- Verificación de empresa_id
- Sanitización de parámetros
- Logs de auditoría

### **Consideraciones de Privacidad**
- Datos filtrados por empresa
- Información financiera protegida
- Trazabilidad de transacciones

## 🧪 Testing

### **Casos de Prueba**
1. **Pago completo**: Factura marcada como pagada
2. **Pago parcial**: Factura marcada como parcialmente pagada
3. **Factura inexistente**: Error de validación
4. **Factura ya pagada**: Rechazo del pago
5. **Monto excesivo**: Error de validación
6. **Método inválido**: Error de validación

### **Ambiente de Testing**
- **Supabase**: Base de datos de desarrollo
- **Facturas**: Datos de prueba con estados controlados
- **Gmail**: Cuenta de pruebas para notificaciones

## 🔗 Integración con Otros Workflows

### **Trigger Manual**
```javascript
// Llamada manual desde el frontend
await fetch('/webhook/registrar-pago', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    factura_id: factura.id,
    numero_factura: factura.numero_factura,
    tipo_factura: 'emitida',
    monto: 1210.00,
    metodo_pago: 'transferencia',
    empresa_id: factura.empresa_id
  })
});
```

### **Integración con MercadoPago**
```javascript
// Webhook de MercadoPago
app.post('/webhook/mercadopago', async (req, res) => {
  if (req.body.type === 'payment') {
    // Llamar al workflow de registro de pagos
    await fetch('/webhook/registrar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factura_id: req.body.data.factura_id,
        numero_factura: req.body.data.numero_factura,
        tipo_factura: 'emitida',
        monto: req.body.data.transaction_amount,
        metodo_pago: 'mercadopago',
        transaccion_id: req.body.data.id,
        empresa_id: req.body.data.empresa_id
      })
    });
  }
});
```

## 📚 Recursos Adicionales

### **Documentación Relacionada**
- [Workflow: Emitir Facturas](./WORKFLOW_EMITIR_FACTURAS.md)
- [Workflow: Actualizar Stock](./WORKFLOW_ACTUALIZAR_STOCK.md)
- [Configuración de n8n](./N8N_WORKFLOWS.md)

### **Archivos del Proyecto**
- `n8n-workflows/registrar-pago.json`: Workflow completo
- `src/services/webhookService.ts`: Servicio de comunicación
- `supabase/migrations/`: Estructura de base de datos

## 🔄 Versiones

### **Versión 1.0 (Actual)**
- ✅ Validación completa de datos de entrada
- ✅ Soporte para facturas emitidas y recibidas
- ✅ Registro automático en tabla pagos
- ✅ Actualización de estado de facturas
- ✅ Notificaciones por email automáticas
- ✅ Manejo de pagos completos y parciales
- ✅ Validación de montos y estados
- ✅ Respuesta detallada al frontend

---

**Última actualización**: Enero 2024  
**Responsable**: Equipo de Desarrollo ContaPYME  
**Estado**: ✅ Completado y Documentado 