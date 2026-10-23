'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RotateCcw,
  QrCode,
  Download,
  Filter,
  Check,
  Plus,
  RefreshCw,
  Clock,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  X,
  FileText,
  Wifi,
  WifiOff,
  Sparkles,
  Ban
} from 'lucide-react';
import {
  apiClient,
  ConteoFisicoDto,
  ConteoLineaDto,
  IniciarConteoFisicoDto,
  SincronizarConteosDto,
  EscanearItemConteoDto,
  ConciliarConteoDto,
  UbicacionDto
} from '@/lib/apiClient';
import { ACTIVOS_ORIGINALES, ActivoTI } from '@/lib/inventoryData';
import { useAuth } from '@/context/AuthContext';
import { CameraScannerModal } from './CameraScannerModal';

interface PhysicalAuditViewProps {
  onOpenScanner?: () => void;
}

export const PhysicalAuditView: React.FC<PhysicalAuditViewProps> = ({ onOpenScanner }) => {
  // Política de Roles SIIA (AGENTS.md): Acceso unificado para todo el personal registrado
  const canManage = true;
  const canCount = true;

  // SubTab: 'sesiones' (Live API Counts) vs 'patrimonial' (341 Assets Check)
  const [activeTab, setActiveTab] = useState<'sesiones' | 'patrimonial'>('sesiones');

  // ==========================================
  // ESTADOS: Sesiones de Conteo Físico (API)
  // ==========================================
  const [conteos, setConteos] = useState<ConteoFisicoDto[]>([]);
  const [loadingConteos, setLoadingConteos] = useState(true);
  const [ubicaciones, setUbicaciones] = useState<UbicacionDto[]>([]);
  const [conteoActivo, setConteoActivo] = useState<ConteoFisicoDto | null>(null);

  // Filtros
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Modales
  const [modalIniciarOpen, setModalIniciarOpen] = useState(false);
  const [modalConciliarOpen, setModalConciliarOpen] = useState(false);
  const [scannerConteoOpen, setScannerConteoOpen] = useState(false);

  // Form iniciar conteo
  const [nuevaSesion, setNuevaSesion] = useState<{
    ubicacionId: string;
    observaciones: string;
    precargarExistencias: boolean;
  }>({
    ubicacionId: '',
    observaciones: '',
    precargarExistencias: true
  });

  // Observaciones de conciliación
  const [observacionesConciliacion, setObservacionesConciliacion] = useState('');

  // Cambios pendientes offline
  const [isOnline, setIsOnline] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Detect online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar lista de sesiones de conteo
  const cargarConteos = async () => {
    setLoadingConteos(true);
    try {
      const res = await apiClient.listarConteosFisicos({
        ubicacionId: filtroUbicacion === 'todas' ? undefined : filtroUbicacion,
        estado: filtroEstado === 'todos' ? undefined : filtroEstado,
        pageSize: 50
      });
      setConteos(res.items || []);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar sesiones de conteo', 'error');
    } finally {
      setLoadingConteos(false);
    }
  };

  // Cargar ubicaciones institucionales
  useEffect(() => {
    const cargarUbicaciones = async () => {
      try {
        const res = await apiClient.listarUbicaciones();
        setUbicaciones(res.items || []);
      } catch (err) {
        console.error('Error cargando ubicaciones:', err);
      }
    };
    cargarUbicaciones();
    cargarConteos();
  }, []);

  // Reload when filters change
  useEffect(() => {
    cargarConteos();
  }, [filtroUbicacion, filtroEstado]);

  // Iniciar conteo físico
  const handleIniciarConteo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaSesion.ubicacionId) {
      showToast('Seleccione una ubicación para auditar', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const dto: IniciarConteoFisicoDto = {
        ubicacionId: nuevaSesion.ubicacionId,
        observaciones: nuevaSesion.observaciones || undefined,
        precargarExistenciasSistema: nuevaSesion.precargarExistencias
      };
      const res = await apiClient.iniciarConteoFisico(dto);
      showToast(`Auditoría iniciada para ${res.ubicacionNombre}`);
      setModalIniciarOpen(false);
      setConteoActivo(res);
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar conteo físico', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Actualizar conteo físico en memoria y guardar en localStorage (offline resilience)
  const modificarCantidadFisica = (lineaId: string, delta: number) => {
    if (!conteoActivo || conteoActivo.estado !== 'abierto') return;

    setConteoActivo((prev) => {
      if (!prev) return prev;
      const lineas = prev.lineas.map((l) => {
        if (l.id === lineaId) {
          const nuevaCant = Math.max(0, l.cantidadFisica + delta);
          return {
            ...l,
            cantidadFisica: nuevaCant,
            diferencia: nuevaCant - l.cantidadSistema
          };
        }
        return l;
      });

      const totalFisico = lineas.reduce((acc, l) => acc + l.cantidadFisica, 0);
      const totalDisc = lineas.filter((l) => l.diferencia !== 0).length;

      const updated = {
        ...prev,
        lineas,
        totalUnidadesFisicas: totalFisico,
        totalDiscrepancias: totalDisc
      };

      // Guardar copia local en localStorage para tolerancia a fallos
      try {
        localStorage.setItem(`siia_conteo_${prev.id}`, JSON.stringify(updated));
      } catch (e) {
        // Ignorar límites de almacenamiento
      }

      setUnsavedChanges(true);
      return updated;
    });
  };

  // Guardar y sincronizar cambios con el servidor
  const sincronizarConServidor = async () => {
    if (!conteoActivo) return;

    setSubmitting(true);
    try {
      const dto: SincronizarConteosDto = {
        lineas: conteoActivo.lineas.map((l) => ({
          recursoId: l.recursoId,
          loteId: l.loteId || undefined,
          cantidadFisica: l.cantidadFisica,
          notas: l.notas || undefined
        }))
      };

      const res = await apiClient.sincronizarLineasConteo(conteoActivo.id, dto);
      setConteoActivo(res);
      setUnsavedChanges(false);
      localStorage.removeItem(`siia_conteo_${conteoActivo.id}`);
      showToast('Conteo sincronizado exitosamente con el servidor');
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || 'Error al sincronizar con el servidor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Procesar escaneo con cámara en el conteo activo
  const handleItemEscaneado = async (codigo: string) => {
    if (!conteoActivo) return;

    try {
      const res = await apiClient.escanearItemConteo(conteoActivo.id, {
        codigo,
        cantidadSumar: 1,
        notas: 'Escaneo en vivo vía cámara PWA'
      });
      setConteoActivo(res);
      showToast(`Lectura registrada: ${codigo}`);
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || `No se pudo registrar el código '${codigo}'`, 'error');
    }
  };

  // Conciliar conteo y ajustar existencias
  const handleConciliarConteo = async () => {
    if (!conteoActivo) return;

    setSubmitting(true);
    try {
      const dto: ConciliarConteoDto = {
        observaciones: observacionesConciliacion || undefined
      };
      const res = await apiClient.conciliarConteoFisico(conteoActivo.id, dto);
      showToast(`Conteo conciliado. Movimientos de ajuste automáticos generados.`);
      setModalConciliarOpen(false);
      setConteoActivo(res);
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || 'Error al conciliar auditoría física', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancelar conteo
  const handleCancelarConteo = async (id: string) => {
    if (!confirm('¿Está seguro de cancelar esta sesión de auditoría? No se aplicarán cambios a las existencias.')) return;

    try {
      const res = await apiClient.cancelarConteoFisico(id, 'Cancelado por usuario');
      showToast('Sesión de auditoría cancelada');
      if (conteoActivo?.id === id) setConteoActivo(res);
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar conteo', 'error');
    }
  };

  // ==========================================
  // ESTADOS: Verificación Patrimonial (341 Activos)
  // ==========================================
  const [selectedUbicacionPatrimonio, setSelectedUbicacionPatrimonio] = useState<string>('todas');
  const [searchPatrimonio, setSearchPatrimonio] = useState('');
  const [verificados, setVerificados] = useState<Record<string, string>>({}); // { activoId: timestamp }

  // Ubicaciones de los 341 activos
  const ubicacionesUnicasPatrimonio = useMemo(() => {
    const set = new Set<string>();
    ACTIVOS_ORIGINALES.forEach((a) => set.add(a.ubicacion_nombre));
    return Array.from(set).sort();
  }, []);

  const activosFiltrados = useMemo(() => {
    return ACTIVOS_ORIGINALES.filter((activo) => {
      const matchUbic =
        selectedUbicacionPatrimonio === 'todas' || activo.ubicacion_nombre === selectedUbicacionPatrimonio;
      const matchSearch =
        searchPatrimonio.trim() === '' ||
        activo.placa_institucional.toLowerCase().includes(searchPatrimonio.toLowerCase()) ||
        activo.numero_serie.toLowerCase().includes(searchPatrimonio.toLowerCase()) ||
        activo.recurso_nombre.toLowerCase().includes(searchPatrimonio.toLowerCase()) ||
        activo.responsable.toLowerCase().includes(searchPatrimonio.toLowerCase());
      return matchUbic && matchSearch;
    });
  }, [selectedUbicacionPatrimonio, searchPatrimonio]);

  const totalFiltrados = activosFiltrados.length;
  const countVerificados = activosFiltrados.filter((a) => verificados[a.id]).length;
  const porcentaje = totalFiltrados > 0 ? Math.round((countVerificados / totalFiltrados) * 100) : 0;

  const toggleVerificado = (id: string) => {
    setVerificados((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return next;
    });
  };

  const marcarTodosVisibles = () => {
    setVerificados((prev) => {
      const next = { ...prev };
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      activosFiltrados.forEach((a) => {
        next[a.id] = now;
      });
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xl transition-all ${
            toast.tipo === 'success' ? 'bg-[#3DAA5C]' : 'bg-rose-600'
          }`}
        >
          {toast.tipo === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header & SubTab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1C3177] uppercase tracking-wider border border-blue-200">
              Control Patrimonial & Auditoría
            </span>
            <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-600" /> Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-amber-600" /> Offline (Cache local)
                </>
              )}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Inventario Físico y Auditoría de Existencias
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conteos físicos por ubicación institucional, lectura con cámara, tolerancia a conexión inestable y conciliación de diferencias.
          </p>
        </div>

        {/* SubTab Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('sesiones')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'sesiones'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Auditorías de Existencias
          </button>
          <button
            onClick={() => setActiveTab('patrimonial')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'patrimonial'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            341 Activos Fijos TI
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: SESIONES DE CONTEO Y AUDITORÍA EN VIVO (API) */}
      {/* ======================================================== */}
      {activeTab === 'sesiones' && (
        <div className="space-y-6">
          {/* Si hay un conteo activo seleccionado en pantalla */}
          {conteoActivo ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#1C3177]">
                      Auditoría: {conteoActivo.ubicacionNombre} ({conteoActivo.ubicacionCodigo})
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        conteoActivo.estado === 'abierto'
                          ? 'bg-blue-50 text-[#1C3177] border border-blue-200'
                          : conteoActivo.estado === 'conciliado'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {conteoActivo.estado.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Responsable: <span className="font-semibold text-slate-700">{conteoActivo.responsableNombre}</span>{' '}
                    • Inicio: {new Date(conteoActivo.fechaInicio).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setConteoActivo(null)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Volver a la lista
                  </button>

                  {conteoActivo.estado === 'abierto' && (
                    <>
                      <button
                        onClick={() => setScannerConteoOpen(true)}
                        className="rounded-xl bg-[#1C3177] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#2B4BA0] flex items-center gap-1.5 shadow-sm shadow-[#1C3177]/20"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Escanear con Cámara</span>
                      </button>

                      {unsavedChanges && (
                        <button
                          onClick={sincronizarConServidor}
                          disabled={submitting}
                          className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 flex items-center gap-1.5 shadow-sm shadow-amber-600/20"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${submitting ? 'animate-spin' : ''}`} />
                          <span>Sincronizar Cambios</span>
                        </button>
                      )}

                      {canManage && (
                        <button
                          onClick={() => setModalConciliarOpen(true)}
                          className="rounded-xl bg-[#3DAA5C] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#2D8246] flex items-center gap-1.5 shadow-sm shadow-[#3DAA5C]/20"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Conciliar y Ajustar Inventario</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Balance Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Líneas</span>
                  <div className="text-lg font-black text-slate-800">{conteoActivo.totalLineas}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Stock Sistema</span>
                  <div className="text-lg font-black text-slate-800">{conteoActivo.totalUnidadesSistema}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Físico Contado</span>
                  <div className="text-lg font-black text-[#1C3177]">{conteoActivo.totalUnidadesFisicas}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Discrepancias</span>
                  <div
                    className={`text-lg font-black ${
                      conteoActivo.totalDiscrepancias > 0 ? 'text-amber-600' : 'text-[#3DAA5C]'
                    }`}
                  >
                    {conteoActivo.totalDiscrepancias} ítems
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Insumo / Recurso</th>
                      <th className="px-4 py-3 text-center">Stock Sistema</th>
                      <th className="px-4 py-3 text-center">Físico Contado</th>
                      <th className="px-4 py-3 text-center">Diferencia</th>
                      <th className="px-4 py-3 text-right">Ajuste de Conteo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {conteoActivo.lineas.map((linea) => (
                      <tr key={linea.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{linea.recursoNombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {linea.recursoSku} {linea.numeroLote ? `• Lote: ${linea.numeroLote}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-600">
                          {linea.cantidadSistema} {linea.unidadMedida}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-black text-slate-900 text-sm">{linea.cantidadFisica}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {linea.diferencia === 0 ? (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                              <Check className="h-3.5 w-3.5 text-[#3DAA5C]" /> 0
                            </span>
                          ) : linea.diferencia > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                              +{linea.diferencia} (Sobrante)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-bold">
                              {linea.diferencia} (Faltante)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {conteoActivo.estado === 'abierto' ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => modificarCantidadFisica(linea.id, -1)}
                                className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700"
                              >
                                -
                              </button>
                              <button
                                onClick={() => modificarCantidadFisica(linea.id, 1)}
                                className="w-7 h-7 rounded-lg bg-[#1C3177] hover:bg-[#2B4BA0] font-bold text-white shadow-2xs"
                              >
                                +
                              </button>
                              <button
                                onClick={() => modificarCantidadFisica(linea.id, 5)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                              >
                                +5
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {linea.ajusteMovimientoNumero ? `Ajuste: ${linea.ajusteMovimientoNumero}` : 'Sin ajuste'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Lista de Sesiones de Conteo
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <select
                    value={filtroUbicacion}
                    onChange={(e) => setFiltroUbicacion(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
                  >
                    <option value="todas">Todas las Ubicaciones UOD</option>
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.codigo})
                      </option>
                    ))}
                  </select>

                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="abierto">Abiertos</option>
                    <option value="conciliado">Conciliados</option>
                    <option value="cancelado">Cancelados</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {canCount && (
                    <button
                      onClick={() => {
                        setNuevaSesion({
                          ubicacionId: ubicaciones[0]?.id || '',
                          observaciones: '',
                          precargarExistencias: true
                        });
                        setModalIniciarOpen(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-[#1C3177] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#2B4BA0] transition-all shadow-sm shadow-[#1C3177]/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Nueva Auditoría de Ubicación</span>
                    </button>
                  )}

                  <button
                    onClick={cargarConteos}
                    disabled={loadingConteos}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingConteos ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Ubicación Auditada</th>
                      <th className="px-4 py-3.5">Responsable</th>
                      <th className="px-4 py-3.5">Fecha Inicio</th>
                      <th className="px-4 py-3.5">Líneas / Ítems</th>
                      <th className="px-4 py-3.5">Discrepancias</th>
                      <th className="px-4 py-3.5">Estado</th>
                      <th className="px-4 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loadingConteos ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          <RefreshCw className="h-4 w-4 animate-spin text-[#1C3177] inline mr-2" />
                          Cargando sesiones de conteo...
                        </td>
                      </tr>
                    ) : conteos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          <ClipboardCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700">No se encontraron sesiones de inventario físico.</p>
                          <p className="text-[11px] text-slate-500 mb-3">Inicia un nuevo conteo para verificar existencias en una clínica o almacén.</p>
                          <button
                            onClick={() => {
                              setNuevaSesion({
                                ubicacionId: ubicaciones[0]?.id || '',
                                observaciones: '',
                                precargarExistencias: true
                              });
                              setModalIniciarOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C3177] px-4 py-2 text-xs font-bold text-white hover:bg-[#2B4BA0] transition-all shadow-sm shadow-[#1C3177]/20 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Crear primer conteo</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      conteos.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <div>{c.ubicacionNombre}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{c.ubicacionCodigo}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{c.responsableNombre}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(c.fechaInicio).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {c.totalUnidadesFisicas} contadas / {c.totalUnidadesSistema} sist.
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                c.totalDiscrepancias > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {c.totalDiscrepancias} {c.totalDiscrepancias === 1 ? 'diferencia' : 'diferencias'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                c.estado === 'abierto'
                                  ? 'bg-blue-50 text-[#1C3177] border border-blue-200'
                                  : c.estado === 'conciliado'
                                  ? 'bg-emerald-50 text-[#2D8246] border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {c.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setConteoActivo(c)}
                                className="rounded-lg p-1.5 text-[#1C3177] hover:bg-blue-50 transition-colors font-bold flex items-center gap-1 text-[11px]"
                                title="Ver o continuar auditoría"
                              >
                                <Eye className="h-4 w-4" />
                                <span>{c.estado === 'abierto' ? 'Continuar' : 'Ver'}</span>
                              </button>

                              {c.estado === 'abierto' && canManage && (
                                <button
                                  onClick={() => handleCancelarConteo(c.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Cancelar conteo"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal: Iniciar Conteo Físico */}
          {modalIniciarOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Iniciar Auditoría Física</h3>
                    <p className="text-xs text-slate-500">Apertura de sesión de verificación en ubicación</p>
                  </div>
                  <button
                    onClick={() => setModalIniciarOpen(false)}
                    className="rounded-xl p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleIniciarConteo} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ubicación a Auditar *
                    </label>
                    <select
                      value={nuevaSesion.ubicacionId}
                      onChange={(e) => setNuevaSesion((prev) => ({ ...prev, ubicacionId: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
                    >
                      <option value="">Seleccione clínica, almacén o laboratorio...</option>
                      {ubicaciones.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.codigo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nuevaSesion.precargarExistencias}
                        onChange={(e) =>
                          setNuevaSesion((prev) => ({ ...prev, precargarExistencias: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#1C3177] focus:ring-[#1C3177] mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-[#1C3177] text-xs">
                          Precargar catálogo de existencias actuales del sistema
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Carga los insumos que el sistema registra actualmente en esta ubicación para comparar discrepancias automáticamente.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Observaciones</label>
                    <textarea
                      value={nuevaSesion.observaciones}
                      onChange={(e) => setNuevaSesion((prev) => ({ ...prev, observaciones: e.target.value }))}
                      placeholder="Motivo del conteo (ej. Auditoría semestral, traspaso de custodio)..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalIniciarOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-[#1C3177] px-5 py-2 font-bold text-white hover:bg-[#2B4BA0] transition-all flex items-center gap-1.5 shadow-sm shadow-[#1C3177]/20"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span>Comenzar Auditoría</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Conciliar y Ajustar Inventario */}
          {modalConciliarOpen && conteoActivo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Conciliar Auditoría Física</h3>
                    <p className="text-xs text-slate-500">Ajuste automático de existencias en base de datos</p>
                  </div>
                  <button
                    onClick={() => setModalConciliarOpen(false)}
                    className="rounded-xl p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-3">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Impacto de la Conciliación
                    </p>
                    <p className="text-[11px] mt-1">
                      Se registrarán movimientos transaccionales auditados tipo <strong>ajuste</strong> para nivelar
                      el stock del sistema con el conteo físico verificado ({conteoActivo.totalDiscrepancias} ítems con diferencias).
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Dictamen / Observaciones de Conciliación
                    </label>
                    <textarea
                      value={observacionesConciliacion}
                      onChange={(e) => setObservacionesConciliacion(e.target.value)}
                      placeholder="Justificación de las diferencias encontradas..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setModalConciliarOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Volver a verificar
                  </button>
                  <button
                    onClick={handleConciliarConteo}
                    disabled={submitting}
                    className="rounded-xl bg-[#3DAA5C] px-5 py-2 font-bold text-white hover:bg-[#2D8246] transition-all flex items-center gap-1.5 shadow-sm shadow-[#3DAA5C]/20"
                  >
                    {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span>Confirmar y Ajustar Inventario</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanner con cámara para conteo en vivo */}
          {scannerConteoOpen && (
            <CameraScannerModal
              isOpen={scannerConteoOpen}
              onClose={() => setScannerConteoOpen(false)}
              onSelectResource={(rec) => {
                handleItemEscaneado(rec.sku);
                setScannerConteoOpen(false);
              }}
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: VERIFICACIÓN PATRIMONIAL DE LOS 341 ACTIVOS TI */}
      {/* ======================================================== */}
      {activeTab === 'patrimonial' && (
        <div className="space-y-6">
          {/* Progress Bar Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Progreso de Levantamiento In Situ 2026
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {countVerificados} de {totalFiltrados} activos verificados ({porcentaje}%)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={marcarTodosVisibles}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Marcar visibles
                </button>
                <button
                  onClick={() => setVerificados({})}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reiniciar
                </button>
              </div>
            </div>

            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1C3177] transition-all duration-300"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por placa EQ-XX, serie, custodio o equipo..."
                value={searchPatrimonio}
                onChange={(e) => setSearchPatrimonio(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1C3177] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <select
                value={selectedUbicacionPatrimonio}
                onChange={(e) => setSelectedUbicacionPatrimonio(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
              >
                <option value="todas">Todas las dependencias ({ACTIVOS_ORIGINALES.length})</option>
                {ubicacionesUnicasPatrimonio.map((ubic) => (
                  <option key={ubic} value={ubic}>
                    {ubic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activosFiltrados.map((activo) => {
              const isDone = !!verificados[activo.id];
              return (
                <div
                  key={activo.id}
                  onClick={() => toggleVerificado(activo.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isDone
                      ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-black text-[#1C3177] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {activo.placa_institucional}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isDone ? 'bg-[#3DAA5C] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="h-3 w-3" /> Verificado {verificados[activo.id]}
                        </>
                      ) : (
                        'Pendiente'
                      )}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs mt-2">{activo.recurso_nombre}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Serie: {activo.numero_serie}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                    <p className="truncate">
                      <span className="text-slate-400 font-medium">Ubicación:</span> {activo.ubicacion_nombre}
                    </p>
                    <p className="truncate">
                      <span className="text-slate-400 font-medium">Custodio:</span> {activo.responsable}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
