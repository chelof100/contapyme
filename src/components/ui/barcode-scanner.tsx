import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  trigger?: React.ReactNode;
  className?: string;
}

declare global {
  interface Window {
    Quagga: any;
  }
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  trigger,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const quaggaRef = useRef<any>(null);

  const startScanner = () => {
    if (!scannerRef.current) return;

    try {
      window.Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true
      }, (err: any) => {
        if (err) {
          console.error('Error starting scanner:', err);
          toast.error('Error al iniciar el escáner');
          onError?.(err.message);
          return;
        }
        
        setIsScanning(true);
        window.Quagga.start();
      });

      window.Quagga.onDetected((result: any) => {
        const code = result.codeResult.code;
        if (code) {
          toast.success(`Código escaneado: ${code}`);
          onScan(code);
          stopScanner();
          setIsOpen(false);
        }
      });

      window.Quagga.onProcessed((result: any) => {
        const drawingCanvas = window.Quagga.canvas.dom.overlay;
        const drawingCtx = drawingCanvas.getContext('2d');
        
        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
            result.boxes.filter((box: any) => box !== result.box).forEach((box: any) => {
              window.Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
            });
          }

          if (result.box) {
            window.Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "blue", lineWidth: 2 });
          }

          if (result.codeResult && result.codeResult.code) {
            window.Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
          }
        }
      });

    } catch (error) {
      console.error('Error initializing scanner:', error);
      toast.error('Error al inicializar el escáner');
      onError?.(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const stopScanner = () => {
    if (window.Quagga) {
      window.Quagga.stop();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    // Cargar QuaggaJS dinámicamente
    const loadQuagga = async () => {
      if (typeof window !== 'undefined' && !window.Quagga) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js';
        script.onload = () => {
          console.log('QuaggaJS loaded successfully');
        };
        script.onerror = () => {
          console.error('Failed to load QuaggaJS');
          toast.error('Error al cargar el escáner de códigos de barras');
        };
        document.head.appendChild(script);
      }
    };

    loadQuagga();

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (isOpen && window.Quagga) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        startScanner();
      }, 100);
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopScanner();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <Camera className="h-4 w-4 mr-2" />
            Escanear Código
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escáner de Códigos de Barras
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Posiciona el código de barras dentro del área de escaneo
          </div>
          
          <div className="relative">
            <div 
              ref={scannerRef}
              className="w-full h-64 bg-black rounded-lg overflow-hidden relative"
            >
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2" />
                    <p>Iniciando escáner...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Overlay con guías de escaneo */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-white rounded-lg">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-blue-500"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-blue-500"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-blue-500"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-blue-500"></div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {isScanning ? 'Escaneando...' : 'Listo para escanear'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner; 