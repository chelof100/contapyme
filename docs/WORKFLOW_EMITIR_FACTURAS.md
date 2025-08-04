# Workflow: Emitir Facturas - Documentación Completa

## 📋 Resumen Ejecutivo

Este documento describe el workflow completo de emisión de facturas electrónicas en ContaPYME, que integra AFIP SDK, Google Drive, Gmail y Supabase para crear un flujo automatizado y profesional.

## 🏗️ Arquitectura del Workflow

### **Componentes Principales**
- **Frontend (ContaPYME)**: Formulario de facturación con captura de email del cliente
- **n8n**: Orquestador central del workflow
- **AFIP SDK**: Generación de facturas electrónicas con QR oficial
- **Google Drive**: Almacenamiento automático de PDFs
- **Gmail**: Envío automático de facturas por email
- **Supabase**: Base de datos y almacenamiento de metadatos

### **Flujo de Datos**
```
ContaPYME → n8n → AFIP → Supabase → Gmail → Google Drive → ContaPYME
```

## 🔧 Configuración Requerida

### **1. Variables de Entorno en n8n**
```bash
# Configuración de Gmail
GMAIL_FROM=facturacion@tuempresa.com

# Configuración de Google Drive
GOOGLE_DRIVE_FOLDER_ID=tu_folder_id_de_google_drive

# Configuración de AFIP SDK (viene del frontend)
# No se configuran aquí - vienen en el payload del webhook
```

### **2. Credenciales Necesarias en n8n**
- **Gmail**: OAuth2 o App Password
- **Google Drive**: OAuth2
- **AFIP SDK**: Credenciales del usuario (vienen del frontend)

### **3. Variables de Entorno en ContaPYME (.env.local)**
```bash
# Credenciales AFIP del usuario
VITE_AFIP_TOKEN=tu_token_afip
VITE_AFIP_SIGN=tu_sign_afip
VITE_AFIP_CUIT=20123456789

# Credenciales Supabase del usuario
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Configuración n8n
VITE_N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/emitir-factura
```

## 📊 Estructura de Datos

### **Datos de Entrada (ContaPYME → n8n)**
```json
{
  "factura_id": "uuid-de-la-factura",
  "empresa_id": "uuid-de-la-empresa",
  "numero_factura": "0001-00000001",
  "punto_venta": "0001",
  "tipo_comprobante": "Factura A",
  "cuit_cliente": "20304050607",
  "cliente_nombre": "Juan Pérez",
  "email_cliente": "cliente@email.com",
  "fecha_emision": "2024-01-01",
  "subtotal": 1000.00,
  "porcentaje_iva": 21.00,
  "monto_iva": 210.00,
  "total": 1210.00,
  "descripcion": "Servicios de consultoría",
  "condicion_iva": "Responsable Inscripto",
  "empresa_razon_social": "Mi Empresa S.A.",
  "empresa_domicilio": "Calle 123, Ciudad",
  "empresa_condicion_iva": "Responsable Inscripto",
  "afip_token": "token_del_usuario",
  "afip_sign": "sign_del_usuario",
  "afip_cuit": "20123456789",
  "supabase_url": "url_del_usuario",
  "supabase_anon_key": "key_del_usuario"
}
```

### **Datos de Salida (n8n → ContaPYME)**
```json
{
  "success": true,
  "message": "Factura emitida exitosamente",
  "factura_id": "uuid-de-la-factura",
  "numero_comprobante": "0001-00000001",
  "cae": "12345678901234",
  "fecha_vencimiento_cae": "2024-02-01",
  "total": 1210.00,
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "pdf_url": "https://api.afipsdk.com/pdf/...",
  "google_drive_url": "https://drive.google.com/file/d/...",
  "google_drive_id": "1ABC123DEF456...",
  "email_sent": true,
  "email_cliente": "cliente@email.com",
  "estado": "emitida",
  "empresa_razon_social": "Mi Empresa S.A.",
  "fecha_emision": "2024-01-01",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔄 Proceso Detallado

### **Paso 1: Validación de Datos**
- Verificación de campos obligatorios
- Validación de formato de CUIT
- Verificación de credenciales AFIP

### **Paso 2: Autenticación AFIP**
- Validación de token y sign
- Verificación de certificado activo
- Comprobación de autorizaciones

### **Paso 3: Obtención de Autorización**
- Solicitud de CAE a AFIP
- Validación de numeración
- Generación de voucher electrónico

### **Paso 4: Generación de QR**
- Creación de QR según especificaciones AFIP
- Inclusión de datos fiscales
- Validación de formato oficial

### **Paso 5: Actualización en Supabase**
- Guardado de CAE y datos de autorización
- Actualización de estado de factura
- Registro de metadatos

### **Paso 6: Generación de PDF**
- Creación de PDF profesional
- Inclusión de QR y datos oficiales
- Aplicación de estilos corporativos

### **Paso 7: Envío por Email (Opcional)**
- Verificación de email del cliente
- Envío automático con PDF adjunto
- Registro de envío

### **Paso 8: Almacenamiento en Google Drive**
- Subida automática del PDF
- Organización por carpetas
- Generación de enlaces de acceso

### **Paso 9: Respuesta al Frontend**
- Confirmación de éxito
- Envío de enlaces y metadatos
- Actualización de interfaz

## ⚙️ Configuración de Nodos n8n

### **1. Webhook Trigger**
- **Endpoint**: `/emitir-factura`
- **Método**: POST
- **Autenticación**: API Key (opcional)

### **2. Validación de Datos**
- **Tipo**: Code Node
- **Función**: Validación de campos y formatos
- **Salida**: Datos validados o error

### **3. Autenticación AFIP**
- **Tipo**: HTTP Request
- **URL**: `https://api.afipsdk.com/auth`
- **Método**: POST
- **Headers**: Content-Type: application/json

### **4. Obtención de Autorización**
- **Tipo**: HTTP Request
- **URL**: `https://api.afipsdk.com/voucher`
- **Método**: POST
- **Headers**: Authorization: Bearer {token}

### **5. Generación de QR**
- **Tipo**: HTTP Request
- **URL**: `https://api.afipsdk.com/qr`
- **Método**: POST
- **Headers**: Authorization: Bearer {token}

### **6. Actualización Supabase**
- **Tipo**: Supabase Node
- **Operación**: Update
- **Tabla**: facturas_emitidas
- **Condición**: id = {factura_id}

### **7. Generación de PDF**
- **Tipo**: HTTP Request
- **URL**: `https://api.afipsdk.com/pdf`
- **Método**: POST
- **Headers**: Authorization: Bearer {token}

### **8. Envío por Gmail**
- **Tipo**: Gmail Node
- **Operación**: Send Email
- **Autenticación**: OAuth2
- **Adjuntos**: PDF generado

### **9. Almacenamiento Google Drive**
- **Tipo**: Google Drive Node
- **Operación**: Upload
- **Carpeta**: {GOOGLE_DRIVE_FOLDER_ID}
- **Archivo**: PDF con nombre dinámico

### **10. Respuesta de Éxito**
- **Tipo**: Respond to Webhook
- **Formato**: JSON
- **Contenido**: Datos completos de la factura

## 🚨 Manejo de Errores

### **Errores Comunes y Soluciones**

#### **Error: "Token AFIP expirado"**
- **Causa**: Token de AFIP vencido
- **Solución**: Usuario debe renovar credenciales AFIP
- **Acción**: Retornar error específico al frontend

#### **Error: "CUIT inválido"**
- **Causa**: Formato incorrecto de CUIT
- **Solución**: Validar formato XX-XXXXXXXX-X
- **Acción**: Rechazar solicitud con mensaje claro

#### **Error: "Email no enviado"**
- **Causa**: Configuración incorrecta de Gmail
- **Solución**: Verificar credenciales OAuth2
- **Acción**: Continuar sin envío de email

#### **Error: "PDF no subido a Google Drive"**
- **Causa**: Problemas de permisos o configuración
- **Solución**: Verificar credenciales y carpeta
- **Acción**: Continuar sin almacenamiento en Drive

## 📈 Métricas y Monitoreo

### **Métricas Capturadas**
- Tiempo de respuesta total
- Tasa de éxito/fallo
- Tiempo por nodo
- Uso de recursos

### **Logs Generados**
- Ejecución del workflow
- Errores y excepciones
- Datos de entrada/salida
- Timestamps de cada paso

## 🔒 Seguridad

### **Medidas Implementadas**
- Validación de datos de entrada
- Sanitización de parámetros
- Autenticación por empresa
- Logs de auditoría
- Manejo seguro de credenciales

### **Consideraciones de Privacidad**
- Datos sensibles no se almacenan en logs
- Credenciales se pasan temporalmente
- Información fiscal protegida
- Cumplimiento con normativas locales

## 🧪 Testing

### **Casos de Prueba**
1. **Factura válida con email**: Flujo completo
2. **Factura válida sin email**: Sin envío de email
3. **Credenciales inválidas**: Manejo de errores
4. **CUIT inválido**: Validación de formato
5. **Error de red**: Timeout y reintentos

### **Ambiente de Testing**
- **AFIP**: Ambiente de testing (no producción)
- **Gmail**: Cuenta de pruebas
- **Google Drive**: Carpeta de testing
- **Supabase**: Base de datos de desarrollo

## 📚 Recursos Adicionales

### **Documentación Relacionada**
- [Configuración de AFIP SDK](https://docs.afipsdk.com/)
- [Especificaciones QR AFIP](https://www.afip.gob.ar/fe/qr/documentos/QRespecificaciones.pdf)
- [Configuración de Gmail en n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-base.gmail/)
- [Configuración de Google Drive en n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-base.googleDrive/)

### **Archivos del Proyecto**
- `n8n-workflows/emitir-factura.json`: Workflow completo
- `src/components/facturas/FacturaForm.tsx`: Formulario frontend
- `src/services/webhookService.ts`: Servicio de comunicación
- `docs/N8N_WORKFLOWS.md`: Documentación general de n8n

## 🔄 Versiones

### **Versión 5.0 (Actual)**
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

### **Versiones Anteriores**
- **Versión 3.0**: HTTP Request para email (complejo)
- **Versión 2.0**: SOAP directo a AFIP, sin QR
- **Versión 1.0**: Funcionalidad básica

---

**Última actualización**: Enero 2024  
**Responsable**: Equipo de Desarrollo ContaPYME  
**Estado**: ✅ Completado y Documentado 