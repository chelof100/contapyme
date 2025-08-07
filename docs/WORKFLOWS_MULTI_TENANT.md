# 🔄 Workflows Multi-Tenant - ContaPYME

## 📋 **Resumen Ejecutivo**

Este documento describe cómo configurar y gestionar workflows de n8n para el sistema multi-tenant de ContaPYME, donde cada cliente tiene su propia instancia de workflows con webhooks únicos.

---

## 🎯 **Arquitectura Multi-Tenant**

### **Estructura de Webhooks por Cliente**

```
Cliente 1 (Usuario 1):
├── /webhook/client-1/emitir-factura
├── /webhook/client-1/actualizar-stock
├── /webhook/client-1/registrar-pago
└── /webhook/client-1/alerta-stock

Cliente 2:
├── /webhook/client-2/emitir-factura
├── /webhook/client-2/actualizar-stock
├── /webhook/client-2/registrar-pago
└── /webhook/client-2/alerta-stock
```

### **Configuración por Cliente**

Cada cliente tiene:
- **Prefijo único** de webhook (ej: `/webhook/client-1`)
- **URL base** específica de n8n
- **API Key** propia
- **Features** habilitadas/deshabilitadas
- **Configuración** de timeout y reintentos

---

## 🚀 **Workflows Disponibles**

### **1. Emitir Factura con AFIP**
- **Archivo:** `n8n-workflows/emitir-factura.json`
- **Endpoint:** `/webhook/{client-prefix}/emitir-factura`
- **Funcionalidad:** Emisión de facturas electrónicas con AFIP
- **Datos requeridos:**
  ```json
  {
    "factura_id": "uuid",
    "cuit_cliente": "XX-XXXXXXXX-X",
    "total": 1000.00,
    "subtotal": 826.45,
    "iva": 173.55,
    "productos": [...],
    "afip_token": "token",
    "afip_sign": "sign",
    "afip_cuit": "cuit",
    "supabase_url": "url",
    "supabase_anon_key": "key"
  }
  ```

### **2. Actualizar Stock**
- **Archivo:** `n8n-workflows/actualizar-stock.json`
- **Endpoint:** `/webhook/{client-prefix}/actualizar-stock`
- **Funcionalidad:** Actualización automática de stock tras ventas
- **Datos requeridos:**
  ```json
  {
    "factura_id": "uuid",
    "empresa_id": "uuid",
    "productos": [
      {
        "producto_id": "uuid",
        "sku": "PROD001",
        "cantidad_vendida": 5
      }
    ]
  }
  ```

### **3. Registrar Pago**
- **Archivo:** `n8n-workflows/registrar-pago.json`
- **Endpoint:** `/webhook/{client-prefix}/registrar-pago`
- **Funcionalidad:** Registro de pagos y actualización de estado de facturas
- **Datos requeridos:**
  ```json
  {
    "factura_id": "uuid",
    "numero_factura": "A-0001-00000001",
    "tipo_factura": "A",
    "monto": 1000.00,
    "metodo_pago": "transferencia",
    "empresa_id": "uuid"
  }
  ```

### **4. Alerta Stock**
- **Archivo:** `n8n-workflows/alerta-stock.json`
- **Endpoint:** `/webhook/{client-prefix}/alerta-stock`
- **Funcionalidad:** Alertas automáticas cuando el stock está bajo
- **Datos requeridos:**
  ```json
  {
    "empresa_id": "uuid",
    "productos_bajo_stock": [
      {
        "producto_id": "uuid",
        "sku": "PROD001",
        "stock_actual": 2,
        "stock_minimo": 5
      }
    ]
  }
  ```

---

## 🔧 **Configuración para Usuario 1 (Desarrollo)**

### **Paso 1: Configurar Cliente en ContaPYME**

1. Ir a **Configuración → Multi-Tenant**
2. Editar el cliente "Usuario 1 (Desarrollo)"
3. Configurar:
   - **URL Base:** `https://tu-instancia-n8n.googlecloud.com`
   - **Prefijo:** `/webhook/client-1`
   - **API Key:** Tu API key de n8n
   - **Features:** Todas habilitadas

### **Paso 2: Importar Workflows en n8n**

#### **Método 1: Importación Manual**
1. Acceder a tu instancia de n8n
2. Ir a **Workflows → Import from file**
3. Importar cada archivo JSON:
   - `emitir-factura.json`
   - `actualizar-stock.json`
   - `registrar-pago.json`
   - `alerta-stock.json`

#### **Método 2: Importación Automática**
```bash
# Usar el script de importación
npm run setup:n8n
```

### **Paso 3: Configurar Variables de Entorno en n8n**

En tu instancia de n8n, configurar las siguientes variables:

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key

# AFIP (para facturación)
AFIP_TOKEN=tu-afip-token
AFIP_SIGN=tu-afip-sign
AFIP_CUIT=tu-cuit

# Email (para notificaciones)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password

# WhatsApp (opcional)
WHATSAPP_API_KEY=tu-whatsapp-api-key
WHATSAPP_PHONE_NUMBER=+5491112345678

# n8n API Key
N8N_API_KEY=tu-n8n-api-key
```

### **Paso 4: Configurar Credenciales en n8n**

1. **Supabase Credentials:**
   - Tipo: Supabase API
   - URL: `{{ $env.SUPABASE_URL }}`
   - Key: `{{ $env.SUPABASE_ANON_KEY }}`

2. **Email Credentials:**
   - Tipo: SMTP
   - Host: `{{ $env.EMAIL_HOST }}`
   - Port: `{{ $env.EMAIL_PORT }}`
   - User: `{{ $env.EMAIL_USER }}`
   - Password: `{{ $env.EMAIL_PASS }}`

### **Paso 5: Actualizar Endpoints de Workflows**

Para cada workflow importado, actualizar el endpoint del webhook:

1. **Emitir Factura:**
   - Cambiar path de `emitir-factura` a `client-1/emitir-factura`

2. **Actualizar Stock:**
   - Cambiar path de `actualizar-stock` a `client-1/actualizar-stock`

3. **Registrar Pago:**
   - Cambiar path de `registrar-pago` a `client-1/registrar-pago`

4. **Alerta Stock:**
   - Cambiar path de `alerta-stock` a `client-1/alerta-stock`

---

## 🧪 **Testing de Workflows**

### **1. Testing de Conectividad**

En ContaPYME → Configuración → n8n:
1. Configurar URL y API Key
2. Hacer clic en "Probar Conexión"
3. Verificar que responda correctamente

### **2. Testing de Endpoints Individuales**

En ContaPYME → Configuración → Desarrollador:
1. Ir a "Configuración de Webhooks n8n"
2. Probar cada endpoint individualmente
3. Verificar respuestas y logs

### **3. Testing de Flujo Completo**

#### **Test de Emisión de Factura:**
```bash
curl -X POST https://tu-instancia-n8n.googlecloud.com/webhook/client-1/emitir-factura \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: tu-api-key" \
  -d '{
    "factura_id": "test-001",
    "cuit_cliente": "20-12345678-9",
    "total": 1000.00,
    "subtotal": 826.45,
    "iva": 173.55,
    "productos": [
      {
        "nombre": "Producto Test",
        "cantidad": 1,
        "precio_unitario": 1000.00
      }
    ],
    "afip_token": "tu-token",
    "afip_sign": "tu-sign",
    "afip_cuit": "tu-cuit",
    "supabase_url": "tu-supabase-url",
    "supabase_anon_key": "tu-supabase-key"
  }'
```

#### **Test de Actualización de Stock:**
```bash
curl -X POST https://tu-instancia-n8n.googlecloud.com/webhook/client-1/actualizar-stock \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: tu-api-key" \
  -d '{
    "factura_id": "test-001",
    "empresa_id": "empresa-uuid",
    "productos": [
      {
        "producto_id": "producto-uuid",
        "sku": "PROD001",
        "cantidad_vendida": 2
      }
    ]
  }'
```

---

## 📊 **Monitoreo y Logs**

### **1. Logs de n8n**
- Acceder a la instancia de n8n
- Ir a **Executions** para ver logs de workflows
- Filtrar por workflow específico

### **2. Métricas en ContaPYME**
- Ir a **Monitoreo** en ContaPYME
- Ver métricas de webhooks
- Revisar estado de integraciones

### **3. Alertas Automáticas**
- Configurar alertas en n8n para errores
- Recibir notificaciones por email/WhatsApp
- Monitorear performance de workflows

---

## 🔄 **Escalabilidad para Múltiples Clientes**

### **Proceso de Onboarding de Nuevo Cliente**

1. **Crear Cliente en ContaPYME:**
   - Ir a Configuración → Multi-Tenant
   - Crear nuevo cliente con prefijo único
   - Configurar URL base y API key

2. **Clonar Workflows en n8n:**
   - Duplicar workflows existentes
   - Actualizar endpoints con prefijo del cliente
   - Configurar credenciales específicas

3. **Configurar Variables de Entorno:**
   - Crear variables específicas del cliente
   - Configurar credenciales de AFIP, Supabase, etc.

4. **Testing y Validación:**
   - Probar conectividad
   - Validar flujos completos
   - Configurar monitoreo

### **Script de Automatización**

```bash
#!/bin/bash
# Script para crear cliente automáticamente

CLIENT_ID=$1
CLIENT_NAME=$2
N8N_URL=$3
API_KEY=$4

# 1. Crear cliente en ContaPYME
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"clientName\": \"$CLIENT_NAME\",
    \"webhookPrefix\": \"/webhook/$CLIENT_ID\",
    \"baseUrl\": \"$N8N_URL\",
    \"apiKey\": \"$API_KEY\"
  }"

# 2. Clonar workflows en n8n
# (Implementar lógica de clonación)
```

---

## 🚨 **Troubleshooting**

### **Problemas Comunes**

1. **Error de Conectividad:**
   - Verificar URL base de n8n
   - Comprobar API key
   - Revisar firewall/red

2. **Error de Autenticación:**
   - Verificar credenciales de AFIP
   - Comprobar Supabase credentials
   - Revisar variables de entorno

3. **Error de Validación:**
   - Verificar formato de datos enviados
   - Comprobar campos requeridos
   - Revisar logs de n8n

4. **Error de Base de Datos:**
   - Verificar conexión a Supabase
   - Comprobar permisos de RLS
   - Revisar estructura de tablas

### **Logs de Debug**

Habilitar logs detallados en n8n:
1. Ir a **Settings → Logs**
2. Configurar nivel de log a **Debug**
3. Revisar logs en tiempo real

---

## 📈 **Métricas y Performance**

### **KPIs a Monitorear**

1. **Tiempo de Respuesta:**
   - Promedio: < 5 segundos
   - P95: < 10 segundos
   - P99: < 15 segundos

2. **Tasa de Éxito:**
   - Emisión de facturas: > 95%
   - Actualización de stock: > 99%
   - Registro de pagos: > 98%

3. **Disponibilidad:**
   - Uptime: > 99.9%
   - Tiempo de recuperación: < 5 minutos

### **Alertas Recomendadas**

1. **Error Rate > 5%**
2. **Response Time > 10s**
3. **Workflow Failures > 3 en 1 hora**
4. **Database Connection Errors**

---

## 🔐 **Seguridad**

### **Buenas Prácticas**

1. **API Keys:**
   - Rotar regularmente
   - Usar diferentes keys por cliente
   - Almacenar de forma segura

2. **Variables de Entorno:**
   - No hardcodear en workflows
   - Usar variables de entorno
   - Encriptar datos sensibles

3. **Acceso a n8n:**
   - Configurar autenticación
   - Limitar acceso por IP
   - Usar HTTPS

4. **Logs:**
   - No loggear datos sensibles
   - Rotar logs regularmente
   - Monitorear acceso

---

## 📞 **Soporte**

### **Contacto**
- **Desarrollador:** [Tu contacto]
- **Documentación:** [Enlace a docs]
- **Issues:** [Enlace a GitHub]

### **Recursos Adicionales**
- [Documentación de n8n](https://docs.n8n.io/)
- [API de AFIP](https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp)
- [Documentación de Supabase](https://supabase.com/docs)
