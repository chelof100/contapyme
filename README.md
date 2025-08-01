# 🏢 ContaPYME - Sistema de Contabilidad para Pymes

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange.svg)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ContaPYME** es un sistema de contabilidad completo y moderno diseñado específicamente para pequeñas y medianas empresas argentinas. Incluye facturación electrónica, gestión de stock avanzada, integración con Mercado Pago, y automatización completa de procesos contables.

## 🚀 **Características Principales**

### 📦 **Gestión de Productos Avanzada**
- ✅ Escaneo de códigos de barras
- ✅ Importación masiva de productos
- ✅ Control de peso, volumen y lotes
- ✅ Gestión de fechas de vencimiento
- ✅ Categorización jerárquica

### 🧾 **Facturación Automatizada**
- ✅ Integración productos-facturas automática
- ✅ Cálculo automático de subtotales e IVA (21%)
- ✅ Generación automática de descripciones
- ✅ Actualización automática de stock
- ✅ Cumplimiento con AFIP

### 👥 **Gestión Comercial**
- ✅ Gestión completa de proveedores
- ✅ Gestión de clientes con límites de crédito
- ✅ Historial de precios automático
- ✅ Alertas de stock en tiempo real

### ⚙️ **Automatización y Integración**
- ✅ Triggers automáticos de base de datos
- ✅ Integración con n8n para automatizaciones
- ✅ Conexión con Mercado Pago
- ✅ Integración con Google Drive
- ✅ WhatsApp Business API

## 🛠️ **Tecnologías Utilizadas**

### **Frontend**
- **React 18** - Framework principal
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos modernos
- **shadcn/ui** - Componentes de interfaz
- **React Query** - Gestión de estado
- **React Router** - Navegación

### **Backend**
- **Supabase** - Base de datos PostgreSQL
- **Row Level Security (RLS)** - Seguridad multi-tenant
- **Triggers PostgreSQL** - Automatización de procesos
- **Funciones PL/pgSQL** - Lógica de negocio

### **Integraciones**
- **n8n** - Automatización de procesos
- **Mercado Pago** - Pagos electrónicos
- **Google Drive** - Almacenamiento en la nube
- **WhatsApp Business API** - Comunicación

## 📋 **Requisitos Previos**

- **Node.js** (versión 18 o superior)
- **npm** o **yarn** (gestor de paquetes)
- **Git** (control de versiones)
- **Cuenta de Supabase** (gratuita)

## 🚀 **Instalación Rápida**

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/contapyme.git
cd contapyme
```

### **2. Configuración Automática**
```bash
# Instalar dependencias
npm install

# Configuración automática
node scripts/setup.js
```

### **3. Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp config/env.example .env

# Editar con tus valores de Supabase
nano .env
```

### **4. Migrar Base de Datos**
Sigue la guía en [`docs/MIGRATION.md`](docs/MIGRATION.md)

### **5. Iniciar Aplicación**
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## 📚 **Documentación**

### **Guías Principales**
- 📖 [**Instalación Completa**](docs/INSTALLATION.md) - Guía detallada de instalación
- 🗄️ [**Migración de Base de Datos**](docs/MIGRATION.md) - Configuración de Supabase
- 🧪 [**Plan de Pruebas**](docs/TESTING-PLAN.md) - Verificación de funcionalidades
- 📊 [**Resumen de Migración**](docs/MIGRATION-SUMMARY.md) - Estado del sistema

### **Documentación Técnica**
- 📋 [**Vista General de la Base de Datos**](docs/DATABASE_OVERVIEW.md)
- 🎯 [**Próximos Pasos**](docs/NEXT-STEPS.md) - Después de la instalación

## 🔧 **Scripts Disponibles**

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción

# Verificación
node scripts/setup.js    # Configuración automática
node scripts/verify.js   # Verificar instalación

# Utilidades
npm run lint             # Verificar código
npm run type-check       # Verificar tipos TypeScript
```

## 🏗️ **Estructura del Proyecto**

```
contapyme/
├── 📁 src/                    # Código fuente de la aplicación
├── 📁 public/                 # Archivos públicos
├── 📁 docs/                   # Documentación completa
├── 📁 database/               # Scripts de base de datos
│   ├── 📄 migration.sql       # Migración principal
│   └── 📄 functions.sql       # Funciones y triggers
├── 📁 scripts/                # Scripts de utilidad
│   ├── 📄 setup.js            # Configuración automática
│   └── 📄 verify.js           # Verificación de instalación
├── 📁 config/                 # Archivos de configuración
│   ├── 📄 env.example         # Variables de entorno ejemplo
│   └── 📄 supabase.example.js # Configuración Supabase ejemplo
└── 📄 README.md               # Este archivo
```

## 🚨 **Solución de Problemas**

### **Problemas Comunes**

**Error: "Faltan las variables de entorno"**
```bash
# Verificar que .env existe y tiene los valores correctos
cat .env
```

**Error: "Cannot connect to Supabase"**
- Verificar URL y Anon Key en `.env`
- Verificar que el proyecto Supabase esté activo

**Error: "Database migration failed"**
```bash
# Ejecutar verificación
node scripts/verify.js
```

### **Obtener Ayuda**
1. Revisar la [documentación](docs/)
2. Ejecutar `node scripts/setup.js` para diagnóstico
3. Crear un issue en GitHub con logs específicos

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 **Agradecimientos**

- **Supabase** por la infraestructura de base de datos
- **React Team** por el framework frontend
- **Tailwind CSS** por el sistema de estilos
- **shadcn/ui** por los componentes de interfaz

## 📞 **Soporte**

- 📧 **Email:** soporte@contapyme.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/tu-usuario/contapyme/issues)
- 📖 **Documentación:** [docs/](docs/)

---

**¡ContaPYME - Simplificando la contabilidad para Pymes argentinas! 🚀**

*Desarrollado con ❤️ para el ecosistema empresarial argentino*