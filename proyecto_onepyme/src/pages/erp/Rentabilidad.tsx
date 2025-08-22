import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3 } from 'lucide-react';

const Rentabilidad = () => {
  // Datos de ejemplo - en producción vendrían de los hooks
  const rentabilidadData = {
    general: 15.8,
    proyectos: 12.3,
    servicios: 18.5,
    productos: 22.1,
    meta: 20.0,
    tendencia: 'up',
    variacion: 2.3
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rentabilidad</h1>
          <p className="mt-2 text-gray-600">Análisis de rentabilidad y márgenes del negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Última actualización: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Rentabilidad General */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rentabilidad General</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{rentabilidadData.general}%</div>
            <div className="flex items-center gap-2 mt-2">
              {rentabilidadData.tendencia === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${rentabilidadData.tendencia === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {rentabilidadData.variacion}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Meta vs Real */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta vs Real</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentabilidadData.general}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {rentabilidadData.meta}%
            </p>
            <Progress 
              value={(rentabilidadData.general / rentabilidadData.meta) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        {/* Rentabilidad por Proyectos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{rentabilidadData.proyectos}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Promedio del mes
            </p>
          </CardContent>
        </Card>

        {/* Rentabilidad por Servicios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{rentabilidadData.servicios}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Alto margen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Rentabilidad por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad por Categoría</CardTitle>
            <CardDescription>
              Desglose de márgenes por tipo de negocio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Proyectos</span>
                <div className="flex items-center gap-2">
                  <Progress value={rentabilidadData.proyectos} className="w-20" />
                  <span className="text-sm font-medium">{rentabilidadData.proyectos}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Servicios</span>
                <div className="flex items-center gap-2">
                  <Progress value={rentabilidadData.servicios} className="w-20" />
                  <span className="text-sm font-medium">{rentabilidadData.servicios}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Productos</span>
                <div className="flex items-center gap-2">
                  <Progress value={rentabilidadData.productos} className="w-20" />
                  <span className="text-sm font-medium">{rentabilidadData.productos}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones</CardTitle>
            <CardDescription>
              Acciones para mejorar la rentabilidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Optimizar Proyectos</h4>
              <p className="text-sm text-blue-700 mt-1">
                Los proyectos tienen margen bajo. Revisar costos y precios.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">Expandir Servicios</h4>
              <p className="text-sm text-green-700 mt-1">
                Los servicios tienen el mejor margen. Considerar expansión.
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800">Revisar Productos</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Los productos tienen buen margen pero podrían optimizarse.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema de Rentabilidad</CardTitle>
          <CardDescription>
            Monitoreo en tiempo real de métricas financieras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-sm text-green-700 mt-1">Sistema Activo</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">15.8%</div>
              <p className="text-sm text-blue-700 mt-1">Rentabilidad</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">79%</div>
              <p className="text-sm text-purple-700 mt-1">Meta Alcanzada</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">↑</div>
              <p className="text-sm text-orange-700 mt-1">Tendencia</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Rentabilidad;
