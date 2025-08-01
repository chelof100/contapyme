# 🧪 PLAN DE PRUEBAS - CONTAPYME MIGRADO

## 📋 **Estado Actual:**
✅ **Migración 100% completada** - Todas las tablas, campos, funciones y triggers creados

## 🎯 **PASOS DE PRUEBA**

### **1. 🚀 VERIFICACIÓN INICIAL**
- [ ] Aplicación iniciada en `http://localhost:5173`
- [ ] Login funcionando correctamente
- [ ] Dashboard cargando sin errores
- [ ] Navegación entre módulos funcionando

### **2. 📦 MÓDULO DE PRODUCTOS**
- [ ] **Crear producto nuevo:**
  - [ ] Campo `nombre` funcionando
  - [ ] Campo `codigo_barras` funcionando
  - [ ] Campo `imagen_url` funcionando
  - [ ] Campo `peso_kg` funcionando
  - [ ] Campo `volumen_l` funcionando
  - [ ] Campo `fecha_vencimiento` funcionando
  - [ ] Campo `numero_lote` funcionando
  - [ ] Guardar producto exitosamente

- [ ] **Escáner de códigos de barras:**
  - [ ] Componente `BarcodeScanner` cargando
  - [ ] Escaneo funcionando
  - [ ] Búsqueda por código de barras
  - [ ] Actualización automática de stock

- [ ] **Importación masiva:**
  - [ ] Componente `BulkImport` funcionando
  - [ ] Carga de archivo CSV
  - [ ] Validación de datos
  - [ ] Importación exitosa

### **3. 🧾 MÓDULO DE FACTURACIÓN**
- [ ] **Crear factura nueva:**
  - [ ] Formulario `FacturaForm` cargando
  - [ ] Selección de productos funcionando
  - [ ] Cálculo automático de subtotales
  - [ ] Cálculo automático de IVA (21%)
  - [ ] Descripción automática generada
  - [ ] Guardar factura exitosamente

- [ ] **Integración productos-facturas:**
  - [ ] Tabla `factura_productos` funcionando
  - [ ] Productos agregados a factura
  - [ ] Actualización automática de totales
  - [ ] Trigger `tr_factura_productos_totales` activo

- [ ] **Confirmar factura:**
  - [ ] Cambio de estado a "confirmada"
  - [ ] Trigger `tr_facturas_emitidas_procesar_venta` activo
  - [ ] Stock actualizado automáticamente
  - [ ] Movimiento de stock registrado

### **4. 📊 MÓDULO DE STOCK**
- [ ] **Alertas de stock:**
  - [ ] Componente `AlertasStock` funcionando
  - [ ] Productos con stock bajo mostrados
  - [ ] Notificaciones automáticas

- [ ] **Movimientos de stock:**
  - [ ] Tabla `movimientos_stock` actualizada
  - [ ] Historial de movimientos visible
  - [ ] Trazabilidad completa

### **5. 👥 MÓDULO DE PROVEEDORES**
- [ ] **Crear proveedor:**
  - [ ] Tabla `proveedores` funcionando
  - [ ] Formulario de proveedor
  - [ ] Validación de CUIT
  - [ ] Guardar proveedor exitosamente

### **6. 👤 MÓDULO DE CLIENTES**
- [ ] **Crear cliente:**
  - [ ] Tabla `clientes` funcionando
  - [ ] Formulario de cliente
  - [ ] Gestión de límite de crédito
  - [ ] Guardar cliente exitosamente

### **7. 🏷️ MÓDULO DE CATEGORÍAS**
- [ ] **Crear categoría:**
  - [ ] Tabla `categorias` funcionando
  - [ ] Categorías jerárquicas
  - [ ] Asignación a productos

### **8. 💰 HISTORIAL DE PRECIOS**
- [ ] **Cambiar precio de producto:**
  - [ ] Tabla `historial_precios` funcionando
  - [ ] Trigger `tr_productos_cambio_precio` activo
  - [ ] Registro automático de cambios
  - [ ] Historial visible

### **9. ⚙️ CONFIGURACIÓN DE ENDPOINTS**
- [ ] **Gestión de configuraciones:**
  - [ ] Tabla `endpoint_configurations_history` funcionando
  - [ ] Tabla `configuration_backups` funcionando
  - [ ] Tabla `configuration_tests` funcionando
  - [ ] Sistema de backups automáticos

### **10. 🔧 FUNCIONES AUTOMÁTICAS**
- [ ] **Verificar funciones:**
  - [ ] `calcular_subtotal_factura()` funcionando
  - [ ] `actualizar_totales_factura()` funcionando
  - [ ] `procesar_venta_productos()` funcionando
  - [ ] `registrar_cambio_precio()` funcionando

## 🚨 **POSIBLES PROBLEMAS Y SOLUCIONES**

### **Problema: Error de RLS (Row Level Security)**
**Solución:** Verificar que el usuario tenga `empresa_id` asignado

### **Problema: Funciones no encontradas**
**Solución:** Ejecutar `create-functions-triggers.sql` nuevamente

### **Problema: Triggers no activos**
**Solución:** Verificar que las tablas tengan RLS habilitado

### **Problema: Campos no visibles en formularios**
**Solución:** Actualizar componentes React para incluir nuevos campos

## 📝 **COMANDOS ÚTILES**

```bash
# Verificar estado de la aplicación
npm run dev

# Verificar migración
node final-verification.js

# Verificar solo funciones
node verify-functions-only.js

# Limpiar caché si hay problemas
npm run build
npm run dev
```

## 🎯 **CRITERIOS DE ÉXITO**

✅ **Aplicación inicia sin errores**
✅ **Todos los formularios funcionan**
✅ **Integración productos-facturas automática**
✅ **Cálculos automáticos funcionando**
✅ **Triggers activos y funcionando**
✅ **RLS funcionando correctamente**
✅ **Interfaz responsive y moderna**

## 📞 **SOPORTE**

Si encuentras algún problema:
1. Revisar logs de la consola del navegador
2. Revisar logs de Supabase
3. Ejecutar scripts de verificación
4. Verificar que todas las migraciones se aplicaron

---

**¡Listo para probar! 🚀** 