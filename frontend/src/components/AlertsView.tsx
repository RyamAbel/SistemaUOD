'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCheck,
  Check,
  RefreshCw,
  Trash2,
  Sliders,
  X,
  Package,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Mail
} from 'lucide-react';
import {
  apiClient,
  AlertaDto,
  ResumenAlertasDto,
  NotificacionPreferenciaDto
} from '@/lib/apiClient';
import { ResourceDetailModal } from './ResourceDetailModal';

export const AlertsView: React.FC = () => {
  const [alertas, setAlertas] = useState<AlertaDto[]>([]);
  const [resumen, setResumen] = useState<ResumenAlertasDto>({
    totalNoLeidas: 0,
    totalUrgentes: 0,
    totalAdvertencias: 0,
    totalInfo: 0,
    porTipo: {}
  });
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filtros
  const [filtroLeida, setFiltroLeida] = useState<'todas' | 'no_leidas' | 'leidas'>('no_leidas');
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>('todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Modal de Detalle de Recurso
  const [selectedRecursoId, setSelectedRecursoId] = useState<string | null>(null);

  // Modal de Preferencias
  const [prefOpen, setPrefOpen] = useState(false);
  const [prefLoading, setPrefLoading] = useState(false);
  const [preferencias, setPreferencias] = useState<NotificacionPreferenciaDto>({
    id: '',
    usuarioId: '',
    recibirAlertasStock: true,
    recibirAlertasMantenimiento: true,
    recibirResumenSemanal: false,
    actualizadoEn: ''
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const leidaParam = filtroLeida === 'no_leidas' ? false : filtroLeida === 'leidas' ? true : undefined;
      const sevParam = filtroSeveridad !== 'todas' ? filtroSeveridad : undefined;
      const tipoParam = filtroTipo !== 'todos' ? filtroTipo : undefined;

      const [resAlertas, resResumen] = await Promise.all([
        apiClient.listarAlertas({
          leida: leidaParam,
          severidad: sevParam,
          tipo: tipoParam,
          pagina,
          tamanoPagina: 15
        }),
        apiClient.obtenerResumenAlertas()
      ]);

      setAlertas(resAlertas.items || []);
      setTotalPaginas(resAlertas.totalPages || 1);
      setResumen(resResumen);
    } catch (err: any) {
      console.error('Error cargando alertas:', err);
      showToast('Error cargando alertas desde el servidor.');
    } finally {
      setLoading(false);
    }
  }, [filtroLeida, filtroSeveridad, filtroTipo, pagina]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleEvaluarReglas = async () => {
    setEvaluating(true);
    try {
      const res = await apiClient.evaluarReglasAlertas();
      showToast(`Motor de alertas ejecutado: ${res.alertasGeneradas} nuevas, ${res.alertasOmitidasExistentes} omitidas.`);
      await cargarDatos();
    } catch (err: any) {
      console.error('Error evaluando reglas:', err);
      showToast('No se pudo ejecutar la evaluación de reglas.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleMarcarLeida = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.marcarAlertaLeida(id);
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, leida: true } : a));
      setResumen(prev => ({
        ...prev,
        totalNoLeidas: Math.max(0, prev.totalNoLeidas - 1)
      }));
      showToast('Alerta marcada como leída.');
      if (filtroLeida === 'no_leidas') {
        cargarDatos();
      }
    } catch {
      showToast('Error al actualizar el estado de la alerta.');
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      const res = await apiClient.marcarTodasAlertasLeidas();
      showToast(`Se marcaron ${res.total} alertas como leídas.`);
      await cargarDatos();
    } catch {
      showToast('Error al marcar todas las alertas como leídas.');
    }
  };

  const handleEliminarAlerta = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.eliminarAlerta(id);
      setAlertas(prev => prev.filter(a => a.id !== id));
      showToast('Alerta eliminada del sistema.');
    } catch {
      showToast('Error al eliminar la alerta.');
    }
  };

  const handleEliminarTodasAlertas = async () => {
    if (!confirm('¿Está seguro de que desea eliminar todas las alertas residuales del sistema? Esta acción limpiará el contador a cero.')) return;
    try {
      const res = await apiClient.eliminarTodasAlertas();
      setAlertas([]);
      setResumen({
        totalNoLeidas: 0,
        totalUrgentes: 0,
        totalAdvertencias: 0,
        totalInfo: 0,
        porTipo: {}
      });
      showToast(res.mensaje || 'Todas las alertas fueron eliminadas. Contador en cero.');
      await cargarDatos();
    } catch {
      showToast('Error al limpiar las alertas.');
    }
  };

  const handleAbrirPreferencias = async () => {
    setPrefOpen(true);
    setPrefLoading(true);
    try {
      const pref = await apiClient.obtenerPreferenciasNotificacion();
      setPreferencias(pref);
    } catch {
      showToast('No se pudieron cargar las preferencias.');
    } finally {
      setPrefLoading(false);
    }
  };

  const handleGuardarPreferencias = async () => {
    setPrefLoading(true);
    try {
      const pref = await apiClient.actualizarPreferenciasNotificacion({
        recibirAlertasStock: preferencias.recibirAlertasStock,
        recibirAlertasMantenimiento: preferencias.recibirAlertasMantenimiento,
        recibirResumenSemanal: preferencias.recibirResumenSemanal
      });
      setPreferencias(pref);
      showToast('Preferencias de notificación guardadas.');
      setPrefOpen(false);
    } catch {
      showToast('Error al guardar las preferencias.');
    } finally {
      setPrefLoading(false);
    }
  };

  const getSeveridadBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'urgente':
        return {
          icon: AlertOctagon,
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-500',
          label: 'Urgente'
        };
      case 'advertencia':
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          dot: 'bg-amber-500',
          label: 'Advertencia'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-blue-50 border-blue-200 text-[#1C3177]',
          dot: 'bg-[#1C3177]',
          label: 'Informativa'
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F7F9FC] min-h-screen">
      {/* Header & Acciones Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1C3177]/10 flex items-center justify-center text-[#1C3177]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Centro de Alertas y Notificaciones
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoreo continuo de stock mínimo (RF-12), vencimientos clínicos y servicios técnicos UOD
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleEvaluarReglas}
            disabled={evaluating}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#1C3177] ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Evaluando...' : 'Evaluar Reglas'}</span>
          </button>

          <button
            onClick={handleMarcarTodasLeidas}
            disabled={resumen.totalNoLeidas === 0}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#2D8246] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5 text-[#3DAA5C]" />
            <span>Marcar Todas Leídas</span>
          </button>

          <button
            onClick={handleEliminarTodasAlertas}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all shadow-xs cursor-pointer"
            title="Eliminar todas las alertas residuales para reiniciar el contador a cero"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            <span>Limpiar Alertas</span>
          </button>

          <button
            onClick={handleAbrirPreferencias}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white transition-all shadow-xs cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Preferencias</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">No Leídas</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{resumen.totalNoLeidas}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 border border-rose-200">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Urgentes</span>
            <p className="text-2xl font-black text-rose-700 mt-0.5">{resumen.totalUrgentes}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Advertencias</span>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{resumen.totalAdvertencias}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#1C3177] shrink-0 border border-blue-200">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#1C3177] uppercase tracking-wider">Informativas</span>
            <p className="text-2xl font-black text-[#1C3177] mt-0.5">{resumen.totalInfo}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        {/* Filtro Estado */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setFiltroLeida('no_leidas'); setPagina(1); }}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              filtroLeida === 'no_leidas'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            No Leídas ({resumen.totalNoLeidas})
          </button>
          <button
            onClick={() => { setFiltroLeida('todas'); setPagina(1); }}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              filtroLeida === 'todas'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => { setFiltroLeida('leidas'); setPagina(1); }}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              filtroLeida === 'leidas'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Historial Leídas
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro Severidad */}
          <select
            value={filtroSeveridad}
            onChange={(e) => { setFiltroSeveridad(e.target.value); setPagina(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#1C3177]"
          >
            <option value="todas">Todas las Severidades</option>
            <option value="urgente">Urgente</option>
            <option value="advertencia">Advertencia</option>
            <option value="info">Informativa</option>
          </select>

          {/* Filtro Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#1C3177]"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="stock_bajo">Stock Bajo / Reorden</option>
            <option value="proximo_vencimiento">Vencimiento Clínico</option>
            <option value="mantenimiento_vencido">Mantenimiento TI</option>
            <option value="sistema">Sistema & Auditoría</option>
          </select>
        </div>
      </div>

      {/* Lista de Alertas */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 p-4 animate-pulse" />
          ))}
        </div>
      ) : alertas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-[#3DAA5C] mx-auto flex items-center justify-center mb-3 border border-emerald-200">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Todo en orden institucional</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No existen alertas activas con los filtros seleccionados. El inventario físico y los lotes clínicos están sincronizados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => {
            const sev = getSeveridadBadge(alerta.severidad);
            const SevIcon = sev.icon;
            const fechaStr = new Date(alerta.creadoEn).toLocaleString('es-DO', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={alerta.id}
                onClick={() => alerta.recursoId && setSelectedRecursoId(alerta.recursoId)}
                className={`bg-white rounded-2xl border transition-all p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-slate-300 ${
                  !alerta.leida ? 'border-l-4 border-l-[#1C3177]' : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`mt-0.5 h-10 w-10 rounded-xl ${sev.bg} flex items-center justify-center shrink-0 border`}>
                    <SevIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sev.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                        {sev.label}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{alerta.titulo}</h4>
                      {!alerta.leida && (
                        <span className="rounded-full bg-blue-100 text-[#1C3177] px-2 py-0.2 text-[9px] font-extrabold uppercase tracking-wider">
                          Nueva
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alerta.mensaje}</p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {fechaStr}
                      </span>

                      {alerta.recursoSku && (
                        <span className="flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Package className="h-3 w-3 text-slate-400" />
                          SKU: {alerta.recursoSku}
                        </span>
                      )}

                      {alerta.ubicacionNombre && (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {alerta.ubicacionNombre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {!alerta.leida ? (
                    <button
                      onClick={(e) => handleMarcarLeida(alerta.id, e)}
                      title="Marcar como leída"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Leída</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold px-2 py-1">
                      Leída
                    </span>
                  )}

                  <button
                    onClick={(e) => handleEliminarAlerta(alerta.id, e)}
                    title="Descartar alerta"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
          <span className="text-slate-500 font-medium">
            Página <strong className="text-slate-900">{pagina}</strong> de <strong className="text-slate-900">{totalPaginas}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Anterior</span>
            </button>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold disabled:opacity-40"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Preferencias de Notificación */}
      {prefOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#1C3177]/10 flex items-center justify-center text-[#1C3177]">
                  <Sliders className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Preferencias de Notificación</h3>
              </div>
              <button
                onClick={() => setPrefOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Configura los canales y tipos de avisos que deseas recibir como personal de la Universidad Odontológica Dominicana.
              </p>

              {prefLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Cargando preferencias...</div>
              ) : (
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferencias.recibirAlertasStock}
                      onChange={(e) => setPreferencias({ ...preferencias, recibirAlertasStock: e.target.checked })}
                      className="mt-0.5 rounded text-[#1C3177] focus:ring-[#1C3177]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">Alertas de Stock Mínimo y Reorden (RF-12)</span>
                      <p className="text-[11px] text-slate-500">Notificar cuando un insumo clínico o consumible caiga por debajo de su umbral óptimo.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferencias.recibirAlertasMantenimiento}
                      onChange={(e) => setPreferencias({ ...preferencias, recibirAlertasMantenimiento: e.target.checked })}
                      className="mt-0.5 rounded text-[#1C3177] focus:ring-[#1C3177]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">Servicios Técnicos y Mantenimiento TI</span>
                      <p className="text-[11px] text-slate-500">Avisos preventivos 7 días antes de la fecha programada y alertas de servicios vencidos.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferencias.recibirResumenSemanal}
                      onChange={(e) => setPreferencias({ ...preferencias, recibirResumenSemanal: e.target.checked })}
                      className="mt-0.5 rounded text-[#1C3177] focus:ring-[#1C3177]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">Resumen Semanal Consolidado por Correo</span>
                      <p className="text-[11px] text-slate-500">Envío automático cada lunes con el balance general de movimientos y activos.</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setPrefOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPreferencias}
                disabled={prefLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white transition-colors shadow-xs disabled:opacity-50"
              >
                Guardar Preferencias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ficha Técnica del Recurso */}
      {selectedRecursoId && (
        <ResourceDetailModal
          isOpen={true}
          recursoId={selectedRecursoId}
          onClose={() => setSelectedRecursoId(null)}
        />
      )}

      {/* Floating Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900 text-white px-5 py-3 text-xs shadow-2xl animate-fade-in">
          <Sparkles className="h-4 w-4 text-[#06B6D4] shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
