# ContaPYME - Sistema de Contabilidad para Pymes

Sistema completo de contabilidad para pequeñas y medianas empresas argentinas, desarrollado con React, TypeScript y Supabase.

## 🚀 Características

- **Gestión de Facturas:** Creación, edición y seguimiento de facturas
- **Control de Stock:** Inventario en tiempo real
- **Gestión de Clientes:** CRM integrado
- **Reportes Financieros:** Análisis y métricas
- **Integración AFIP:** Validación automática de CUIT
- **Dashboard Interactivo:** Monitoreo en tiempo real

## 🛠️ Tecnologías

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, Radix UI, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
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

Edita `.env.local` con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

### **4. Ejecutar en Desarrollo**
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
- Creación de facturas A y B
- Cálculo automático de IVA
- Validación de CUIT con AFIP
- Generación de PDF
- Historial de facturas

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
- Métricas en tiempo real
- Gráficos y reportes
- Monitoreo del sistema
- Alertas automáticas

## 🔧 Configuración de Supabase

### **1. Crear Proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia la URL y la clave anónima

### **2. Configurar Base de Datos**
```sql
-- Ejecutar en el SQL Editor de Supabase
-- Las migraciones se encuentran en supabase/migrations/
```

### **3. Configurar Autenticación**
- Habilitar autenticación por email
- Configurar políticas de seguridad
- Crear usuarios de prueba

## 🚀 Despliegue

### **GitHub Pages (Automático)**
El proyecto se despliega automáticamente en:
https://chelof100.github.io/contapyme/

### **Despliegue Manual**
```bash
npm run build
# Subir contenido de /dist a tu servidor
```

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

## 🎯 Roadmap

- [ ] Integración con Mercado Pago
- [ ] App móvil nativa
- [ ] Reportes avanzados
- [ ] Integración con contadores
- [ ] API pública
- [ ] Multi-tenant

---

**ContaPYME** - Simplificando la contabilidad para Pymes argentinas 🚀

<!-- Trigger deploy workflow -->