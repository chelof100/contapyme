import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, TrendingUp, TrendingDown, AlertCircle, FileText, Upload, Camera, X, Search, Filter, SortAsc, SortDesc, BarChart3, TrendingUp as TrendingUpIcon, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useProductos, useMovimientosStock, useAlertasStock, useRecetas } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';
import VentaFacturadaForm from '@/components/VentaFacturadaForm';
import AlertasStock from '@/components/AlertasStock';
import { useConfig } from '@/contexts/ConfigContext';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';

const Stock = () => {
  const { user } = useAuth();
  const { recetasEnabled, setRecetasEnabled } = useConfig();
  const { data: productos = [], loading: loadingProductos, create: createProducto, update: updateProducto } = useProductos();
  const { data: movimientos = [], loading: loadingMovimientos, create: createMovimiento } = useMovimientosStock();
  const { data: alertasStock = [] } = useAlertasStock();
  const { data: recetas = [], loading: loadingRecetas, create: createReceta } = useRecetas();
  const [activeTab, setActiveTab] = useState('alertas');

  // Función para manejar el cambio de pestaña activa
  const handleTabChange = (value: string) => {
    // Si se deshabilita recetas y estamos en la pestaña de recetas, cambiar a alertas
    if (value === 'recetas' && !recetasEnabled) {
      setActiveTab('alertas');
      toast.info('Habilita el módulo de recetas para acceder a esta función');
    } else {
      setActiveTab(value);
    }
  };
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [sortBy, setSortBy] = useState('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados para nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState({
    sku: '',
    descripcion: '',
    unidad_medida: '',
    precio_costo: 0,
    precio_venta_sugerido: 0,
    stock_inicial: 0,
    categoria: '',
    proveedor_principal: '',
    ubicacion: '',
    stock_minimo: 0
  });

  // Estados para movimientos
  const [movimiento, setMovimiento] = useState({
    tipo: 'ingreso' as 'ingreso' | 'egreso',
    sku: '',
    cantidad: 0,
    tipo_egreso: '',
    observaciones: '',
    proveedor: '',
    numero_remito: '',
    numero_factura: '',
    cliente: ''
  });

  // Función para manejar nuevo producto
  const handleNuevoProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoProducto.sku || !nuevoProducto.descripcion || !nuevoProducto.unidad_medida) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const productoData = {
        sku: nuevoProducto.sku,
        descripcion: nuevoProducto.descripcion,
        unidad_medida: nuevoProducto.unidad_medida,
        precio_costo: nuevoProducto.precio_costo,
        precio_venta_sugerido: nuevoProducto.precio_venta_sugerido,
        stock_actual: nuevoProducto.stock_inicial,
        stock_minimo: nuevoProducto.stock_minimo,
        categoria: nuevoProducto.categoria,
        proveedor_principal: nuevoProducto.proveedor_principal,
        ubicacion: nuevoProducto.ubicacion,
        activo: true
      };

      const nuevoProductoCreado = await createProducto(productoData);
      
      if (nuevoProductoCreado && nuevoProducto.stock_inicial > 0) {
        // Registrar movimiento inicial de stock
        await createMovimiento({
          producto_id: nuevoProductoCreado.id,
          sku: nuevoProducto.sku,
          tipo_movimiento: 'ingreso',
          cantidad: nuevoProducto.stock_inicial,
          stock_anterior: 0,
          stock_nuevo: nuevoProducto.stock_inicial,
          tipo_egreso: '',
          referencia: '',
          observaciones: 'Stock inicial del producto',
          usuario_id: user?.id || ''
        });
      }

      toast.success(`Producto "${nuevoProducto.descripcion}" creado exitosamente`);
      
      // Limpiar formulario
      setNuevoProducto({
        sku: '',
        descripcion: '',
        unidad_medida: '',
        precio_costo: 0,
        precio_venta_sugerido: 0,
        stock_inicial: 0,
        categoria: '',
        proveedor_principal: '',
        ubicacion: '',
        stock_minimo: 0
      });
    } catch (error) {
      console.error('Error al crear producto:', error);
      toast.error('Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar movimientos de stock
  const handleMovimientoStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movimiento.sku || !movimiento.cantidad) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    const producto = productos.find(p => p.sku === movimiento.sku);
    if (!producto) {
      toast.error('Producto no encontrado');
      return;
    }

    // Validar stock negativo para egresos
    if (movimiento.tipo === 'egreso' && producto.stock_actual < movimiento.cantidad) {
      toast.error('Stock insuficiente para realizar el egreso');
      return;
    }

    setLoading(true);

    try {
      const nuevoStock = movimiento.tipo === 'ingreso' 
        ? producto.stock_actual + movimiento.cantidad
        : producto.stock_actual - movimiento.cantidad;

      // Crear movimiento en Supabase
      await createMovimiento({
        producto_id: producto.id,
        sku: movimiento.sku,
        tipo_movimiento: movimiento.tipo,
        cantidad: movimiento.cantidad,
        stock_anterior: producto.stock_actual,
        stock_nuevo: nuevoStock,
        tipo_egreso: movimiento.tipo === 'egreso' ? movimiento.tipo_egreso : undefined,
        referencia: movimiento.numero_factura || movimiento.numero_remito,
        observaciones: movimiento.observaciones,
        usuario_id: user?.id
      });

      // Actualizar stock del producto
      await updateProducto(producto.id, { stock_actual: nuevoStock });

      toast.success(`Movimiento de ${movimiento.tipo} registrado exitosamente`);

      // Limpiar formulario
      setMovimiento({
        tipo: 'ingreso',
        sku: '',
        cantidad: 0,
        tipo_egreso: '',
        observaciones: '',
        proveedor: '',
        numero_remito: '',
        numero_factura: '',
        cliente: ''
      });

    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      toast.error('Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener badge de stock
  const getStockBadge = (producto: any) => {
    const stockMinimo = producto.stock_minimo || 10;
    if (producto.stock_actual <= 0) {
      return <Badge variant="destructive">Sin Stock</Badge>;
    } else if (producto.stock_actual <= stockMinimo) {
      return <Badge variant="secondary">Stock Bajo</Badge>;
    } else {
      return <Badge variant="default">Stock OK</Badge>;
    }
  };

  // Función para manejar código escaneado
  const handleScannedCode = (code: string) => {
    setScannedCode(code);
    setShowScanner(false);
    
    // Buscar producto por SKU
    const producto = productos.find(p => p.sku === code);
    if (producto) {
      toast.success(`Producto encontrado: ${producto.descripcion}`);
      // Aquí podrías abrir un modal para editar el producto o registrar movimiento
    } else {
      toast.info('Producto no encontrado. ¿Deseas crearlo?');
      // Aquí podrías abrir el formulario de nuevo producto con el SKU pre-llenado
      setNuevoProducto({...nuevoProducto, sku: code});
      setActiveTab('nuevo-producto');
    }
  };

  // Función para manejar importación masiva
  const handleBulkImport = async (file: File) => {
    setLoading(true);
    try {
      // Simular procesamiento de archivo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí iría la lógica real de importación
      toast.success('Importación completada exitosamente');
      setShowImport(false);
    } catch (error) {
      console.error('Error en importación:', error);
      toast.error('Error al importar productos');
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar y ordenar productos
  const getFilteredAndSortedProductos = () => {
    let filtered = productos.filter(producto => {
      const matchesSearch = searchTerm === '' || 
        producto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || producto.categoria === filterCategory;
      
      let matchesStock = true;
      if (filterStock === 'low') {
        matchesStock = producto.stock_actual <= producto.stock_minimo;
      } else if (filterStock === 'out') {
        matchesStock = producto.stock_actual <= 0;
      } else if (filterStock === 'ok') {
        matchesStock = producto.stock_actual > producto.stock_minimo;
      }
      
      return matchesSearch && matchesCategory && matchesStock;
    });

    // Ordenar productos
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'sku':
          aValue = a.sku;
          bValue = b.sku;
          break;
        case 'descripcion':
          aValue = a.descripcion;
          bValue = b.descripcion;
          break;
        case 'stock':
          aValue = a.stock_actual;
          bValue = b.stock_actual;
          break;
        case 'precio':
          aValue = a.precio_costo || 0;
          bValue = b.precio_costo || 0;
          break;
        case 'categoria':
          aValue = a.categoria || '';
          bValue = b.categoria || '';
          break;
        default:
          aValue = a.sku;
          bValue = b.sku;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // Obtener categorías únicas
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

  // Efecto para manejar cuando se deshabilita recetas
  useEffect(() => {
    if (!recetasEnabled && activeTab === 'recetas') {
      setActiveTab('alertas');
      toast.info('Módulo de recetas deshabilitado. Cambiando a Alertas.');
    }
  }, [recetasEnabled, activeTab]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Stock</h1>
          <p className="mt-2 text-gray-600">Control de inventario y alertas de stock</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={recetasEnabled}
              onCheckedChange={setRecetasEnabled}
            />
            <Label htmlFor="recetas" className="text-sm">
              Habilitar Recetas
            </Label>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowScanner(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              Escanear Código
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowImport(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Masivo
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                // Función para exportar reporte
                const reportData = productos.map(p => ({
                  SKU: p.sku,
                  Descripción: p.descripcion,
                  Unidad: p.unidad_medida,
                  'Stock Actual': p.stock_actual,
                  'Stock Mínimo': p.stock_minimo,
                  'Precio Costo': p.precio_costo,
                  'Precio Venta': p.precio_venta_sugerido,
                  'Valor Stock': p.stock_actual * (p.precio_costo || 0),
                  Estado: p.stock_actual <= p.stock_minimo ? 'Stock Bajo' : 'Stock OK'
                }));
                
                const csvContent = [
                  Object.keys(reportData[0] || {}).join(','),
                  ...reportData.map(row => Object.values(row).join(','))
                ].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte-stock-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                toast.success('Reporte exportado exitosamente');
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen de Stock */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingProductos ? '...' : productos.length}
            </div>
            <p className="text-xs text-muted-foreground">productos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingProductos ? '...' : productos.reduce((total, p) => total + p.stock_actual, 0)}
            </div>
            <p className="text-xs text-muted-foreground">unidades en stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Bajo Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingProductos ? '...' : alertasStock.length}
            </div>
            <p className="text-xs text-muted-foreground">requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loadingProductos ? '...' : productos.reduce((total, p) => total + (p.stock_actual * (p.precio_costo || 0)), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">valor de inventario</p>
          </CardContent>
        </Card>
      </div>

                              <Card>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                      <div className="p-4">
                        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
                                        <TabsTrigger value="alertas">🚨 Alertas</TabsTrigger>
                          <TabsTrigger value="productos">📦 Productos</TabsTrigger>
                          <TabsTrigger value="nuevo-producto">➕ Nuevo</TabsTrigger>
                          <TabsTrigger value="venta-automatica">🧾 Venta</TabsTrigger>
                          <TabsTrigger value="movimientos">🔄 Movimientos</TabsTrigger>
                          {recetasEnabled && (
                            <TabsTrigger value="recetas">🍳 Recetas</TabsTrigger>
                          )}
                          <TabsTrigger value="analisis">📊 Análisis</TabsTrigger>
                          <TabsTrigger value="historial">📋 Historial</TabsTrigger>
            </TabsList>
          </div>

                 <TabsContent value="alertas" className="space-y-6 p-6">
          <AlertasStock 
            productos={productos} 
            onUpdateProducto={updateProducto}
          />
        </TabsContent>

                 <TabsContent value="productos" className="space-y-6 p-6">
           <Card>
             <CardHeader>
               <CardTitle>Lista de Productos</CardTitle>
             </CardHeader>
             <CardContent>
               {/* Filtros y Búsqueda */}
               <div className="space-y-6 mb-8">
                                    <div className="flex flex-col md:flex-row gap-6">
                   {/* Búsqueda */}
                   <div className="flex-1">
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                       <Input
                         placeholder="Buscar por SKU, descripción o categoría..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="pl-10"
                       />
                     </div>
                   </div>
                   
                   {/* Filtros */}
                   <div className="flex gap-3">
                     <Select value={filterCategory} onValueChange={setFilterCategory}>
                       <SelectTrigger className="w-40">
                         <Filter className="h-4 w-4 mr-2" />
                         <SelectValue placeholder="Categoría" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">Todas las categorías</SelectItem>
                         {categorias.map(cat => (
                           <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     
                     <Select value={filterStock} onValueChange={setFilterStock}>
                       <SelectTrigger className="w-40">
                         <Package className="h-4 w-4 mr-2" />
                         <SelectValue placeholder="Stock" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">Todo el stock</SelectItem>
                         <SelectItem value="low">Stock bajo</SelectItem>
                         <SelectItem value="out">Sin stock</SelectItem>
                         <SelectItem value="ok">Stock OK</SelectItem>
                       </SelectContent>
                     </Select>
                     
                     <Select value={sortBy} onValueChange={setSortBy}>
                       <SelectTrigger className="w-40">
                         {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                         <SelectValue placeholder="Ordenar por" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="sku">SKU</SelectItem>
                         <SelectItem value="descripcion">Descripción</SelectItem>
                         <SelectItem value="stock">Stock</SelectItem>
                         <SelectItem value="precio">Precio</SelectItem>
                         <SelectItem value="categoria">Categoría</SelectItem>
                       </SelectContent>
                     </Select>
                     
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                     >
                       {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                     </Button>
                   </div>
                 </div>
                 
                 {/* Estadísticas de filtros */}
                 <div className="flex gap-4 text-sm text-muted-foreground">
                   <span>Mostrando {getFilteredAndSortedProductos().length} de {productos.length} productos</span>
                   {(searchTerm || filterCategory !== 'all' || filterStock !== 'all') && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => {
                         setSearchTerm('');
                         setFilterCategory('all');
                         setFilterStock('all');
                       }}
                     >
                       Limpiar filtros
                     </Button>
                   )}
                 </div>
               </div>
              {loadingProductos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando productos...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Precio Costo</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAndSortedProductos().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {productos.length === 0 
                            ? 'No hay productos registrados. Agrega tu primer producto.'
                            : 'No se encontraron productos con los filtros aplicados.'
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredAndSortedProductos().map((producto) => (
                        <TableRow key={producto.id}>
                          <TableCell className="font-medium">{producto.sku}</TableCell>
                          <TableCell>{producto.descripcion}</TableCell>
                          <TableCell>{producto.unidad_medida}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={producto.stock_actual <= producto.stock_minimo ? 'text-red-600 font-medium' : ''}>
                                {producto.stock_actual}
                              </span>
                              {getStockBadge(producto)}
                            </div>
                          </TableCell>
                          <TableCell>${producto.precio_costo?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>${producto.precio_venta_sugerido?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Badge variant={producto.activo ? 'default' : 'secondary'}>
                              {producto.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

                 <TabsContent value="nuevo-producto" className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNuevoProducto} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={nuevoProducto.sku}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, sku: e.target.value})}
                      placeholder="Código del producto"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción *</Label>
                    <Input
                      id="descripcion"
                      value={nuevoProducto.descripcion}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                      placeholder="Nombre del producto"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
                    <Select value={nuevoProducto.unidad_medida} onValueChange={(value) => setNuevoProducto({...nuevoProducto, unidad_medida: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidad">Unidad</SelectItem>
                        <SelectItem value="kg">Kilogramo</SelectItem>
                        <SelectItem value="l">Litro</SelectItem>
                        <SelectItem value="m">Metro</SelectItem>
                        <SelectItem value="m2">Metro Cuadrado</SelectItem>
                        <SelectItem value="m3">Metro Cúbico</SelectItem>
                        <SelectItem value="par">Par</SelectItem>
                        <SelectItem value="docena">Docena</SelectItem>
                        <SelectItem value="caja">Caja</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Input
                      id="categoria"
                      value={nuevoProducto.categoria}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                      placeholder="Categoría del producto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precio_costo">Precio de Costo</Label>
                    <Input
                      id="precio_costo"
                      type="number"
                      step="0.01"
                      value={nuevoProducto.precio_costo}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, precio_costo: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precio_venta">Precio de Venta Sugerido</Label>
                    <Input
                      id="precio_venta"
                      type="number"
                      step="0.01"
                      value={nuevoProducto.precio_venta_sugerido}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, precio_venta_sugerido: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock_inicial">Stock Inicial</Label>
                    <Input
                      id="stock_inicial"
                      type="number"
                      value={nuevoProducto.stock_inicial}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, stock_inicial: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                    <Input
                      id="stock_minimo"
                      type="number"
                      value={nuevoProducto.stock_minimo}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, stock_minimo: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proveedor">Proveedor Principal</Label>
                    <Input
                      id="proveedor"
                      value={nuevoProducto.proveedor_principal}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, proveedor_principal: e.target.value})}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input
                      id="ubicacion"
                      value={nuevoProducto.ubicacion}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, ubicacion: e.target.value})}
                      placeholder="Ubicación en almacén"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Producto'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

                 <TabsContent value="venta-automatica" className="space-y-6 p-6">
           <VentaFacturadaForm 
             productos={productos}
             onVentaProcesada={() => {
               // Recargar datos después de una venta
               toast.success('Venta procesada exitosamente');
             }}
           />
         </TabsContent>

                 <TabsContent value="movimientos" className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Movimiento de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMovimientoStock} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_movimiento">Tipo de Movimiento</Label>
                    <Select value={movimiento.tipo} onValueChange={(value) => setMovimiento({...movimiento, tipo: value as 'ingreso' | 'egreso'})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingreso">Ingreso</SelectItem>
                        <SelectItem value="egreso">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku_movimiento">SKU del Producto</Label>
                    <Select value={movimiento.sku} onValueChange={(value) => setMovimiento({...movimiento, sku: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((producto) => (
                          <SelectItem key={producto.id} value={producto.sku}>
                            {producto.sku} - {producto.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      value={movimiento.cantidad}
                      onChange={(e) => setMovimiento({...movimiento, cantidad: parseInt(e.target.value) || 0})}
                      placeholder="0"
                      min="1"
                    />
                  </div>
                  {movimiento.tipo === 'ingreso' && (
                    <div className="space-y-2">
                      <Label htmlFor="proveedor">Proveedor</Label>
                      <Input
                        id="proveedor"
                        value={movimiento.proveedor}
                        onChange={(e) => setMovimiento({...movimiento, proveedor: e.target.value})}
                        placeholder="Nombre del proveedor"
                      />
                    </div>
                  )}
                  {movimiento.tipo === 'ingreso' && (
                    <div className="space-y-2">
                      <Label htmlFor="numero_remito">Número de Remito</Label>
                      <Input
                        id="numero_remito"
                        value={movimiento.numero_remito}
                        onChange={(e) => setMovimiento({...movimiento, numero_remito: e.target.value})}
                        placeholder="Número de remito"
                      />
                    </div>
                  )}
                  {movimiento.tipo === 'ingreso' && (
                    <div className="space-y-2">
                      <Label htmlFor="numero_factura">Número de Factura</Label>
                      <Input
                        id="numero_factura"
                        value={movimiento.numero_factura}
                        onChange={(e) => setMovimiento({...movimiento, numero_factura: e.target.value})}
                        placeholder="Número de factura"
                      />
                    </div>
                  )}
                  {movimiento.tipo === 'egreso' && (
                    <div className="space-y-2">
                      <Label htmlFor="tipo_egreso">Tipo de Egreso</Label>
                      <Select value={movimiento.tipo_egreso} onValueChange={(value) => setMovimiento({...movimiento, tipo_egreso: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="venta">Venta</SelectItem>
                          <SelectItem value="merma">Merma</SelectItem>
                          <SelectItem value="traslado">Traslado</SelectItem>
                          <SelectItem value="ajuste">Ajuste</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {movimiento.tipo === 'egreso' && (
                    <div className="space-y-2">
                      <Label htmlFor="cliente">Cliente</Label>
                      <Input
                        id="cliente"
                        value={movimiento.cliente}
                        onChange={(e) => setMovimiento({...movimiento, cliente: e.target.value})}
                        placeholder="Nombre del cliente"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Input
                      id="observaciones"
                      value={movimiento.observaciones}
                      onChange={(e) => setMovimiento({...movimiento, observaciones: e.target.value})}
                      placeholder="Observaciones adicionales"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {movimiento.tipo === 'ingreso' ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {loading ? 'Registrando...' : 'Registrar Ingreso'}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 mr-2" />
                      {loading ? 'Registrando...' : 'Registrar Egreso'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

                 <TabsContent value="recetas" className="space-y-6 p-6">
           <Card>
             <CardHeader>
               <CardTitle>Gestión de Recetas</CardTitle>
               <p className="text-sm text-muted-foreground">
                 Define recetas para productos compuestos. Al vender una receta, se descontarán automáticamente los ingredientes.
               </p>
             </CardHeader>
             <CardContent>
               {recetasEnabled ? (
                 <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <h4 className="font-medium">Recetas Registradas</h4>
                     <Button size="sm">
                       <Plus className="h-4 w-4 mr-2" />
                       Nueva Receta
                     </Button>
                   </div>
                   
                   {loadingRecetas ? (
                     <div className="text-center py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                       <p className="mt-2 text-muted-foreground">Cargando recetas...</p>
                     </div>
                   ) : recetas.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                       <p>No hay recetas registradas</p>
                       <p className="text-sm">Las recetas te permiten crear productos compuestos por ingredientes</p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {recetas.map((receta) => (
                         <Card key={receta.id} className="p-4">
                           <div className="flex justify-between items-start">
                             <div>
                               <h5 className="font-medium">{receta.nombre_receta}</h5>
                               <p className="text-sm text-muted-foreground">{receta.descripcion}</p>
                               <div className="flex gap-2 mt-2">
                                 <Badge variant="outline">Costo: ${receta.costo_total?.toFixed(2)}</Badge>
                                 <Badge variant="outline">Precio: ${receta.precio_venta_sugerido?.toFixed(2)}</Badge>
                                 <Badge variant="outline">Margen: {((receta.precio_venta_sugerido - receta.costo_total) / receta.precio_venta_sugerido * 100).toFixed(1)}%</Badge>
                               </div>
                             </div>
                             <Button size="sm" variant="outline">
                               Editar
                             </Button>
                           </div>
                         </Card>
                       ))}
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                   <h4 className="font-medium mb-2">Módulo de Recetas Deshabilitado</h4>
                   <p className="text-sm text-muted-foreground mb-4">
                     Activa el módulo de recetas para gestionar productos compuestos
                   </p>
                   <Button 
                     onClick={() => setRecetasEnabled(true)}
                     size="sm"
                   >
                     Habilitar Recetas
                   </Button>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="analisis" className="space-y-6 p-6">
           <div className="grid gap-6 md:grid-cols-2">
             {/* Análisis de Categorías */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <BarChart3 className="h-5 w-5" />
                   Análisis por Categorías
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {categorias.length === 0 ? (
                     <p className="text-muted-foreground text-center py-4">
                       No hay categorías definidas
                     </p>
                   ) : (
                     categorias.map(categoria => {
                       const productosCategoria = productos.filter(p => p.categoria === categoria);
                       const stockTotal = productosCategoria.reduce((sum, p) => sum + p.stock_actual, 0);
                       const valorTotal = productosCategoria.reduce((sum, p) => sum + (p.stock_actual * (p.precio_costo || 0)), 0);
                       const productosBajoStock = productosCategoria.filter(p => p.stock_actual <= p.stock_minimo).length;
                       
                       return (
                         <div key={categoria} className="border rounded-lg p-4">
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="font-medium">{categoria}</h4>
                             <Badge variant={productosBajoStock > 0 ? 'destructive' : 'default'}>
                               {productosBajoStock} bajo stock
                             </Badge>
                           </div>
                           <div className="grid grid-cols-3 gap-4 text-sm">
                             <div>
                               <p className="text-muted-foreground">Productos</p>
                               <p className="font-semibold">{productosCategoria.length}</p>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Stock Total</p>
                               <p className="font-semibold">{stockTotal}</p>
                             </div>
                             <div>
                               <p className="text-muted-foreground">Valor</p>
                               <p className="font-semibold">${valorTotal.toFixed(2)}</p>
                             </div>
                           </div>
                         </div>
                       );
                     })
                   )}
                 </div>
               </CardContent>
             </Card>

             {/* Análisis de Movimientos */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <TrendingUpIcon className="h-5 w-5" />
                   Análisis de Movimientos
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="text-center p-4 bg-green-50 rounded-lg">
                       <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                       <p className="text-sm text-green-600">Ingresos</p>
                       <p className="text-2xl font-bold text-green-700">
                         {movimientos.filter(m => m.tipo_movimiento === 'ingreso').length}
                       </p>
                     </div>
                     <div className="text-center p-4 bg-red-50 rounded-lg">
                       <TrendingDown className="h-8 w-8 mx-auto text-red-600 mb-2" />
                       <p className="text-sm text-red-600">Egresos</p>
                       <p className="text-2xl font-bold text-red-700">
                         {movimientos.filter(m => m.tipo_movimiento === 'egreso').length}
                       </p>
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <h4 className="font-medium">Últimos Movimientos</h4>
                     {movimientos.slice(0, 5).map((mov, index) => (
                       <div key={index} className="flex justify-between items-center text-sm">
                         <span>{mov.sku}</span>
                         <div className="flex items-center gap-2">
                           <Badge variant={mov.tipo_movimiento === 'ingreso' ? 'default' : 'secondary'}>
                             {mov.cantidad}
                           </Badge>
                           <span className="text-muted-foreground">
                             {mov.tipo_movimiento === 'ingreso' ? '+' : '-'}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Productos Más Vendidos */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <TrendingUpIcon className="h-5 w-5" />
                   Productos Más Vendidos
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {(() => {
                     const egresos = movimientos.filter(m => m.tipo_movimiento === 'egreso');
                     const ventasPorProducto = egresos.reduce((acc, mov) => {
                       acc[mov.sku] = (acc[mov.sku] || 0) + mov.cantidad;
                       return acc;
                     }, {} as Record<string, number>);
                     
                     const topProductos = Object.entries(ventasPorProducto)
                       .sort(([,a], [,b]) => b - a)
                       .slice(0, 5);
                     
                     return topProductos.length === 0 ? (
                       <p className="text-muted-foreground text-center py-4">
                         No hay datos de ventas
                       </p>
                     ) : (
                       topProductos.map(([sku, cantidad], index) => {
                         const producto = productos.find(p => p.sku === sku);
                         return (
                           <div key={sku} className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                               <span className="text-sm font-medium text-muted-foreground">
                                 #{index + 1}
                               </span>
                               <div>
                                 <p className="font-medium">{producto?.descripcion || sku}</p>
                                 <p className="text-sm text-muted-foreground">{sku}</p>
                               </div>
                             </div>
                             <Badge variant="outline">{cantidad} unidades</Badge>
                           </div>
                         );
                       })
                     );
                   })()}
                 </div>
               </CardContent>
             </Card>

             {/* Alertas y Recomendaciones */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <AlertCircle className="h-5 w-5" />
                   Alertas y Recomendaciones
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {alertasStock.length > 0 ? (
                     <div className="space-y-3">
                       <div className="flex items-center gap-2 text-red-600">
                         <AlertCircle className="h-4 w-4" />
                         <span className="font-medium">{alertasStock.length} productos requieren atención</span>
                       </div>
                       {alertasStock.slice(0, 3).map((alerta, index) => (
                         <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                           <p className="font-medium text-red-800">{alerta.sku}</p>
                           <p className="text-sm text-red-600">
                             Stock actual: {alerta.stock_actual} (mínimo: {alerta.stock_minimo})
                           </p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-4">
                       <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                         <TrendingUp className="h-6 w-6 text-green-600" />
                       </div>
                       <p className="font-medium text-green-800">¡Excelente!</p>
                       <p className="text-sm text-green-600">Todos los productos tienen stock adecuado</p>
                     </div>
                   )}
                   
                   <div className="pt-4 border-t">
                     <h4 className="font-medium mb-2">Recomendaciones</h4>
                     <ul className="text-sm text-muted-foreground space-y-1">
                       <li>• Revisa productos con stock bajo semanalmente</li>
                       <li>• Actualiza precios de costo regularmente</li>
                       <li>• Configura alertas automáticas</li>
                       <li>• Exporta reportes mensuales</li>
                     </ul>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>

         <TabsContent value="historial" className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMovimientos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando movimientos...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Stock Anterior</TableHead>
                      <TableHead>Stock Nuevo</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay movimientos de stock registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimientos.map((mov) => (
                                                 <TableRow key={mov.id}>
                           <TableCell>{new Date().toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{mov.sku}</TableCell>
                          <TableCell>
                            <Badge variant={mov.tipo_movimiento === 'ingreso' ? 'default' : 'secondary'}>
                              {mov.tipo_movimiento === 'ingreso' ? 'Ingreso' : 'Egreso'}
                            </Badge>
                          </TableCell>
                          <TableCell>{mov.cantidad}</TableCell>
                          <TableCell>{mov.stock_anterior}</TableCell>
                          <TableCell>{mov.stock_nuevo}</TableCell>
                          <TableCell>{mov.observaciones}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </Card>

      {/* Modal del Escáner de Códigos de Barras */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Escanear Código de Barras</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Simulación de escáner de códigos de barras
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  En producción, aquí se activaría la cámara
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-code">Código Manual (para pruebas)</Label>
                <Input
                  id="manual-code"
                  placeholder="Ingresa un código de barras"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => handleScannedCode(scannedCode)}
                  disabled={!scannedCode}
                >
                  Procesar Código
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowScanner(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación Masiva */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Importación Masiva</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImport(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Formato Requerido</h4>
                <p className="text-sm text-blue-800 mb-2">
                  El archivo debe ser un Excel (.xlsx) o CSV con las siguientes columnas:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• SKU (obligatorio)</li>
                  <li>• Descripción (obligatorio)</li>
                  <li>• Unidad de Medida (obligatorio)</li>
                  <li>• Precio de Costo</li>
                  <li>• Precio de Venta</li>
                  <li>• Stock Inicial</li>
                  <li>• Stock Mínimo</li>
                  <li>• Categoría</li>
                  <li>• Proveedor</li>
                  <li>• Ubicación</li>
                </ul>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Arrastra y suelta tu archivo aquí
                </p>
                <p className="text-xs text-gray-500">
                  o haz clic para seleccionar
                </p>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleBulkImport(file);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Seleccionar Archivo
                </Button>
              </div>
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Procesando archivo...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;