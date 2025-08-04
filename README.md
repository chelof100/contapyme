# ContaPYME - Sistema de Contabilidad para Pymes

Sistema completo de contabilidad para pequeñas y medianas empresas argentinas, desarrollado con React, TypeScript y Supabase.

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

## 📦 Instalación

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/chelof100/contapyme.git
cd contapyme
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno**
```bash
cp config/env.example .env.local
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

### **4. Configurar Supabase (OBLIGATORIO)**

#### **4.1. Crear Proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia la **Project URL** y **anon public key**

#### **4.2. Ejecutar Migraciones de Base de Datos**
En tu proyecto Supabase, ve a **SQL Editor** y ejecuta las siguientes migraciones en orden:

**Migración 1 - Esquema Base Consolidado:**
```sql
-- Ejecutar: supabase/migrations/20250101000000_initial_schema.sql
-- Contiene: Todas las tablas principales, funciones y políticas de seguridad
```

**Migración 2 - Analytics Inteligente:**
```sql
-- Ejecutar: supabase/migrations/20250101000001_user_analytics.sql
-- Contiene: Sistema de tracking de acciones y preferencias de usuario
```

**Migración 3 - Logs de Workflows:**
```sql
-- Ejecutar: supabase/migrations/20250101000002_workflow_logs.sql
-- Contiene: Sistema de logs y métricas para workflows n8n
```

**Migración 4 - Integración de Productos:**
```sql
-- Ejecutar: supabase/migrations/20250101000003_factura_productos.sql
-- Contiene: Integración de productos en facturas y control de stock
```

**Migración 5 - Autenticación de Usuarios:**
```sql
-- Ejecutar: supabase/migrations/20250101000004_users_auth.sql
-- Contiene: Sistema de autenticación y gestión de usuarios
```

**Migración 6 - Tablas CRM:**
```sql
-- Ejecutar: supabase/migrations/20250101000005_crm_tables.sql
-- Contiene: Tablas de CRM y gestión de clientes
```

**Migración 7 - Tablas ERP:**
```sql
-- Ejecutar: supabase/migrations/20250101000006_erp_tables.sql
-- Contiene: Tablas de ERP y gestión empresarial
```

**Migración 8 - Sistema de Configuraciones:**
```sql
-- Ejecutar: supabase/migrations/20250101000007_configuration_system.sql
-- Contiene: Sistema de configuraciones y monitoreo
```
```

**Migración 7 - Analytics de Usuario:**
```sql
-- Ejecutar: supabase/migrations/20250101000000_user_analytics.sql
-- Contiene: Sistema de tracking de uso y recomendaciones inteligentes
```

**Migración 8 - Logs de Workflows:**
```sql
-- Ejecutar: supabase/migrations/20250101000001_workflow_logs.sql
-- Contiene: Sistema de logs y métricas para workflows de n8n
```

#### **4.3. Tablas Requeridas**
La aplicación necesita las siguientes tablas (se crean automáticamente con las migraciones):

**Tablas Principales:**
- `empresas` - Información de la empresa
- `profiles` - Perfiles de usuarios
- `facturas_emitidas` - Facturas emitidas
- `facturas_recibidas` - Facturas recibidas
- `ordenes_compra` - Órdenes de compra
- `ordenes_recepcion` - Recepciones
- `pagos` - Registro de pagos
- `productos` - Catálogo de productos
- `movimientos_stock` - Historial de stock
- `alertas_stock` - Alertas de inventario

**Tablas CRM:**
- `clientes` - Gestión de clientes
- `oportunidades` - Pipeline de ventas
- `actividades` - Actividades comerciales
- `campanas` - Campañas de marketing

**Tablas ERP:**
- `empleados` - Gestión de personal
- `proyectos` - Gestión de proyectos
- `finanzas` - Información financiera

**Tablas de Configuración:**
- `configuraciones` - Configuraciones del sistema
- `logs_conectividad` - Logs de conectividad
- `backups_configuracion` - Backups de configuración

**Tablas de Analytics:**
- `user_actions` - Tracking de acciones del usuario
- `user_preferences` - Preferencias y patrones de uso

**Tablas de Workflows:**
- `workflow_logs` - Logs de ejecución de workflows n8n
- `workflow_metrics` - Métricas agregadas de workflows

#### **4.4. Configurar Autenticación**
1. En Supabase, ve a **Authentication → Settings**
2. Habilita **Email auth**
3. Configura **Site URL** con tu dominio
4. Opcional: Configura **SMTP** para emails

### **5. Configurar n8n (OPCIONAL)**

n8n se usa para automatizaciones avanzadas. Las siguientes funciones están conectadas:

#### **5.1. Funciones Conectadas a n8n:**

**Facturación:**
- `emitirFactura()` - Emisión automática de facturas
- `recibirFactura()` - Procesamiento de facturas recibidas

**Compras:**
- `crearOrdenCompra()` - Creación automática de órdenes
- `registrarPago()` - Registro automático de pagos

**Stock:**
- `registrarMovimientoStock()` - Actualización automática de stock
- `enviarAlertaStock()` - Alertas automáticas de stock bajo

**Recetas (Restaurantes):**
- `crearReceta()` - Gestión de recetas
- `venderReceta()` - Ventas de productos con recetas

#### **5.2. Configurar n8n:**
1. **Instalar n8n** (local o cloud)
2. **Crear workflows** para cada función
3. **Configurar webhooks** en n8n
4. **Agregar credenciales** en `.env.local`

#### **5.3. Workflows Disponibles:**
```bash
# Workflows Implementados:
/webhook/emitir-factura          # ✅ COMPLETADO - Emisión de facturas con AFIP SDK
/webhook/actualizar-stock        # ✅ COMPLETADO - Actualización automática de inventario
/webhook/registrar-pago          # ✅ COMPLETADO - Procesamiento de pagos

# Workflows Pendientes:
/webhook/alerta-stock            # ⚠️ PENDIENTE - Notificaciones de stock bajo
/webhook/validar-cuit            # 🔍 PENDIENTE - Validación independiente de CUIT
```

**📋 Documentación Completa:**
- [Workflow: Emitir Facturas](./docs/WORKFLOW_EMITIR_FACTURAS.md)
- [Workflow: Actualizar Stock](./docs/WORKFLOW_ACTUALIZAR_STOCK.md)
- [Workflow: Registro de Pagos](./docs/WORKFLOW_REGISTRAR_PAGO.md)
- [Workflows Pendientes](./docs/WORKFLOWS_PENDIENTES.md)
- [Configuración de n8n](./docs/N8N_WORKFLOWS.md)

### **6. Ejecutar en Desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/`

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de UI base
│   ├── facturas/       # Componentes específicos de facturas
│   └── monitoring/     # Componentes de monitoreo
├── pages/              # Páginas de la aplicación
│   ├── admin/          # Páginas de administración
│   ├── crm/            # Páginas del CRM
│   └── erp/            # Páginas del ERP
├── hooks/              # Custom hooks
├── contexts/           # Contextos de React
├── services/           # Servicios y APIs
├── types/              # Definiciones de TypeScript
├── utils/              # Utilidades
└── integrations/       # Integraciones externas
    └── supabase/       # Configuración de Supabase
```

## 🚀 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Linting del código
- `npm run type-check` - Verificación de tipos

## 📊 Funcionalidades Principales

### **Gestión de Facturas**
- Creación de facturas A, B y C electrónicas
- Integración completa con AFIP SDK
- Generación de QR oficial y PDF profesional
- Envío automático por email con Gmail
- Almacenamiento automático en Google Drive
- Validación de CUIT en tiempo real
- Historial completo de facturas

### **Control de Stock**
- Inventario en tiempo real
- Alertas de stock bajo
- Movimientos de entrada/salida
- Reportes de inventario

### **CRM Integrado**
- Gestión de clientes
- Historial de compras
- Segmentación de clientes
- Campañas de marketing

### **Dashboard Interactivo**
- Métricas en tiempo real con analytics inteligente
- Gráficos y reportes personalizados
- Monitoreo del sistema con logs detallados
- Alertas automáticas y notificaciones
- Acciones rápidas basadas en uso real

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

### **Configuración de Supabase**
```sql
-- Verificar que las políticas RLS estén activas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar funciones
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### **Configuración de n8n**
```javascript
// Ejemplo de webhook en n8n
{
  "webhook": {
    "path": "/emitir-factura",
    "method": "POST",
    "authentication": "headerAuth",
    "headerName": "X-N8N-API-KEY",
    "headerValue": "tu-api-key"
  }
}
```

## 🚀 Despliegue

### **GitHub Pages (Automático)**
El proyecto se despliega automáticamente en:
https://chelof100.github.io/contapyme/

### **Despliegue Manual**
```bash
npm run build
# Subir contenido de /dist a tu servidor
```

### **Despliegue en Vercel/Netlify**
1. Conecta tu repositorio
2. Configura las variables de entorno
3. Deploy automático

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request en [https://github.com/chelof100/contapyme](https://github.com/chelof100/contapyme)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

- 📧 **Email:** soporte@contapyme.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/chelof100/contapyme/issues)
- 📖 **Documentación:** [docs/](docs/)
- 🔧 **Workflows n8n:** [docs/N8N_WORKFLOWS.md](docs/N8N_WORKFLOWS.md)

## 🎯 Roadmap

### **✅ Completado (Fase 1)**
- [x] Sistema de facturación electrónica con AFIP SDK
- [x] Integración con Google Drive y Gmail
- [x] Analytics inteligente y dashboard personalizado
- [x] Arquitectura multi-tenant
- [x] Base de datos consolidada y optimizada
- [x] Documentación completa del sistema

### **🔄 En Desarrollo (Fase 2)**
- [ ] Workflow de actualización automática de stock
- [ ] Workflow de registro de pagos
- [ ] Workflow de alertas de stock
- [ ] Validación independiente de CUIT

### **📋 Planificado (Fase 3)**
- [ ] Integración con Mercado Pago
- [ ] App móvil nativa
- [ ] Reportes avanzados
- [ ] Integración con contadores
- [ ] API pública
- [ ] Funcionalidades adicionales de ERP

## 🔍 Solución de Problemas

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

### **Error: "SelectItem must have a value prop"**
- Ya resuelto en versiones recientes
- Verificar que estés usando la última versión

---

**ContaPYME** - Simplificando la contabilidad para Pymes argentinas 🚀