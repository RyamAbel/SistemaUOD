'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Calendar,
  DollarSign,
  TrendingDown,
  Clock,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import {
  apiClient,
  CalculoDepreciacionActivoDto,
  TablaAmortizacionActivoDto,
  PeriodoAmortizacionDto
} from '@/lib/apiClient';

interface DepreciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activoId: string | null;
  placaInstitucional?: string;
}

export const DepreciationModal: React.FC<DepreciationModalProps> = ({
  isOpen,
  onClose,
  activoId,
  placaInstitucional
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [calculo, setCalculo] = useState<CalculoDepreciacionActivoDto | null>(null);
  const [tabla, setTabla] = useState<TablaAmortizacionActivoDto | null>(null);
  const [fechaCorte, setFechaCorte] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [mostrarTablaCompleta, setMostrarTablaCompleta] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && activoId) {
      cargarDatos(fechaCorte);
    }
  }, [isOpen, activoId]);

  const cargarDatos = async (fecha?: string) => {
    if (!activoId) return;
    try {
      setLoading(true);
      setError(null);
      const [resCalculo, resTabla] = await Promise.all([
        apiClient.obtenerDepreciacionActivo(activoId, fecha),
        apiClient.obtenerTablaAmortizacionActivo(activoId)
      ]);
      setCalculo(resCalculo);
      setTabla(resTabla);
    } catch (err: any) {
      console.error('Error al calcular depreciación:', err);
      setError(err?.message || 'Error al obtener datos contables de depreciación');
    } finally {
      setLoading(false);
    }
  };

  const handleCambioFechaCorte = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFecha = e.target.value;
    setFechaCorte(nuevaFecha);
    cargarDatos(nuevaFecha);
  };

  const formatearDOP = (monto: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    }).format(monto);
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleDescargarCsvActivo = () => {
    if (!tabla || !calculo) return;

    let csv = '\uFEFF'; // BOM UTF-8
    csv += 'FICHA CONTABLE DE DEPRECIACIÓN - UNIVERSIDAD ODONTOLÓGICA DOMINICANA (UOD)\n';
    csv += `Placa Institucional;${calculo.placaInstitucional}\n`;
    csv += `Equipo;${calculo.recursoNombre}\n`;
    csv += `Número de Serie;${calculo.numeroSerie || 'N/A'}\n`;
    csv += `Categoría Fiscal DGII;${calculo.categoriaDgii}\n`;
    csv += `Tasa Anual;${calculo.tasaAnualPorcentaje}%\n`;
    csv += `Vida Útil (meses);${calculo.vidaUtilMesesTotal}\n`;
    csv += `Costo Histórico Adquisición;${calculo.costoAdquisicion}\n`;
    csv += `Valor Residual (5%);${calculo.valorResidual}\n`;
    csv += `Depreciación Acumulada a la Fecha;${calculo.depreciacionAcumulada}\n`;
    csv += `Valor Neto en Libros;${calculo.valorEnLibros}\n`;
    csv += `Meses Transcurridos;${calculo.mesesTranscurridos}\n`;
    csv += `Meses Restantes;${calculo.mesesVidaUtilRestante}\n\n`;

    csv += 'TABLA DE AMORTIZACIÓN PROYECTADA (48 MESES)\n';
    csv += 'Periodo;Año;Mes;Cuota Mensual;Depreciación Acumulada;Valor en Libros Fin Periodo;% Amortizado\n';

    tabla.periodos.forEach((p) => {
      csv += `${p.periodoNumero};${p.anio};${p.mes};${p.depreciacionPeriodo};${p.depreciacionAcumulada};${p.valorEnLibrosFinPeriodo};${p.porcentajeAmortizado}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `depreciacion_${calculo.placaInstitucional}_${fechaCorte}.csv`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="depreciation-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera Institucional UOD */}
        <div className="bg-[#1C3177] px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="depreciation-modal-title" className="text-lg font-bold text-white tracking-wide">
                  Depreciación y Valor en Libros
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  DGII Cat. 2 (25%)
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Placa institucional:{' '}
                <span className="font-mono font-semibold text-white">
                  {calculo?.placaInstitucional || placaInstitucional || 'N/A'}
                </span>{' '}
                • Cálculo bajo normativa fiscal dominicana (48 meses)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F7F9FC]">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-8 h-8 border-3 border-[#1C3177] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Calculando amortización contable DGII...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && calculo && (
            <>
              {/* Tarjeta Informativa del Activo */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Equipo / Recurso:</span>
                    <span className="font-semibold text-slate-800 text-sm">{calculo.recursoNombre}</span>
                    <span className="text-slate-400 block font-mono text-[11px] mt-0.5">SKU: {calculo.recursoSku}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Ubicación Actual:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-[#1C3177]" />
                      {calculo.ubicacionNombre}
                    </span>
                    <span className="text-slate-400 block font-medium mt-2">Custodio Asignado:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      {calculo.custodioNombre || 'Sin custodio asignado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Control de Fecha de Corte:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="date"
                          value={fechaCorte}
                          onChange={handleCambioFechaCorte}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1C3177] focus:border-transparent font-medium"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Inicio amortización: <span className="font-mono text-slate-600">{calculo.fechaInicioDepreciacion}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicadores Financieros / Métricas Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Costo Adquisición */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-medium">Costo Histórico</span>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {formatearDOP(calculo.costoAdquisicion)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Valor residual (5%): <span className="font-medium text-slate-700">{formatearDOP(calculo.valorResidual)}</span>
                  </div>
                </div>

                {/* Depreciación Acumulada */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-medium">Deprec. Acumulada</span>
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-lg font-bold text-amber-700">
                    {formatearDOP(calculo.depreciacionAcumulada)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Cuota mensual: <span className="font-medium text-slate-700">{formatearDOP(calculo.depreciacionMensual)}</span>
                  </div>
                </div>

                {/* Valor en Libros Neto */}
                <div className="bg-white p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/20 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-700 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Valor en Libros</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-extrabold text-emerald-800">
                    {formatearDOP(calculo.valorEnLibros)}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                    {calculo.totalmenteDepreciado ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Totalmente depreciado
                      </span>
                    ) : (
                      <span>Valor neto computable actual</span>
                    )}
                  </div>
                </div>

                {/* Tiempo / Vida Útil */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-medium">Vida Útil (Meses)</span>
                    <Clock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {calculo.mesesTranscurridos}{' '}
                    <span className="text-xs font-normal text-slate-400">/ {calculo.vidaUtilMesesTotal} meses</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Restantes: <span className="font-semibold text-indigo-600">{calculo.mesesVidaUtilRestante} meses</span>
                  </div>
                </div>
              </div>

              {/* Barra de Progreso del Porcentaje Depreciado */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    Progreso de Amortización Fiscal:{' '}
                    <span className="font-bold text-slate-900">{calculo.porcentajeDepreciado}% amortizado</span>
                  </span>
                  <span className="text-slate-500">
                    {(100 - calculo.porcentajeDepreciado).toFixed(2)}% remanente
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      calculo.totalmenteDepreciado
                        ? 'bg-slate-500'
                        : calculo.porcentajeDepreciado > 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, calculo.porcentajeDepreciado))}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  * Basado en la Ley 11-92 y normativas DGII: Equipos de cómputo y TI se deprecian en línea recta al 25% anual durante 48 meses.
                </p>
              </div>

              {/* Tabla de Amortización Proyectada */}
              {tabla && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div
                    onClick={() => setMostrarTablaCompleta(!mostrarTablaCompleta)}
                    className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#1C3177]" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Tabla de Amortización DGII (48 Periodos Mensuales)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{mostrarTablaCompleta ? 'Ocultar proyección' : 'Ver todos los periodos'}</span>
                      {mostrarTablaCompleta ? (
                        <ChevronUp className="w-4 h-4 text-slate-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </div>

                  {mostrarTablaCompleta && (
                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Periodo</th>
                            <th className="py-2.5 px-3">Mes</th>
                            <th className="py-2.5 px-3 text-right">Cuota Mensual</th>
                            <th className="py-2.5 px-3 text-right">Deprec. Acumulada</th>
                            <th className="py-2.5 px-3 text-right">Valor en Libros</th>
                            <th className="py-2.5 px-3 text-right">% Amortizado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {tabla.periodos.map((p) => {
                            const esPeriodoActual = p.periodoNumero === calculo.mesesTranscurridos;
                            return (
                              <tr
                                key={p.periodoNumero}
                                className={`transition-colors ${
                                  esPeriodoActual
                                    ? 'bg-blue-50 font-bold text-[#1C3177]'
                                    : p.periodoNumero < calculo.mesesTranscurridos
                                    ? 'text-slate-600'
                                    : 'text-slate-400 italic'
                                }`}
                              >
                                <td className="py-2 px-3">
                                  #{p.periodoNumero} {esPeriodoActual && '👉 (Actual)'}
                                </td>
                                <td className="py-2 px-3 font-sans">{p.periodoTexto}</td>
                                <td className="py-2 px-3 text-right">{formatearDOP(p.depreciacionPeriodo)}</td>
                                <td className="py-2 px-3 text-right">{formatearDOP(p.depreciacionAcumulada)}</td>
                                <td className="py-2 px-3 text-right font-semibold">
                                  {formatearDOP(p.valorEnLibrosFinPeriodo)}
                                </td>
                                <td className="py-2 px-3 text-right font-sans">{p.porcentajeAmortizado}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Barra de Acciones y Cierre */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDescargarCsvActivo}
              disabled={!calculo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Descargar CSV Contable
            </button>
            <button
              onClick={handleImprimir}
              disabled={!calculo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Imprimir
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1C3177] hover:bg-[#2B4BA0] rounded-lg transition-colors shadow-sm"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
