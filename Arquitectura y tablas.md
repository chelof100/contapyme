🏢 ARQUITECTURA SIMPLE:
•	UNA SOLA empresa activa en todo momento
•	NO multi-tenant - cada cliente tendrá su propia instancia y base de datos
•	Developer tiene super poderes totales
🔄 FLUJO DE empresa_id:
1.	Developer crea/modifica empresa → Sistema genera nuevo id de empresa (Developer y admin de onepyme tienen empresa Test con el id que los identifica)
2.	TODOS los usuarios (nuevos) cambian al nuevo id empresa una vez que el developer ponga los datos de la empresa usuaria en configuracion.
3.	el sistema generara y guardara en la tabla los id de las empresas que se generen y los usuarios que se generen luego del cambio seran con ese id. (inicialmente la tabla tendra por defecto la empresa test que es donde estan el developer y el admin de onepyme)
4. 1.	Cuando developer cambia empresa → TODOS los usuarios existentes cambian su id empresa id nuevo
2.	No hay separación histórica - todos los usuarios siempre tienen el mismo empresa_id
3.	Es un sistema de cliente único - no multi-tenant
4.	Developer puede cambiar empresa y esto afecta a toda la base de datos

✅ TABLAS Base necesarias OnePyme (43 tablas):
1.	AUTENTICACIÓN Y USUARIOS:
•	usuarios ✅
•	profiles ✅
•	roles ✅
•	permisos ✅
•	usuarios_roles ✅
•	usuarios_permisos ✅
2.	EMPRESA:
•	empresa (usuaria del sistema) ✅
•	empresas (proveedores del usuario del sistema) ✅
3.	PRODUCTOS Y STOCK:
•	productos ✅
•	servicios ✅
•	stock ✅
•	movimientos_stock ✅
•	alertas_stock ✅
•	historial_precios ✅
•	categorias ✅
•	categorias_financieras ✅
4.	FACTURACIÓN:
•	facturas_emitidas ✅
•	facturas_recibidas ✅
•	factura_productos ✅
•	pagos ✅
•	cobros ✅
5.	COMPRAS:
•	ordenes_compra ✅
•	recepcion_productos ✅
6.	CRM:
•	clientes ✅
•	contactos ✅
•	interacciones ✅
•	etapas_pipeline ✅
•	oportunidades ✅
•	actividades ✅
•	campanas ✅
7.	ERP:
•	empleados ✅
•	tiempo_trabajado ✅
•	proyectos ✅
•	tareas_proyecto ✅
•	presupuestos ✅
•	cash_flow_proyecciones ✅
•	indicadores_kpi ✅
•	asistencia ✅
•	liquidaciones ✅
8.	RECETAS:
•	recetas ✅
•	ingredientes_receta ✅
•	ventas_recetas ✅
9.	CONFIGURACIÓN:
•	endpoint_configurations_history ✅
•	configuration_backups ✅
•	configuration_tests ✅
10.	ANALÍTICAS:
•	user_actions ✅
•	user_preferences ✅
•	workflow_logs ✅
•	workflow_metrics ✅
11.	BANCARIO:
•	cuentas_bancarias ✅
•	transacciones_bancarias ✅

�� FUNCIONES DEL SISTEMA:
•	get_current_user_empresa_id() ✅
•	get_current_user_role() ✅
•	handle_new_user() ✅
•	update_updated_at_column() ✅
📋 ENUMS:
•	estado_actividad ✅
•	estado_factura ✅
•	estado_orden ✅
•	estado_proyecto ✅
•	prioridad ✅
•	tipo_actividad ✅
•	tipo_movimiento ✅
•	tipo_pago ✅
•	user_role ✅



