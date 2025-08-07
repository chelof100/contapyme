# Configuración de n8n para ContaPYME - Cliente Único

## 🎯 Configuración Actual

- **URL de n8n**: https://n8n.n8ncloud.top/
- **Modo**: Cliente Único (sin multi-tenant)
- **Webhooks**: Simples sin prefijos

## 📋 Pasos para Configurar n8n

### 1. Importar Workflows

Ve a tu workspace de n8n y importa los siguientes workflows:

1. **Emitir Factura**: `n8n-workflows/emitir-factura.json`
2. **Actualizar Stock**: `n8n-workflows/actualizar-stock.json`
3. **Registrar Pago**: `n8n-workflows/registrar-pago.json`
4. **Alerta Stock**: `n8n-workflows/alerta-stock.json`

### 2. Configurar Variables de Entorno en n8n

En tu workspace de n8n, ve a Settings > Variables y configura:

```
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-servicio

# AFIP (opcional)
AFIP_CUIT=20123456789
AFIP_TOKEN=tu-token-afip
AFIP_SIGN=tu-sign-afip

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-aplicación

# WhatsApp (opcional)
WHATSAPP_API_TOKEN=tu-token-whatsapp
WHATSAPP_PHONE_NUMBER=+5491112345678

# API Keys
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZmQyZWYyMi0xZWVhLTQ0NzctYTMxMy03NjQ1OTk1ZTZjZDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzMjMzMjUyfQ.cQ1vFdsJYEwI5I2DFmariRtu99XVytyRkJaCu2ZGkMo
```

### 3. Configurar Webhooks

Cada workflow debe tener un webhook configurado de forma simple:

- **Health Check**: https://n8n.n8ncloud.top/webhook/health-check
- **Emitir Factura**: https://n8n.n8ncloud.top/webhook/emitir-factura
- **Actualizar Stock**: https://n8n.n8ncloud.top/webhook/actualizar-stock
- **Registrar Pago**: https://n8n.n8ncloud.top/webhook/registrar-pago
- **Alerta Stock**: https://n8n.n8ncloud.top/webhook/alerta-stock

### 4. Configurar ContaPYME

1. **Copia estas variables a tu `.env.local`:**
```env
VITE_N8N_BASE_URL=https://n8n.n8ncloud.top/
VITE_N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZmQyZWYyMi0xZWVhLTQ0NzctYTMxMy03NjQ1OTk1ZTZjZDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzMjMzMjUyfQ.cQ1vFdsJYEwI5I2DFmariRtu99XVytyRkJaCu2ZGkMo
```

2. Ejecuta `npm run dev` para iniciar ContaPYME
3. Ve a Configuración > n8n
4. Configura la URL base y API key
5. Haz clic en "Probar Conexión"

### 5. Probar Conexión

1. Ve a Configuración > n8n
2. Haz clic en "Probar Conexión"
3. Verifica que todos los endpoints respondan correctamente

## 🧪 Comandos de Prueba

### Health Check
```bash
curl -X POST https://n8n.n8ncloud.top/webhook/health-check \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Test de Emisión de Factura
```bash
curl -X POST https://n8n.n8ncloud.top/webhook/emitir-factura \
  -H "Content-Type: application/json" \
  -d '{
    "factura_id": "test-123",
    "cuit_cliente": "20-12345678-9",
    "total": 1000,
    "test_mode": true
  }'
```

## ✅ Checklist de Verificación

- [ ] n8n Cloud configurado y accesible
- [ ] Variables de entorno configuradas en n8n
- [ ] Workflows importados correctamente
- [ ] Webhooks activos sin prefijos
- [ ] ContaPYME configurado con las URLs correctas
- [ ] Prueba de conexión exitosa
- [ ] Health check funcionando
- [ ] Workflows respondiendo correctamente

## 🚀 Próximos Pasos

1. Completa la configuración en ContaPYME
2. Importa los workflows en n8n
3. Configura las variables de entorno
4. Prueba la conexión desde ContaPYME
5. Realiza pruebas de los workflows

## 📚 Documentación Adicional

- [Guía Completa de n8n](docs/SETUP_N8N_COMPLETO.md)
- [Integración n8n](docs/N8N_INTEGRATION.md)

## 🔄 Escalabilidad Futura

Cuando necesites escalar a múltiples clientes:

1. **Opción A**: Clonar workflows por cliente (recomendado)
2. **Opción B**: Habilitar multi-tenant en ContaPYME
3. **Opción C**: Instancias separadas de n8n por cliente

La configuración actual es perfecta para empezar y escalar fácilmente.
