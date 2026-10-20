'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  QrCode,
  Flashlight,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { apiClient, ResolucionCodigoDto, RecursoDto } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenResourceDetail?: (id: string) => void;
  onCreateResourceWithCode?: (codigo: string) => void;
  onSelectResource?: (recurso: RecursoDto) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onOpenResourceDetail,
  onCreateResourceWithCode,
  onSelectResource
}) => {
  const { rol } = useAuth();
  const canManage = rol === 'super_admin' || rol === 'admin_inventario' || rol === 'gestor_inventario';

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Entrada manual de código
  const [manualCode, setManualCode] = useState('');
  const [resolving, setResolving] = useState(false);

  // Resultado de resolución
  const [scanResult, setScanResult] = useState<ResolucionCodigoDto | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'siia-scanner-viewport';

  // Sonido de confirmación con Web Audio API
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5)
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {
      // Silencioso
    }
  };

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setCameraError(null);
      setManualCode('');
      // Iniciar cámara con pequeño delay para que el contenedor DOM esté listo
      const t = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(t);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const startScanner = async () => {
    const el = document.getElementById(scannerContainerId);
    if (!el) return;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ],
          verbose: false
        });
      }

      setScanning(true);
      setCameraError(null);

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          // Código detectado
          playBeep();
          stopScanner();
          handleCodeDetected(decodedText);
        },
        () => {
          // Frame sin código (ignorar)
        }
      );

      // Revisar si soporta linterna
      try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Error iniciando cámara:', err);
      setScanning(false);
      if (err.name === 'NotAllowedError' || err.toString().includes('Permission')) {
        setCameraError('Permiso de cámara denegado. Habilita el acceso en los ajustes de tu navegador.');
      } else if (err.name === 'NotFoundError' || err.toString().includes('device not found')) {
        setCameraError('No se detectó ninguna cámara en este dispositivo.');
      } else {
        setCameraError('No se pudo inicializar la cámara. Puedes ingresar el código manualmente debajo.');
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // Silencioso
      }
    }
    setScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const next = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: next } as any]
      });
      setTorchOn(next);
    } catch (e) {
      console.warn('Error alternando linterna:', e);
    }
  };

  // Resolver código mediante la API universal
  const handleCodeDetected = async (rawCode: string) => {
    if (!rawCode) return;
    setResolving(true);
    try {
      const res = await apiClient.resolverCodigo(rawCode.trim());
      setScanResult(res);
    } catch (err: any) {
      setScanResult({
        encontrado: false,
        codigoBuscado: rawCode,
        tipoEntidad: 'recurso',
        tipoCodigoDetectado: 'desconocido',
        urlFicha: '',
        mensaje: err.message || 'Error al consultar código.'
      });
    } finally {
      setResolving(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopScanner();
    handleCodeDetected(manualCode.trim());
  };

  const handleScanAnother = () => {
    setScanResult(null);
    setManualCode('');
    startScanner();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-[#1C3177] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Escáner Móvil UOD • PWA</h3>
              <p className="text-[11px] text-blue-100">Lectura de QR institucional, barras y series</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5">
          {resolving ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#1C3177] mx-auto" />
              <p className="text-xs font-bold text-slate-800">Identificando código en inventario central...</p>
              <p className="text-[11px] text-slate-400">Verificando en catálogo de recursos y placas de activos</p>
            </div>
          ) : scanResult ? (
            /* Pantalla de Resultados de Escaneo */
            <div className="space-y-4 animate-fade-in">
              {scanResult.encontrado ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>¡Elemento identificado con éxito!</span>
                  </div>

                  {/* Tarjeta del Recurso o Serie */}
                  <div className="bg-white rounded-xl p-3.5 border border-emerald-200 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-[#1C3177]">
                        {scanResult.recurso?.sku || scanResult.activoSerie?.placaInstitucional || scanResult.codigoBuscado}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1C3177]">
                        {scanResult.tipoEntidad === 'activo_serie' ? 'Activo Físico / Serie' : 'Recurso de Catálogo'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {scanResult.recurso?.nombre || `Equipo Serie: ${scanResult.activoSerie?.numeroSerie}`}
                    </h4>

                    {scanResult.activoSerie && (
                      <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ubicación: <strong>{scanResult.activoSerie.ubicacionNombre}</strong></span>
                        </div>
                        {scanResult.activoSerie.responsableNombre && (
                          <div className="text-[11px] text-slate-500">
                            Custodio: <strong>{scanResult.activoSerie.responsableNombre}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {scanResult.recurso && (
                      <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span>Categoría: <strong>{scanResult.recurso.categoriaNombre}</strong></span>
                          <span>Stock: <strong>{scanResult.recurso.stockActual} {scanResult.recurso.unidadMedida}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="space-y-2 pt-1">
                    {scanResult.recurso && onSelectResource && (
                      <button
                        onClick={() => {
                          onSelectResource(scanResult.recurso!);
                          onClose();
                        }}
                        className="w-full py-2.5 bg-[#3DAA5C] hover:bg-[#2D8246] text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar al Movimiento</span>
                      </button>
                    )}

                    {scanResult.recurso && onOpenResourceDetail && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenResourceDetail(scanResult.recurso!.id);
                        }}
                        className="w-full py-2.5 bg-[#1C3177] hover:bg-[#2B4BA0] text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>Abrir Ficha Completa del Recurso</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={handleScanAnother}
                      className="w-full py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Escanear otro código</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Código no encontrado */
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Código no registrado en el inventario</span>
                  </div>

                  <p className="text-xs text-amber-800">
                    El código <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 text-slate-900 font-bold">{scanResult.codigoBuscado}</code> no corresponde a ningún SKU institucional ni placa física registrada.
                  </p>

                  <div className="space-y-2 pt-1">
                    {canManage && onCreateResourceWithCode && (
                      <button
                        onClick={() => {
                          onClose();
                          onCreateResourceWithCode(scanResult.codigoBuscado);
                        }}
                        className="w-full py-2.5 bg-[#3DAA5C] hover:bg-[#2D8246] text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Crear nuevo recurso con este código</span>
                      </button>
                    )}

                    <button
                      onClick={handleScanAnother}
                      className="w-full py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reintentar escaneo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Visor de Cámara Activo */
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex flex-col items-center justify-center">
                {/* Contenedor del video HTML5 QR */}
                <div id={scannerContainerId} className="w-full h-full" />

                {/* Marco visor guía estilizado UOD */}
                {scanning && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(61,170,92,0.3)] relative">
                      {/* Esquinas destacadas */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                    </div>
                  </div>
                )}

                {/* Linterna botón */}
                {hasTorch && scanning && (
                  <button
                    onClick={toggleTorch}
                    className={`absolute bottom-3 right-3 p-2 rounded-xl transition-colors ${
                      torchOn ? 'bg-amber-400 text-slate-900' : 'bg-slate-800/80 text-white hover:bg-slate-700'
                    }`}
                    title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}

                {/* Error de cámara */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center text-white space-y-3">
                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                    <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                    <button
                      onClick={startScanner}
                      className="px-3.5 py-1.5 bg-[#1C3177] hover:bg-[#2B4BA0] text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Reintentar acceso a cámara
                    </button>
                  </div>
                )}
              </div>

              {/* Formulario alternativo manual */}
              <form onSubmit={handleManualSubmit} className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-600 block">
                  ¿No puedes escanear? Ingresa el código o SKU manualmente:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    placeholder="Ej. UOD-ACT-0045, EQ-42 o código de barras..."
                    className="flex-1 text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="px-4 py-2 bg-[#1C3177] hover:bg-[#2B4BA0] text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Compatible con etiquetas físicas SIIA y códigos del fabricante.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
