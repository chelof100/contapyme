# N8N Workflows para ContaPYME

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Workflow: Emitir Factura con AFIP](#workflow-emitir-factura-con-afip)
3. [Configuración de Certificados AFIP](#configuración-de-certificados-afip)
4. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Solución de Problemas](#solución-de-problemas)

## 🔧 Configuración Inicial

### Variables de Entorno en n8n

Configura las siguientes variables en tu instancia de n8n:

```bash
# Variables globales de n8n (NO contienen datos específicos del usuario)
N8N_API_KEY=tu_api_key_de_n8n
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com

# Configuración de Gmail (para envío de facturas)
GMAIL_FROM=facturacion@tuempresa.com

# Configuración de Google Drive (para almacenar PDFs)
GOOGLE_DRIVE_FOLDER_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

### Configuración de Gmail en n8n

1. **Crear credenciales de Gmail:**
   - Ve a Settings → Credentials en n8n
   - Crea una nueva credencial de tipo "Gmail"
   - Configura OAuth2 con tu cuenta de Gmail
   - Usa la variable `GMAIL_FROM` para el email remitente

2. **Configurar App Password (recomendado):**
   - Activa 2FA en tu cuenta de Gmail
   - Genera una "App Password" específica para n8n
   - Usa esta contraseña en lugar de tu contraseña normal

## Configuración de Google Drive en n8n

1. **Crear credenciales de Google Drive:**
   - Ve a Settings → Credentials en n8n
   - Crea una nueva credencial de tipo "Google Drive"
   - Configura OAuth2 con tu cuenta de Google
   - Asegúrate de tener permisos de escritura en Drive

2. **Configurar carpeta de destino:**
   - Crea una carpeta en Google Drive para las facturas
   - Copia el ID de la carpeta (está en la URL cuando abres la carpeta)
   - Configura la variable `GOOGLE_DRIVE_FOLDER_ID` en n8n

### Variables de Entorno en ContaPYME (.env.local)

```bash
# Credenciales específicas del usuario (NO en n8n)
VITE_AFIP_TOKEN=tu_token_afip
VITE_AFIP_SIGN=tu_sign_afip
VITE_AFIP_CUIT=tu_cuit_afip
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_supabase

# URL del webhook de n8n
VITE_N8N_WEBHOOK_URL=https://tu-instancia-n8n.com
```

## 🚀 Workflow: Emitir Factura con AFIP

### Características
- ✅ **AFIP SDK Integration**: Usa la API oficial de AFIP SDK
- ✅ **QR Code Oficial**: Genera QR según especificaciones de AFIP
- ✅ **PDF Profesional**: Crea PDF con estilos oficiales
- ✅ **Email Automático con Gmail**: Envía factura por email al cliente
- ✅ **Numeración Automática**: Obtiene último número autorizado
- ✅ **Multi-tenant**: Cada usuario usa sus propias credenciales
- ✅ **Respuesta Completa**: Informa al frontend sobre el resultado

### Flujo del Workflow
```
Webhook → Validar Datos → Obtener Autorización → Obtener Último Número → 
Crear Voucher → Generar QR → Actualizar Supabase → Generar HTML → 
Crear PDF → Descargar PDF → Enviar Email con Gmail → Subir a Google Drive → Respuesta Completa
```

### Flujo de Datos

#### **1. ContaPYME → n8n:**
- Frontend envía datos de la factura al webhook de n8n
- Incluye credenciales específicas del usuario (AFIP + Supabase)
- **Nuevo**: Incluye `email_cliente` y `nombre_cliente` para envío automático

#### **2. n8n → AFIP:**
- Obtiene autorización y crea voucher
- Genera QR según especificaciones oficiales

#### **3. n8n → Supabase:**
- Actualiza la factura con CAE, QR, estado, etc.
- Los datos quedan disponibles para ContaPYME

#### **4. n8n → Gmail:**
- Genera PDF profesional
- Envía email con PDF adjunto al cliente (solo si `email_cliente` está presente)

#### **5. n8n → Google Drive:**
- Sube el PDF a Google Drive
- Guarda el enlace para acceso posterior
- Los contadores pueden descargar las facturas desde ContaPYME

#### **6. n8n → ContaPYME:**
- Responde al frontend con todos los datos
- Incluye enlaces de Google Drive para descarga
- ContaPYME valida la respuesta y muestra confirmación al usuario

### Datos de Entrada
```json
{
  "factura_id": "uuid-de-la-factura",
  "cuit_cliente": "20-12345678-9",
  "total": 1210.00,
  "subtotal": 1000.00,
  "iva": 210.00,
  "fecha": "2024-01-01",
  "tipo_factura": "B",
  "punto_venta": 1,
  "productos": [
    {
      "sku": "001",
      "nombre": "Producto 1",
      "cantidad": 1,
      "precio_unitario": 1000.00,
      "subtotal": 1000.00
    }
  ],
  "empresa_razon_social": "Mi Empresa S.A.",
  "empresa_domicilio": "Calle 123, Ciudad",
  "empresa_condicion_iva": "Responsable Inscripto",
  "email_cliente": "cliente@email.com",
  "nombre_cliente": "Juan Pérez"
}
```

### Manejo del Email del Cliente

#### **Clientes Habituales:**
- Los datos del cliente se pueden cargar previamente en la base de datos
- El email se autocompleta desde los datos del cliente
- Se puede editar manualmente si es necesario

#### **Clientes Casuales:**
- Se ingresa el email manualmente en el formulario
- El campo es opcional pero recomendado para envío automático
- Si no se proporciona email, la factura se genera pero no se envía por email

#### **Validación:**
- El email se valida en el frontend antes del envío
- Si el email es inválido, se muestra una advertencia
- El workflow de n8n verifica que el email sea válido antes del envío

### Respuesta de Éxito
```json
{
  "success": true,
  "message": "Factura emitida exitosamente",
  "factura_id": "uuid-de-la-factura",
  "numero_comprobante": "0001-00000001",
  "cae": "12345678901234",
  "fecha_vencimiento_cae": "20241231",
  "total": 1210.00,
  "qr_code": "https://www.afip.gob.ar/fe/qr/?p=...",
  "pdf_url": "https://app.afipsdk.com/api/v1/pdfs/...",
  "google_drive_url": "https://drive.google.com/file/d/...",
  "google_drive_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "email_sent": true,
  "email_cliente": "cliente@email.com",
  "estado": "emitida",
  "empresa_razon_social": "Mi Empresa S.A.",
  "fecha_emision": "2024-01-01",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": "Descripción del error",
  "factura_id": "uuid-de-la-factura",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔐 Configuración de Certificados AFIP

### ⚠️ Importante: Los certificados se crean MANUALMENTE

Los certificados AFIP **NO se crean vía n8n**. Cada usuario debe crear su certificado manualmente siguiendo estos pasos:

### 1. Crear Certificado (Una sola vez)

Usa la librería AFIP SDK en tu entorno local:

```javascript
// Ejemplo con Node.js
const Afip = require('afip.js');

const afip = new Afip({ 
    CUIT: 20123456789,
    production: false // true para producción
});

// Crear certificado (¡Paciencia! Esto toma unos cuantos segundos)
const res = await afip.CreateCert(
    '20123456789', // username (generalmente el mismo CUIT)
    'tu_password_arca', // password de ARCA
    'contapyme_cert' // alias para el certificado
);

console.log('Certificado:', res.cert);
console.log('Key:', res.key);

// ⚠️ IMPORTANTE: Guarda el cert y key, la librería no los guarda automáticamente
```

### 2. Autorizar Web Service (Una sola vez)

```javascript
// Autorizar web service de facturación
const auth = await afip.createWSAuth(
    '20123456789', // username
    'tu_password_arca', // password
    'contapyme_cert', // alias del certificado
    'wsfe' // web service de facturación electrónica
);

console.log('Autorización:', auth);
```

### 3. Obtener Token y Sign

Una vez configurado el certificado, obtén el token y sign:

```javascript
// Obtener token y sign para usar en ContaPYME
const ta = await afip.ElectronicBilling.getTokenAuthorization();

console.log('Token:', ta.token);
console.log('Sign:', ta.sign);
```

### 4. Configurar en ContaPYME

Agrega estos valores a tu `.env.local`:

```bash
VITE_AFIP_TOKEN=tu_token_obtenido
VITE_AFIP_SIGN=tu_sign_obtenido
VITE_AFIP_CUIT=20123456789
```

## ⚙️ Configuración de Variables de Entorno

### Para Desarrollo (Testing)
```bash
# En .env.local de ContaPYME
VITE_AFIP_TOKEN=tu_token_testing
VITE_AFIP_SIGN=tu_sign_testing
VITE_AFIP_CUIT=20123456789
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_supabase
VITE_N8N_WEBHOOK_URL=https://tu-instancia-n8n.com
```

### Para Producción
```bash
# En .env.local de ContaPYME
VITE_AFIP_TOKEN=tu_token_produccion
VITE_AFIP_SIGN=tu_sign_produccion
VITE_AFIP_CUIT=20123456789
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_supabase
VITE_N8N_WEBHOOK_URL=https://tu-instancia-n8n.com
```

## 📝 Ejemplos de Uso

### Emitir Factura
```bash
curl -X POST https://tu-instancia-n8n.com/webhook/emitir-factura \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: tu_api_key" \
  -d '{
    "factura_id": "123e4567-e89b-12d3-a456-426614174000",
    "cuit_cliente": "20-12345678-9",
    "total": 1210.00,
    "subtotal": 1000.00,
    "iva": 210.00,
    "tipo_factura": "B",
    "punto_venta": 1,
    "productos": [
      {
        "sku": "001",
        "nombre": "Producto 1",
        "cantidad": 1,
        "precio_unitario": 1000.00,
        "subtotal": 1000.00
      }
    ],
    "empresa_razon_social": "Mi Empresa S.A.",
    "empresa_domicilio": "Calle 123, Ciudad",
    "empresa_condicion_iva": "Responsable Inscripto",
    "email_cliente": "cliente@email.com",
    "nombre_cliente": "Juan Pérez"
  }'
```

## 🔧 Solución de Problemas

### Error: "Certificado no encontrado"
- Verificar que el certificado existe con el alias especificado
- Crear el certificado manualmente usando AFIP SDK
- Verificar que el token y sign estén actualizados

### Error: "Web service no autorizado"
- Verificar que el web service esté autorizado para el certificado
- Autorizar el web service manualmente usando AFIP SDK

### Error: "Token expirado"
- Los tokens de AFIP expiran cada 12 horas
- El workflow maneja automáticamente la renovación

### Error: "CUIT inválido"
- Verificar que el CUIT tenga formato XX-XXXXXXXX-X
- Verificar que el CUIT esté activo en AFIP

### Error: "Email no enviado"
- Verificar configuración de Gmail en n8n
- Verificar que el email del cliente sea válido
- Verificar credenciales de Gmail (OAuth2 o App Password)
- Verificar que el campo `email_cliente` esté presente en los datos

### Error: "PDF no subido a Google Drive"
- Verificar configuración de Google Drive en n8n
- Verificar credenciales de Google Drive (OAuth2)
- Verificar que la carpeta de destino exista y tenga permisos
- Verificar la variable `GOOGLE_DRIVE_FOLDER_ID`

### Error: "Respuesta incompleta del webhook"
- Verificar que todos los campos requeridos estén en la respuesta
- ContaPYME necesita `success`, `message`, `factura_id`, `cae`, etc.
- Verificar que `google_drive_url` esté presente en la respuesta

## 📚 Recursos Adicionales

- [Documentación AFIP SDK](https://docs.afipsdk.com/)
- [Especificaciones QR AFIP](https://www.afip.gob.ar/fe/qr/documentos/QRespecificaciones.pdf)
- [Web Services AFIP](https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp)
- [Crear Certificados AFIP](https://docs.afipsdk.com/recursos/otros-metodos-utiles#crear-certificado)
- [Configurar Gmail en n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-base.gmail/)
- [Configurar Google Drive en n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-base.googleDrive/)

## 🔄 Actualizaciones

### Versión 5.0 (Actual)
- ✅ Integración completa con AFIP SDK
- ✅ Generación de QR según especificaciones oficiales
- ✅ PDF profesional con estilos oficiales
- ✅ Envío automático de email con Gmail (OAuth2)
- ✅ Almacenamiento automático en Google Drive
- ✅ Captura de email del cliente en el frontend
- ✅ Respuesta completa al frontend con enlaces de Google Drive
- ✅ Arquitectura multi-tenant
- ✅ Certificados creados manualmente (proceso correcto)
- ✅ Flujo de datos completo: ContaPYME → n8n → AFIP → Supabase → Gmail → Google Drive → ContaPYME

### Versión 3.0 (Anterior)
- ❌ HTTP Request para email (complejo)
- ❌ Respuesta incompleta al frontend

### Versión 2.0 (Anterior)
- ❌ Workflows innecesarios para certificados
- ❌ Sin envío de email
- ❌ Respuesta incompleta al frontend

### Versión 1.0 (Inicial)
- ❌ SOAP directo a AFIP
- ❌ Sin generación de QR
- ❌ PDF básico 