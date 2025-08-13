�� RESUMEN EJECUTIVO:
OnePYME es un sistema integral de contabilidad para Pymes argentinas que YA EXISTE y está 95% funcional. El objetivo actual es integrar SQL Server existente usando Supabase como API Gateway, manteniendo toda la funcionalidad actual.
🏗️ ARQUITECTURA ACTUAL (FUNCIONAL):
🏗️ ARQUITECTURA OBJETIVO (A IMPLEMENTAR):
📊 ESTADO ACTUAL DEL PROYECTO (CONFIRMADO):
✅ FUNCIONALIDADES COMPLETAS:
Sistema de Facturación - 100% funcional (AFIP SDK integrado)
Gestión de Stock - 100% funcional con alertas automáticas
Sistema de Pagos - 100% funcional con notificaciones
CRM Integrado - 100% funcional con pipeline de ventas
ERP Básico - 100% funcional (finanzas, empleados, proyectos)
Dashboard Inteligente - 100% funcional con métricas en tiempo real
Multi-tenancy - 100% funcional con RLS implementado
Autenticación - 100% funcional con roles y permisos
✅ TECNOLOGÍAS IMPLEMENTADAS:
Frontend: React 18.3.1 + TypeScript 5.5.3 + Vite 5.4.1
UI: Radix UI + Tailwind CSS + Shadcn/ui
Backend: Supabase (PostgreSQL + Auth + RLS)
Automatización: n8n (4 workflows funcionales)
Estado: TanStack Query + React Context
Formularios: React Hook Form + Zod
Base de Datos: 15 tablas + 8 migraciones + RLS completo
✅ INTEGRACIONES FUNCIONANDO:
AFIP SDK - Facturación electrónica completa
Gmail - Envío automático de emails
Google Drive - Almacenamiento automático de PDFs
n8n - 4 workflows de automatización
�� OBJETIVO INMEDIATO:
Crear API Gateway para conectar OnePYME con SQL Server existente, SIN PERDER ninguna funcionalidad actual.
�� PLAN DE ACCIÓN INTEGRADO (6-8 SEMANAS):
🏗️ FASE 0: PRESERVACIÓN DEL SISTEMA ACTUAL (SEMANA 1)
🔌 FASE 1: API GATEWAY FOUNDATION (SEMANA 2-3)
⚡ FASE 2: EDGE FUNCTIONS CORE (SEMANA 4-5)
🎨 FASE 3: FRONTEND INTEGRATION (SEMANA 6)
🧪 FASE 4: TESTING & VALIDATION (SEMANA 7)
�� FASE 5: DESPLIEGUE & MONITOREO (SEMANA 8)
🏗️ ESTRUCTURA TÉCNICA INTEGRADA:
1️⃣ PRESERVAR (Sistema Actual):
src/
├── components/           # ✅ MANTENER - UI components existentes
├── pages/               # ✅ MANTENER - Páginas funcionales
├── contexts/            # ✅ MANTENER - AuthContext funcional
├── services/            # ✅ MANTENER - Servicios existentes
├── hooks/               # ✅ MANTENER - Hooks funcionales
├── types/               # ✅ MANTENER - Tipos existentes
└── utils/               # ✅ MANTENER - Utilidades existentes
2️⃣ AGREGAR (API Gateway):
supabase/functions/
├── sql-server-connector.ts    # Nueva - Conexión a SQL Server
├── clientes/                  # Nueva - API de clientes
├── facturas/                  # Nueva - API de facturas
├── productos/                 # Nueva - API de productos
└── middleware/                # Nueva - Middleware de auth
3️⃣ INTEGRAR (Servicios):
src/services/
├── existingServices.ts         # ✅ MANTENER - Servicios actuales
├── sqlServerService.ts         # 🆕 NUEVO - Servicio SQL Server
├── clientesService.ts          # 🆕 NUEVO - Servicio clientes
├── facturasService.ts          # 🆕 NUEVO - Servicio facturas
└── productosService.ts         # 🆕 NUEVO - Servicio productos
�� VARIABLES DE ENTORNO REQUERIDAS:
✅ EXISTENTES (Mantener):
# Supabase (YA CONFIGURADO)
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# N8N (YA CONFIGURADO)
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=tu_api_key_n8n

# AFIP (YA CONFIGURADO)
VITE_AFIP_CUIT=tu_cuit
VITE_AFIP_CERT_PATH=path/to/cert.p12
VITE_AFIP_KEY_PATH=path/to/key.key
🆕 NUEVAS (Para SQL Server):
# SQL Server (NUEVO)
SQL_SERVER_HOST=tu-servidor.database.windows.net
SQL_SERVER_DATABASE=tu_base_de_datos
SQL_SERVER_USER=tu_usuario
SQL_SERVER_PASSWORD=tu_password
SQL_SERVER_PORT=1433
SQL_SERVER_ENCRYPT=true
�� DEPENDENCIAS EXISTENTES (MANTENER):
{
  "dependencies": {
    "react": "^18.3.1",                    # ✅ MANTENER
    "@supabase/supabase-js": "^2.50.5",    # ✅ MANTENER
    "@tanstack/react-query": "^5.56.2",    # ✅ MANTENER
    "react-router-dom": "^6.26.2",         # ✅ MANTENER
    "react-hook-form": "^7.60.0",          # ✅ MANTENER
    "zod": "^3.23.8"                       # ✅ MANTENER
  }
}
🆕 DEPENDENCIAS NUEVAS (Para Edge Functions):
{
  "dependencies": {
    "mssql": "^10.0.0",                    # 🆕 NUEVO
    "@types/mssql": "^10.0.0"              # 🆕 NUEVO
  }
}
🎯 PRÓXIMOS PASOS INMEDIATOS: