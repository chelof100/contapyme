import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportData {
  sku: string;
  descripcion: string;
  unidad_medida: string;
  precio_costo: number;
  precio_venta_sugerido: number;
  stock_inicial: number;
  stock_minimo: number;
  categoria: string;
  proveedor_principal: string;
  ubicacion: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface BulkImportProps {
  onImport: (data: ImportData[]) => Promise<void>;
  templateUrl?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

const BulkImport: React.FC<BulkImportProps> = ({
  onImport,
  templateUrl = '/templates/productos_template.xlsx',
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 5 * 1024 * 1024 // 5MB
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque index empieza en 0 y hay header
      
      // Validar SKU
      if (!row.sku || row.sku.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'sku',
          message: 'SKU es obligatorio'
        });
      }
      
      // Validar descripción
      if (!row.descripcion || row.descripcion.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'descripcion',
          message: 'Descripción es obligatoria'
        });
      }
      
      // Validar unidad de medida
      if (!row.unidad_medida || row.unidad_medida.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'unidad_medida',
          message: 'Unidad de medida es obligatoria'
        });
      }
      
      // Validar precios
      if (row.precio_costo && isNaN(Number(row.precio_costo))) {
        errors.push({
          row: rowNumber,
          field: 'precio_costo',
          message: 'Precio de costo debe ser un número válido'
        });
      }
      
      if (row.precio_venta_sugerido && isNaN(Number(row.precio_venta_sugerido))) {
        errors.push({
          row: rowNumber,
          field: 'precio_venta_sugerido',
          message: 'Precio de venta debe ser un número válido'
        });
      }
      
      // Validar stock
      if (row.stock_inicial && isNaN(Number(row.stock_inicial))) {
        errors.push({
          row: rowNumber,
          field: 'stock_inicial',
          message: 'Stock inicial debe ser un número válido'
        });
      }
      
      if (row.stock_minimo && isNaN(Number(row.stock_minimo))) {
        errors.push({
          row: rowNumber,
          field: 'stock_minimo',
          message: 'Stock mínimo debe ser un número válido'
        });
      }
    });
    
    return errors;
  };

  const processFile = async (file: File) => {
    try {
      let data: ImportData[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Procesar CSV
        const text = await file.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            data = results.data as ImportData[];
          },
          error: (error) => {
            throw new Error(`Error al procesar CSV: ${error.message}`);
          }
        });
      } else {
        // Procesar Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convertir a formato ImportData
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        data = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
          });
          return obj as ImportData;
        });
      }
      
      // Validar datos
      const errors = validateData(data);
      setValidationErrors(errors);
      
      if (errors.length === 0) {
        setImportData(data);
        toast.success(`Archivo procesado: ${data.length} productos encontrados`);
      } else {
        toast.error(`Archivo procesado con ${errors.length} errores de validación`);
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error al procesar el archivo');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validar tamaño
    if (file.size > maxFileSize) {
      toast.error(`El archivo es demasiado grande. Máximo ${maxFileSize / 1024 / 1024}MB`);
      return;
    }
    
    processFile(file);
  }, [maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (importData.length === 0) {
      toast.error('No hay datos para importar');
      return;
    }
    
    if (validationErrors.length > 0) {
      toast.error('Corrige los errores de validación antes de importar');
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simular progreso
      const totalSteps = importData.length;
      let currentStep = 0;
      
      for (const item of importData) {
        await onImport([item]);
        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
        
        // Pequeña pausa para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast.success(`Importación completada: ${importData.length} productos importados`);
      setIsOpen(false);
      setImportData([]);
      setValidationErrors([]);
      setProgress(0);
      
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Error durante la importación');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        sku: 'PROD001',
        descripcion: 'Producto de ejemplo',
        unidad_medida: 'unidad',
        precio_costo: 100.00,
        precio_venta_sugerido: 150.00,
        stock_inicial: 50,
        stock_minimo: 10,
        categoria: 'Categoría ejemplo',
        proveedor_principal: 'Proveedor ejemplo',
        ubicacion: 'Ubicación ejemplo'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    XLSX.writeFile(wb, 'productos_template.xlsx');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar Productos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importación Masiva de Productos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Descarga de plantilla */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Plantilla de Importación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Descarga la plantilla para ver el formato requerido
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Plantilla
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Área de drop */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Subir Archivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-primary">Suelta el archivo aquí...</p>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastra y suelta un archivo aquí, o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formatos soportados: CSV, XLSX, XLS (máximo {maxFileSize / 1024 / 1024}MB)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Errores de validación */}
          {validationErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errores de Validación ({validationErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fila</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationErrors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{error.row}</TableCell>
                          <TableCell>{error.field}</TableCell>
                          <TableCell className="text-destructive">{error.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vista previa de datos */}
          {importData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Vista Previa ({importData.length} productos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Precio Costo</TableHead>
                        <TableHead>Stock Inicial</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importData.slice(0, 10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell>{item.unidad_medida}</TableCell>
                          <TableCell>${item.precio_costo?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{item.stock_inicial || 0}</TableCell>
                        </TableRow>
                      ))}
                      {importData.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            ... y {importData.length - 10} productos más
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progreso de importación */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progreso de Importación</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% completado
                </p>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={importData.length === 0 || validationErrors.length > 0 || isProcessing}
            >
              {isProcessing ? 'Importando...' : `Importar ${importData.length} Productos`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImport; 