'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  QrCode,
  Printer,
  Download,
  Edit2,
  MapPin,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Barcode,
  UserCheck,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Maximize2,
  Image as ImageIcon,
  Clock,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import {
  apiClient,
  RecursoDetalleDto,
  RecursoDto,
  MovimientoDto
} from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { QrLabelsPrintModal } from './QrLabelsPrintModal';

interface ResourceDetailModalProps {
  recursoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEditResource?: (id: string) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  recursoId,
  isOpen,
  onClose,
  onEditResource
}) => {
  const { rol } = useAuth();
  const canManage = rol === 'super_admin' || rol === 'admin_inventario' || rol === 'gestor_inventario';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recurso, setRecurso] = useState<RecursoDetalleDto | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'existencias' | 'series' | 'codigos' | 'timeline'>('general');

  // Modal para imprimir etiquetas
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Línea de tiempo de movimientos del recurso (Prompt 7.5)
  const [timelineMovimientos, setTimelineMovimientos] = useState<MovimientoDto[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (isOpen && recursoId) {
      cargarDetalleRecurso(recursoId);
    } else {
      setRecurso(null);
      setActivePhotoUrl(null);
      setError(null);
      setActiveTab('general');
      setTimelineMovimientos([]);
    }
  }, [isOpen, recursoId]);

  const cargarDetalleRecurso = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.obtenerRecurso(id);
      setRecurso(data);
      if (data.fotos && data.fotos.length > 0) {
        const principal = data.fotos.find(f => f.esPrincipal) || data.fotos[0];
        setActivePhotoUrl(principal.urlArchivo);
      } else {
        setActivePhotoUrl(null);
      }

      // Cargar historial de movimientos que involucran a este recurso
      cargarTimeline(id);
    } catch (err: any) {
      setError(err.message || 'No se pudo obtener el detalle del recurso.');
    } finally {
      setLoading(false);
    }
  };

  const cargarTimeline = async (id: string) => {
    setLoadingTimeline(true);
    try {
      const res = await apiClient.listarMovimientos({
        recursoId: id,
        pageSize: 50,
        sortBy: 'creadoEn',
        isDescending: true
      });
      setTimelineMovimientos(res.items);
    } catch (err) {
      console.error('Error cargando línea de tiempo del recurso:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-[#1C3177] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-200">
                  {recurso?.sku || 'Cargando...'}
                </span>
                {recurso && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      recurso.activo
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                    }`}
                  >
                    {recurso.activo ? 'Activo en Catálogo' : 'Inactivo'}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base leading-tight mt-0.5">
                {recurso?.nombre || 'Ficha Técnica del Recurso'}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {recurso && canManage && onEditResource && (
              <button
                onClick={() => {
                  onClose();
                  onEditResource(recurso.id);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            {recurso && (
              <button
                onClick={() => setPrintModalOpen(true)}
                className="px-3 py-1.5 bg-[#3DAA5C] hover:bg-[#2D8246] text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir Etiqueta</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error o Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#1C3177] mb-3" />
            <p className="text-xs font-medium">Cargando ficha institucional del recurso...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
            <button
              onClick={() => recursoId && cargarDetalleRecurso(recursoId)}
              className="px-4 py-2 bg-[#1C3177] text-white rounded-xl text-xs font-bold"
            >
              Reintentar
            </button>
          </div>
        ) : recurso ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Tabs de Navegación Interna */}
            <div className="px-6 border-b border-slate-200 bg-slate-50 flex space-x-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'general'
                    ? 'border-[#1C3177] text-[#1C3177]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Información General
              </button>
              <button
                onClick={() => setActiveTab('existencias')}
                className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'existencias'
                    ? 'border-[#1C3177] text-[#1C3177]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Existencias por Ubicación</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                  {recurso.existencias?.length || 0}
                </span>
              </button>
              {recurso.tipo === 'activo_fijo' && (
                <button
                  onClick={() => setActiveTab('series')}
                  className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'series'
                      ? 'border-[#1C3177] text-[#1C3177]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Equipos / Series Físicas</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-[#1C3177] text-[10px] font-bold">
                    {recurso.activosSerie?.length || 0}
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('codigos')}
                className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'codigos'
                    ? 'border-[#1C3177] text-[#1C3177]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Códigos y QR</span>
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'timeline'
                    ? 'border-[#1C3177] text-[#1C3177]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Línea de Tiempo</span>
                {timelineMovimientos.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                    {timelineMovimientos.length}
                  </span>
                )}
              </button>
            </div>

            {/* Contenido de Tabs */}
            <div className="p-6 space-y-6">
              {/* TAB 1: INFORMACIÓN GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Fila superior: Galería de Fotos + Resumen de Stock */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Galería (5 cols) */}
                    <div className="md:col-span-5 space-y-3">
                      <div className="relative aspect-square rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xs">
                        {activePhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={activePhotoUrl}
                            alt={recurso.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-12 h-12 stroke-[1.5] mb-2" />
                            <span className="text-xs">Sin fotografía registrada</span>
                          </div>
                        )}
                      </div>

                      {/* Miniaturas */}
                      {recurso.fotos && recurso.fotos.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto pb-1">
                          {recurso.fotos.map(foto => (
                            <button
                              key={foto.id}
                              onClick={() => setActivePhotoUrl(foto.urlArchivo)}
                              className={`w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${
                                activePhotoUrl === foto.urlArchivo
                                  ? 'ring-2 ring-[#1C3177] border-transparent'
                                  : 'border-slate-200 opacity-70 hover:opacity-100'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={foto.urlArchivo} alt="Miniatura" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resumen de Atributos & Existencias (7 cols) */}
                    <div className="md:col-span-7 space-y-4">
                      {/* Tarjeta de Existencias */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Existencias Actuales</span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              recurso.stockActual === 0
                                ? 'bg-rose-100 text-rose-700'
                                : recurso.stockActual <= recurso.stockMinimo
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {recurso.stockActual === 0
                              ? 'Agotado'
                              : recurso.stockActual <= recurso.stockMinimo
                              ? 'Stock Bajo'
                              : 'Existencias Normales'}
                          </span>
                        </div>

                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-black text-[#1C3177]">
                            {recurso.stockActual}
                          </span>
                          <span className="text-sm font-semibold text-slate-500">
                            {recurso.unidadMedida}s disponibles en total
                          </span>
                        </div>

                        {/* Barra de progreso de stock */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full transition-all ${
                                recurso.stockActual === 0
                                  ? 'bg-rose-500'
                                  : recurso.stockActual <= recurso.stockMinimo
                                  ? 'bg-amber-500'
                                  : 'bg-[#3DAA5C]'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  recurso.stockMaximo
                                    ? (recurso.stockActual / recurso.stockMaximo) * 100
                                    : recurso.stockActual > 0
                                    ? 80
                                    : 0
                                )}%`
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Mín: {recurso.stockMinimo}</span>
                            {recurso.puntoReorden && <span>Reorden: {recurso.puntoReorden}</span>}
                            <span>Máx: {recurso.stockMaximo || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Atributos Clave en Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl border border-slate-200 bg-white">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                            Categoría
                          </span>
                          <span className="font-bold text-slate-800 mt-0.5 block">
                            {recurso.categoriaNombre}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-white">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                            Tipo de Recurso
                          </span>
                          <span className="font-bold text-slate-800 mt-0.5 block">
                            {recurso.tipo === 'activo_fijo' ? 'Activo Fijo Institucional' : 'Suministro Consumible'}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-white">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                            Costo de Referencia
                          </span>
                          <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                            RD$ {recurso.costoEstimado.toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-white">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                            Fecha de Registro
                          </span>
                          <span className="font-medium text-slate-700 mt-0.5 block">
                            {new Date(recurso.creadoEn).toLocaleDateString('es-DO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Descripción */}
                      {recurso.descripcion && (
                        <div className="p-3 rounded-xl border border-slate-200 bg-white text-xs">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-1">
                            Descripción y Especificaciones
                          </span>
                          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                            {recurso.descripcion}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXISTENCIAS POR UBICACIÓN */}
              {activeTab === 'existencias' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">
                      Distribución por Departamentos y Clínicas UOD
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Total: {recurso.stockActual} {recurso.unidadMedida}s
                    </span>
                  </div>

                  {recurso.existencias && recurso.existencias.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Código</th>
                            <th className="py-2.5 px-4">Ubicación Institucional</th>
                            <th className="py-2.5 px-4 text-right">Cantidad</th>
                            <th className="py-2.5 px-4 text-right">Última Actualización</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {recurso.existencias.map(e => (
                            <tr key={e.ubicacionId} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-mono font-bold text-[#1C3177]">
                                {e.ubicacionCodigo}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-800">
                                {e.ubicacionNombre}
                              </td>
                              <td className="py-2.5 px-4 text-right font-black text-slate-900">
                                {e.cantidad} {recurso.unidadMedida}s
                              </td>
                              <td className="py-2.5 px-4 text-right text-slate-400 text-[11px]">
                                {new Date(e.actualizadoEn).toLocaleDateString('es-DO')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl space-y-2">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500">
                        No hay existencias registradas en ninguna ubicación actualmente.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EQUIPOS / SERIES FÍSICAS */}
              {activeTab === 'series' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Placas Institucionales y Números de Serie Registrados
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Levantamiento físico de activos tecnológicos y equipos clínicos UOD
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#1C3177] bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                      {recurso.activosSerie?.length || 0} unidades físicas
                    </span>
                  </div>

                  {recurso.activosSerie && recurso.activosSerie.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Placa / ID</th>
                            <th className="py-2.5 px-4">Número de Serie</th>
                            <th className="py-2.5 px-4">Ubicación</th>
                            <th className="py-2.5 px-4">Custodio / Responsable</th>
                            <th className="py-2.5 px-4">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {recurso.activosSerie.map(serie => (
                            <tr key={serie.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-mono font-bold text-[#1C3177]">
                                {serie.placaInstitucional || 'S/P'}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-700">
                                {serie.numeroSerie}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-800">
                                {serie.ubicacionNombre}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">
                                {serie.responsableNombre || 'No asignado'}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {serie.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl space-y-2">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500">
                        No hay placas institucionales o números de serie vinculados a este activo.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CÓDIGOS Y QR */}
              {activeTab === 'codigos' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
                    {/* Visualizador QR */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={apiClient.obtenerUrlDescargaQr(recurso.id)}
                        alt={`QR ${recurso.sku}`}
                        className="w-36 h-36 object-contain"
                      />
                    </div>

                    <div className="flex-1 space-y-3 text-center sm:text-left">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#1C3177]">
                          Código QR Canónico UOD
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-0.5">
                          {recurso.sku}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Enlace institucional: <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">https://siia.uod.edu.do/recurso/{recurso.id}</code>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <a
                          href={apiClient.obtenerUrlDescargaQr(recurso.id)}
                          download={`QR_${recurso.sku}.png`}
                          className="px-3.5 py-1.5 bg-[#1C3177] hover:bg-[#2B4BA0] text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Imagen PNG</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setPrintModalOpen(true)}
                          className="px-3.5 py-1.5 bg-[#3DAA5C] hover:bg-[#2D8246] text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Generar Etiqueta Imprimible</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LÍNEA DE TIEMPO Y TRAZABILIDAD (Prompt 7.5) */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#1C3177]" />
                        Trazabilidad Cronológica de Movimientos
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Historial auditado de entradas, traslados internos, despachos y ajustes de este recurso.
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {timelineMovimientos.length} registro(s)
                    </span>
                  </div>

                  {loadingTimeline ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1C3177]" />
                      <p className="text-xs font-medium">Cargando eventos de la línea de tiempo...</p>
                    </div>
                  ) : timelineMovimientos.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                      <Clock className="w-8 h-8 mx-auto stroke-1" />
                      <p className="text-xs font-medium">Este recurso no registra movimientos ni transferencias aún.</p>
                      <p className="text-[11px] text-slate-400">Las existencias iniciales provienen del inventario base institucional.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                      {timelineMovimientos.map((m) => {
                        const lineaRecurso = m.lineas?.find((l) => l.recursoId === recurso.id);
                        const cantidad = lineaRecurso ? lineaRecurso.cantidad : m.totalUnidades;
                        const esPositivo = m.tipo === 'entrada' || m.tipo === 'devolucion';

                        return (
                          <div key={m.id} className="relative group">
                            {/* Punto / Indicador en la línea de tiempo */}
                            <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[10px] ${
                              m.tipo === 'entrada' ? 'bg-[#3DAA5C] text-white' :
                              m.tipo === 'salida' || m.tipo === 'baja' ? 'bg-red-500 text-white' :
                              m.tipo === 'traslado' ? 'bg-[#1C3177] text-white' :
                              'bg-amber-500 text-white'
                            }`}>
                              {m.tipo === 'entrada' ? <ArrowDownLeft className="w-3 h-3" /> :
                               m.tipo === 'salida' ? <ArrowUpRight className="w-3 h-3" /> :
                               m.tipo === 'traslado' ? <ArrowLeftRight className="w-3 h-3" /> :
                               <RotateCcw className="w-3 h-3" />}
                            </div>

                            {/* Tarjeta del evento */}
                            <div className="bg-slate-50/70 group-hover:bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 transition-colors">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-[#1C3177]">
                                    {m.numeroMovimiento}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                    m.tipo === 'entrada' ? 'bg-emerald-100 text-[#2D8246]' :
                                    m.tipo === 'salida' || m.tipo === 'baja' ? 'bg-red-100 text-red-700' :
                                    m.tipo === 'traslado' ? 'bg-blue-100 text-[#1C3177]' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {m.tipo}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500">
                                  {new Date(m.creadoEn).toLocaleDateString('es-DO', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Ruta:</span>
                                  <span className="font-semibold text-slate-800">
                                    {m.origenUbicacionNombre || 'Externo'} → {m.destinoUbicacionNombre || 'Externo'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Cantidad Afectada:</span>
                                  <span className={`font-bold ${esPositivo ? 'text-[#3DAA5C]' : 'text-slate-800'}`}>
                                    {esPositivo ? `+${cantidad}` : cantidad} {recurso.unidadMedida}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Responsable:</span>
                                  <span className="text-slate-700 font-medium truncate block">
                                    {m.usuarioNombre}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                                "{m.motivo}"
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                ID: {recurso.id}
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal de Impresión de Etiquetas */}
      {recurso && (
        <QrLabelsPrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          recursos={[recurso]}
        />
      )}
    </div>
  );
};
