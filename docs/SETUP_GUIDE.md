# 🚀 Guía de Setup - ContaPYME

Guía completa para configurar ContaPYME en cualquier ordenador en menos de 10 minutos.

## 📋 **Prerrequisitos**

### **Software Requerido:**
- ✅ **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- ✅ **Git** - [Descargar aquí](https://git-scm.com/)
- ✅ **Editor de código** - VS Code recomendado

### **Cuentas Requeridas:**
- ✅ **Supabase** - [Crear cuenta](https://supabase.com/)
- ✅ **N8N** (opcional) - [Crear cuenta](https://n8n.io/)

## 🚀 **Setup Automático (Recomendado)**

### **1️⃣ Clonar Repositorio**
```bash
git clone https://github.com/chelof100/contapyme.git
cd contapyme
```

### **2️⃣ Setup Automático**
```bash
# Setup completo automático
npm run setup
```

**¡Eso es todo!** El script automático:
- ✅ Verifica prerrequisitos
- ✅ Instala dependencias
- ✅ Crea archivo .env
- ✅ Verifica estructura del proyecto
- ✅ Guía para configuración manual

## 🔧 **Setup Manual (Alternativo)**

### **1️⃣ Instalar Dependencias**
```bash
npm install
```

### **2️⃣ Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar .env con tus credenciales
code .env
```

**Variables OBLIGATORIAS:**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### **3️⃣ Configurar Supabase**

#### **A. Crear Proyecto**
1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Crea nuevo proyecto
3. Anota URL y claves

#### **B. Ejecutar Migraciones**
1. Ve a **SQL Editor** en tu proyecto
2. Ejecuta: `supabase/migrations/20250201000018_complete_fresh_start.sql`
3. Verifica que se crearon las tablas

#### **C. Crear Usuarios de Prueba**
```sql
-- Crear empresa por defecto
INSERT INTO empresa (nombre, email, activa) 
VALUES ('Mi Empresa', 'admin@miempresa.com', true);

-- Crear usuario admin
-- (Se crea automáticamente al registrarse en Supabase Auth)
```

### **4️⃣ Configurar N8N (Opcional)**
```bash
# Setup básico de N8N
npm run setup:n8n:simple

# Setup completo de N8N
npm run setup:n8n
```

## 🧪 **Verificar Instalación**

### **1️⃣ Verificación Automática**
```bash
npm run verify
```

### **2️⃣ Verificación Manual**
```bash
# Ejecutar aplicación
npm run dev

# Abrir en navegador
# http://localhost:5173
```

### **3️⃣ Login de Prueba**
- **Email:** admin@contapyme.com
- **Password:** admin123

## 🔍 **Troubleshooting Común**

### **❌ Error: "permission denied for table empresa"**
**Solución:** Verificar que las variables de entorno estén correctas en `.env`

### **❌ Error: "relation does not exist"**
**Solución:** Ejecutar la migración SQL en Supabase Dashboard

### **❌ Error: "npm install failed"**
**Solución:** 
```bash
# Limpiar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

### **❌ Error: "Supabase connection failed"**
**Solución:** Verificar URL y claves en `.env`

## 📁 **Estructura del Proyecto**

```
contapyme/
├── src/                    # Código fuente principal
│   ├── components/         # Componentes React
│   ├── pages/             # Páginas de la aplicación
│   ├── hooks/             # Custom hooks
│   ├── services/          # Servicios externos
│   └── types/             # Definiciones TypeScript
├── supabase/              # Configuración Supabase
│   └── migrations/        # Migraciones de base de datos
├── n8n-workflows/         # Workflows de automatización
├── docs/                  # Documentación técnica
├── scripts/               # Scripts de setup
└── demo/                  # Versión de demostración
```

## 🎯 **Comandos Útiles**

| Comando | Descripción |
|---------|-------------|
| `npm run setup` | Setup automático completo |
| `npm run verify` | Verificar estado del sistema |
| `npm run dev` | Ejecutar en desarrollo |
| `npm run build` | Construir para producción |
| `npm run test` | Ejecutar tests |
| `npm run lint` | Verificar código |

## 🔐 **Configuración de Seguridad**

### **Variables de Entorno Sensibles:**
- ✅ **NUNCA** subas `.env` al repositorio
- ✅ **SÍ** sube `env.example` actualizado
- ✅ Usa `.gitignore` para excluir `.env`

### **Claves de Supabase:**
- ✅ **Anon Key:** Segura para frontend
- ✅ **Service Role Key:** Solo para scripts backend
- ✅ **URL:** Pública, no es sensible

## 📚 **Recursos Adicionales**

- [Documentación Supabase](https://supabase.com/docs)
- [Guía N8N](https://docs.n8n.io/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 **Soporte**

### **Problemas Comunes:**
1. **Verificar Node.js 18+**
2. **Verificar variables de entorno**
3. **Verificar migraciones ejecutadas**
4. **Verificar conexión a Supabase**

### **Contacto:**
- **Issues:** [GitHub Issues](https://github.com/chelof100/contapyme/issues)
- **Wiki:** [GitHub Wiki](https://github.com/chelof100/contapyme/wiki)
- **Documentación:** [docs/](docs/)

---

**¡ContaPYME está listo para usar! 🚀**

Si tienes problemas, revisa esta guía o abre un issue en GitHub.
