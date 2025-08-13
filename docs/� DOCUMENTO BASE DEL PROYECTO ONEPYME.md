� DOCUMENTO BASE DEL PROYECTO ONEPYME
�� OBJETIVO PRINCIPAL:
Crear un sistema donde OnePYME use Supabase como proxy para conectarse a SQL Server existente, manteniendo la seguridad y escalabilidad.
🏗️ ARQUITECTURA FINAL:
📊 ESTADO ACTUAL DEL PROYECTO:
Frontend: React + Vite + TypeScript
Backend: Supabase (Auth + Database)
UI: Shadcn UI + Tailwind CSS
Estado: Proyecto base funcional con autenticación
Problema: Necesidad de conectar con SQL Server existente
�� TECNOLOGÍAS SELECCIONADAS:
Frontend: React 18 + Vite + TypeScript
UI Framework: Shadcn UI + Tailwind CSS
Backend: Supabase (Auth + Edge Functions)
Database: SQL Server (existente) + Supabase (cache/metadata)
API: RESTful con Edge Functions
Testing: Jest + React Testing Library
�� ESTRUCTURA DEL PROYECTO:
🚀 PLAN DE IMPLEMENTACIÓN:
FASE 1: PROYECTO BASE (SEMANA 1-2)
[ ] Setup inicial React + Vite + TypeScript
[ ] Configuración de Supabase
[ ] Sistema de autenticación básico
[ ] UI components base (Shadcn + Tailwind)
[ ] Layout y navegación básica
FASE 2: API GATEWAY FOUNDATION (SEMANA 3)
[ ] Análisis de SQL Server existente
[ ] Mapeo de datos SQL Server ↔ Supabase
[ ] Diseño de Edge Functions
[ ] Configuración de variables de entorno
FASE 3: EDGE FUNCTIONS CORE (SEMANA 4-5)
[ ] SQL Server Connector
[ ] Clientes API (CRUD completo)
[ ] Facturas API (CRUD completo)
[ ] Productos API (CRUD completo)
[ ] Middleware de autenticación
FASE 4: FRONTEND INTEGRATION (SEMANA 6)
[ ] Servicios de conexión a SQL Server
[ ] Hooks personalizados para datos
[ ] Componentes de gestión (clientes, facturas, productos)
[ ] Dashboard con datos reales
FASE 5: TESTING & VALIDATION (SEMANA 7)
[ ] Tests unitarios para Edge Functions
[ ] Tests de integración Frontend ↔ API
[ ] Tests de rendimiento y escalabilidad
[ ] Validación de seguridad
FASE 6: DESPLIEGUE & MONITOREO (SEMANA 8)
[ ] Despliegue de Edge Functions
[ ] Configuración de monitoreo
[ ] Alertas y logging
[ ] Documentación final
�� VARIABLES DE ENTORNO REQUERIDAS:
📚 DEPENDENCIAS PRINCIPALES:
🎯 PRÓXIMOS PASOS INMEDIATOS:
Crear estructura del proyecto base
Configurar Supabase y autenticación
Implementar UI components básicos
Crear layout y navegación