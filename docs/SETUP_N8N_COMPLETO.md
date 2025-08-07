# 🚀 Configuración Completa de n8n - ContaPYME

## 📋 Resumen
Esta guía te llevará paso a paso para configurar n8n y conectar todos los workflows con ContaPYME para que el sistema esté 100% funcional.

## 🎯 Objetivo
- Configurar n8n Cloud o local
- Importar todos los workflows
- Configurar variables de entorno
- Probar conectividad completa
- Verificar funcionamiento de todos los procesos

---

## 🔧 Paso 1: Configurar n8n Cloud

### **1.1 Crear cuenta en n8n Cloud**
1. Ve a [n8n.cloud](https://n8n.cloud)
2. Crea una cuenta gratuita
3. Crea un nuevo workspace
4. Anota la URL de tu workspace (ej: `https://tu-workspace.n8n.cloud`)

### **1.2 Configurar Variables de Entorno en n8n**

En tu workspace de n8n, ve a **Settings > Variables** y agrega:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# AFIP Configuration (para facturación)
AFIP_CUIT=20123456789
AFIP_CERT_PATH=/path/to/cert.pem
AFIP_KEY_PATH=/path/to/key.pem

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# WhatsApp Business API (opcional)
WHATSAPP_API_TOKEN=tu-token
WHATSAPP_PHONE_NUMBER=+5491112345678

# API Keys
N8N_API_KEY=tu-api-key-secreta-para-webhooks
```

---

## 📥 Paso 2: Importar Workflows

### **2.1 Importar Workflow de Emisión de Facturas**

1. En n8n, ve a **Workflows**
2. Haz clic en **Import from file**
3. Selecciona `n8n-workflows/emitir-factura.json`
4. Haz clic en **Import**

### **2.2 Importar Workflow de Actualización de Stock**

1. Repite el proceso para `n8n-workflows/actualizar-stock.json`

### **2.3 Importar Workflow de Registro de Pagos**

1. Importa `n8n-workflows/registrar-pago.json`

### **2.4 Importar Workflow de Alertas de Stock**

1. Importa `n8n-workflows/alerta-stock.json`

---

## ⚙️ Paso 3: Configurar Webhooks

### **3.1 Verificar URLs de Webhooks**

Después de importar, verifica que los webhooks tengan las URLs correctas:

- **Emitir Factura**: `https://tu-workspace.n8n.cloud/webhook/emitir-factura`
- **Actualizar Stock**: `https://tu-workspace.n8n.cloud/webhook/actualizar-stock`
- **Registrar Pago**: `https://tu-workspace.n8n.cloud/webhook/registrar-pago`
- **Alerta Stock**: `https://tu-workspace.n8n.cloud/webhook/alerta-stock`

### **3.2 Configurar Autenticación**

En cada webhook, configura la autenticación:
- **Type**: Header Auth
- **Header Name**: `X-N8N-API-KEY`
- **Header Value**: `{{ $env.N8N_API_KEY }}`

---

## 🔗 Paso 4: Configurar ContaPYME

### **4.1 Actualizar Variables de Entorno**

En tu archivo `.env.local`:

```env
# n8n Configuration
VITE_N8N_BASE_URL=https://tu-workspace.n8n.cloud
VITE_N8N_API_KEY=tu-api-key-secreta

# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima

# AFIP Configuration (si tienes)
VITE_AFIP_TOKEN=tu-token-afip
VITE_AFIP_SIGN=tu-sign-afip
VITE_AFIP_CUIT=20123456789
```

### **4.2 Configurar desde la Aplicación**

1. Ve a **Configuración > n8n**
2. Ingresa la URL de tu workspace n8n
3. Ingresa tu API Key
4. Haz clic en **Probar Conexión**

---

## 🧪 Paso 5: Probar Conectividad

### **5.1 Test de Health Check**

```bash
# Desde la aplicación
npm run dev
# Ve a Configuración > n8n > Probar Conexión
```

### **5.2 Test Manual de Webhooks**

Puedes probar manualmente con curl:

```bash
# Health Check
curl -X POST https://tu-workspace.n8n.cloud/webhook/health-check \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: tu-api-key" \
  -d '{"test": true}'

# Emitir Factura (test)
curl -X POST https://tu-workspace.n8n.cloud/webhook/emitir-factura \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: tu-api-key" \
  -d '{
    "factura_id": "test-123",
    "cuit_cliente": "20-12345678-9",
    "total": 1000,
    "test_mode": true
  }'
```

---

## ✅ Paso 6: Verificar Funcionamiento

### **6.1 Probar Emisión de Factura**

1. Ve a **Facturas > Nueva Factura**
2. Completa los datos
3. Haz clic en **Emitir**
4. Verifica en n8n que el workflow se ejecute

### **6.2 Probar Actualización de Stock**

1. Ve a **Stock > Nuevo Producto**
2. Agrega un producto
3. Verifica que se actualice automáticamente

### **6.3 Probar Alertas de Stock**

1. Reduce el stock de un producto por debajo del mínimo
2. Verifica que se genere la alerta automáticamente

---

## 🔍 Paso 7: Monitoreo y Logs

### **7.1 Verificar Logs en n8n**

1. Ve a **Executions** en n8n
2. Revisa las ejecuciones de los workflows
3. Verifica que no haya errores

### **7.2 Verificar Logs en ContaPYME**

1. Ve a **Monitoreo > Logs**
2. Revisa los logs de conectividad
3. Verifica el estado de los webhooks

---

## 🚨 Solución de Problemas

### **Error: "Webhook not found"**
- Verifica que el webhook esté activo en n8n
- Verifica la URL del webhook
- Verifica la autenticación

### **Error: "AFIP validation failed"**
- Verifica las credenciales de AFIP
- Verifica que el CUIT esté habilitado
- Verifica los certificados

### **Error: "Supabase connection failed"**
- Verifica las credenciales de Supabase
- Verifica que las tablas existan
- Verifica los permisos

---

## 📊 Verificación Final

### **Checklist de Funcionalidad**

- [ ] n8n Cloud configurado
- [ ] Variables de entorno configuradas
- [ ] Workflows importados
- [ ] Webhooks configurados
- [ ] Autenticación funcionando
- [ ] Health check exitoso
- [ ] Emisión de facturas funcionando
- [ ] Actualización de stock funcionando
- [ ] Registro de pagos funcionando
- [ ] Alertas de stock funcionando
- [ ] Logs funcionando
- [ ] Monitoreo funcionando

### **Comando de Verificación**

```bash
npm run verify
```

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu sistema ContaPYME estará 100% conectado con n8n y funcionando automáticamente.

### **Próximos Pasos**

1. **Configurar notificaciones por email**
2. **Configurar WhatsApp Business**
3. **Personalizar workflows según necesidades**
4. **Configurar backups automáticos**
5. **Implementar métricas avanzadas**

---

**¿Necesitas ayuda con algún paso específico?** 

Puedes ejecutar `npm run setup` para una configuración automatizada, o seguir esta guía paso a paso para configuración manual.
