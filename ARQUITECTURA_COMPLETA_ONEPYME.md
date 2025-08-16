# 🏢 ARQUITECTURA COMPLETA ONEPYME

## 📋 RESUMEN EJECUTIVO

**OnePyme** es un sistema integral de gestión empresarial **SINGLE-TENANT** diseñado para PYMES argentinas. El sistema incluye módulos de contabilidad, facturación, inventario, CRM, ERP y gestión de recetas (especialmente para restaurantes).

## 🎯 PRINCIPIOS ARQUITECTÓNICOS

### SINGLE-TENANT (NO Multi-Tenant)
- **UNA SOLA empresa** por instalación
- **NO hay separación** por `empresa_id` en consultas
- **Todos los usuarios** comparten la misma base de datos
- **Developer tiene super poderes** totales para configuración

### ARQUITECTURA FRONTEND
- **React + TypeScript + Vite**
- **Tailwind CSS + shadcn/ui** para componentes
- **Context API** para estado global
- **Hooks personalizados** para cada módulo
- **Protección de rutas** basada en roles

## 🗂️ ESTRUCTURA COMPLETA DEL SISTEMA

### 📱 PÁGINAS PRINCIPALES (ROUTING)

#### 1. **AUTENTICACIÓN**
- `/auth` - Login/Registro
- `/admin-reset-password` - Reset de contraseña

#### 2. **DASHBOARD PRINCIPAL**
- `/dashboard` - Vista general del negocio
- `/` - Página de inicio
- `/testing` - Dashboard de testing

#### 3. **MÓDULO CONTABILIDAD**
- `/facturas` - Gestión de facturas emitidas/recibidas
- `/ordenes-compra` - Órdenes de compra
- `/ordenes-recepcion` - Recepción de productos
- `/pagos` - Gestión de pagos
- `/stock` - Control de inventario

#### 4. **MÓDULO CRM**
- `/crm/clientes` - Gestión de clientes
- `/crm/oportunidades` - Pipeline de ventas
- `/crm/actividades` - Seguimiento de actividades
- `/crm/campanas` - Campañas de marketing

#### 5. **MÓDULO ERP**
- `/erp/finanzas` - Gestión financiera
- `/erp/empleados` - Recursos humanos
- `/erp/proyectos` - Gestión de proyectos
- `/erp/rentabilidad` - Análisis de rentabilidad

#### 6. **MÓDULO ADMINISTRACIÓN**
- `/admin/usuarios` - Gestión de usuarios del sistema
- `/configuracion` - Configuración general
- `/monitoreo` - Monitoreo del sistema

#### 7. **MÓDULO ESPECIALIZADO**
- `/recetas` - Gestión de recetas (restaurantes)

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### 📊 TABLAS PRINCIPALES (43 TABLAS)

#### **1. AUTENTICACIÓN Y USUARIOS**
```sql
-- Sistema de usuarios y autenticación
usuarios ✅
profiles ✅
roles ✅
permisos ✅
usuarios_roles ✅
usuarios_permisos ✅
```

#### **2. EMPRESA**
```sql
-- Empresa principal del sistema (SINGLE-TENANT)
empresa ✅
-- Proveedores y clientes de la empresa
empresas ✅
```

#### **3. PRODUCTOS Y STOCK**
```sql
-- Gestión de inventario
productos ✅
servicios ✅
stock ✅
movimientos_stock ✅
alertas_stock ✅
historial_precios ✅
categorias ✅
categorias_financieras ✅
```

#### **4. FACTURACIÓN**
```sql
-- Sistema de facturación completo
facturas_emitidas ✅
facturas_recibidas ✅
factura_productos ✅
pagos ✅
cobros ✅
```

#### **5. COMPRAS**
```sql
-- Gestión de compras y proveedores
ordenes_compra ✅
recepcion_productos ✅
```

#### **6. CRM**
```sql
-- Gestión de relaciones con clientes
clientes ✅
contactos ✅
interacciones ✅
etapas_pipeline ✅
oportunidades ✅
actividades ✅
campanas ✅
```

#### **7. ERP**
```sql
-- Gestión empresarial
empleados ✅
tiempo_trabajado ✅
proyectos ✅
tareas_proyecto ✅
presupuestos ✅
cash_flow_proyecciones ✅
indicadores_kpi ✅
asistencia ✅
liquidaciones ✅
```

#### **8. RECETAS (RESTAURANTES)**
```sql
-- Sistema de recetas para restaurantes
recetas ✅
ingredientes_receta ✅
ventas_recetas ✅
```

#### **9. CONFIGURACIÓN**
```sql
-- Configuración del sistema
endpoint_configurations_history ✅
configuration_backups ✅
configuration_tests ✅
```

#### **10. ANALÍTICAS**
```sql
-- Seguimiento de uso y métricas
user_actions ✅
user_preferences ✅
workflow_logs ✅
workflow_metrics ✅
```

#### **11. BANCARIO**
```sql
-- Gestión bancaria
cuentas_bancarias ✅
transacciones_bancarias ✅
```

## 🔧 FUNCIONALIDADES DETALLADAS POR MÓDULO

### 📊 **DASHBOARD PRINCIPAL**
- **Métricas contables**: Facturas emitidas/recibidas, órdenes, pagos, stock
- **Métricas CRM**: Clientes activos, pipeline de ventas, actividades pendientes
- **Métricas ERP**: Cash flow, empleados, proyectos, rentabilidad
- **Alertas del sistema**: Stock bajo, actividades vencidas, facturas pendientes
- **Acciones rápidas**: Navegación directa a módulos principales
- **Estado del sistema**: Health checks de servicios (n8n, Supabase)

### 💼 **MÓDULO CONTABILIDAD**

#### **Facturas**
- **Emisión**: Crear facturas A/B/C con validación de CUIT
- **Recepción**: Registrar facturas de proveedores
- **Gestión**: Estados (pendiente, emitida, vencida, pagada)
- **Productos**: Asociar productos a facturas
- **PDF**: Generación y envío por email
- **Integración**: Envío automático a n8n para procesamiento

#### **Órdenes de Compra**
- **Creación**: Órdenes con proveedores y productos
- **Seguimiento**: Estados (abierta, cerrada, cancelada)
- **Integración**: Envío a n8n para confirmación de proveedores

#### **Pagos**
- **Registro**: Pagos de facturas emitidas/recibidas
- **Métodos**: Múltiples formas de pago
- **Seguimiento**: Estados de confirmación
- **Integración**: Procesamiento automático vía n8n

#### **Stock**
- **Productos**: SKU, códigos, nombres, descripciones
- **Precios**: Costo, venta sugerido, venta real
- **Movimientos**: Ingresos, egresos, ajustes
- **Alertas**: Stock mínimo automático
- **Categorías**: Organización por tipos
- **Integración**: Movimientos automáticos desde facturas

### 👥 **MÓDULO CRM**

#### **Clientes**
- **Gestión completa**: CUIT, razón social, contacto, dirección
- **Categorización**: VIP, Regular, Nuevo, Importado
- **Importación automática**: Desde facturas emitidas
- **Seguimiento**: Primera compra, monto total, estado
- **Integración**: Envío a n8n para procesamiento CRM

#### **Oportunidades**
- **Pipeline de ventas**: Etapas configurables
- **Valor estimado**: Montos y probabilidades
- **Seguimiento**: Actividades y próximos pasos
- **Integración**: Workflows automáticos vía n8n

#### **Actividades**
- **Tipos**: Llamadas, emails, reuniones, tareas, demos
- **Prioridades**: Alta, media, baja
- **Estados**: Pendiente, completada, vencida
- **Seguimiento**: Fechas y recordatorios

#### **Campañas**
- **Marketing**: Campañas de email y seguimiento
- **Segmentación**: Por categoría de cliente
- **Métricas**: Apertura, clics, conversiones

### 🏭 **MÓDULO ERP**

#### **Finanzas**
- **Presupuestos**: Mensuales por categorías
- **Cash Flow**: Proyecciones de ingresos/egresos
- **KPIs**: Indicadores de rendimiento
- **Análisis**: Presupuesto vs real, tendencias
- **Gráficos**: Visualización de datos financieros

#### **Empleados**
- **Gestión completa**: Datos personales, laborales, bancarios
- **Asistencia**: Control de entrada/salida
- **Licencias**: Tipos y aprobaciones
- **Salarios**: Estructura y liquidaciones

#### **Proyectos**
- **Gestión completa**: Planificación, ejecución, cierre
- **Tiempo trabajado**: Registro de horas por empleado
- **Presupuestos**: Estimaciones vs reales
- **Facturación**: Horas facturables y realizadas
- **Rentabilidad**: Análisis de costos y beneficios

### 🍴 **MÓDULO RECETAS (RESTAURANTES)**

#### **Gestión de Recetas**
- **Creación**: Ingredientes, cantidades, costos
- **Cálculo automático**: Costo total y precio sugerido
- **Stock**: Consumo automático de ingredientes
- **Ventas**: Registro de ventas con impacto en stock

#### **Integración con Stock**
- **Movimientos automáticos**: Al vender recetas
- **Alertas**: Stock insuficiente de ingredientes
- **Costos**: Actualización automática de precios

### ⚙️ **MÓDULO ADMINISTRACIÓN**

#### **Usuarios del Sistema**
- **Roles**: Developer, Admin, Contador, Usuario
- **Permisos**: Granular por funcionalidad
- **Gestión**: Crear, editar, eliminar usuarios
- **Seguridad**: Reset de contraseñas, bloqueos

#### **Configuración**
- **Empresa**: Datos de la empresa principal
- **n8n**: Configuración de workflows
- **Sistema**: Parámetros generales
- **Backups**: Configuraciones guardadas

#### **Monitoreo**
- **Health Checks**: Estado de servicios
- **Métricas**: Rendimiento del sistema
- **Logs**: Registro de actividades
- **Alertas**: Notificaciones de problemas

## 🔌 INTEGRACIONES EXTERNAS

### **n8n (Workflow Automation)**
- **Endpoints**: Webhooks para cada módulo
- **Procesamiento**: Automatización de tareas
- **Integración**: AFIP, email, notificaciones
- **Health Checks**: Monitoreo de conectividad

### **Supabase (Backend)**
- **Base de datos**: PostgreSQL con RLS
- **Autenticación**: Sistema de usuarios y sesiones
- **Storage**: Archivos PDF y documentos
- **Real-time**: Actualizaciones en tiempo real

### **Servicios Externos**
- **AFIP**: Validación de CUIT y facturación
- **Email**: Envío de facturas y notificaciones
- **WhatsApp**: Notificaciones de alertas

## 🛡️ SEGURIDAD Y PERMISOS

### **Sistema de Roles**
```typescript
enum UserRole {
  developer = 'developer',    // Super poderes totales
  admin = 'admin',           // Administración completa
  contador = 'contador',     // Módulos contables
  usuario = 'usuario'        // Acceso limitado
}
```

### **Permisos por Rol**
- **Developer**: Acceso total a todo el sistema
- **Admin**: Gestión de usuarios y configuración
- **Contador**: Módulos contables y reportes
- **Usuario**: Funcionalidades básicas asignadas

### **Row Level Security (RLS)**
- **Políticas simples**: `FOR ALL USING (true)` para usuarios autenticados
- **Sin filtros por empresa**: Sistema single-tenant
- **Protección básica**: Solo usuarios autenticados

## 📊 MÉTRICAS Y ANALÍTICAS

### **Dashboard Metrics**
- **Contabilidad**: Facturas, órdenes, pagos, stock
- **CRM**: Clientes, oportunidades, actividades
- **ERP**: Finanzas, empleados, proyectos
- **Sistema**: Health checks, performance

### **User Analytics**
- **Acciones del usuario**: Tracking de uso
- **Preferencias**: Configuraciones personalizadas
- **Actividad reciente**: Historial de acciones
- **Quick Actions**: Acciones más utilizadas

### **System Metrics**
- **Performance**: Tiempo de respuesta, uptime
- **Health Checks**: Estado de servicios externos
- **Error Logs**: Registro de problemas
- **Workflow Metrics**: Métricas de n8n

## 🚀 IMPLEMENTACIÓN TÉCNICA

### **Frontend Architecture**
```typescript
// Estructura de componentes
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── facturas/       # Componentes específicos de facturas
│   └── monitoring/     # Componentes de monitoreo
├── pages/              # Páginas principales
│   ├── crm/           # Módulo CRM
│   ├── erp/           # Módulo ERP
│   └── admin/         # Administración
├── hooks/              # Hooks personalizados
├── contexts/           # Context providers
├── services/           # Servicios externos
└── types/              # Tipos TypeScript
```

### **Data Flow**
1. **Usuario interactúa** con componente
2. **Hook personalizado** maneja la lógica de datos
3. **Supabase client** ejecuta consultas
4. **Estado local** se actualiza
5. **UI se re-renderiza** con nuevos datos
6. **Integración n8n** se ejecuta en background

### **State Management**
- **Context API**: Estado global (auth, config)
- **Local State**: Estado específico de componentes
- **Supabase**: Estado persistente en base de datos
- **Real-time**: Suscripciones para actualizaciones

## 🔄 FLUJOS DE TRABAJO PRINCIPALES

### **Flujo de Facturación**
1. Usuario crea factura
2. Sistema valida CUIT
3. Se guarda en Supabase
4. Se envía a n8n para procesamiento
5. Se genera PDF automáticamente
6. Se envía por email al cliente
7. Se actualiza stock si aplica

### **Flujo de CRM**
1. Usuario crea cliente
2. Sistema valida datos
3. Se guarda en Supabase
4. Se envía a n8n para workflows
5. Se crean actividades automáticas
6. Se asignan recordatorios

### **Flujo de Stock**
1. Usuario registra movimiento
2. Sistema actualiza stock
3. Se verifica stock mínimo
4. Se generan alertas si es necesario
5. Se actualiza costo promedio
6. Se registra en historial

## 📈 ESCALABILIDAD Y MANTENIMIENTO

### **Arquitectura Escalable**
- **Módulos independientes**: Cada módulo puede evolucionar por separado
- **Hooks reutilizables**: Lógica compartida entre componentes
- **Tipos centralizados**: Definiciones TypeScript consistentes
- **Servicios modulares**: Integraciones separadas por funcionalidad

### **Mantenimiento**
- **Código limpio**: Estructura clara y documentada
- **Testing**: Componentes testables y aislados
- **Error Handling**: Manejo consistente de errores
- **Logging**: Registro detallado para debugging

### **Performance**
- **Lazy Loading**: Carga de módulos bajo demanda
- **Optimización de queries**: Consultas eficientes a Supabase
- **Caching**: Datos en memoria cuando es apropiado
- **Real-time**: Actualizaciones sin refrescar página

## 🎯 ROADMAP DE IMPLEMENTACIÓN

### **Fase 1: Core System (MVP)**
- [x] Autenticación y usuarios
- [x] Dashboard principal
- [x] Módulo de facturación básico
- [x] Gestión de stock simple

### **Fase 2: CRM y ERP**
- [ ] Sistema CRM completo
- [ ] Gestión de empleados
- [ ] Proyectos y tiempo
- [ ] Finanzas y presupuestos

### **Fase 3: Integraciones Avanzadas**
- [ ] Workflows n8n complejos
- [ ] Integración AFIP completa
- [ ] Sistema de recetas
- [ ] Reportes avanzados

### **Fase 4: Optimización**
- [ ] Performance y caching
- [ ] Testing completo
- [ ] Documentación de usuario
- [ ] Deployment y CI/CD

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### **Consideraciones Técnicas**
- **Single-Tenant**: NO implementar filtros por empresa_id
- **RLS Simple**: Políticas básicas sin complejidad
- **Error Handling**: Manejo robusto de errores de red
- **Type Safety**: TypeScript estricto en todo el código

### **Decisiones de Arquitectura**
- **Frontend First**: UI/UX como prioridad
- **Backend Simple**: Supabase para funcionalidad básica
- **Integración n8n**: Automatización de procesos complejos
- **Real-time**: Suscripciones para datos críticos

### **Patrones de Diseño**
- **Custom Hooks**: Lógica de datos reutilizable
- **Context Providers**: Estado global compartido
- **Component Composition**: Componentes modulares
- **Service Layer**: Abstracción de APIs externas

---

**Documento creado por**: Senior Software Engineer  
**Fecha**: 15 de Agosto, 2025  
**Versión**: 1.0  
**Estado**: Análisis completo del frontend realizado

