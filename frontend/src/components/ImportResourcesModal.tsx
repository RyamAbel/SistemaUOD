'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  apiClient,
  ImportarRecursoFilaDto,
  ResultadoValidacionImportacionDto,
  ResultadoImportacionDto
} from '@/lib/apiClient';

interface ImportResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportResourcesModal: React.FC<ImportResourcesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [paso, setPaso] = useState<'subir' | 'previsualizar' | 'completado'>('subir');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacionImportacionDto | null>(null);
  const [filasAnalizadas, setFilasAnalizadas] = useState<ImportarRecursoFilaDto[]>([]);
  const [filtroTabla, setFiltroTabla] = useState<'todos' | 'validos' | 'errores'>('todos');
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoImportacionDto | null>(null);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetearEstado = () => {
    setPaso('subir');
    setArchivo(null);
    setProcesando(false);
    setImportando(false);
    setErrorSubida(null);
    setResultadoValidacion(null);
    setFilasAnalizadas([]);
    setFiltroTabla('todos');
    setResultadoFinal(null);
  };

  const handleCerrar = () => {
    resetearEstado();
    onClose();
  };

  // Descarga directa de la plantilla CSV oficial
  const handleDescargarPlantilla = async () => {
    setDescargandoPlantilla(true);
    try {
      await apiClient.descargarPlantillaCsvImportacion();
    } catch (err: any) {
      console.error('Error al descargar plantilla:', err);
      alert('No se pudo descargar la plantilla CSV: ' + (err.message || 'Error de red'));
    } finally {
      setDescargandoPlantilla(false);
    }
  };

  // Parseador de CSV con soporte para comillas, comas y punto y coma
  const parsearCsv = (textoCsv: string): ImportarRecursoFilaDto[] => {
    // 1. Limpiar UTF-8 BOM
    const contenidoLimpio = textoCsv.replace(/^\uFEFF/, '').trim();
    if (!contenidoLimpio) return [];

    const lineas = contenidoLimpio.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lineas.length < 2) return [];

    // Detectar delimitador (coma o punto y coma)
    const encabezadoLinea = lineas[0];
    const delimitador = encabezadoLinea.includes(';') && !encabezadoLinea.includes(',') ? ';' : ',';

    const parsearCampos = (linea: string): string[] => {
      const campos: string[] = [];
      let campoActual = '';
      let dentroComillas = false;

      for (let i = 0; i < linea.length; i++) {
        const char = linea[i];
        if (char === '"') {
          if (dentroComillas && linea[i + 1] === '"') {
            campoActual += '"';
            i++;
          } else {
            dentroComillas = !dentroComillas;
          }
        } else if (char === delimitador && !dentroComillas) {
          campos.push(campoActual.trim());
          campoActual = '';
        } else {
          campoActual += char;
        }
      }
      campos.push(campoActual.trim());
      return campos;
    };

    const encabezados = parsearCampos(lineas[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Mapear posiciones de columnas
    const idxSku = encabezados.findIndex(h => h === 'sku' || h.includes('codigo'));
    const idxNombre = encabezados.findIndex(h => h === 'nombre' || h.includes('descripcioncorta'));
    const idxDesc = encabezados.findIndex(h => h.startsWith('desc'));
    const idxCat = encabezados.findIndex(h => h.startsWith('cat'));
    const idxTipo = encabezados.findIndex(h => h === 'tipo');
    const idxUnidad = encabezados.findIndex(h => h.includes('unidad') || h.includes('medida'));
    const idxStockMin = encabezados.findIndex(h => h.includes('min'));
    const idxStockMax = encabezados.findIndex(h => h.includes('max'));
    const idxReorden = encabezados.findIndex(h => h.includes('reorden'));
    const idxCosto = encabezados.findIndex(h => h.includes('costo') || h.includes('precio'));

    const filas: ImportarRecursoFilaDto[] = [];

    for (let i = 1; i < lineas.length; i++) {
      const vals = parsearCampos(lineas[i]);
      if (vals.every(v => v === '')) continue; // Fila vacía

      const sku = idxSku >= 0 && vals[idxSku] ? vals[idxSku] : '';
      const nombre = idxNombre >= 0 && vals[idxNombre] ? vals[idxNombre] : '';
      const descripcion = idxDesc >= 0 ? vals[idxDesc] : undefined;
      const categoria = idxCat >= 0 && vals[idxCat] ? vals[idxCat] : 'General';
      const tipo = idxTipo >= 0 && vals[idxTipo] ? vals[idxTipo].toLowerCase() : 'consumible';
      const unidadMedida = idxUnidad >= 0 && vals[idxUnidad] ? vals[idxUnidad] : 'unidad';
      
      const stockMin = idxStockMin >= 0 ? parseInt(vals[idxStockMin].replace(/[^0-9-]/g, ''), 10) || 0 : 0;
      const stockMax = idxStockMax >= 0 && vals[idxStockMax] ? parseInt(vals[idxStockMax].replace(/[^0-9-]/g, ''), 10) : undefined;
      const puntoReorden = idxReorden >= 0 && vals[idxReorden] ? parseInt(vals[idxReorden].replace(/[^0-9-]/g, ''), 10) : undefined;
      
      let costo = 0;
      if (idxCosto >= 0 && vals[idxCosto]) {
        const limpia = vals[idxCosto].replace(/[^0-9.-]/g, '');
        costo = parseFloat(limpia) || 0;
      }

      filas.push({
        numeroFila: i,
        sku,
        nombre,
        descripcion,
        categoria,
        tipo,
        unidadMedida,
        stockMinimo: stockMin,
        stockMaximo: stockMax,
        puntoReorden,
        costoEstimado: costo
      });
    }

    return filas;
  };

  const procesarArchivo = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      setErrorSubida('Por favor seleccione un archivo en formato CSV (.csv).');
      return;
    }

    setArchivo(file);
    setErrorSubida(null);
    setProcesando(true);

    try {
      const texto = await file.text();
      const filas = parsearCsv(texto);

      if (filas.length === 0) {
        setErrorSubida('El archivo no contiene filas de recursos o las cabeceras son irreconocibles.');
        setProcesando(false);
        return;
      }

      setFilasAnalizadas(filas);

      // Enviar a la API para validación integral en base de datos
      const resValidacion = await apiClient.validarFilasImportacion(filas);
      setResultadoValidacion(resValidacion);
      setPaso('previsualizar');
    } catch (err: any) {
      console.error('Error al procesar archivo CSV:', err);
      setErrorSubida(err.message || 'Error al leer el archivo CSV.');
    } finally {
      setProcesando(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      procesarArchivo(e.target.files[0]);
    }
  };

  const handleEjecutarImportacion = async () => {
    if (!resultadoValidacion || resultadoValidacion.recursosValidos.length === 0) return;

    setImportando(true);
    try {
      const res = await apiClient.ejecutarImportacionRecursos(resultadoValidacion.recursosValidos);
      setResultadoFinal(res);
      setPaso('completado');
      onSuccess();
    } catch (err: any) {
      console.error('Error al ejecutar importación:', err);
      alert('Error durante la importación: ' + (err.message || 'Error desconocido'));
    } finally {
      setImportando(false);
    }
  };

  // Mapa de errores por número de fila para visualización en tabla
  const erroresPorFila = React.useMemo(() => {
    const mapa = new Map<number, string[]>();
    if (resultadoValidacion?.errores) {
      for (const err of resultadoValidacion.errores) {
        const list = mapa.get(err.numeroFila) || [];
        list.push(`${err.campo}: ${err.mensaje}`);
        mapa.set(err.numeroFila, list);
      }
    }
    return mapa;
  }, [resultadoValidacion]);

  // Filtrar filas para la tabla
  const filasFiltradas = React.useMemo(() => {
    if (filtroTabla === 'validos') {
      return filasAnalizadas.filter(f => !erroresPorFila.has(f.numeroFila || 0));
    }
    if (filtroTabla === 'errores') {
      return filasAnalizadas.filter(f => erroresPorFila.has(f.numeroFila || 0));
    }
    return filasAnalizadas;
  }, [filasAnalizadas, filtroTabla, erroresPorFila]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCerrar} />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col max-h-[92vh]">
        {/* Cabecera institucional UOD */}
        <div className="p-5 border-b border-slate-200 bg-[#1C3177] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Importación Masiva de Recursos</h3>
              <p className="text-xs text-blue-100">
                Carga ágil de catálogo de suministros y activos mediante hoja de cálculo CSV / Excel
              </p>
            </div>
          </div>
          <button
            onClick={handleCerrar}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {/* PASO 1: SUBIR ARCHIVO */}
          {paso === 'subir' && (
            <div className="space-y-6">
              {/* Tarjeta de descarga de plantilla */}
              <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-blue-50 text-[#1C3177] rounded-lg mt-0.5">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">¿Primera vez importando? Descargue la plantilla oficial</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contiene las cabeceras requeridas (SKU, Nombre, Categoría, Tipo, Stock Mínimo/Máximo, Costo) y ejemplos de la UOD.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDescargarPlantilla}
                  disabled={descargandoPlantilla}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1C3177] bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all shrink-0 disabled:opacity-60"
                >
                  {descargandoPlantilla ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#1C3177]" />
                  ) : (
                    <Download className="w-4 h-4 text-[#1C3177]" />
                  )}
                  <span>Descargar Plantilla CSV</span>
                </button>
              </div>

              {/* Zona Drag & Drop */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  errorSubida
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-slate-300 bg-white hover:border-[#1C3177] hover:bg-blue-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />

                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-[#1C3177] flex items-center justify-center mb-4 shadow-sm">
                  {procesando ? (
                    <Loader2 className="w-8 h-8 animate-spin text-[#1C3177]" />
                  ) : (
                    <Upload className="w-8 h-8 text-[#1C3177]" />
                  )}
                </div>

                <h4 className="text-base font-semibold text-slate-800 mb-1">
                  {procesando ? 'Analizando archivo CSV...' : 'Haga clic para subir o arrastre el archivo CSV aquí'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Soporta archivos delimitados por comas o punto y coma exportados desde Excel o Google Sheets con codificación UTF-8.
                </p>

                {errorSubida && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-xl text-red-700 text-xs inline-flex items-center space-x-2 max-w-md text-left">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{errorSubida}</span>
                  </div>
                )}
              </div>

              {/* Instrucciones y tips */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">1. Código SKU único</span>
                  El SKU identifica de forma unívoca a cada recurso. Si ya existe en la base de datos, será advertido para evitar sobrescrituras.
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">2. Tipos de recurso</span>
                  Especifique <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded">consumible</code> para suministros o <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded">activo_fijo</code> para equipos con placa.
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">3. Categorías automáticas</span>
                  Si la categoría indicada no existe, el sistema la creará automáticamente en estado activo.
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: PREVISUALIZACIÓN Y VALIDACIÓN */}
          {paso === 'previsualizar' && resultadoValidacion && (
            <div className="space-y-5">
              {/* Tarjetas métricas de validación */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">Total Registros</span>
                  <p className="text-xl font-bold text-slate-800 mt-0.5">{resultadoValidacion.totalFilas}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
                  <span className="text-xs text-emerald-700 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Válidos para Alta</span>
                  </span>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">{resultadoValidacion.filasValidas}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-red-200 bg-red-50/30 shadow-sm">
                  <span className="text-xs text-red-700 font-medium flex items-center space-x-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Filas con Errores</span>
                  </span>
                  <p className="text-xl font-bold text-red-700 mt-0.5">{resultadoValidacion.filasConError}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
                  <span className="text-xs text-amber-700 font-medium flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Nombres Similares</span>
                  </span>
                  <p className="text-xl font-bold text-amber-700 mt-0.5">{resultadoValidacion.posiblesDuplicados}</p>
                </div>
              </div>

              {/* Barra de filtros de la tabla */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-1 text-xs font-medium">
                  <button
                    onClick={() => setFiltroTabla('todos')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      filtroTabla === 'todos'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos ({filasAnalizadas.length})
                  </button>
                  <button
                    onClick={() => setFiltroTabla('validos')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                      filtroTabla === 'validos'
                        ? 'bg-emerald-600 text-white'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <span>Válidos ({resultadoValidacion.filasValidas})</span>
                  </button>
                  <button
                    onClick={() => setFiltroTabla('errores')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                      filtroTabla === 'errores'
                        ? 'bg-red-600 text-white'
                        : 'text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <span>Con Error ({resultadoValidacion.filasConError})</span>
                  </button>
                </div>

                <span className="text-xs text-slate-500">
                  Archivo: <strong className="text-slate-700">{archivo?.name}</strong>
                </span>
              </div>

              {/* Tabla de detalle */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[340px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Nombre</th>
                        <th className="py-2.5 px-3">Categoría</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3 text-right">Stock Mín.</th>
                        <th className="py-2.5 px-3 text-right">Costo Estimado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No hay filas que coincidan con el filtro seleccionado.
                          </td>
                        </tr>
                      ) : (
                        filasFiltradas.map((fila, idx) => {
                          const tieneError = erroresPorFila.has(fila.numeroFila || 0);
                          const errores = erroresPorFila.get(fila.numeroFila || 0) || [];

                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-slate-50 transition-colors ${
                                tieneError ? 'bg-red-50/40' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                                {fila.numeroFila}
                              </td>
                              <td className="py-2.5 px-3">
                                {tieneError ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                                    <XCircle className="w-3 h-3" />
                                    <span>Error</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Válido</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                                {fila.sku || <span className="text-red-500 italic">Vacío</span>}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-medium text-slate-800">{fila.nombre || '—'}</div>
                                {tieneError && (
                                  <div className="text-[11px] text-red-600 mt-0.5">
                                    {errores.join(' • ')}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{fila.categoria}</td>
                              <td className="py-2.5 px-3">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                  fila.tipo === 'activo_fijo'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {fila.tipo === 'activo_fijo' ? 'Activo Fijo' : 'Consumible'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                {fila.stockMinimo} {fila.unidadMedida}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                                RD$ {(fila.costoEstimado ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {resultadoValidacion.filasConError > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Aviso sobre filas con errores:</span>
                    Las {resultadoValidacion.filasConError} filas con errores serán omitidas durante la importación. Solo se darán de alta los {resultadoValidacion.filasValidas} recursos válidos.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: COMPLETADO */}
          {paso === 'completado' && resultadoFinal && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">¡Importación Exitosa!</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {resultadoFinal.mensaje}
              </p>

              <div className="inline-flex items-center justify-center gap-6 bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm mt-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Creados</span>
                  <p className="text-2xl font-bold text-emerald-600">{resultadoFinal.recursosCreados}</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-xs text-slate-400 font-medium">Omitidos</span>
                  <p className="text-2xl font-bold text-slate-500">{resultadoFinal.recursosOmitidos}</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-xs text-slate-400 font-medium">Total</span>
                  <p className="text-2xl font-bold text-[#1C3177]">{resultadoFinal.totalProcesados}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          {paso === 'subir' && (
            <>
              <button
                type="button"
                onClick={handleCerrar}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <span className="text-xs text-slate-400">Paso 1 de 2: Selección de archivo</span>
            </>
          )}

          {paso === 'previsualizar' && (
            <>
              <button
                type="button"
                onClick={() => setPaso('subir')}
                disabled={importando}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                ← Seleccionar otro archivo
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCerrar}
                  disabled={importando}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEjecutarImportacion}
                  disabled={importando || !resultadoValidacion || resultadoValidacion.filasValidas === 0}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1C3177] hover:bg-[#2B4BA0] shadow-sm transition-all disabled:opacity-50"
                >
                  {importando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importando recursos...</span>
                    </>
                  ) : (
                    <>
                      <span>Importar {resultadoValidacion?.filasValidas || 0} Recursos Válidos</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {paso === 'completado' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleCerrar}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1C3177] hover:bg-[#2B4BA0] shadow-sm transition-all"
              >
                Finalizar y Ver Catálogo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
