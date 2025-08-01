import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertTriangle, Settings, Code } from 'lucide-react';

interface DeveloperConfigGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const DeveloperConfigGuard: React.FC<DeveloperConfigGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, profile } = useAuth();

  // Verificar si el usuario tiene permisos de desarrollador
  const hasDeveloperAccess = () => {
    if (!user || !profile) return false;
    
    // Verificar rol de administrador o desarrollador
    const allowedRoles = ['admin', 'developer', 'super_admin'];
    return allowedRoles.includes(profile.role?.toLowerCase() || '');
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = !!user;

  // Componente de fallback por defecto
  const DefaultFallback = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Acceso Restringido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Esta sección está protegida y requiere permisos especiales.
          </p>
          {!isAuthenticated ? (
            <div className="space-y-2">
              <Badge variant="destructive" className="flex items-center gap-1 mx-auto w-fit">
                <AlertTriangle className="h-3 w-3" />
                No autenticado
              </Badge>
              <p className="text-sm text-muted-foreground">
                Debes iniciar sesión para acceder a esta sección.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="destructive" className="flex items-center gap-1 mx-auto w-fit">
                <AlertTriangle className="h-3 w-3" />
                Permisos insuficientes
              </Badge>
              <p className="text-sm text-muted-foreground">
                Tu rol actual ({profile?.role || 'sin rol'}) no tiene permisos para acceder a esta sección.
              </p>
            </div>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sección de Desarrollador
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Configuración de webhooks n8n</li>
            <li>• Configuración de base de datos</li>
            <li>• Gestión de API keys</li>
            <li>• Logs del sistema</li>
            <li>• Configuraciones avanzadas</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Contacta al administrador del sistema si necesitas acceso a esta sección.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // Si no está autenticado o no tiene permisos, mostrar fallback
  if (!isAuthenticated || !hasDeveloperAccess()) {
    return fallback || <DefaultFallback />;
  }

  // Si tiene permisos, mostrar el contenido protegido
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Configuración de Desarrollador</h2>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Protegido
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Usuario: {profile?.email} | Rol: {profile?.role}
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default DeveloperConfigGuard;