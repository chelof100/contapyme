import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { usePresupuestos, useCashFlow, useKPIs } from '@/hooks/useERPData';
import { webhookService } from '@/services/webhookService';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle,
  Plus,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
// import { 
//   ChartContainer, 
//   ChartTooltip, 
//   ChartTooltipContent 
// } from '@/components/ui/chart';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell } from 'recharts';

const Finanzas = () => {
  const { data: presupuestos, loading: loadingPresupuestos, create: createPresupuesto } = usePresupuestos();
  const { data: cashFlow, loading: loadingCashFlow, create: createCashFlow } = useCashFlow();
  const { data: kpis, loading: loadingKPIs, create: createKPI } = useKPIs();
  const [showPresupuestoForm, setShowPresupuestoForm] = useState(false);
  const [showCashFlowForm, setShowCashFlowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [presupuestoForm, setPresupuestoForm] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    categoria: '',
    subcategoria: '',
    monto_presupuestado: 0,
    notas: ''
  });

  const [cashFlowForm, setCashFlowForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    tipo: 'ingreso' as 'ingreso' | 'egreso',
    monto: 0,
    categoria: '',
    recurrente: false,
    frecuencia: '',
    notas: ''
  });

  // Datos para gráficos
  const chartData = [
    { mes: 'Ene', presupuestado: 450000, real: 420000, diferencia: -30000 },
    { mes: 'Feb', presupuestado: 520000, real: 580000, diferencia: 60000 },
    { mes: 'Mar', presupuestado: 480000, real: 465000, diferencia: -15000 },
    { mes: 'Abr', presupuestado: 590000, real: 610000, diferencia: 20000 },
    { mes: 'May', presupuestado: 650000, real: 720000, diferencia: 70000 },
    { mes: 'Jun', presupuestado: 600000, real: 580000, diferencia: -20000 },
  ];

  const cashFlowData = [
    { fecha: '2024-01', ingresos: 850000, egresos: 620000, neto: 230000 },
    { fecha: '2024-02', ingresos: 920000, egresos: 680000, neto: 240000 },
    { fecha: '2024-03', ingresos: 780000, egresos: 590000, neto: 190000 },
    { fecha: '2024-04', ingresos: 1100000, egresos: 750000, neto: 350000 },
    { fecha: '2024-05', ingresos: 950000, egresos: 720000, neto: 230000 },
    { fecha: '2024-06', ingresos: 1050000, egresos: 680000, neto: 370000 },
  ];

  const distribucionGastos = [
    { name: 'Sueldos', value: 45, color: '#3B82F6' },
    { name: 'Alquileres', value: 20, color: '#EF4444' },
    { name: 'Servicios', value: 15, color: '#10B981' },
    { name: 'Marketing', value: 10, color: '#F59E0B' },
    { name: 'Otros', value: 10, color: '#8B5CF6' },
  ];

  const handlePresupuestoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!presupuestoForm.categoria || presupuestoForm.monto_presupuestado <= 0) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const presupuestoData = {
        ...presupuestoForm,
        monto_real: 0,
        variacion_porcentaje: 0
      };

      const nuevoPresupuesto = await createPresupuesto(presupuestoData);
      
      if (nuevoPresupuesto) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.makeRequest('/webhook/erp-presupuesto-crear', {
            presupuesto_id: nuevoPresupuesto.id,
            ...presupuestoData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n:', webhookError);
        }

        toast.success('Presupuesto creado exitosamente');
        
        // Limpiar formulario
        setPresupuestoForm({
          ano: new Date().getFullYear(),
          mes: new Date().getMonth() + 1,
          categoria: '',
          subcategoria: '',
          monto_presupuestado: 0,
          notas: ''
        });
        setShowPresupuestoForm(false);
      }

    } catch (error) {
      console.error('Error al crear presupuesto:', error);
      toast.error('Error al crear el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleCashFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cashFlowForm.concepto || cashFlowForm.monto <= 0) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const cashFlowData = {
        ...cashFlowForm,
        estado: 'proyectado' as const
      };

      const nuevoCashFlow = await createCashFlow(cashFlowData);
      
      if (nuevoCashFlow) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.makeRequest('/webhook/erp-cash-flow-crear', {
            cash_flow_id: nuevoCashFlow.id,
            ...cashFlowData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n:', webhookError);
        }

        toast.success('Proyección de cash flow creada exitosamente');
        
        // Limpiar formulario
        setCashFlowForm({
          fecha: new Date().toISOString().split('T')[0],
          concepto: '',
          tipo: 'ingreso',
          monto: 0,
          categoria: '',
          recurrente: false,
          frecuencia: '',
          notas: ''
        });
        setShowCashFlowForm(false);
      }

    } catch (error) {
      console.error('Error al crear proyección:', error);
      toast.error('Error al crear la proyección');
    } finally {
      setLoading(false);
    }
  };

  const calcularKPIs = () => {
    const totalPresupuestado = presupuestos.reduce((sum, p) => sum + (p.monto_presupuestado || 0), 0);
    const totalReal = presupuestos.reduce((sum, p) => sum + (p.monto_real || 0), 0);
    const variacionPresupuesto = totalPresupuestado > 0 ? ((totalReal - totalPresupuestado) / totalPresupuestado) * 100 : 0;
    
    const ingresosMes = cashFlow.filter(cf => cf.tipo === 'ingreso' && cf.estado === 'realizado')
      .reduce((sum, cf) => sum + (cf.monto || 0), 0);
    const egresosMes = cashFlow.filter(cf => cf.tipo === 'egreso' && cf.estado === 'realizado')
      .reduce((sum, cf) => sum + (cf.monto || 0), 0);
    const margenNeto = ingresosMes > 0 ? ((ingresosMes - egresosMes) / ingresosMes) * 100 : 0;

    return {
      variacionPresupuesto,
      margenNeto,
      liquidez: ingresosMes - egresosMes,
      proyeccionAnual: (ingresosMes - egresosMes) * 12
    };
  };

  const kpisCalculados = calcularKPIs();

  const getVariacionBadge = (variacion: number) => {
    if (variacion > 5) return <Badge className="bg-green-100 text-green-800">+{variacion.toFixed(1)}%</Badge>;
    if (variacion < -5) return <Badge className="bg-red-100 text-red-800">{variacion.toFixed(1)}%</Badge>;
    return <Badge variant="secondary">{variacion.toFixed(1)}%</Badge>;
  };

  // const chartConfig = {
  //   presupuestado: {
  //     label: "Presupuestado",
  //     color: "hsl(var(--primary))",
  //   },
  //   real: {
  //     label: "Real",
  //     color: "hsl(var(--destructive))",
  //   },
  // };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión Financiera</h1>
          <p className="mt-2 text-gray-600">Dashboard financiero y control presupuestario</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reportes
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Datos
          </Button>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${kpisCalculados.liquidez.toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted-foreground">Cash Flow Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {kpisCalculados.variacionPresupuesto.toFixed(1)}%
                  {getVariacionBadge(kpisCalculados.variacionPresupuesto)}
                </div>
                <p className="text-sm text-muted-foreground">vs Presupuesto</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{kpisCalculados.margenNeto.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Margen Neto</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">${kpisCalculados.proyeccionAnual.toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted-foreground">Proyección Anual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="presupuestos">Presupuestos</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Presupuesto vs Real
                </CardTitle>
                <CardDescription>Comparación mensual de presupuesto planificado vs ejecutado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Gráfico temporalmente deshabilitado</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cash Flow Histórico
                </CardTitle>
                <CardDescription>Evolución del flujo de caja mensual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Gráfico temporalmente deshabilitado</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribución de gastos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribución de Gastos
              </CardTitle>
              <CardDescription>Análisis de la estructura de costos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Gráfico temporalmente deshabilitado</p>
                </div>
                <div className="space-y-3">
                  {distribucionGastos.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.value}%</p>
                        <p className="text-sm text-muted-foreground">
                          ${(item.value * 10000).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presupuestos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Gestión de Presupuestos</h3>
            <Dialog open={showPresupuestoForm} onOpenChange={setShowPresupuestoForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Presupuesto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Presupuesto</DialogTitle>
                  <DialogDescription>
                    Define un nuevo presupuesto para una categoría específica
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePresupuestoSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ano">Año</Label>
                      <Input
                        id="ano"
                        type="number"
                        value={presupuestoForm.ano}
                        onChange={(e) => setPresupuestoForm({...presupuestoForm, ano: parseInt(e.target.value)})}
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mes">Mes</Label>
                      <Select value={presupuestoForm.mes.toString()} onValueChange={(value) => setPresupuestoForm({...presupuestoForm, mes: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 12}, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {new Date(2024, i).toLocaleDateString('es-AR', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Select value={presupuestoForm.categoria} onValueChange={(value) => setPresupuestoForm({...presupuestoForm, categoria: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingresos">Ingresos</SelectItem>
                        <SelectItem value="gastos_fijos">Gastos Fijos</SelectItem>
                        <SelectItem value="gastos_variables">Gastos Variables</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="tecnologia">Tecnología</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategoria">Subcategoría</Label>
                    <Input
                      id="subcategoria"
                      value={presupuestoForm.subcategoria}
                      onChange={(e) => setPresupuestoForm({...presupuestoForm, subcategoria: e.target.value})}
                      placeholder="Ej: Sueldos, Alquiler, Publicidad"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto Presupuestado *</Label>
                    <Input
                      id="monto"
                      type="number"
                      min="0"
                      step="0.01"
                      value={presupuestoForm.monto_presupuestado}
                      onChange={(e) => setPresupuestoForm({...presupuestoForm, monto_presupuestado: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Input
                      id="notas"
                      value={presupuestoForm.notas}
                      onChange={(e) => setPresupuestoForm({...presupuestoForm, notas: e.target.value})}
                      placeholder="Notas adicionales"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Creando...' : 'Crear Presupuesto'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowPresupuestoForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              {loadingPresupuestos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando presupuestos...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Subcategoría</TableHead>
                      <TableHead>Presupuestado</TableHead>
                      <TableHead>Real</TableHead>
                      <TableHead>Variación</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presupuestos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay presupuestos definidos. Crea tu primer presupuesto.
                        </TableCell>
                      </TableRow>
                    ) : (
                      presupuestos.map((presupuesto) => {
                        const variacion = presupuesto.monto_presupuestado > 0 
                          ? ((presupuesto.monto_real - presupuesto.monto_presupuestado) / presupuesto.monto_presupuestado) * 100 
                          : 0;
                        
                        return (
                          <TableRow key={presupuesto.id}>
                            <TableCell>{presupuesto.mes}/{presupuesto.ano}</TableCell>
                            <TableCell className="font-medium">{presupuesto.categoria}</TableCell>
                            <TableCell>{presupuesto.subcategoria || '-'}</TableCell>
                            <TableCell>${presupuesto.monto_presupuestado.toLocaleString('es-AR')}</TableCell>
                            <TableCell>${presupuesto.monto_real.toLocaleString('es-AR')}</TableCell>
                            <TableCell>{getVariacionBadge(variacion)}</TableCell>
                            <TableCell>
                              <Badge variant={Math.abs(variacion) <= 10 ? 'default' : 'destructive'}>
                                {Math.abs(variacion) <= 10 ? 'En línea' : 'Desviado'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Proyecciones de Cash Flow</h3>
            <Dialog open={showCashFlowForm} onOpenChange={setShowCashFlowForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Proyección
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Proyección Cash Flow</DialogTitle>
                  <DialogDescription>
                    Registra una proyección de ingreso o egreso futuro
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCashFlowSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha *</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={cashFlowForm.fecha}
                        onChange={(e) => setCashFlowForm({...cashFlowForm, fecha: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select value={cashFlowForm.tipo} onValueChange={(value: 'ingreso' | 'egreso') => setCashFlowForm({...cashFlowForm, tipo: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingreso">Ingreso</SelectItem>
                          <SelectItem value="egreso">Egreso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="concepto">Concepto *</Label>
                    <Input
                      id="concepto"
                      value={cashFlowForm.concepto}
                      onChange={(e) => setCashFlowForm({...cashFlowForm, concepto: e.target.value})}
                      placeholder="Descripción del movimiento"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monto">Monto *</Label>
                      <Input
                        id="monto"
                        type="number"
                        min="0"
                        step="0.01"
                        value={cashFlowForm.monto}
                        onChange={(e) => setCashFlowForm({...cashFlowForm, monto: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Input
                        id="categoria"
                        value={cashFlowForm.categoria}
                        onChange={(e) => setCashFlowForm({...cashFlowForm, categoria: e.target.value})}
                        placeholder="Categoría del movimiento"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Input
                      id="notas"
                      value={cashFlowForm.notas}
                      onChange={(e) => setCashFlowForm({...cashFlowForm, notas: e.target.value})}
                      placeholder="Notas adicionales"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Creando...' : 'Crear Proyección'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCashFlowForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              {loadingCashFlow ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando proyecciones...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay proyecciones de cash flow. Crea tu primera proyección.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cashFlow.map((cf) => (
                        <TableRow key={cf.id}>
                          <TableCell>{new Date(cf.fecha).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{cf.concepto}</TableCell>
                          <TableCell>
                            <Badge variant={cf.tipo === 'ingreso' ? 'default' : 'secondary'}>
                              {cf.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                            </Badge>
                          </TableCell>
                          <TableCell className={cf.tipo === 'ingreso' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {cf.tipo === 'ingreso' ? '+' : '-'}${cf.monto.toLocaleString('es-AR')}
                          </TableCell>
                          <TableCell>{cf.categoria || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              cf.estado === 'realizado' ? 'default' : 
                              cf.estado === 'confirmado' ? 'secondary' : 'outline'
                            }>
                              {cf.estado}
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

        <TabsContent value="reportes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Financieros</CardTitle>
              <CardDescription>Genera reportes ejecutivos y análisis financieros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">Estado de Resultados</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Balance General</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm">Flujo de Efectivo</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Target className="h-6 w-6" />
                  <span className="text-sm">Análisis Presupuestario</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <PieChart className="h-6 w-6" />
                  <span className="text-sm">Análisis de Costos</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Reporte Mensual</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finanzas;