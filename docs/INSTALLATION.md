# 🚀 GUÍA DE INSTALACIÓN - CONTAPYME

## 📋 **Requisitos Previos**

### **Software Necesario:**
- **Node.js** (versión 18 o superior)
- **npm** o **yarn** (gestor de paquetes)
- **Git** (control de versiones)
- **Navegador web** (Chrome, Firefox, Safari, Edge)

### **Cuenta de Supabase:**
- Cuenta gratuita en [Supabase](https://supabase.com)
- Proyecto creado con PostgreSQL

## 🎯 **Instalación Paso a Paso**

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/contapyme.git
cd contapyme
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp config/env.example .env

# Editar .env con tus valores de Supabase
nano .env
```

**Variables necesarias en `.env`:**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### **4. Configurar Supabase**
```bash
# Copiar archivo de configuración
cp config/supabase.example.js src/lib/supabase.js

# Editar con tus valores
nano src/lib/supabase.js
```

### **5. Ejecutar Migración de Base de Datos**

#### **Opción A: Manual (Recomendado)**
1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Ir a **SQL Editor**
4. Ejecutar `database/migration.sql`
5. Ejecutar `database/functions.sql`

#### **Opción B: Automática**
```bash
# Verificar que la migración se ejecutó correctamente
node scripts/verify.js
```

### **6. Iniciar la Aplicación**
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## 🔧 **Configuración de Supabase**

### **Crear Proyecto en Supabase:**
1. Ir a [Supabase](https://supabase.com)
2. Crear cuenta gratuita
3. Crear nuevo proyecto
4. Anotar URL y Anon Key

### **Configurar Row Level Security (RLS):**
- Las políticas RLS se configuran automáticamente con la migración
- Verificar que estén activas en **Authentication > Policies**

### **Configurar Autenticación:**
1. Ir a **Authentication > Settings**
2. Configurar proveedores de autenticación (Email, Google, etc.)
3. Configurar redirecciones de URL

## 📊 **Verificación de Instalación**

### **Script de Verificación:**
```bash
node scripts/verify.js
```

### **Verificación Manual:**
1. ✅ Aplicación inicia sin errores
2. ✅ Login funciona correctamente
3. ✅ Dashboard carga sin problemas
4. ✅ Navegación entre módulos funciona
5. ✅ Formularios funcionan correctamente

## 🚨 **Solución de Problemas**

### **Error: "Faltan las variables de entorno"**
```bash
# Verificar que .env existe y tiene los valores correctos
cat .env
```

### **Error: "Cannot connect to Supabase"**
- Verificar URL y Anon Key en `.env`
- Verificar conexión a internet
- Verificar que el proyecto Supabase esté activo

### **Error: "Database migration failed"**
```bash
# Ejecutar verificación
node scripts/verify.js

# Si hay errores, ejecutar migración manual en Supabase Dashboard
```

### **Error: "RLS policy violation"**
- Verificar que el usuario tenga `empresa_id` asignado
- Verificar políticas RLS en Supabase Dashboard

## 📝 **Comandos Útiles**

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción

# Verificación
node scripts/verify.js    # Verificar instalación
npm run lint             # Verificar código
npm run type-check       # Verificar tipos TypeScript

# Base de datos
# Ver database/MIGRATION.md para más detalles
```

## 🎯 **Próximos Pasos**

Después de la instalación exitosa:

1. **Configurar empresa:** Crear primera empresa en el sistema
2. **Configurar usuarios:** Crear usuarios y asignar roles
3. **Importar datos:** Usar herramientas de importación masiva
4. **Configurar integraciones:** Mercado Pago, Google Drive, etc.

## 📞 **Soporte**

Si encuentras problemas:

1. **Revisar logs:** Consola del navegador y terminal
2. **Verificar documentación:** `docs/` para más detalles
3. **Ejecutar verificación:** `node scripts/verify.js`
4. **Crear issue:** En el repositorio de GitHub

---

**¡ContaPYME está listo para usar! 🎉** 