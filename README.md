# ContaPYME - Sistema de Contabilidad para Pymes

Sistema completo de contabilidad para pequeñas y medianas empresas argentinas, desarrollado con React, TypeScript y Supabase.

## 🏗️ Arquitectura

### **Entornos Separados:**
- **Local/Producción** (`src/`): Supabase real para implementación en clientes
- **Demo** (`demo/`): Supabase mock para presentaciones en GitHub Pages

### **URLs:**
- **Local**: `http://localhost:5173/`
- **Demo**: `https://chelof100.github.io/contapyme/`

## 🚀 Características

- **Gestión de Facturas:** Creación, edición y seguimiento de facturas electrónicas
- **Integración AFIP SDK:** Facturación electrónica con QR oficial y PDF profesional
- **Control de Stock:** Inventario en tiempo real con alertas automáticas
- **Gestión de Clientes:** CRM integrado con validación de CUIT
- **Reportes Financieros:** Análisis y métricas en tiempo real
- **Dashboard Interactivo:** Monitoreo con analytics inteligente
- **Automatizaciones n8n:** Workflows automáticos para procesos de negocio
- **Analytics Inteligente:** Acciones rápidas personalizadas basadas en uso real
- **Multi-tenant:** Arquitectura para múltiples empresas
- **Almacenamiento Cloud:** Integración con Google Drive para PDFs
- **Notificaciones:** Envío automático de facturas por email

## 🛠️ Tecnologías

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, Radix UI, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Automatización:** n8n (opcional)
- **Deployment:** GitHub Pages
- **CI/CD:** GitHub Actions

## 📦 Instalación Rápida

### **Opción 1: Setup Automatizado (Recomendado)**
```bash
git clone https://github.com/chelof100/contapyme.git
cd contapyme
npm run setup
```

### **Opción 2: Instalación Manual**

#### **1. Clonar el Repositorio**
```bash
git clone https://github.com/chelof100/contapyme.git
cd contapyme
```

#### **2. Instalar Dependencias**
```bash
npm install
```

#### **3. Configurar Variables de Entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
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

#### **4. Verificar Configuración**
```bash
npm run verify
```

#### **5. Iniciar Desarrollo**
```bash
npm run dev
```

## 🗄️ Configuración de Supabase

### **1. Crear Proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia la **Project URL** y **anon public key**

### **2. Ejecutar Migraciones**
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

## 🔧 Scripts Disponibles

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

## 📚 Documentación

- **[Guía de Implementación](docs/GUIA_IMPLEMENTACION.md)** - Guía completa para implementar en clientes
- **[Workflows n8n](docs/N8N_WORKFLOWS.md)** - Documentación de automatizaciones
- **[Migración de Base de Datos](docs/MIGRATION.md)** - Guía de migración
- **[Análisis Completo](docs/ANALISIS_COMPLETO_PROYECTO.md)** - Análisis técnico
- **[Testing](docs/TESTING_SUITE.md)** - Suite de testing

## 🚀 Workflows Implementados

### **✅ Completados:**
1. **Emitir Factura** - Facturación electrónica con AFIP
2. **Actualizar Stock** - Control automático de inventario
3. **Registrar Pago** - Procesamiento automático de pagos
4. **Alertas de Stock** - Notificaciones de stock bajo

### **📋 Documentación:**
- [Workflow Emitir Facturas](docs/WORKFLOW_EMITIR_FACTURAS.md)
- [Workflow Actualizar Stock](docs/WORKFLOW_ACTUALIZAR_STOCK.md)
- [Workflow Registrar Pago](docs/WORKFLOW_REGISTRAR_PAGO.md)
- [Workflow Alertas de Stock](docs/WORKFLOW_ALERTAS_STOCK.md)

## 🎯 Implementación en Clientes

### **Para Implementar en Otros Ordenadores:**

1. **Clonar repositorio**
2. **Ejecutar setup automatizado**: `npm run setup`
3. **Configurar variables de entorno**
4. **Verificar configuración**: `npm run verify`
5. **¡Listo para usar!**

### **Ventajas de la Nueva Arquitectura:**
- ✅ **Separación completa** entre local y demo
- ✅ **Setup automatizado** para implementación rápida
- ✅ **Configuración centralizada** y validada
- ✅ **Rollback seguro** en caso de problemas
- ✅ **Documentación completa** para implementación

## 🚨 Solución de Problemas

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

### **Error: "Build failed"**
```bash
# Solución: Limpiar cache y reinstalar
npm run clean
npm install
npm run build
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- **Guía de Implementación:** [docs/GUIA_IMPLEMENTACION.md](docs/GUIA_IMPLEMENTACION.md)
- **Issues:** [GitHub Issues](https://github.com/chelof100/contapyme/issues)
- **Documentación:** [docs/](docs/)
- **Demo:** [GitHub Pages](https://chelof100.github.io/contapyme/)

---

**ContaPYME** - Sistema de Contabilidad para Pymes Argentinas