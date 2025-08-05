import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Info, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye,
  Clock,
  Server,
  User
} from 'lucide-react';
import { ErrorLog } from '@/hooks/useSystemMetrics';

interface ErrorLogsProps {
  logs: ErrorLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

const ErrorLogs: React.FC<ErrorLogsProps> = ({ logs, loading = false, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'afip_validation':
        return <Server className="h-4 w-4" />;
      case 'stock_management':
        return <Server className="h-4 w-4" />;
      case 'backup_service':
        return <Server className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesService = serviceFilter === 'all' || log.service === serviceFilter;
    
    return matchesSearch && matchesLevel && matchesService;
  });

  const getUniqueServices = () => {
    const services = new Set(logs.map(log => log.service));
    return Array.from(services);
  };

  const getErrorCount = (level: string) => {
    return logs.filter(log => log.level === level).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Logs de Errores</h2>
          <Badge variant="outline">{logs.length} total</Badge>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getErrorCount('error')}</div>
            <p className="text-xs text-muted-foreground">Críticos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getErrorCount('warning')}</div>
            <p className="text-xs text-muted-foreground">Atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Información</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getErrorCount('info')}</div>
            <p className="text-xs text-muted-foreground">Informativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUniqueServices().length}</div>
            <p className="text-xs text-muted-foreground">Monitoreados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en mensajes o servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nivel</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="error">Solo errores</SelectItem>
                  <SelectItem value="warning">Solo advertencias</SelectItem>
                  <SelectItem value="info">Solo información</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Servicio</label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los servicios</SelectItem>
                  {getUniqueServices().map(service => (
                    <SelectItem key={service} value={service}>
                      {service.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Logs ({filteredLogs.length})</span>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Mostrando {filteredLogs.length} de {logs.length}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay logs</h3>
              <p className="text-muted-foreground">
                {logs.length === 0 ? 'No hay logs disponibles' : 'No hay logs que coincidan con los filtros'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          {getLevelBadge(log.level)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getServiceIcon(log.service)}
                          <span className="font-medium">{log.service.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate" title={log.message}>
                          {log.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(log.timestamp).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {getLevelIcon(log.level)}
                                Detalles del Log
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <label className="text-sm font-medium">Nivel</label>
                                  <div className="mt-1">{getLevelBadge(log.level)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Servicio</label>
                                  <div className="mt-1 flex items-center gap-2">
                                    {getServiceIcon(log.service)}
                                    <span>{log.service.replace('_', ' ')}</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Fecha</label>
                                  <div className="mt-1 text-sm">
                                    {new Date(log.timestamp).toLocaleString('es-AR')}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">ID</label>
                                  <div className="mt-1 text-sm font-mono">{log.id}</div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Mensaje</label>
                                <div className="mt-1 p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{log.message}</p>
                                </div>
                              </div>
                              
                              {log.stack_trace && (
                                <div>
                                  <label className="text-sm font-medium">Stack Trace</label>
                                  <div className="mt-1 p-3 bg-muted rounded-lg">
                                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                      {log.stack_trace}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorLogs;