
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calculator, FileText, TrendingUp } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src="/srcassets/OnePyme Logo.png" 
              alt="OnePyme Logo" 
              className="h-32 md:h-40 w-auto"
            />
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistema integral de gestión empresarial diseñado especialmente para pequeñas y medianas empresas
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              Acceder al Sistema
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
                              <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Gestión de Empresas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Administra múltiples empresas con información completa y organizada
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
                              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Facturación</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Crea y gestiona facturas de forma rápida y profesional
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
                              <Calculator className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Contabilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Control completo de ingresos, gastos y reportes financieros
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
                              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Reportes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Analiza el rendimiento de tu empresa con reportes detallados
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">¿Listo para comenzar?</CardTitle>
              <CardDescription>
                Únete a miles de PYMEs que ya confían en OnePyme para su gestión contable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth?tab=register">
                            <Button size="lg" className="text-lg px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white transition-colors">
              Crear Cuenta Gratuita
            </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
