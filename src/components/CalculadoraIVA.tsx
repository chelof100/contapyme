
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, Percent, Receipt } from 'lucide-react';

interface CalculadoraIVAProps {
  onCalculoCompleto?: (resultado: CalculoIVA) => void;
}

interface CalculoIVA {
  montoNeto: number;
  iva: number;
  montoTotal: number;
  tipoIva: string;
  fecha: Date;
}

const CalculadoraIVA: React.FC<CalculadoraIVAProps> = ({ onCalculoCompleto }) => {
  const [tipoCalculo, setTipoCalculo] = useState<'neto-a-total' | 'total-a-neto'>('neto-a-total');
  const [tipoIva, setTipoIva] = useState('21');
  const [monto, setMonto] = useState('');
  const [resultado, setResultado] = useState<CalculoIVA | null>(null);

  const tasasIVA = [
    { valor: '0', descripcion: '0% - Exento' },
    { valor: '10.5', descripcion: '10.5% - Reducido' },
    { valor: '21', descripcion: '21% - General' },
    { valor: '27', descripcion: '27% - Mayor' }
  ];

  const calcularIVA = () => {
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) return;

    const tasaIVA = parseFloat(tipoIva) / 100;
    let calculo: CalculoIVA;

    if (tipoCalculo === 'neto-a-total') {
      const iva = montoNum * tasaIVA;
      const total = montoNum + iva;
      calculo = {
        montoNeto: montoNum,
        iva: iva,
        montoTotal: total,
        tipoIva: tipoIva,
        fecha: new Date()
      };
    } else {
      const neto = montoNum / (1 + tasaIVA);
      const iva = montoNum - neto;
      calculo = {
        montoNeto: neto,
        iva: iva,
        montoTotal: montoNum,
        tipoIva: tipoIva,
        fecha: new Date()
      };
    }

    setResultado(calculo);
    onCalculoCompleto?.(calculo);
  };

  const limpiarCalculo = () => {
    setMonto('');
    setResultado(null);
  };

  const copiarResultado = () => {
    if (!resultado) return;
    
    const texto = `Neto: $${resultado.montoNeto.toFixed(2)}
IVA (${resultado.tipoIva}%): $${resultado.iva.toFixed(2)}
Total: $${resultado.montoTotal.toFixed(2)}`;
    
    navigator.clipboard.writeText(texto);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Calculadora de IVA</h2>
        <Badge variant="secondary">AFIP</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel de entrada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Datos de Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tipo-calculo">Tipo de Cálculo</Label>
              <Select value={tipoCalculo} onValueChange={(value: any) => setTipoCalculo(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neto-a-total">Neto → Total</SelectItem>
                  <SelectItem value="total-a-neto">Total → Neto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipo-iva">Tasa de IVA</Label>
              <Select value={tipoIva} onValueChange={setTipoIva}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tasasIVA.map((tasa) => (
                    <SelectItem key={tasa.valor} value={tasa.valor}>
                      {tasa.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="monto">
                {tipoCalculo === 'neto-a-total' ? 'Monto Neto' : 'Monto Total'}
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={calcularIVA} className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular
              </Button>
              <Button variant="outline" onClick={limpiarCalculo}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Panel de resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Monto Neto:</span>
                    <span className="text-lg font-bold">${resultado.montoNeto.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">IVA ({resultado.tipoIva}%):</span>
                    <span className="text-lg font-bold text-blue-600">${resultado.iva.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-green-600">${resultado.montoTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Fecha: {resultado.fecha.toLocaleDateString('es-AR')}</p>
                  <p>Hora: {resultado.fecha.toLocaleTimeString('es-AR')}</p>
                </div>

                <Button onClick={copiarResultado} variant="outline" className="w-full">
                  Copiar Resultado
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingresa los datos y presiona "Calcular"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información sobre IVA en Argentina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Tasas de IVA</h4>
              <ul className="space-y-1 text-sm">
                <li><strong>0%:</strong> Productos exentos (libros, medicamentos básicos)</li>
                <li><strong>10.5%:</strong> Productos de primera necesidad</li>
                <li><strong>21%:</strong> Tasa general (la más común)</li>
                <li><strong>27%:</strong> Productos de lujo o servicios premium</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tipos de Cálculo</h4>
              <ul className="space-y-1 text-sm">
                <li><strong>Neto → Total:</strong> Calcula el IVA sobre el monto neto</li>
                <li><strong>Total → Neto:</strong> Extrae el IVA del monto total</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculadoraIVA;
