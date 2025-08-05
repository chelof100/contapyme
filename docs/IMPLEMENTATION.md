# 🚀 Guía de Implementación Local - ContaPYME

Guía completa para implementar ContaPYME en tu empresa con configuración de producción.

## 📋 Prerrequisitos

- **Node.js 18+** instalado
- **Git** instalado
- **Cuenta en Supabase** (gratuita)
- **Instancia de n8n** (opcional, para automatizaciones)

## 🛠️ Paso 1: Instalación

### **1.1 Clonar el Repositorio**
```bash
git clone https://github.com/chelof100/contapyme.git
cd contapyme
```

### **1.2 Instalar Dependencias**
```bash
npm install
```

### **1.3 Configuración Inicial**
```bash
npm run setup:local
```

## 🔧 Paso 2: Configuración de Supabase

### **2.1 Crear Proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Anota la **Project URL** y **anon public key**

### **2.2 Configurar Variables de Entorno**
Edita el archivo `.env.local` creado:

```env
# Supabase Configuration (OBLIGATORIO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# n8n Configuration (OPCIONAL)
VITE_N8N_BASE_URL=https://tu-instancia-n8n.com
VITE_N8N_API_KEY=tu_api_key_de_n8n

# Application Configuration
VITE_APP_NAME=ContaPYME
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

### **2.3 Ejecutar Migraciones de Base de Datos**

En tu proyecto Supabase, ve a **SQL Editor** y ejecuta las siguientes migraciones **en orden**:

#### **Migración 1: Esquema Base**
```sql
-- Ejecutar: supabase/migrations/20250101000000_initial_schema.sql
-- Contiene: Todas las tablas principales, funciones y políticas de seguridad
```

#### **Migración 2: Analytics Inteligente**
```sql
-- Ejecutar: supabase/migrations/20250101000001_user_analytics.sql
-- Contiene: Sistema de tracking de acciones y preferencias de usuario
```

#### **Migración 3: Logs de Workflows**
```sql
-- Ejecutar: supabase/migrations/20250101000002_workflow_logs.sql
-- Contiene: Sistema de logs y métricas para workflows n8n
```

#### **Migración 4: Integración de Productos**
```sql
-- Ejecutar: supabase/migrations/20250101000003_factura_productos.sql
-- Contiene: Integración de productos en facturas y control de stock
```

#### **Migración 5: Autenticación de Usuarios**
```sql
-- Ejecutar: supabase/migrations/20250101000004_users_auth.sql
-- Contiene: Sistema de autenticación y gestión de usuarios
```

### **2.4 Configurar Autenticación**
1. En Supabase, ve a **Authentication → Settings**
2. Habilita **Email auth**
3. Configura **Site URL** con tu dominio
4. Opcional: Configura **SMTP** para emails

## 🤖 Paso 3: Configuración de n8n (Opcional)

### **3.1 Instalar n8n**
```bash
# Opción 1: Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Opción 2: npm
npm install n8n -g
n8n start
```

### **3.2 Importar Workflows**
1. Ve a tu instancia de n8n (http://localhost:5678)
2. Importa los workflows desde `n8n-workflows/`:
   - `emitir-factura.json`
   - `actualizar-stock.json`
   - `registrar-pago.json`
   - `alerta-stock.json`

### **3.3 Configurar Credenciales en n8n**
Para cada workflow, configura:
- **Supabase credentials** (URL y API key)
- **Gmail credentials** (para envío de emails)
- **Google Drive credentials** (para almacenamiento de PDFs)
- **AFIP credentials** (para facturación electrónica)

## 🚀 Paso 4: Ejecutar la Aplicación

### **4.1 Desarrollo**
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173/`

### **4.2 Producción**
```bash
npm run build:local
npm run preview
```

## 👥 Paso 5: Configuración de Usuarios

### **5.1 Crear Usuario Administrador**
1. Ve a la aplicación
2. Regístrate con tu email
3. En Supabase, ve a **Authentication → Users**
4. Cambia el rol del usuario a **admin**

### **5.2 Configurar Empresa**
1. Inicia sesión en la aplicación
2. Ve a **Configuración**
3. Completa los datos de tu empresa:
   - Nombre de la empresa
   - CUIT
   - Dirección
   - Datos de contacto

## 🔒 Paso 6: Configuración de Seguridad

### **6.1 Políticas RLS**
Verificar que las políticas de Row Level Security estén activas:

```sql
-- Verificar políticas RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### **6.2 Configurar Dominio**
1. En Supabase, ve a **Authentication → Settings**
2. Agrega tu dominio a **Site URL**
3. Configura **Redirect URLs** si es necesario

## 📊 Paso 7: Verificación

### **7.1 Tests de Funcionalidad**
```bash
npm run test:local
```

### **7.2 Verificar Conectividad**
1. **Supabase**: Login y creación de datos
2. **n8n**: Ejecutar workflow de prueba
3. **AFIP**: Emitir factura de prueba
4. **Email**: Verificar envío de emails

## 🚀 Paso 8: Despliegue

### **8.1 Opción 1: Vercel**
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático

### **8.2 Opción 2: Netlify**
1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno
3. Deploy automático

### **8.3 Opción 3: Servidor Propio**
```bash
npm run build:local
# Subir contenido de /dist a tu servidor
```

## 🔧 Configuración Avanzada

### **Variables de Entorno Completas**
```env
# Supabase (OBLIGATORIO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima

# n8n (OPCIONAL)
VITE_N8N_BASE_URL=https://tu-instancia-n8n.com
VITE_N8N_API_KEY=tu_api_key

# Aplicación
VITE_APP_NAME=ContaPYME
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# APIs Externas (OPCIONAL)
VITE_MERCADO_PAGO_PUBLIC_KEY=tu_mercado_pago_key
VITE_GOOGLE_DRIVE_CLIENT_ID=tu_google_drive_id
VITE_WHATSAPP_API_TOKEN=tu_whatsapp_token

# Desarrollo
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

## 🐛 Solución de Problemas

### **Error: "Cannot connect to Supabase"**
- Verificar URL y Anon Key en `.env.local`
- Verificar que el proyecto Supabase esté activo
- Verificar políticas RLS en Supabase

### **Error: "Database migration failed"**
- Ejecutar migraciones en orden
- Verificar permisos en Supabase
- Revisar logs de SQL Editor

### **Error: "n8n connection failed"**
- Verificar URL de n8n
- Verificar API Key
- Verificar que los workflows estén activos

### **Error: "AFIP authentication failed"**
- Verificar credenciales de AFIP
- Verificar que el certificado esté vigente
- Verificar configuración en n8n

## 📞 Soporte

- **Documentación:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/chelof100/contapyme/issues)
- **Email:** soporte@contapyme.com

---

**¡ContaPYME está listo para usar en tu empresa!** 🎉 