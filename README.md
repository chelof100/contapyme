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
- **Deployment:** GitHub Pages (Demo) / Local (Producción)
- **CI/CD:** GitHub Actions

## 📦 Instalación

### **🎯 Opción 1: Implementación Local (Producción)**

Para implementar ContaPYME en tu empresa:

```bash
git clone https://github.com/chelof100/contapyme.git
cd contapyme
npm install
npm run setup:local
```

**Configurar variables de entorno:**
```bash
# Editar .env.local con tus credenciales
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
VITE_N8N_BASE_URL=https://tu-instancia-n8n.com
VITE_N8N_API_KEY=tu_api_key_de_n8n
```

**Ejecutar migraciones de base de datos:**
```bash
# Ver docs/MIGRATION.md para instrucciones detalladas
```

**Iniciar aplicación:**
```bash
npm run dev
```

### **🎮 Opción 2: Demo Online**

**Demo funcional:** [https://chelof100.github.io/contapyme/](https://chelof100.github.io/contapyme/)

**Credenciales demo:**
- Email: `demo@contapyme.com`
- Contraseña: `demo123`

### **🔧 Opción 3: Demo Local**

Para probar el demo en tu máquina:

```bash
git clone https://github.com/chelof100/contapyme.git
cd contapyme
npm install
npm run setup:demo
npm run dev:demo
```

## 📖 Documentación

- **[Implementación Local](docs/IMPLEMENTATION.md)** - Guía completa para implementar en producción
- **[Configuración de Supabase](docs/MIGRATION.md)** - Migraciones y configuración de base de datos
- **[Integración n8n](docs/N8N_INTEGRATION.md)** - Configuración de automatizaciones
- **[Workflows Disponibles](docs/N8N_WORKFLOWS.md)** - Lista de workflows automáticos
- **[Análisis del Proyecto](docs/ANALISIS_COMPLETO_PROYECTO.md)** - Análisis técnico completo

## 🏗️ Arquitectura

```
projectocontapyme/
├── src/                    # APLICACIÓN PRODUCCIÓN (local)
├── demo/                   # DEMO (GitHub Pages)
├── docs/                   # Documentación técnica
├── n8n-workflows/          # Workflows de automatización
├── supabase/              # Migraciones de base de datos
└── README.md              # Guía principal
```

## 🚀 Scripts Disponibles

### **Producción (Local)**
```bash
npm run dev              # Desarrollo local
npm run build:local      # Build para producción
npm run test:local       # Tests de producción
npm run setup:local      # Configuración inicial
```

### **Demo**
```bash
npm run dev:demo         # Desarrollo demo
npm run build:demo       # Build para GitHub Pages
npm run test:demo        # Tests de demo
npm run setup:demo       # Configuración demo
```

## 📋 Próximos Pasos

1. **Configurar Supabase** - Crear proyecto y ejecutar migraciones
2. **Configurar n8n** - Instalar workflows de automatización
3. **Personalizar** - Adaptar a necesidades específicas de tu empresa
4. **Desplegar** - Configurar dominio y SSL

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **Documentación:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/chelof100/contapyme/issues)
- **Email:** soporte@contapyme.com

---

**ContaPYME** - Sistema de Contabilidad para Pymes Argentinas