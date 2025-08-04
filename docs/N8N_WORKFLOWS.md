# Workflows de n8n para ContaPYME

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Workflow: Emisión de Factura](#workflow-emisión-de-factura)
3. [Variables de Entorno](#variables-de-entorno)
4. [Instalación y Despliegue](#instalación-y-despliegue)
5. [Testing](#testing)
6. [Monitoreo](#monitoreo)

---

## 🔧 Configuración Inicial

### **1. Instalar n8n**

#### **Opción A: n8n Cloud (Recomendado)**
```bash
# 1. Ir a https://n8n.cloud
# 2. Crear cuenta gratuita
# 3. Crear workspace
# 4. Copiar URL del workspace
```

#### **Opción B: n8n Local**
```bash
# Instalar n8n localmente
npm install n8n -g
n8n start
```

### **2. Configurar Variables de Entorno**

En tu workspace de n8n, ve a **Settings → Variables** y agrega **SOLO las variables globales**:

```env
# n8n Configuration (Solo estas variables globales)
N8N_API_KEY=tu_api_key_secreta_global
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=tu_password
```

**Las credenciales de AFIP y Supabase vienen desde ContaPYME de cada usuario.**

---

## 🔥 Workflow: Emisión de Factura

### **📊 Descripción**
Workflow completo para emitir facturas electrónicas con integración AFIP, generación de CAE, envío de email y actualización de base de datos.

### **🔄 Flujo del Workflow**
```
Webhook → Validación → AFIP → CAE → Supabase → Email → Log → Respuesta
```

### **📥 Datos de Entrada**
```json
{
  "factura_id": "12345",
  "cuit_cliente": "20-12345678-9",
  "total": 1000.00,
  "subtotal": 826.45,
  "iva": 173.55,
  "fecha": "2024-01-01",
  "tipo_factura": "A",
  "punto_venta": 1,
  "productos": [
    {
      "sku": "PROD001",
      "nombre": "Producto 1",
      "cantidad": 2,
      "precio_unitario": 500.00,
      "subtotal": 1000.00
    }
  ],
  
  // Credenciales del usuario (agregadas automáticamente por ContaPYME)
  "afip_token": "token_del_usuario",
  "afip_sign": "sign_del_usuario", 
  "afip_cuit": "20123456789",
  "supabase_url": "https://usuario.supabase.co",
  "supabase_anon_key": "key_del_usuario"
}
```

### **📤 Respuesta de Éxito**
```json
{
  "success": true,
  "factura_id": "12345",
  "cae": "12345678901234",
  "cliente": "EMPRESA SA",
  "total": 1000.00,
  "email_sent": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### **❌ Respuesta de Error**
```json
{
  "success": false,
  "error": "CUIT 20-12345678-9 no válido o inactivo en AFIP",
  "factura_id": "12345",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### **🔧 Pasos del Workflow**

#### **1. Webhook Trigger**
- **Endpoint:** `/emitir-factura`
- **Método:** POST
- **Autenticación:** Header `X-N8N-API-KEY`

#### **2. Validar Datos**
- Validar `factura_id` requerido
- Validar `cuit_cliente` con formato XX-XXXXXXXX-X
- Validar `total` mayor a 0
- Calcular `subtotal` e `iva` si no están presentes

#### **3. Consultar CUIT AFIP**
- Llamar servicio AFIP para validar CUIT
- Verificar que el contribuyente esté activo
- Obtener razón social y datos del cliente

#### **4. Generar CAE**
- Solicitar CAE a AFIP
- Incluir todos los datos de la factura
- Procesar respuesta XML

#### **5. Actualizar Supabase**
- Actualizar factura con CAE
- Cambiar estado a "emitida"
- Guardar datos del cliente

#### **6. Enviar Email**
- Generar email HTML con datos de la factura
- Incluir CAE y fecha de vencimiento
- Enviar al cliente

#### **7. Log de Éxito**
- Registrar ejecución exitosa
- Guardar métricas en Supabase

---

## 📋 Variables de Entorno Detalladas

### **AFIP Configuration**
```env
# Token de autenticación AFIP
AFIP_TOKEN=tu_token_largo_de_afip

# Sign de autenticación AFIP  
AFIP_SIGN=tu_sign_de_afip

# CUIT de la empresa
AFIP_CUIT=20123456789
```

### **Email Configuration**
```env
# Email de origen
SMTP_FROM=facturacion@tuempresa.com

# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_de_aplicacion
```

### **n8n Configuration**
```env
# API Key para autenticación
N8N_API_KEY=tu_api_key_secreta_muy_larga
```

### **Supabase Configuration**
```env
# URL del proyecto Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave anónima de Supabase
SUPABASE_ANON_KEY=tu_clave_anonima_larga
```

---

## 🚀 Instalación y Despliegue

### **1. Importar Workflow**

#### **En n8n Cloud:**
1. Ve a tu workspace
2. Haz clic en **Import from file**
3. Selecciona `n8n-workflows/emitir-factura.json`
4. Haz clic en **Import**

#### **En n8n Local:**
1. Copia el contenido de `emitir-factura.json`
2. Ve a **Workflows** en n8n
3. Haz clic en **Import from JSON**
4. Pega el contenido y haz clic en **Import**

### **2. Configurar Variables**

1. Ve a **Settings → Variables**
2. Agrega todas las variables de entorno listadas arriba
3. Haz clic en **Save**

### **3. Activar Workflow**

1. Haz clic en **Activate** en el workflow
2. Copia la URL del webhook
3. Configura la URL en ContaPYME

### **4. Configurar ContaPYME**

Cada usuario configura su archivo `.env.local` con sus propias credenciales:

```env
# n8n Configuration (Común para todos)
VITE_N8N_BASE_URL=https://tu-n8n-workspace.n8n.cloud
VITE_N8N_API_KEY=tu_api_key_secreta_global

# Credenciales específicas del usuario
VITE_AFIP_TOKEN=token_del_usuario
VITE_AFIP_SIGN=sign_del_usuario
VITE_AFIP_CUIT=20123456789
VITE_SUPABASE_URL=https://usuario.supabase.co
VITE_SUPABASE_ANON_KEY=key_del_usuario
```

---

## 🧪 Testing

### **1. Test Básico**

```bash
# Usar curl para probar el webhook
curl -X POST https://tu-n8n-workspace.n8n.cloud/webhook/emitir-factura \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: tu_api_key_secreta" \
  -d '{
    "factura_id": "TEST001",
    "cuit_cliente": "20-12345678-9",
    "total": 1000.00,
    "subtotal": 826.45,
    "iva": 173.55,
    "fecha": "2024-01-01"
  }'
```

### **2. Test desde ContaPYME**

1. Ve a la página de Facturas
2. Crea una nueva factura
3. Verifica que se envíe al webhook
4. Revisa los logs en n8n

### **3. Verificar Resultados**

1. **En Supabase:** Verificar que la factura tenga CAE
2. **En Email:** Verificar que se envíe el email
3. **En Logs:** Verificar que se registre la ejecución

---

## 📊 Monitoreo

### **1. Logs de Ejecución**

En n8n, ve a **Executions** para ver:
- ✅ Ejecuciones exitosas
- ❌ Ejecuciones fallidas
- ⏱️ Tiempo de respuesta
- 📊 Estadísticas

### **2. Métricas en Supabase**

```sql
-- Ver logs de workflows
SELECT * FROM workflow_logs 
WHERE workflow_name = 'Emitir Factura' 
ORDER BY timestamp DESC;

-- Estadísticas de éxito
SELECT 
  status,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (timestamp::timestamp - LAG(timestamp::timestamp) OVER (ORDER BY timestamp)))) as avg_time
FROM workflow_logs 
WHERE workflow_name = 'Emitir Factura'
GROUP BY status;
```

### **3. Alertas**

Configurar alertas para:
- ❌ Workflows fallidos
- ⏱️ Tiempo de respuesta alto
- 📧 Errores de email
- 🔗 Problemas de conectividad AFIP

---

## 🔧 Troubleshooting

### **Error: "CUIT no válido"**
- Verificar formato del CUIT (XX-XXXXXXXX-X)
- Verificar que el CUIT esté activo en AFIP
- Verificar credenciales de AFIP

### **Error: "No se pudo generar CAE"**
- Verificar token y sign de AFIP
- Verificar que el punto de venta esté habilitado
- Verificar que no haya duplicados

### **Error: "Email no enviado"**
- Verificar configuración SMTP
- Verificar credenciales de email
- Verificar que el email del cliente sea válido

### **Error: "No se pudo actualizar Supabase"**
- Verificar credenciales de Supabase
- Verificar que la tabla exista
- Verificar permisos RLS

---

## 📈 Próximos Workflows

### **Fase 2:**
- [ ] Validación de CUIT independiente
- [ ] Actualización de Stock
- [ ] Registro de Pagos
- [ ] Creación de Clientes

### **Fase 3:**
- [ ] Alertas de Stock
- [ ] Envío de WhatsApp
- [ ] Reportes Automáticos
- [ ] Conciliación Bancaria

---

## 📞 Soporte

- 📧 **Email:** soporte@contapyme.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/chelof100/contapyme/issues)
- 📖 **Documentación:** [docs/](docs/)

---

**¡El workflow está listo para usar! 🚀** 