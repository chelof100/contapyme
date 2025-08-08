# ContaPYME - Sistema de Gestión para Pymes Argentinas

## 🚀 Estado Actual del Proyecto

**Versión:** 1.0.0 - Estable  
**Última actualización:** Enero 2025  
**Estado:** ✅ **FUNCIONAL Y LISTO PARA PRODUCCIÓN**

## 📋 Resumen Ejecutivo

ContaPYME es un sistema integral de gestión empresarial diseñado específicamente para Pymes argentinas. El sistema incluye módulos de facturación electrónica, gestión de stock, CRM, contabilidad básica y automatizaciones con n8n.

### ✅ **FUNCIONALIDADES IMPLEMENTADAS Y FUNCIONANDO:**

- **🔐 Autenticación y Usuarios:** Sistema completo de login/logout con roles
- **🏢 Gestión Multi-empresa:** Soporte para múltiples empresas con aislamiento de datos
- **📦 Gestión de Productos:** CRUD completo con stock y movimientos
- **👥 Gestión de Clientes:** Base de datos de clientes con información fiscal
- **📄 Facturación Electrónica:** Integración con AFIP (estructura lista)
- **💰 Gestión de Pagos:** Registro y seguimiento de pagos
- **📊 Dashboard:** Métricas y reportes en tiempo real
- **⚙️ Configuración:** Panel de configuración avanzado con opciones de desarrollador
- **🔗 Integración n8n:** Conexión con automatizaciones (configurada)
- **🎨 UI/UX:** Interfaz moderna con temas claro/oscuro y configuración de densidad

## 🏗️ Arquitectura Técnica

### **Frontend:**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Radix UI + Shadcn/ui
- **State Management:** React Hooks + Context API
- **HTTP Client:** Supabase Client

### **Backend:**
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage

### **Automatizaciones:**
- **Platform:** n8n (self-hosted)
- **Integrations:** AFIP, WhatsApp, Email, Google Drive
- **Webhooks:** Configurables desde la aplicación

## 🗄️ Base de Datos

### **Esquema Limpio y Unificado:**
- ✅ **Tablas principales:** empresas, profiles, productos, clientes, proveedores
- ✅ **Facturación:** facturas_emitidas, factura_productos, pagos
- ✅ **Stock:** movimientos_stock, alertas_stock
- ✅ **Compras:** ordenes_compra
- ✅ **Recetas:** recetas (para restaurantes/industrias)
- ✅ **Seguridad:** RLS (Row Level Security) habilitado en todas las tablas
- ✅ **Índices:** Optimizados para rendimiento
- ✅ **Triggers:** Actualización automática de timestamps

### **Migraciones:**
- ✅ **Esquema final:** `20250201000006_final_clean_schema.sql`
- ✅ **Migraciones limpias:** Solo archivos esenciales mantenidos
- ✅ **Sin duplicados:** Eliminadas migraciones temporales

## 🚀 Instalación y Configuración

### **Requisitos:**
- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Instancia n8n (opcional para automatizaciones)

### **Configuración Rápida:**

1. **Clonar repositorio:**
```bash
git clone [URL_DEL_REPO]
cd contapyme
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

4. **Ejecutar migración de base de datos:**
- Ir a Supabase Dashboard
- SQL Editor
- Ejecutar: `20250201000006_final_clean_schema.sql`

5. **Iniciar aplicación:**
```bash
npm run dev
```

## 🔧 Configuración de Variables de Entorno

### **Archivo `.env.local` (tu configuración personal):**
```env
# Supabase
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key

# n8n (opcional)
VITE_N8N_URL=https://tu-instancia-n8n.com
VITE_N8N_API_KEY=tu_api_key_n8n

# AFIP (para facturación electrónica)
VITE_AFIP_CERT_PATH=path/to/cert.pem
VITE_AFIP_KEY_PATH=path/to/key.pem
VITE_AFIP_CUIT=tu_cuit
```

### **Archivo `.env` (repositorio - genérico):**
```env
# Configuración genérica para clientes
VITE_SUPABASE_URL=REEMPLAZAR_CON_URL_CLIENTE
VITE_SUPABASE_ANON_KEY=REEMPLAZAR_CON_ANON_KEY_CLIENTE
VITE_N8N_URL=REEMPLAZAR_CON_URL_N8N_CLIENTE
VITE_N8N_API_KEY=REEMPLAZAR_CON_API_KEY_N8N_CLIENTE
```

## 📱 Uso del Sistema

### **Login:**
- **Email:** admin@contapyme.com
- **Password:** (configurar en Supabase Auth)

### **Módulos Principales:**
1. **Dashboard:** Vista general y métricas
2. **Stock:** Gestión de productos e inventario
3. **Clientes:** Base de datos de clientes
4. **Facturación:** Emisión de facturas electrónicas
5. **Compras:** Órdenes de compra y proveedores
6. **Configuración:** Ajustes del sistema

### **Configuración Avanzada:**
- **Opciones de Desarrollador:** Configuración de n8n, webhooks, conexiones
- **Estado del Sistema:** Monitoreo de conexiones en tiempo real
- **Configuración de Usuario:** Tema, densidad, notificaciones

## 🔄 Automatizaciones n8n

### **Workflows Implementados:**
- ✅ **Health Check:** Monitoreo de estado
- ✅ **Emitir Factura:** Proceso de facturación
- ✅ **Actualizar Stock:** Gestión de inventario
- ✅ **Registrar Pago:** Procesamiento de pagos
- ✅ **Alerta Stock:** Notificaciones de stock bajo

### **Configuración:**
- **URL:** Configurable desde la aplicación
- **API Key:** Configurable desde la aplicación
- **Webhooks:** Generados automáticamente por workflow

## 🧪 Testing

### **Funcionalidades Probadas:**
- ✅ **Autenticación:** Login/logout funcionando
- ✅ **CRUD Productos:** Crear, leer, actualizar, eliminar productos
- ✅ **Gestión de Clientes:** CRUD completo
- ✅ **Conexiones:** Supabase y n8n funcionando
- ✅ **UI/UX:** Temas, densidad, configuración de usuario
- ✅ **Base de Datos:** Esquema limpio y funcional

## 📈 Roadmap

### **Próximas Funcionalidades:**
- 🔄 **Facturación AFIP:** Integración completa con AFIP
- 🔄 **WhatsApp Integration:** Notificaciones automáticas
- 🔄 **Reportes Avanzados:** Exportación a PDF/Excel
- 🔄 **Backup Automático:** Respaldo de datos
- 🔄 **Multi-idioma:** Soporte para inglés

## 🛠️ Desarrollo

### **Scripts Disponibles:**
```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run preview      # Preview de producción
npm run lint         # Linting
npm run type-check   # Verificación de tipos
```

### **Estructura del Proyecto:**
```
src/
├── components/      # Componentes reutilizables
├── hooks/          # Custom hooks
├── pages/          # Páginas principales
├── services/       # Servicios externos
├── styles/         # Estilos globales
├── types/          # Definiciones de tipos
└── utils/          # Utilidades
```

## 🤝 Contribución

### **Guías de Desarrollo:**
1. **Seguir convenciones:** TypeScript, ESLint, Prettier
2. **Testing:** Probar funcionalidades antes de commit
3. **Documentación:** Actualizar README cuando sea necesario
4. **Migraciones:** Usar `IF NOT EXISTS` para compatibilidad

### **Proceso de Commit:**
```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

## 📞 Soporte

### **Contacto:**
- **Email:** soporte@contapyme.com
- **Documentación:** [URL_DOCUMENTACION]
- **Issues:** GitHub Issues

### **Troubleshooting Común:**
1. **Error de conexión Supabase:** Verificar variables de entorno
2. **Error de n8n:** Verificar URL y API key
3. **Error de base de datos:** Ejecutar migración final
4. **Error de autenticación:** Verificar configuración de Auth en Supabase

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---

**ContaPYME** - Sistema de Gestión para Pymes Argentinas  
**Versión:** 1.0.0 | **Estado:** ✅ **PRODUCCIÓN READY**