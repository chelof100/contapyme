import React from 'react';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'healthy' | 'unhealthy' | 'offline' | 'error' | 'unknown';
  label?: string;
  variant?: 'badge' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  variant = 'badge',
  size = 'md',
  tooltip
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'offline':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Saludable</Badge>;
      case 'unhealthy':
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'healthy':
        return 'Saludable';
      case 'unhealthy':
      case 'error':
        return 'Error';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconocido';
    }
  };

  const content = (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      {label && <span className="text-sm font-medium">{label}</span>}
      {variant === 'badge' && getStatusBadge()}
      {variant === 'text' && <span className="text-sm">{getStatusText()}</span>}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export const ConnectionStatus: React.FC<{ connected: boolean; label?: string }> = ({
  connected,
  label = 'Conexión'
}) => {
  return (
    <StatusIndicator
      status={connected ? 'healthy' : 'error'}
      label={label}
      variant="badge"
    />
  );
};

export const MultiServiceStatus: React.FC<{ services: Array<{ name: string; status: string }> }> = ({
  services
}) => {
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalCount = services.length;
  const isHealthy = healthyCount === totalCount;

  return (
    <div className="space-y-2">
      <StatusIndicator
        status={isHealthy ? 'healthy' : 'unhealthy'}
        label={`Servicios (${healthyCount}/${totalCount})`}
        variant="badge"
      />
      <div className="grid grid-cols-2 gap-2">
        {services.map((service, index) => (
          <StatusIndicator
            key={index}
            status={service.status as any}
            label={service.name}
            variant="text"
            size="sm"
          />
        ))}
      </div>
    </div>
  );
};