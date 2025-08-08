# CURSOR AGENT RULES - CONTAPYME

## 🔴 REGLAS ABSOLUTAS (PRIORIDAD MÁXIMA)

### 1. SEPARACIÓN DEMO/PRODUCCIÓN
- NUNCA modificar directamente archivos en `demo/`
- NUNCA sincronizar automáticamente demo con src
- Demo es INDEPENDIENTE y usa datos MOCK
- Si necesitas cambiar demo, hacerlo MANUALMENTE y con PROPÓSITO ESPECÍFICO

### 2. MIGRACIONES DE BASE DE DATOS
- NUNCA crear múltiples archivos de migración temporal
- NUNCA ejecutar migraciones directamente sin backup
- SIEMPRE usar UN SOLO archivo de migración limpio
- SIEMPRE hacer backup antes de cualquier migración
- ELIMINAR inmediatamente archivos temporales como: auto-*.js, *-migration-*.sql, direct-*.js, execute-*.js

### 3. CREDENCIALES Y SEGURIDAD
- NUNCA commitear archivos .env o .env.local
- NUNCA hardcodear credenciales en el código
- NUNCA commitear certificados AFIP (.pem, .crt, .key)
- NUNCA exponer API keys en el frontend
- SIEMPRE usar variables de entorno para datos sensibles

### 4. ARQUITECTURA SIMPLIFICADA
- NO implementar multi-tenant complejo
- NO crear abstracciones innecesarias
- Cada cliente = Una instancia = Una Supabase = Un n8n
- Mantener la arquitectura SIMPLE y DIRECTA

## 🟡 REGLAS DE DESARROLLO

### 5. ESTRUCTURA DE ARCHIVOS
- Trabajar SIEMPRE en `src/` para features nuevas
- NO crear carpetas innecesarias
- NO duplicar código entre src y demo
- Mantener componentes en sus carpetas correspondientes:
  - Componentes UI: `src/components/ui/`
  - Páginas: `src/pages/`
  - Servicios: `src/services/`
  - Hooks: `src/hooks/`
  - Types: `src/types/`

### 6. CONVENCIÓN DE COMMITS
Usar SIEMPRE este formato:
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Solo documentación
- `style:` Cambios de formato (no afectan funcionamiento)
- `refactor:` Refactorización sin cambiar funcionalidad
- `test:` Agregar tests
- `chore:` Tareas de mantenimiento

Ejemplos:
- ✅ `fix: corregir autenticación en Supabase`
- ✅ `feat: agregar gestión de certificados AFIP`
- ❌ `updated files` (MAL - no descriptivo)
- ❌ `changes` (MAL - no específico)

### 7. MANEJO DE ERRORES
- SIEMPRE usar try-catch en funciones async
- SIEMPRE loggear errores con contexto
- NUNCA silenciar errores sin loggear
- Usar el errorHandler existente en `src/utils/errorHandler.ts`

### 8. CONFIGURACIÓN
- La configuración va en `.env.local` (desarrollo) o `.env.production` (producción)
- NUNCA crear sistemas de configuración complejos
- Usar el `configManager` existente, NO crear nuevos
- Variables de entorno SIEMPRE con prefijo `VITE_`

## 🟢 MEJORES PRÁCTICAS

### 9. CÓDIGO LIMPIO
- Funciones < 50 líneas
- Archivos < 300 líneas (excepto componentes complejos)
- Si un componente > 500 líneas, DIVIDIRLO
- Nombres descriptivos en español o inglés (consistente)
- NO mezclar idiomas en el mismo archivo

### 10. PERFORMANCE
- Lazy loading para rutas pesadas
- Memorización con useMemo/useCallback donde sea necesario
- NO re-renders innecesarios
- Usar React.memo para componentes puros

### 11. TESTING
- NO crear tests complejos por ahora
- Enfocarse en ESTABILIDAD antes que en cobertura
- Tests manuales son suficientes en esta etapa

### 12. DEPENDENCIAS
- NO agregar dependencias sin necesidad clara
- Preferir soluciones vanilla antes que librerías
- Si agregas una dependencia, documentar el POR QUÉ

## 🚫 PROHIBICIONES ABSOLUTAS

### NUNCA HACER:
1. ❌ Modificar automáticamente archivos en `demo/`
2. ❌ Crear migraciones temporales sin limpiarlas
3. ❌ Commitear credenciales o certificados
4. ❌ Implementar multi-tenant complejo
5. ❌ Crear abstracciones "por si acaso"
6. ❌ Optimizar prematuramente
7. ❌ Agregar features no solicitadas
8. ❌ Refactorizar sin motivo claro
9. ❌ Cambiar arquitectura sin discusión previa
10. ❌ Eliminar código sin entender su propósito

## ✅ SIEMPRE HACER:

### ANTES DE CADA CAMBIO:
1. ✅ Entender el contexto completo
2. ✅ Verificar si no rompe funcionalidad existente
3. ✅ Hacer backup si es cambio crítico
4. ✅ Probar localmente antes de commitear

### DESPUÉS DE CADA CAMBIO:
1. ✅ Verificar que la app compile sin errores
2. ✅ Verificar que el login funcione
3. ✅ Limpiar archivos temporales
4. ✅ Commit descriptivo

## 📝 FLUJO DE TRABAJO

### PARA NUEVAS FEATURES:
1. Desarrollar en `src/`
2. Probar localmente
3. Commit con mensaje descriptivo
4. NO TOCAR demo a menos que sea específicamente solicitado

### PARA FIXES:
1. Identificar el problema exacto
2. Solución mínima y directa
3. NO aprovechar para "mejorar" otras cosas
4. Commit específico del fix

### PARA MIGRACIONES:
1. Backup actual
2. Crear UNA migración limpia
3. Probar en local
4. Eliminar archivos temporales
5. Commit con la migración final

## 🎯 OBJETIVO PRINCIPAL

**MANTENER EL SISTEMA SIMPLE, ESTABLE Y FUNCIONAL**

- Estabilidad > Features nuevas
- Simplicidad > Abstracciones complejas  
- Funcionalidad > Optimización prematura
- Claridad > Código "inteligente"

## 🔄 CUANDO TENGAS DUDAS

Si no estás seguro de algo:
1. PREGUNTA antes de hacer cambios grandes
2. Propón la solución y espera confirmación
3. Mejor conservador que romper algo
4. Si algo funciona, NO lo toques sin razón

## 📊 PRIORIDADES ACTUALES (AGOSTO 2025)

1. 🔴 CRÍTICO: Estabilizar autenticación Supabase
2. 🟡 MEDIO: Limpiar código y migraciones
3. 🟢 BAJO: Mejorar documentación
4. ⚫ NO HACER: Multi-tenant, optimizaciones, features nuevas no solicitadas

## 🚀 COMANDOS PERMITIDOS

### PUEDES EJECUTAR:
- `npm run dev` - Desarrollo local
- `npm run build` - Build de producción
- `npm run verify` - Verificar configuración
- `git status/add/commit/push` - Control de versiones

### NO EJECUTAR SIN PERMISO:
- `npm install [paquete]` - Preguntar antes
- `npx supabase migration` - Preguntar antes
- `rm -rf` - NUNCA sin confirmación
- Scripts de deployment - Solo con supervisión

---

**ESTAS REGLAS SON ABSOLUTAS. NO HAY EXCEPCIONES.**

Fecha de última actualización: Agosto 2025
Proyecto: ContaPYME
Desarrollador Principal: [Chelo]