# 🏢 OnePYME - Sistema de Contabilidad para Pymes Argentinas

Sistema completo de contabilidad, facturación y gestión empresarial integrado con Supabase y N8N.

## 🚀 **Setup Rápido (5 minutos)**

### **1️⃣ Prerrequisitos**
- Node.js 18+ 
- Git
- Cuenta de Supabase
- Cuenta de N8N (opcional)

### **2️⃣ Clonar y Configurar**
```bash
# Clonar repositorio
git clone https://github.com/chelof100/onepyme.git
cd onepyme

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### **3️⃣ Setup Automático**
```bash
# Setup completo (base de datos + aplicación)
npm run setup

# Solo verificar estado
npm run verify

# Solo setup de N8N (opcional)
npm run setup:n8n:simple
```

### **4️⃣ Ejecutar Aplicación**
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview
```

## 🏗️ **Arquitectura**

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Automatización**: N8N Workflows
- **Estado**: React Context + TanStack Query

## 📁 **Estructura del Proyecto**

```
onepyme/
├── src/                    # Código fuente principal
├── demo/                   # Versión de demostración
├── supabase/              # Configuración y migrations
├── n8n-workflows/         # Workflows de automatización
├── docs/                  # Documentación técnica
└── scripts/               # Scripts de setup automático
```

## 🔧 **Scripts Disponibles**

| Comando | Descripción |
|---------|-------------|
| `npm run setup` | Setup completo del sistema |
| `npm run verify` | Verificar estado de la base de datos |
| `npm run setup:n8n` | Configurar N8N completo |
| `npm run setup:n8n:simple` | Configurar N8N básico |
| `npm run dev` | Ejecutar en modo desarrollo |
| `npm run build` | Construir para producción |

## 🌐 **Variables de Entorno**

Crear archivo `.env` con:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=tu_api_key_n8n
```

## 📊 **Funcionalidades Principales**

- ✅ **Gestión de Usuarios** con roles y permisos
- ✅ **Sistema Multi-Empresa** con RLS
- ✅ **Facturación Electrónica** integrada con AFIP
- ✅ **Control de Stock** con alertas automáticas
- ✅ **Gestión de Recetas** y costos
- ✅ **Dashboard** con métricas en tiempo real
- ✅ **Workflows Automatizados** con N8N

## 🧪 **Testing**

```bash
# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Cobertura
npm run test:coverage
```

## 📚 **Documentación Adicional**

- [Guía de Implementación](docs/GUIA_IMPLEMENTACION.md)
- [Configuración N8N](docs/N8N_INTEGRATION.md)
- [Arquitectura del Sistema](docs/ANALISIS_COMPLETO_PROYECTO.md)
- [Plan de Testing](docs/TESTING_SUITE.md)

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 **Soporte**

- **Issues**: [GitHub Issues](https://github.com/chelof100/onepyme/issues)
- **Documentación**: [docs/](docs/)
- **Wiki**: [GitHub Wiki](https://github.com/chelof100/onepyme/wiki)

---

**Desarrollado con ❤️ por el equipo OnePYME**