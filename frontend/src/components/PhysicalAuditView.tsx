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
  Ban,
  Trash2,
  Printer,
  ChevronLeft,
  User,
  XCircle,
  Copy
} from 'lucide-react';
import {
  apiClient,
  ConteoFisicoDto,
  ConteoLineaDto,
  IniciarConteoFisicoDto,
  SincronizarConteosDto,
  UbicacionDto
} from '@/lib/apiClient';
import { ACTIVOS_ORIGINALES, ActivoTI } from '@/lib/inventoryData';
import { CameraScannerModal } from './CameraScannerModal';
import { PhysicalAuditReportModal, ActivoVerificadoAudit } from './PhysicalAuditReportModal';

interface PhysicalAuditViewProps {
  onOpenScanner?: () => void;
}

export const PhysicalAuditView: React.FC<PhysicalAuditViewProps> = ({ onOpenScanner }) => {
  // Lista de sesiones de conteo
  const [conteos, setConteos] = useState<ConteoFisicoDto[]>([]);
  const [loadingConteos, setLoadingConteos] = useState(true);
  const [ubicaciones, setUbicaciones] = useState<UbicacionDto[]>([]);
  const [conteoActivo, setConteoActivo] = useState<ConteoFisicoDto | null>(null);

  // Filtros de la lista de auditorías
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Modales
  const [modalIniciarOpen, setModalIniciarOpen] = useState(false);
  const [modalReporteOpen, setModalReporteOpen] = useState(false);
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

  // Estado de verificación de activos físicos de la ubicación activa
  // { [activoId]: { estado: 'encontrado' | 'no_encontrado' | 'danado', observaciones: string } }
  const [activosVerificadosMap, setActivosVerificadosMap] = useState<
    Record<string, { estado: 'encontrado' | 'no_encontrado' | 'danado'; observaciones?: string }>
  >({});

  // Búsqueda dentro del conteo activo
  const [searchActivo, setSearchActivo] = useState('');
  const [filtroEstadoActivo, setFiltroEstadoActivo] = useState<'todos' | 'encontrado' | 'no_encontrado' | 'danado'>('todos');

  // Tolerancia offline / cambios no guardados
  const [isOnline, setIsOnline] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Detector de conectividad
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

  // Cargar ubicaciones institucionales UOD
  useEffect(() => {
    const cargarUbicaciones = async () => {
      try {
        const res = await apiClient.listarUbicaciones({ pageSize: 100, soloActivas: true });
        setUbicaciones(res.items || []);
      } catch (err) {
        console.error('Error cargando ubicaciones:', err);
      }
    };
    cargarUbicaciones();
    cargarConteos();
  }, []);

  // Recargar al cambiar filtros
  useEffect(() => {
    cargarConteos();
  }, [filtroUbicacion, filtroEstado]);

  // Activos físicos reales de la ubicación del conteo activo
  const activosUbicacionReal = useMemo(() => {
    if (!conteoActivo) return [];
    const nom = (conteoActivo.ubicacionNombre || '').trim().toLowerCase();
    const ubId = conteoActivo.ubicacionId;

    return ACTIVOS_ORIGINALES.filter(a =>
      (a.ubicacion_nombre && a.ubicacion_nombre.trim().toLowerCase() === nom) ||
      (a.ubicacion_id && a.ubicacion_id === ubId)
    );
  }, [conteoActivo]);

  // Inicializar mapa de verificación al abrir un conteo
  useEffect(() => {
    if (!conteoActivo) {
      setActivosVerificadosMap({});
      return;
    }

    // Intentar recuperar avance previo guardado en localStorage
    const saved = localStorage.getItem(`siia_audit_${conteoActivo.id}`);
    if (saved) {
      try {
        setActivosVerificadosMap(JSON.parse(saved));
        return;
      } catch (e) {
        // Fallback a inicialización limpia
      }
    }

    // Por defecto, inicializar cada activo físico como 'no_encontrado' hasta que se verifique
    const initialMap: Record<string, { estado: 'encontrado' | 'no_encontrado' | 'danado'; observaciones?: string }> = {};
    activosUbicacionReal.forEach(a => {
      initialMap[a.id] = { estado: 'no_encontrado', observaciones: '' };
    });
    setActivosVerificadosMap(initialMap);
  }, [conteoActivo?.id, activosUbicacionReal.length]);

  // Guardar en localStorage cuando cambie el mapa de verificación
  const persistirVerificados = (nextMap: typeof activosVerificadosMap) => {
    if (!conteoActivo) return;
    setActivosVerificadosMap(nextMap);
    setUnsavedChanges(true);
    try {
      localStorage.setItem(`siia_audit_${conteoActivo.id}`, JSON.stringify(nextMap));
    } catch (e) {
      // Ignorar límite de almacenamiento
    }
  };

  // Cambiar estado de verificación de un activo físico individual
  const setEstadoActivoFisico = (
    activoId: string,
    nuevoEstado: 'encontrado' | 'no_encontrado' | 'danado',
    nota?: string
  ) => {
    const current = activosVerificadosMap[activoId] || { estado: 'no_encontrado' };
    const nextMap = {
      ...activosVerificadosMap,
      [activoId]: {
        estado: nuevoEstado,
        observaciones: nota !== undefined ? nota : current.observaciones
      }
    };
    persistirVerificados(nextMap);

    // Si tenemos líneas de conteo en la API, actualizar correspondencia
    if (conteoActivo) {
      const activo = ACTIVOS_ORIGINALES.find(a => a.id === activoId);
      if (activo) {
        // Recalcular cantidad física del recurso asociado
        const recursoId = activo.recurso_id;
        const activosDelMismoRecurso = activosUbicacionReal.filter(a => a.recurso_id === recursoId);
        const contados = activosDelMismoRecurso.filter(a => nextMap[a.id]?.estado === 'encontrado').length;

        setConteoActivo(prev => {
          if (!prev) return prev;
          const lineasActualizadas = prev.lineas.map(l => {
            if (l.recursoId === recursoId) {
              return {
                ...l,
                cantidadFisica: contados,
                diferencia: contados - l.cantidadSistema
              };
            }
            return l;
          });

          return {
            ...prev,
            lineas: lineasActualizadas,
            totalUnidadesFisicas: lineasActualizadas.reduce((acc, l) => acc + l.cantidadFisica, 0),
            totalDiscrepancias: lineasActualizadas.filter(l => l.diferencia !== 0).length
          };
        });
      }
    }
  };

  // Marcar todos los activos visibles de la ubicación como encontrados
  const marcarTodosEncontrados = () => {
    const nextMap = { ...activosVerificadosMap };
    activosUbicacionReal.forEach(a => {
      nextMap[a.id] = { estado: 'encontrado', observaciones: nextMap[a.id]?.observaciones || 'Verificado in situ' };
    });
    persistirVerificados(nextMap);

    if (conteoActivo) {
      setConteoActivo(prev => {
        if (!prev) return prev;
        const lineasActualizadas = prev.lineas.map(l => ({
          ...l,
          cantidadFisica: l.cantidadSistema,
          diferencia: 0
        }));
        return {
          ...prev,
          lineas: lineasActualizadas,
          totalUnidadesFisicas: prev.totalUnidadesSistema,
          totalDiscrepancias: 0
        };
      });
    }
    showToast(`Todos los ${activosUbicacionReal.length} equipos marcados como encontrados.`);
  };

  // Iniciar nuevo conteo físico
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

  // Modificar cantidad física manual en tabla de líneas
  const modificarCantidadFisica = (lineaId: string, delta: number) => {
    if (!conteoActivo || conteoActivo.estado !== 'abierto') return;

    setConteoActivo(prev => {
      if (!prev) return prev;
      const lineas = prev.lineas.map(l => {
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
      const totalDisc = lineas.filter(l => l.diferencia !== 0).length;

      const updated = {
        ...prev,
        lineas,
        totalUnidadesFisicas: totalFisico,
        totalDiscrepancias: totalDisc
      };

      setUnsavedChanges(true);
      return updated;
    });
  };

  // Guardar y sincronizar avance con el servidor
  const sincronizarConServidor = async () => {
    if (!conteoActivo) return;

    setSubmitting(true);
    try {
      const dto: SincronizarConteosDto = {
        lineas: conteoActivo.lineas.map(l => ({
          recursoId: l.recursoId,
          loteId: l.loteId || undefined,
          cantidadFisica: l.cantidadFisica,
          notas: l.notas || undefined
        }))
      };

      const res = await apiClient.sincronizarLineasConteo(conteoActivo.id, dto);
      setConteoActivo(res);
      setUnsavedChanges(false);
      showToast('Avance sincronizado exitosamente con el servidor.');
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || 'Error al sincronizar con el servidor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Escanear código mediante cámara o entrada manual
  const handleItemEscaneado = async (codigo: string) => {
    if (!conteoActivo) return;

    const codNorm = codigo.trim().toLowerCase();

    // 1. Verificar si coincide con algún activo físico de esta ubicación
    const activoFisico = activosUbicacionReal.find(a =>
      (a.placa_institucional && a.placa_institucional.toLowerCase() === codNorm) ||
      (a.numero_serie && a.numero_serie.toLowerCase() === codNorm) ||
      (a.id && a.id.toLowerCase() === codNorm)
    );

    if (activoFisico) {
      setEstadoActivoFisico(activoFisico.id, 'encontrado', 'Verificado mediante escáner QR');
      showToast(`Activo verificado: ${activoFisico.placa_institucional} (${activoFisico.recurso_nombre})`);
    } else {
      // 2. Intentar registrar vía API del servidor
      try {
        const res = await apiClient.escanearItemConteo(conteoActivo.id, {
          codigo,
          cantidadSumar: 1,
          notas: 'Escaneo en vivo vía cámara PWA'
        });
        setConteoActivo(res);
        showToast(`Lectura registrada en auditoría: ${codigo}`);
      } catch (err: any) {
        showToast(err.message || `No se pudo registrar el código '${codigo}'`, 'error');
      }
    }
  };

  // Conciliar y finalizar conteo (con confirmación de ajustes)
  const handleConciliarConteo = async () => {
    if (!conteoActivo) return;

    setSubmitting(true);
    try {
      const res = await apiClient.conciliarConteoFisico(conteoActivo.id, {
        observaciones: `Conciliación física completada. ${activosUbicacionReal.length} equipos auditados in situ.`
      });
      setConteoActivo(res);
      setModalReporteOpen(false);
      showToast(`Conteo conciliado exitosamente. Ajustes patrimoniales registrados.`);
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || 'Error al conciliar auditoría física', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancelar conteo (sin fallos 500)
  const handleCancelarConteo = async (id: string) => {
    if (!confirm('¿Está seguro de cancelar esta sesión de auditoría? No se aplicarán cambios a las existencias.')) return;

    try {
      const res = await apiClient.cancelarConteoFisico(id, 'Cancelado por usuario');
      showToast('Sesión de auditoría cancelada');
      if (conteoActivo?.id === id) setConteoActivo(null);
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar conteo', 'error');
    }
  };

  // Eliminar conteo definitivamente (limpieza sin residuos)
  const handleEliminarConteo = async (id: string) => {
    if (!confirm('¿Desea eliminar este conteo de prueba? Se removerá completamente de la base de datos sin dejar datos residuales.')) return;

    try {
      await apiClient.eliminarConteoFisico(id);
      showToast('Conteo eliminado de la base de datos sin dejar residuos.');
      if (conteoActivo?.id === id) setConteoActivo(null);
      setModalReporteOpen(false);
      await cargarConteos();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar conteo', 'error');
    }
  };

  // Preparar lista estructurada para el reporte PDF
  const activosAuditadosParaReporte: ActivoVerificadoAudit[] = useMemo(() => {
    return activosUbicacionReal.map(a => {
      const v = activosVerificadosMap[a.id] || { estado: 'no_encontrado' };
      return {
        activo: a,
        estadoVerificado: v.estado,
        observaciones: v.observaciones
      };
    });
  }, [activosUbicacionReal, activosVerificadosMap]);

  // Filtrado de activos físicos en pantalla de auditoría
  const activosFisicosFiltrados = useMemo(() => {
    return activosUbicacionReal.filter(a => {
      const q = searchActivo.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        (a.placa_institucional && a.placa_institucional.toLowerCase().includes(q)) ||
        (a.numero_serie && a.numero_serie.toLowerCase().includes(q)) ||
        (a.recurso_nombre && a.recurso_nombre.toLowerCase().includes(q)) ||
        (a.responsable && a.responsable.toLowerCase().includes(q));

      const v = activosVerificadosMap[a.id]?.estado || 'no_encontrado';
      const matchEstado = filtroEstadoActivo === 'todos' || v === filtroEstadoActivo;

      return matchSearch && matchEstado;
    });
  }, [activosUbicacionReal, searchActivo, filtroEstadoActivo, activosVerificadosMap]);

  // Contadores de activos
  const totalEquiposUbicacion = activosUbicacionReal.length;
  const totalEncontrados = activosUbicacionReal.filter(a => activosVerificadosMap[a.id]?.estado === 'encontrado').length;
  const totalNoEncontrados = activosUbicacionReal.filter(a => (activosVerificadosMap[a.id]?.estado || 'no_encontrado') === 'no_encontrado').length;
  const totalDanados = activosUbicacionReal.filter(a => activosVerificadosMap[a.id]?.estado === 'danado').length;
  const porcentajeConforme = totalEquiposUbicacion > 0 ? Math.round((totalEncontrados / totalEquiposUbicacion) * 100) : 0;

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

      {/* Header Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1C3177] uppercase tracking-wider border border-blue-200">
              Auditoría Institucional TI 2026
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
            {unsavedChanges && (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 animate-pulse">
                Cambios pendientes de sincronizar
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Inventario Físico y Auditoría de Existencias
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verificación in situ de los 341 equipos físicos institucionales en las 49 ubicaciones UOD, lectura QR y reporte oficial en PDF.
          </p>
        </div>

        {/* Acciones del Encabezado */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!conteoActivo && (
            <button
              onClick={() => {
                setNuevaSesion({
                  ubicacionId: ubicaciones[0]?.id || '',
                  observaciones: '',
                  precargarExistencias: true
                });
                setModalIniciarOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] px-3.5 py-2 text-xs font-bold text-white transition-all shadow-sm shadow-[#1C3177]/20 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nueva Auditoría de Ubicación</span>
            </button>
          )}

          {conteoActivo && (
            <button
              onClick={() => setConteoActivo(null)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Ver Todas las Auditorías</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: ESPACIO DE TRABAJO DE AUDITORÍA ACTIVA */}
      {/* ======================================================== */}
      {conteoActivo ? (
        <div className="space-y-6">
          {/* Tarjeta de Control de la Sesión Activa */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-xs text-[#1C3177] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                    {conteoActivo.ubicacionCodigo || 'UB-UOD'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Auditoría en: {conteoActivo.ubicacionNombre}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    conteoActivo.estado === 'conciliado'
                      ? 'bg-emerald-100 text-[#2D8246]'
                      : conteoActivo.estado === 'abierto'
                      ? 'bg-blue-100 text-[#1C3177]'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {conteoActivo.estado}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Iniciado el {new Date(conteoActivo.fechaInicio).toLocaleDateString()} a las {new Date(conteoActivo.fechaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Auditor: <strong>{conteoActivo.responsableNombre || 'Admin UOD'}</strong>
                </p>
              </div>

              {/* Botones Operativos de la Auditoría */}
              <div className="flex items-center gap-2 flex-wrap">
                {conteoActivo.estado === 'abierto' && (
                  <>
                    <button
                      onClick={() => setScannerConteoOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-xs"
                      title="Escanear placa o QR desde la cámara del celular"
                    >
                      <Camera className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Escanear con Cámara</span>
                    </button>

                    <button
                      onClick={marcarTodosEncontrados}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                      title="Marcar todos los equipos visibles como encontrados"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Todos encontrados</span>
                    </button>

                    <button
                      onClick={sincronizarConServidor}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1C3177] border border-blue-200 transition-colors cursor-pointer"
                      title="Sincronizar y respaldar conteo con la base de datos"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${submitting ? 'animate-spin' : ''}`} />
                      <span>Guardar avance</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setModalReporteOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white transition-colors cursor-pointer shadow-xs"
                  title="Abrir acta oficial, exportar PDF y conciliar"
                >
                  <Printer className="h-3.5 w-3.5 text-blue-200" />
                  <span>Reporte Oficial PDF</span>
                </button>

                {conteoActivo.estado === 'abierto' && (
                  <button
                    onClick={() => handleCancelarConteo(conteoActivo.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 transition-colors cursor-pointer"
                    title="Cancelar auditoría"
                  >
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tarjetas de Métricas en Vivo */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Equipos</span>
                <span className="text-xl font-black text-slate-900">{totalEquiposUbicacion}</span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Encontrados</span>
                <span className="text-xl font-black text-emerald-700">{totalEncontrados}</span>
              </div>
              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-200/80">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Faltantes</span>
                <span className="text-xl font-black text-rose-700">{totalNoEncontrados}</span>
              </div>
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">Dañados / Falla</span>
                <span className="text-xl font-black text-amber-800">{totalDanados}</span>
              </div>
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-[#1C3177] uppercase block">Coincidencia</span>
                <span className="text-xl font-black text-[#1C3177]">{porcentajeConforme}%</span>
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>Progreso de verificación de la ubicación</span>
                <span>{totalEncontrados} de {totalEquiposUbicacion} equipos confirmados</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1C3177] transition-all duration-300"
                  style={{ width: `${porcentajeConforme}%` }}
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* LISTADO DE ACTIVOS FÍSICOS REALES EN ESTA UBICACIÓN */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Equipos Físicos Asignados ({totalEquiposUbicacion} activos reales)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marca cada equipo como encontrado, no encontrado o dañado durante el recorrido físico.
                </p>
              </div>

              {/* Filtro y Búsqueda de Activos */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchActivo}
                    onChange={e => setSearchActivo(e.target.value)}
                    placeholder="Buscar placa, serie, modelo..."
                    className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#1C3177]"
                  />
                </div>

                <select
                  value={filtroEstadoActivo}
                  onChange={e => setFiltroEstadoActivo(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:border-[#1C3177]"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="encontrado">🟢 Encontrados ({totalEncontrados})</option>
                  <option value="no_encontrado">🔴 Faltantes ({totalNoEncontrados})</option>
                  <option value="danado">🟡 Dañados ({totalDanados})</option>
                </select>
              </div>
            </div>

            {/* Listado de Activos */}
            {activosFisicosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="font-semibold text-slate-600">No se encontraron activos con los filtros aplicados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activosFisicosFiltrados.map(activo => {
                  const estadoActual = activosVerificadosMap[activo.id]?.estado || 'no_encontrado';
                  const notasActuales = activosVerificadosMap[activo.id]?.observaciones || '';

                  return (
                    <div
                      key={activo.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        estadoActual === 'encontrado'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : estadoActual === 'danado'
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Datos del Activo */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#1C3177] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                              {activo.placa_institucional || 'S/P'}
                            </span>
                            <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {activo.recurso_nombre}
                            </h5>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500 font-mono flex-wrap">
                            <span>Serie: <strong className="text-slate-700">{activo.numero_serie || 'N/A'}</strong></span>
                            <span>Custodio: <strong className="text-slate-700">{activo.responsable || 'Sin custodio'}</strong></span>
                            <span>Categoría: <strong className="text-slate-700">{activo.categoria_nombre}</strong></span>
                          </div>
                        </div>

                        {/* Botones de Marcado de Estado */}
                        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                          <button
                            type="button"
                            onClick={() => setEstadoActivoFisico(activo.id, 'encontrado')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              estadoActual === 'encontrado'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Encontrado</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEstadoActivoFisico(activo.id, 'no_encontrado')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              estadoActual === 'no_encontrado'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>No encontrado</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEstadoActivoFisico(activo.id, 'danado')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              estadoActual === 'danado'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Dañado</span>
                          </button>
                        </div>
                      </div>

                      {/* Campo de Notas u Observaciones */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">Observación:</span>
                        <input
                          type="text"
                          value={notasActuales}
                          onChange={e => setEstadoActivoFisico(activo.id, estadoActual, e.target.value)}
                          placeholder="Agregar nota sobre este activo físico (ej. Teclado roto, etiqueta ilegible)..."
                          className="w-full text-xs bg-transparent border-none text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-0 italic"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* BALANCE POR LÍNEAS DE INVENTARIO GENERAL */}
          {/* ======================================================== */}
          {conteoActivo.lineas.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  2. Balance de Existencias por Insumo / Recurso
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparativa de cantidades teóricas registradas en el sistema vs conteo físico verificado.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Recurso / Insumo</th>
                      <th className="py-3 px-4 text-center">Stock Sistema</th>
                      <th className="py-3 px-4 text-center">Físico Contado</th>
                      <th className="py-3 px-4 text-center">Diferencia</th>
                      <th className="py-3 px-4 text-right">Ajuste Manual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {conteoActivo.lineas.map(linea => (
                      <tr key={linea.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{linea.recursoNombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{linea.recursoSku}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600">
                          {linea.cantidadSistema} {linea.unidadMedida}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm font-black text-slate-900">{linea.cantidadFisica}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {linea.diferencia === 0 ? (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                              <Check className="h-3 w-3 text-emerald-600" /> 0 (Conforme)
                            </span>
                          ) : linea.diferencia > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold text-[11px]">
                              +{linea.diferencia} (Sobrante)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-bold text-[11px]">
                              {linea.diferencia} (Faltante)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {conteoActivo.estado === 'abierto' ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => modificarCantidadFisica(linea.id, -1)}
                                className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                onClick={() => modificarCantidadFisica(linea.id, 1)}
                                className="w-7 h-7 rounded-lg bg-[#1C3177] hover:bg-[#2B4BA0] font-bold text-white shadow-2xs cursor-pointer"
                              >
                                +
                              </button>
                              <button
                                onClick={() => modificarCantidadFisica(linea.id, 5)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                              >
                                +5
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Conciliado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* VISTA 2: LISTA DE SESIONES DE AUDITORÍA FÍSICA */
        /* ======================================================== */
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <select
                value={filtroUbicacion}
                onChange={e => setFiltroUbicacion(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
              >
                <option value="todas">Todas las Ubicaciones ({ubicaciones.length})</option>
                {ubicaciones.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.totalActivosFisicos || 0} activos)
                  </option>
                ))}
              </select>

              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
              >
                <option value="todos">Todos los Estados</option>
                <option value="abierto">Abiertos</option>
                <option value="conciliado">Conciliados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={cargarConteos}
                disabled={loadingConteos}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                title="Actualizar sesiones"
              >
                <RefreshCw className={`h-4 w-4 ${loadingConteos ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabla de Sesiones o Estado Vacío */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {loadingConteos ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-[#1C3177] mx-auto mb-2" />
                <p className="text-xs font-semibold">Cargando sesiones de inventario físico...</p>
              </div>
            ) : conteos.length === 0 ? (
              /* Estado Vacío Elegante */
              <div className="p-12 sm:p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1C3177] flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
                  <ClipboardCheck className="h-8 w-8 text-[#1C3177]" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-black text-slate-900">
                    No se encontraron sesiones de inventario físico
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Inicia un nuevo conteo por ubicación institucional para verificar los equipos físicos reales con la cámara de tu celular y emitir reportes de conciliación oficiales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNuevaSesion({
                      ubicacionId: ubicaciones[0]?.id || '',
                      observaciones: '',
                      precargarExistencias: true
                    });
                    setModalIniciarOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white text-xs font-bold transition-all shadow-sm shadow-[#1C3177]/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear primer conteo</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Ubicación Auditada</th>
                    <th className="px-4 py-3.5">Auditor / Responsable</th>
                    <th className="px-4 py-3.5">Fecha</th>
                    <th className="px-4 py-3.5 text-center">Contadas / Teóricas</th>
                    <th className="px-4 py-3.5 text-center">Discrepancias</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {conteos.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div>{c.ubicacionNombre}</div>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          {c.ubicacionCodigo || 'UOD'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{c.responsableNombre || 'Admin UOD'}</td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(c.fechaInicio).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold">
                        <span className="text-[#1C3177]">{c.totalUnidadesFisicas}</span> / {c.totalUnidadesSistema}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.totalDiscrepancias > 0
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {c.totalDiscrepancias} {c.totalDiscrepancias === 1 ? 'diferencia' : 'diferencias'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.estado === 'conciliado'
                            ? 'bg-emerald-100 text-[#2D8246]'
                            : c.estado === 'abierto'
                            ? 'bg-blue-100 text-[#1C3177]'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setConteoActivo(c)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1C3177] hover:bg-blue-100 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            {c.estado === 'abierto' ? 'Continuar conteo' : 'Ver detalle'}
                          </button>

                          <button
                            onClick={() => {
                              setConteoActivo(c);
                              setModalReporteOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver reporte oficial PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleEliminarConteo(c.id)}
                            className="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar sesión de conteo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INICIAR NUEVO CONTEO POR UBICACIÓN */}
      {/* ======================================================== */}
      {modalIniciarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Iniciar Auditoría de Inventario Físico</h3>
                <p className="text-xs text-slate-500">Seleccione la ubicación institucional a auditar in situ</p>
              </div>
              <button
                onClick={() => setModalIniciarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIniciarConteo} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ubicación a Auditar (49 ubicaciones institucionales) *
                </label>
                <select
                  value={nuevaSesion.ubicacionId}
                  onChange={e => setNuevaSesion(prev => ({ ...prev, ubicacionId: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
                >
                  <option value="">Seleccione clínica, aula, departamento o laboratorio...</option>
                  {ubicaciones.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.totalActivosFisicos || 0} activos asignados)
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevaSesion.precargarExistencias}
                    onChange={e => setNuevaSesion(prev => ({ ...prev, precargarExistencias: e.target.checked }))}
                    className="rounded border-slate-300 text-[#1C3177] focus:ring-[#1C3177] mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-[#1C3177] text-xs">
                      Precargar catálogo y existencias de activos de esta ubicación
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Carga automáticamente los activos físicos y existencias que el sistema tiene registrados en esta área para comparar discrepancias.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  value={nuevaSesion.observaciones}
                  onChange={e => setNuevaSesion(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Motivo del conteo (ej. Auditoría semestral, traspaso de custodio)..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalIniciarOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#1C3177] px-5 py-2 font-bold text-white hover:bg-[#2B4BA0] transition-all flex items-center gap-1.5 shadow-sm shadow-[#1C3177]/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Comenzar Auditoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ESCÁNER CON CÁMARA PWA PARA CONTEO */}
      {/* ======================================================== */}
      {scannerConteoOpen && (
        <CameraScannerModal
          isOpen={scannerConteoOpen}
          onClose={() => setScannerConteoOpen(false)}
          onScanAuditCode={codigo => {
            handleItemEscaneado(codigo);
            setScannerConteoOpen(false);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL: REPORTE OFICIAL PDF Y CONCILIACIÓN */}
      {/* ======================================================== */}
      {modalReporteOpen && conteoActivo && (
        <PhysicalAuditReportModal
          isOpen={modalReporteOpen}
          onClose={() => setModalReporteOpen(false)}
          conteo={conteoActivo}
          activosAuditados={activosAuditadosParaReporte}
          onConciliar={handleConciliarConteo}
          onEliminar={() => handleEliminarConteo(conteoActivo.id)}
          submitting={submitting}
        />
      )}
    </div>
  );
};
