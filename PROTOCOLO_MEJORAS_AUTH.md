# 🔐 PROTOCOLO DE MEJORAS DE AUTENTICACIÓN

## **CONFIGURACIONES RECOMENDADAS PARA SUPABASE AUTH**

### **1. Reducir OTP Expiry (CRÍTICO)**
**Problema**: OTP expiry configurado a más de 1 hora
**Solución**: Configurar a 30 minutos máximo

**Pasos en Supabase Dashboard:**
1. Ir a Authentication → Settings
2. En "Email" section → "OTP expiry"
3. Cambiar de 3600 segundos a 1800 segundos (30 min)

### **2. Habilitar Protección contra Passwords Filtrados**
**Problema**: Protección deshabilitada contra passwords comprometidos
**Solución**: Habilitar verificación con HaveIBeenPwned

**Pasos en Supabase Dashboard:**
1. Ir a Authentication → Settings
2. En "Password" section
3. Habilitar "Leaked Password Protection"

### **3. Configurar Password Policy Más Estricta**
**Recomendaciones adicionales:**
- Mínimo 12 caracteres
- Requerir mayúsculas, minúsculas, números y símbolos
- Prevenir reutilización de últimas 5 passwords

### **4. Configurar Rate Limiting**
**Para prevenir ataques de fuerza bruta:**
- Login attempts: 5 intentos por 15 minutos
- Password reset: 3 intentos por hora
- OTP requests: 3 intentos por 5 minutos

### **5. Configurar Session Management**
**Configuraciones recomendadas:**
- Session timeout: 24 horas
- Refresh token rotation: Habilitado
- Concurrent sessions: Limitar a 3 por usuario

## **IMPLEMENTACIÓN**

### **Paso 1: Configuraciones de Dashboard**
```
✅ Reducir OTP expiry a 30 minutos
✅ Habilitar Leaked Password Protection  
✅ Configurar Rate Limiting
✅ Configurar Session Management
```

### **Paso 2: Validaciones en Frontend**
```typescript
// En AuthContext.tsx - Agregar validaciones adicionales
const validatePassword = (password: string): boolean => {
  const minLength = 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSymbol;
};
```

### **Paso 3: Monitoreo de Seguridad**
```sql
-- Query para monitorear intentos de login fallidos
SELECT 
  email,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM auth.audit_log_entries 
WHERE event_type = 'user_signedin_failed'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 3
ORDER BY failed_attempts DESC;
```

## **VERIFICACIÓN**

### **Checklist de Seguridad:**
- [ ] OTP expiry ≤ 30 minutos
- [ ] Leaked password protection habilitado
- [ ] Rate limiting configurado
- [ ] Session timeout configurado
- [ ] Password policy estricta
- [ ] Monitoreo de intentos fallidos

### **Testing:**
1. Probar login con password comprometido (debe fallar)
2. Probar rate limiting (5 intentos fallidos)
3. Verificar expiración de OTP
4. Verificar timeout de sesión

## **MANTENIMIENTO**

### **Revisiones Mensuales:**
- Revisar logs de intentos fallidos
- Actualizar lista de passwords comprometidos
- Verificar configuraciones de seguridad
- Revisar usuarios con múltiples sesiones activas

### **Alertas Automáticas:**
- Más de 10 intentos fallidos por hora
- Uso de passwords comprometidos
- Sesiones anómalas (ubicación/dispositivo)
- Múltiples sesiones concurrentes por usuario
