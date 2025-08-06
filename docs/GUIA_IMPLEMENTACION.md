# 🚀 Guía de Implementación - ContaPYME

## **Descripción General**

Esta guía te ayudará a implementar ContaPYME en el ordenador de tu cliente de manera rápida y sin complicaciones.

## **📋 Requisitos Previos**

### **Software Necesario:**
- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Navegador moderno** (Chrome, Firefox, Edge)

### **Cuentas Necesarias:**
- **Supabase** - [Crear cuenta](https://supabase.com/)
- **n8n** (opcional) - [Crear cuenta](https://n8n.io/)

## **🛠️ Implementación Paso a Paso**

### **Paso 1: Clonar el Repositorio**
```bash
git clone https://github.com/chelof100/contapyme.git
cd contapyme
```

### **Paso 2: Setup Automatizado**
```bash
npm run setup
```

**¿Qué hace este comando?**
- ✅ Verifica Node.js y npm
- ✅ Instala todas las dependencias
- ✅ Crea archivos de configuración
- ✅ Valida la configuración
- ✅ Prepara el entorno

### **Paso 3: Configurar Supabase**

#### **3.1. Crear Proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Anota la **Project URL** y **anon public key**

#### **3.2. Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar con las credenciales del cliente
notepad .env.local
```

**Contenido de `.env.local`:**
```env
# Supabase Configuration (OBLIGATORIO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# n8n Configuration (OPCIONAL)
VITE_N8N_BASE_URL=https://tu-instancia-n8n.com
VITE_N8N_API_KEY=tu_api_key_de_n8n

# App Configuration
VITE_APP_NAME=ContaPYME
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

### **Paso 4: Configurar Base de Datos**

#### **4.1. Ejecutar Migraciones**
En tu proyecto Supabase, ve a **SQL Editor** y ejecuta las migraciones en orden:

```sql
-- Migración 1: Esquema Base
-- Ejecutar: supabase/migrations/20250101000000_initial_schema.sql

-- Migración 2: Analytics
-- Ejecutar: supabase/migrations/20250101000001_user_analytics.sql

-- Migración 3: Logs de Workflows
-- Ejecutar: supabase/migrations/20250101000002_workflow_logs.sql

-- Migración 4: Integración de Productos
-- Ejecutar: supabase/migrations/20250101000003_factura_productos.sql

-- Migración 5: Autenticación
-- Ejecutar: supabase/migrations/20250101000004_users_auth.sql

-- Migración 6: CRM
-- Ejecutar: supabase/migrations/20250101000005_crm_tables.sql

-- Migración 7: ERP
-- Ejecutar: supabase/migrations/20250101000006_erp_tables.sql

-- Migración 8: Configuración
-- Ejecutar: supabase/migrations/20250101000007_configuration_system.sql
```

### **Paso 5: Verificar Configuración**
```bash
npm run verify
```

**¿Qué verifica?**
- ✅ Node.js y npm
- ✅ Dependencias instaladas
- ✅ Variables de entorno
- ✅ Configuración de Supabase
- ✅ Configuración de n8n

### **Paso 6: Iniciar la Aplicación**
```bash
npm run dev
```

**URL de acceso:** `http://localhost:5173/`

## **🔧 Configuración de n8n (Opcional)**

### **Para Automatizaciones Avanzadas:**

#### **1. Crear Instancia n8n**
1. Ve a [n8n.io](https://n8n.io)
2. Crea una cuenta gratuita
3. Obtén tu API key

#### **2. Importar Workflows**
1. En n8n, ve a **Workflows**
2. Importa los archivos de `n8n-workflows/`:
   - `emitir-factura.json`
   - `actualizar-stock.json`
   - `registrar-pago.json`
   - `alerta-stock.json`

#### **3. Configurar Webhooks**
1. Copia las URLs de webhook de cada workflow
2. Configúralas en `.env.local`

## **📊 Scripts Disponibles**

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Previsualizar build

# Testing
npm run test         # Ejecutar tests
npm run test:ui      # Interfaz visual de tests
npm run test:coverage # Cobertura de tests

# Utilidades
npm run setup        # Setup automatizado
npm run verify       # Verificar configuración
npm run clean        # Limpiar cache
npm run lint         # Linting
npm run type-check   # Verificación de tipos
```

## **🚨 Solución de Problemas**

### **Error: "VITE_SUPABASE_URL is required"**
```bash
# Solución: Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales correctas
```

### **Error: "Cannot find module"**
```bash
# Solución: Reinstalar dependencias
npm install
```

### **Error: "Database connection failed"**
```bash
# Solución: Verificar credenciales de Supabase
npm run verify
```

### **Error: "Build failed"**
```bash
# Solución: Limpiar cache y reinstalar
npm run clean
npm install
npm run build
```

## **📱 Configuración de Usuarios**

### **Crear Usuario Administrador:**
1. Accede a la aplicación
2. Ve a **Registro**
3. Crea el primer usuario (será administrador)
4. Configura la empresa

### **Configurar Empresa:**
1. Ve a **Configuración**
2. Completa los datos de la empresa
3. Configura CUIT y datos fiscales
4. Configura punto de venta AFIP

## **🔒 Seguridad**

### **Recomendaciones:**
- ✅ Usar contraseñas fuertes
- ✅ Configurar autenticación de dos factores
- ✅ Mantener actualizado Node.js
- ✅ Usar HTTPS en producción
- ✅ Hacer backups regulares de la base de datos

### **Variables Sensibles:**
- Nunca compartir `.env.local`
- Mantener credenciales seguras
- Usar variables de entorno en producción

## **📞 Soporte**

### **En Caso de Problemas:**
1. **Verificar configuración:** `npm run verify`
2. **Revisar logs:** Consola del navegador
3. **Documentación:** [docs/](docs/)
4. **Issues:** [GitHub Issues](https://github.com/chelof100/contapyme/issues)

### **Contacto:**
- **Email:** soporte@contapyme.com
- **WhatsApp:** +54 9 11 1234-5678
- **Horario:** Lunes a Viernes 9:00-18:00

## **✅ Checklist de Implementación**

- [ ] Node.js 18+ instalado
- [ ] Repositorio clonado
- [ ] Setup automatizado ejecutado
- [ ] Supabase configurado
- [ ] Migraciones ejecutadas
- [ ] Variables de entorno configuradas
- [ ] Verificación exitosa
- [ ] Aplicación funcionando
- [ ] Usuario administrador creado
- [ ] Empresa configurada
- [ ] n8n configurado (opcional)
- [ ] Testing realizado

## **🎉 ¡Implementación Completada!**

Una vez completado el checklist, ContaPYME estará listo para usar en el ordenador del cliente.

**¡Felicitaciones! Has implementado ContaPYME exitosamente.** 