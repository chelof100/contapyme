# Integración con n8n - ContaPYME

## 📋 Resumen

n8n es una plataforma de automatización de flujos de trabajo que se integra con ContaPYME para automatizar procesos de negocio. Esta integración es **opcional** y la aplicación funciona perfectamente sin ella.

## 🔗 Funciones Conectadas a n8n

### **1. Facturación Automática**

#### **emitirFactura(data)**
- **Propósito:** Emisión automática de facturas electrónicas
- **Trigger:** Cuando se crea una factura en ContaPYME
- **Acciones n8n:**
  - Validación de CUIT con AFIP
  - Generación de CAE
  - Envío de email al cliente
  - Generación de PDF
  - Actualización de estado en ContaPYME

#### **recibirFactura(data)**
- **Propósito:** Procesamiento automático de facturas recibidas
- **Trigger:** Cuando se registra una factura de proveedor
- **Acciones n8n:**
  - Validación de datos
  - Registro en contabilidad
  - Alertas de vencimiento
  - Integración con órdenes de compra

### **2. Gestión de Compras**

#### **crearOrdenCompra(data)**
- **Propósito:** Creación automática de órdenes de compra
- **Trigger:** Cuando se detecta stock bajo
- **Acciones n8n:**
  - Cálculo de cantidad a comprar
  - Selección automática de proveedor
  - Envío de solicitud a proveedor
  - Seguimiento de estado

#### **registrarPago(data)**
- **Propósito:** Registro automático de pagos
- **Trigger:** Cuando se confirma un pago
- **Acciones n8n:**
  - Actualización de estado de factura
  - Registro en contabilidad
  - Envío de confirmación
  - Integración con bancos

### **3. Control de Stock**

#### **registrarMovimientoStock(data)**
- **Propósito:** Actualización automática de inventario
- **Trigger:** Cuando hay movimiento de stock
- **Acciones n8n:**
  - Actualización de cantidades
  - Cálculo de costos
  - Generación de alertas
  - Actualización de reportes

#### **enviarAlertaStock(data)**
- **Propósito:** Alertas automáticas de stock bajo
- **Trigger:** Cuando el stock está por debajo del mínimo
- **Acciones n8n:**
  - Envío de email/WhatsApp
  - Creación de orden de compra
  - Notificación a responsables
  - Registro de alerta

### **4. Gestión de Recetas (Restaurantes)**

#### **crearReceta(data)**
- **Propósito:** Gestión automática de recetas
- **Trigger:** Cuando se crea una nueva receta
- **Acciones n8n:**
  - Cálculo de costos
  - Actualización de precios
  - Generación de QR codes
  - Sincronización con menú

#### **venderReceta(data)**
- **Propósito:** Procesamiento de ventas con recetas
- **Trigger:** Cuando se vende un producto con receta
- **Acciones n8n:**
  - Descuento automático de ingredientes
  - Cálculo de ganancias
  - Actualización de stock
  - Generación de reportes

## 🛠️ Configuración de n8n

### **1. Instalación de n8n**

#### **Opción A: n8n Cloud (Recomendado)**
1. Ve a [n8n.cloud](https://n8n.cloud)
2. Crea una cuenta gratuita
3. Crea un nuevo workspace
4. Copia la URL de tu workspace

#### **Opción B: n8n Local**
```bash
# Instalar n8n localmente
npm install n8n -g
n8n start
```

### **2. Configuración de Webhooks**

#### **Estructura de Webhooks Requeridos:**
```
https://tu-n8n.com/webhook/emitir-factura
https://tu-n8n.com/webhook/recibir-factura
https://tu-n8n.com/webhook/crear-orden-compra
https://tu-n8n.com/webhook/registrar-pago
https://tu-n8n.com/webhook/movimiento-stock
https://tu-n8n.com/webhook/alerta-stock
https://tu-n8n.com/webhook/crear-receta
https://tu-n8n.com/webhook/vender-receta
https://tu-n8n.com/webhook/health-check
```

#### **Configuración de Autenticación:**
```javascript
// En cada webhook de n8n
{
  "authentication": {
    "type": "headerAuth",
    "headerName": "X-N8N-API-KEY",
    "headerValue": "tu-api-key-secreta"
  }
}
```

### **3. Variables de Entorno**

#### **En ContaPYME (.env.local):**
```env
# n8n Configuration
VITE_N8N_BASE_URL=https://tu-n8n-workspace.n8n.cloud
VITE_N8N_API_KEY=tu-api-key-secreta
```

#### **En n8n (Variables de entorno):**
```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password

# WhatsApp Business API
WHATSAPP_API_TOKEN=tu-token
WHATSAPP_PHONE_NUMBER=+5491112345678

# AFIP Configuration
AFIP_CUIT=20123456789
AFIP_CERT_PATH=/path/to/cert.pem
AFIP_KEY_PATH=/path/to/key.pem
```

## 📊 Ejemplos de Workflows

### **Workflow: Emisión de Factura**

```javascript
// 1. Webhook Trigger
{
  "webhook": {
    "path": "/emitir-factura",
    "method": "POST"
  }
}

// 2. Validar Datos
{
  "function": {
    "code": `
      const { factura } = $input.first().json;
      
      if (!factura.cuit_cliente || !factura.total) {
        throw new Error('Datos de factura incompletos');
      }
      
      return { factura };
    `
  }
}

// 3. Validar CUIT con AFIP
{
  "httpRequest": {
    "url": "https://servicios1.afip.gov.ar/ws_sr_padron_a4/service.asmx",
    "method": "POST",
    "headers": {
      "Content-Type": "text/xml"
    },
    "body": `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <getPersona xmlns="http://a4.soap.ws.server.puc.sr/">
            <token>${AFIP_TOKEN}</token>
            <sign>${AFIP_SIGN}</sign>
            <cuitRepresentada>${AFIP_CUIT}</cuitRepresentada>
            <idPersona>${factura.cuit_cliente}</idPersona>
          </getPersona>
        </soap:Body>
      </soap:Envelope>
    `
  }
}

// 4. Generar CAE
{
  "httpRequest": {
    "url": "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
    "method": "POST",
    "body": `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <FECAESolicitar xmlns="http://ar.gov.afip.dif.facturaelectronica/">
            <Auth>
              <Token>${AFIP_TOKEN}</Token>
              <Sign>${AFIP_SIGN}</Sign>
              <Cuit>${AFIP_CUIT}</Cuit>
            </Auth>
            <FeCAEReq">
              <FeCabReq>
                <CantReg>1</CantReg>
                <PtoVta>${factura.punto_venta}</PtoVta>
                <Concepto>1</Concepto>
              </FeCabReq>
              <FeDetReq>
                <FECAEDetRequest>
                  <Concepto>1</Concepto>
                  <DocTipo>80</DocTipo>
                  <DocNro>${factura.cuit_cliente}</DocNro>
                  <CbteDesde>${factura.numero}</CbteDesde>
                  <CbteHasta>${factura.numero}</CbteHasta>
                  <CbteFch>${factura.fecha}</CbteFch>
                  <ImpTotal>${factura.total}</ImpTotal>
                  <ImpTotConc>0</ImpTotConc>
                  <ImpNeto>${factura.subtotal}</ImpNeto>
                  <ImpOpEx>0</ImpOpEx>
                  <ImpIVA>${factura.iva}</ImpIVA>
                  <ImpTrib>0</ImpTrib>
                  <FchServDesde>${factura.fecha}</FchServDesde>
                  <FchServHasta>${factura.fecha}</FchServHasta>
                  <FchVtoPago>${factura.fecha_vencimiento}</FchVtoPago>
                  <MonId>PES</MonId>
                  <MonCotiz>1</MonCotiz>
                </FECAEDetRequest>
              </FeDetReq>
            </FeCAEReq>
          </FECAESolicitar>
        </soap:Body>
      </soap:Envelope>
    `
  }
}

// 5. Actualizar Factura en Supabase
{
  "supabase": {
    "operation": "update",
    "table": "facturas_emitidas",
    "id": "{{$json.factura.id}}",
    "data": {
      "cae": "{{$json.CAE}}",
      "fecha_vencimiento_cae": "{{$json.fecha_vencimiento_cae}}",
      "estado": "emitida"
    }
  }
}

// 6. Enviar Email
{
  "email": {
    "to": "{{$json.factura.email_cliente}}",
    "subject": "Factura {{$json.factura.numero}} - {{$json.empresa.nombre}}",
    "html": `
      <h1>Factura {{$json.factura.numero}}</h1>
      <p>Total: ${{$json.factura.total}}</p>
      <p>CAE: {{$json.CAE}}</p>
    `
  }
}
```

### **Workflow: Alerta de Stock**

```javascript
// 1. Webhook Trigger
{
  "webhook": {
    "path": "/alerta-stock",
    "method": "POST"
  }
}

// 2. Verificar Stock
{
  "supabase": {
    "operation": "select",
    "table": "productos",
    "where": "stock_actual <= stock_minimo"
  }
}

// 3. Enviar WhatsApp
{
  "httpRequest": {
    "url": "https://graph.facebook.com/v17.0/{{WHATSAPP_PHONE_NUMBER}}/messages",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{WHATSAPP_API_TOKEN}}",
      "Content-Type": "application/json"
    },
    "body": {
      "messaging_product": "whatsapp",
      "to": "{{RESPONSABLE_PHONE}}",
      "type": "template",
      "template": {
        "name": "alerta_stock",
        "language": {
          "code": "es"
        },
        "components": [
          {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": "{{$json.producto.nombre}}"
              },
              {
                "type": "text",
                "text": "{{$json.producto.stock_actual}}"
              }
            ]
          }
        ]
      }
    }
  }
}

// 4. Crear Orden de Compra
{
  "supabase": {
    "operation": "insert",
    "table": "ordenes_compra",
    "data": {
      "producto_id": "{{$json.producto.id}}",
      "cantidad": "{{$json.producto.stock_minimo * 2}}",
      "estado": "pendiente"
    }
  }
}
```

## 🔍 Monitoreo y Logs

### **Health Check**
```javascript
// Endpoint para verificar estado de n8n
GET https://tu-n8n.com/webhook/health-check

// Respuesta esperada
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "endpoints": {
    "emitir-factura": "active",
    "alerta-stock": "active",
    "crear-orden-compra": "active"
  }
}
```

### **Logs de Conectividad**
ContaPYME registra automáticamente el estado de conectividad con n8n en la tabla `logs_conectividad`.

## 🚨 Solución de Problemas

### **Error: "n8n connection failed"**
1. Verificar URL de n8n en `.env.local`
2. Verificar API Key
3. Verificar que los workflows estén activos
4. Revisar logs en n8n

### **Error: "Webhook not found"**
1. Verificar que el webhook esté creado en n8n
2. Verificar la ruta del webhook
3. Verificar autenticación

### **Error: "AFIP validation failed"**
1. Verificar credenciales de AFIP
2. Verificar certificados
3. Verificar CUIT habilitado

## 📚 Recursos Adicionales

- [Documentación oficial de n8n](https://docs.n8n.io/)
- [Guía de webhooks en n8n](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.webhook/)
- [Integración con Supabase](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.supabase/)
- [Automatización de emails](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.emailSend/)

---

**Nota:** La integración con n8n es completamente opcional. ContaPYME funciona perfectamente sin automatizaciones, pero n8n agrega capacidades avanzadas de automatización de procesos de negocio. 