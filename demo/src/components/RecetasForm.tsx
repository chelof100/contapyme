import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, ChefHat, Calculator, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRecetas, useProductos } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';
import { useAuth } from '@/contexts/AuthContext';

interface IngredienteReceta {
  producto_id: string;
  sku: string;
  descripcion: string;
  cantidad_requerida: number;
  unidad_medida: string;
  precio_costo: number;
  costo_ingrediente: number;
}

interface RecetaFormData {
  id_producto_venta_final: string;
  nombre_receta: string;
  descripcion: string;
  precio_venta_sugerido: number;
  ingredientes: IngredienteReceta[];
}

const RecetasForm: React.FC = () => {
  const { user } = useAuth();
  const { data: recetas, loading: loadingRecetas, create: createReceta, update: updateReceta } = useRecetas();
  const { data: productos, loading: loadingProductos } = useProductos();
  
  const [isOpen, setIsOpen] = useState(false);
  const [recetaForm, setRecetaForm] = useState<RecetaFormData>({
    id_producto_venta_final: '',
    nombre_receta: '',
    descripcion: '',
    precio_venta_sugerido: 0,
    ingredientes: []
  });

  const [ingredienteTemp, setIngredienteTemp] = useState({
    producto_id: '',
    cantidad_requerida: 0,
    unidad_medida: ''
  });

  const [editingReceta, setEditingReceta] = useState<string | null>(null);

  // Calcular costo total de la receta
  const calcularCostoTotal = () => {
    return recetaForm.ingredientes.reduce((total, ingrediente) => {
      return total + ingrediente.costo_ingrediente;
    }, 0);
  };

  // Calcular margen de ganancia
  const calcularMargen = () => {
    const costoTotal = calcularCostoTotal();
    if (costoTotal === 0) return 0;
    return ((recetaForm.precio_venta_sugerido - costoTotal) / costoTotal) * 100;
  };

  // Agregar ingrediente a la receta
  const agregarIngrediente = () => {
    if (!ingredienteTemp.producto_id || ingredienteTemp.cantidad_requerida <= 0) {
      toast.error('Complete todos los campos del ingrediente');
      return;
    }

    const producto = productos.find(p => p.id === ingredienteTemp.producto_id);
    if (!producto) {
      toast.error('Producto no encontrado');
      return;
    }

    const costoIngrediente = producto.precio_costo * ingredienteTemp.cantidad_requerida;

    const nuevoIngrediente: IngredienteReceta = {
      producto_id: ingredienteTemp.producto_id,
      sku: producto.sku,
      descripcion: producto.descripcion,
      cantidad_requerida: ingredienteTemp.cantidad_requerida,
      unidad_medida: ingredienteTemp.unidad_medida || producto.unidad_medida,
      precio_costo: producto.precio_costo,
      costo_ingrediente: costoIngrediente
    };

    setRecetaForm({
      ...recetaForm,
      ingredientes: [...recetaForm.ingredientes, nuevoIngrediente]
    });

    setIngredienteTemp({
      producto_id: '',
      cantidad_requerida: 0,
      unidad_medida: ''
    });
  };

  // Eliminar ingrediente de la receta
  const eliminarIngrediente = (index: number) => {
    const nuevosIngredientes = recetaForm.ingredientes.filter((_, i) => i !== index);
    setRecetaForm({
      ...recetaForm,
      ingredientes: nuevosIngredientes
    });
  };

  // Guardar receta
  const guardarReceta = async () => {
    if (!recetaForm.nombre_receta || recetaForm.ingredientes.length === 0) {
      toast.error('Complete el nombre de la receta y agregue al menos un ingrediente');
      return;
    }

    try {
      const costoTotal = calcularCostoTotal();
      
      const recetaData = {
        id_producto_venta_final: recetaForm.id_producto_venta_final,
        nombre_receta: recetaForm.nombre_receta,
        descripcion: recetaForm.descripcion,
        precio_venta_sugerido: recetaForm.precio_venta_sugerido,
        costo_total: costoTotal,
        activa: true
      };

      if (editingReceta) {
        await updateReceta(editingReceta, recetaData);
        toast.success('Receta actualizada correctamente');
      } else {
        await createReceta(recetaData);
        toast.success('Receta creada correctamente');
      }

      // Enviar a n8n para procesamiento adicional
      try {
        await webhookService.crearReceta({
          ...recetaData,
          ingredientes: recetaForm.ingredientes,
          usuario_id: user?.id
        });
      } catch (webhookError) {
        console.warn('Error enviando a n8n, pero receta guardada en Supabase:', webhookError);
      }

      // Limpiar formulario
      setRecetaForm({
        id_producto_venta_final: '',
        nombre_receta: '',
        descripcion: '',
        precio_venta_sugerido: 0,
        ingredientes: []
      });
      setEditingReceta(null);
      setIsOpen(false);

    } catch (error) {
      console.error('Error guardando receta:', error);
      toast.error('Error al guardar la receta');
    }
  };

  // Editar receta existente
  const editarReceta = (receta: any) => {
    setEditingReceta(receta.id);
    setRecetaForm({
      id_producto_venta_final: receta.id_producto_venta_final,
      nombre_receta: receta.nombre_receta,
      descripcion: receta.descripcion || '',
      precio_venta_sugerido: receta.precio_venta_sugerido || 0,
      ingredientes: [] // Los ingredientes se cargarían desde la base de datos
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Gestión de Recetas
          </h2>
          <p className="text-muted-foreground">
            Administra las recetas para productos compuestos
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Receta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReceta ? 'Editar Receta' : 'Nueva Receta'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Datos básicos de la receta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre_receta">Nombre de la Receta *</Label>
                  <Input
                    id="nombre_receta"
                    value={recetaForm.nombre_receta}
                    onChange={(e) => setRecetaForm({...recetaForm, nombre_receta: e.target.value})}
                    placeholder="Ej: Pizza Margherita"
                  />
                </div>
                <div>
                  <Label htmlFor="id_producto_venta_final">ID Producto Final</Label>
                  <Input
                    id="id_producto_venta_final"
                    value={recetaForm.id_producto_venta_final}
                    onChange={(e) => setRecetaForm({...recetaForm, id_producto_venta_final: e.target.value})}
                    placeholder="ID del producto final"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={recetaForm.descripcion}
                    onChange={(e) => setRecetaForm({...recetaForm, descripcion: e.target.value})}
                    placeholder="Descripción de la receta"
                  />
                </div>
                <div>
                  <Label htmlFor="precio_venta_sugerido">Precio de Venta Sugerido</Label>
                  <Input
                    id="precio_venta_sugerido"
                    type="number"
                    step="0.01"
                    value={recetaForm.precio_venta_sugerido}
                    onChange={(e) => setRecetaForm({...recetaForm, precio_venta_sugerido: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Agregar ingredientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Agregar Ingredientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="producto">Producto</Label>
                      <Select value={ingredienteTemp.producto_id} onValueChange={(value) => setIngredienteTemp({...ingredienteTemp, producto_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.map((producto) => (
                            <SelectItem key={producto.id} value={producto.id}>
                              {producto.descripcion} ({producto.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cantidad">Cantidad</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        step="0.01"
                        value={ingredienteTemp.cantidad_requerida}
                        onChange={(e) => setIngredienteTemp({...ingredienteTemp, cantidad_requerida: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unidad_medida">Unidad</Label>
                      <Select value={ingredienteTemp.unidad_medida} onValueChange={(value) => setIngredienteTemp({...ingredienteTemp, unidad_medida: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gr">Gramos</SelectItem>
                          <SelectItem value="kg">Kilogramos</SelectItem>
                          <SelectItem value="ml">Mililitros</SelectItem>
                          <SelectItem value="lt">Litros</SelectItem>
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="cucharada">Cucharada</SelectItem>
                          <SelectItem value="cucharadita">Cucharadita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={agregarIngrediente} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de ingredientes */}
              {recetaForm.ingredientes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Ingredientes de la Receta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Costo</TableHead>
                          <TableHead>Costo Ingrediente</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recetaForm.ingredientes.map((ingrediente, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{ingrediente.descripcion}</div>
                                <div className="text-sm text-muted-foreground">{ingrediente.sku}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {ingrediente.cantidad_requerida} {ingrediente.unidad_medida}
                            </TableCell>
                            <TableCell>${ingrediente.precio_costo.toFixed(2)}</TableCell>
                            <TableCell>${ingrediente.costo_ingrediente.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => eliminarIngrediente(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Resumen de costos */}
              {recetaForm.ingredientes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Resumen de Costos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Costo Total</Label>
                        <div className="text-2xl font-bold">${calcularCostoTotal().toFixed(2)}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Precio Sugerido</Label>
                        <div className="text-2xl font-bold">${recetaForm.precio_venta_sugerido.toFixed(2)}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Margen</Label>
                        <div className="text-2xl font-bold">
                          <Badge variant={calcularMargen() >= 30 ? "default" : "secondary"}>
                            {calcularMargen().toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarReceta} disabled={recetaForm.ingredientes.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingReceta ? 'Actualizar' : 'Guardar'} Receta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de recetas existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Recetas Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecetas ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando recetas...</p>
            </div>
          ) : recetas.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay recetas</h3>
              <p className="text-muted-foreground">
                Crea tu primera receta para comenzar a gestionar productos compuestos.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>ID Producto</TableHead>
                  <TableHead>Costo Total</TableHead>
                  <TableHead>Precio Sugerido</TableHead>
                  <TableHead>Margen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recetas.map((receta) => {
                  const margen = receta.costo_total > 0 
                    ? ((receta.precio_venta_sugerido - receta.costo_total) / receta.costo_total) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={receta.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{receta.nombre_receta}</div>
                          {receta.descripcion && (
                            <div className="text-sm text-muted-foreground">{receta.descripcion}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{receta.id_producto_venta_final}</TableCell>
                      <TableCell>${receta.costo_total.toFixed(2)}</TableCell>
                      <TableCell>${receta.precio_venta_sugerido.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={margen >= 30 ? "default" : "secondary"}>
                          {margen.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={receta.activa ? "default" : "secondary"}>
                          {receta.activa ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editarReceta(receta)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecetasForm; 