# OnePyme - Sistema Integral de Gestión

Sistema completo de gestión empresarial para PYMES con módulos de contabilidad, facturación, inventario, CRM y ERP.

## 🚀 Inicio Rápido

### 1. Instalación
```bash
npm install
```

### 2. Configuración
```bash
# Copiar archivo de variables de entorno
cp env.example .env

# Editar .env con tus credenciales de Supabase
```

### 3. Desarrollo
```bash
npm run dev
```

El sistema estará disponible en `http://localhost:5173`

## 📊 Funcionalidades

### 💼 Contabilidad
- Facturas emitidas y recibidas
- Órdenes de compra
- Gestión de pagos
- Reportes financieros

### 📦 Inventario
- Gestión de productos
- Control de stock
- Alertas automáticas
- Movimientos de stock

### 👥 CRM
- Gestión de clientes
- Oportunidades de venta
- Seguimiento de interacciones
- Pipeline de ventas

### 🏭 ERP
- Gestión de proyectos
- Control de empleados
- Tiempo trabajado
- Presupuestos

### 🍴 Recetas (Restaurantes)
- Creación de recetas
- Control de ingredientes
- Costeo automático
- Ventas de recetas

## 🔧 Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estado**: Context API

## 👤 Usuarios de Prueba

- **Admin**: admin@onepyme.pro / admin123
- **Developer**: developer@onepyme.pro / dev123

## 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas de la aplicación
├── hooks/         # Custom hooks
├── contexts/      # Context providers
├── services/      # Servicios externos
├── utils/         # Utilidades
└── integrations/ # Integraciones (Supabase)
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Vista previa del build
- `npm run lint` - Linter de código
- `npm run type-check` - Verificación de tipos

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.