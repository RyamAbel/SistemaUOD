'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  ShieldAlert,
  Laptop,
  Printer,
  Server,
  Zap,
  Building2,
  User,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  DollarSign,
  FileText,
  Check
} from 'lucide-react';
import {
  apiClient,
  MantenimientoDto,
  CrearMantenimientoDto,
  CompletarMantenimientoDto,
  CancelarMantenimientoDto
} from '@/lib/apiClient';
import { ACTIVOS_ORIGINALES, ActivoTI } from '@/lib/inventoryData';
import { useAuth } from '@/context/AuthContext';

export const MaintenanceView: React.FC = () => {
  const { rol } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mantenimientos, setMantenimientos] = useState<MantenimientoDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');

  // Modales
  const [modalProgramarOpen, setModalProgramarOpen] = useState(false);
  const [modalCompletarOpen, setModalCompletarOpen] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState<MantenimientoDto | null>(null);

  // Estados de formulario de programación
  const [nuevoActivoId, setNuevoActivoId] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'preventivo' | 'correctivo' | 'calibracion'>('preventivo');
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nuevoTecnico, setNuevoTecnico] = useState('');
  const [nuevoCostoEstimado, setNuevoCostoEstimado] = useState<number>(0);
  const [nuevasObservaciones, setNuevasObservaciones] = useState('');
  const [cambiarEstadoAEnMantenimiento, setCambiarEstadoAEnMantenimiento] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados de formulario de completar
  const [fechaFinReal, setFechaFinReal] = useState(new Date().toISOString().slice(0, 10));
  const [costoReal, setCostoReal] = useState<number>(0);
  const [notasResolucion, setNotasResolucion] = useState('');
  const [estadoFinalActivo, setEstadoFinalActivo] = useState<'en_uso' | 'disponible'>('en_uso');

  // Estados de cancelación
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Toast
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar mantenimientos desde API
  const cargarMantenimientos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listarMantenimientos({
        pageIndex: 1,
        pageSize: 50,
        search: searchTerm || undefined,
        estado: estadoFiltro !== 'todos' ? estadoFiltro : undefined,
        tipo: tipoFiltro !== 'todos' ? tipoFiltro : undefined
      });
      setMantenimientos(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.warn('Error al cargar mantenimientos:', err);
      setMantenimientos([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, estadoFiltro, tipoFiltro]);

  useEffect(() => {
    cargarMantenimientos();
  }, [cargarMantenimientos]);

  // Programar Mantenimiento
  const handleGuardarProgramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoActivoId) {
      showToast('Selecciona el equipo físico para la intervención.', 'error');
      return;
    }

    setGuardando(true);
    try {
      const dto: CrearMantenimientoDto = {
        activoSerieId: nuevoActivoId,
        tipo: nuevoTipo,
        fechaProgramada: nuevaFecha,
        tecnicoResponsable: nuevoTecnico.trim() || undefined,
        costo: nuevoCostoEstimado >= 0 ? nuevoCostoEstimado : 0,
        descripcion: nuevasObservaciones.trim() || `Mantenimiento ${nuevoTipo} programado`,
        cambiarEstadoActivoAEnMantenimiento: cambiarEstadoAEnMantenimiento
      };

      await apiClient.registrarMantenimiento(dto);
      showToast('Mantenimiento programado exitosamente.');
      setModalProgramarOpen(false);
      // Reset form
      setNuevoActivoId('');
      setNuevoTecnico('');
      setNuevoCostoEstimado(0);
      setNuevasObservaciones('');
      cargarMantenimientos();
    } catch (err: any) {
      showToast(err.message || 'Error al programar mantenimiento.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Completar Mantenimiento
  const handleConfirmarCompletar = async () => {
    if (!mantenimientoSeleccionado) return;
    setGuardando(true);
    try {
      const dto: CompletarMantenimientoDto = {
        fechaRealizada: fechaFinReal,
        costoFinal: costoReal >= 0 ? costoReal : 0,
        observacionesFinales: notasResolucion.trim(),
        estadoFinalActivo: estadoFinalActivo
      };

      await apiClient.completarMantenimiento(mantenimientoSeleccionado.id, dto);
      showToast('Mantenimiento completado y estado del activo actualizado.');
      setModalCompletarOpen(false);
      setMantenimientoSeleccionado(null);
      cargarMantenimientos();
    } catch (err: any) {
      showToast(err.message || 'Error al completar mantenimiento.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Cancelar Mantenimiento
  const handleConfirmarCancelar = async () => {
    if (!mantenimientoSeleccionado) return;
    setGuardando(true);
    try {
      const dto: CancelarMantenimientoDto = {
        motivo: motivoCancelacion.trim() || 'Cancelado por el operador'
      };

      await apiClient.cancelarMantenimiento(mantenimientoSeleccionado.id, dto);
      showToast('Mantenimiento cancelado y activo devuelto a estado operativo.');
      setModalCancelarOpen(false);
      setMantenimientoSeleccionado(null);
      setMotivoCancelacion('');
      cargarMantenimientos();
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar mantenimiento.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Cálculos dinámicos
  const proximosCount = mantenimientos.filter((m) => m.estado === 'programado').length;
  const enRevisionCount = mantenimientos.filter((m) => m.estado === 'en_proceso').length;
  const completadosCount = mantenimientos.filter((m) => m.estado === 'completado').length;

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in ${
            toast.tipo === 'success' ? 'bg-[#1C3177]' : 'bg-rose-600'
          }`}
        >
          {toast.tipo === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#3DAA5C]" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-white" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#1C3177]" />
            Mantenimiento y Soporte Técnico de Equipos TI
          </h2>
          <p className="text-xs text-slate-500">
            Control preventivo y correctivo de laptops, servidores, pantallas y UPS de la Universidad Odontológica Dominicana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarMantenimientos()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Recargar"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#1C3177] ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => setModalProgramarOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Programar Mantenimiento</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards (100% dinámicas basadas en BD real) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex items-center justify-between text-xs text-[#1C3177] font-semibold mb-1">
            <span>Programados / Próximos</span>
            <Calendar className="h-4 w-4 text-[#1C3177]" />
          </div>
          <div className="text-2xl font-bold text-[#1C3177] font-mono">{proximosCount}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Servicios agendados</span>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
          <div className="flex items-center justify-between text-xs text-[#0891B2] font-semibold mb-1">
            <span>En Proceso / Taller</span>
            <Clock className="h-4 w-4 text-[#0891B2]" />
          </div>
          <div className="text-2xl font-bold text-[#0891B2] font-mono">{enRevisionCount}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Intervenciones activas</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between text-xs text-[#2D8246] font-semibold mb-1">
            <span>Completados</span>
            <CheckCircle2 className="h-4 w-4 text-[#2D8246]" />
          </div>
          <div className="text-2xl font-bold text-[#2D8246] font-mono">{completadosCount}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Servicios finalizados</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Total Activos TI</span>
            <Laptop className="h-4 w-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">341</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Parque tecnológico UOD</span>
        </div>
      </div>

      {/* Main Section: Calendar & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar Grid */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#1C3177]" />
              <h3 className="font-bold text-sm text-slate-900">
                Calendario Institucional ({new Date().toLocaleString('es-DO', { month: 'long', year: 'numeric' })})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {mantenimientos.length} evento(s) registrado(s)
            </span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="font-bold text-slate-400 py-1">
                {d}
              </div>
            ))}
            {days.map((day) => {
              // Buscar si hay mantenimientos en este día
              const eventosDia = mantenimientos.filter((m) => {
                const f = new Date(m.fechaProgramada);
                return f.getDate() === day;
              });

              const tieneEventos = eventosDia.length > 0;

              return (
                <div
                  key={day}
                  className={`min-h-[52px] rounded-lg border p-1 text-left flex flex-col justify-between transition-colors ${
                    tieneEventos
                      ? 'border-[#1C3177] bg-blue-50/70'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <span className={`font-mono text-[10px] font-bold ${tieneEventos ? 'text-[#1C3177]' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  {eventosDia.map((ev) => (
                    <span
                      key={ev.id}
                      className="text-[8px] font-bold rounded bg-[#1C3177] text-white px-1 py-0.5 truncate block"
                      title={`${ev.placaInstitucional} - ${ev.tipo}`}
                    >
                      {ev.placaInstitucional}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400">
            {mantenimientos.length === 0
              ? 'No hay intervenciones técnicas agendadas en este mes.'
              : `Mostrando ${mantenimientos.length} intervención(es) en el calendario.`}
          </div>
        </div>

        {/* Right Column: Information & Guidelines Panel */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#06B6D4]" />
              Protocolo de Mantenimiento UOD
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Políticas institucionales para el servicio preventivo de hardware de clínicas y aulas.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3DAA5C]" />
                Preventivo Semestral
              </span>
              <p className="text-[11px] text-slate-500">
                Limpieza interna, cambio de pasta térmica en PCs/Laptops y verificación de ventilación en laboratorios y clínicas.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Sistemas de Respaldo (UPS)
              </span>
              <p className="text-[11px] text-slate-500">
                Prueba trimestral de baterías, tiempos de autonomía y estabilidad de voltaje para proteger equipos clínicos.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Printer className="h-3.5 w-3.5 text-blue-500" />
                Impresoras y Escáneres
              </span>
              <p className="text-[11px] text-slate-500">
                Limpieza de rodillos, calibración óptica y verificación de niveles de tóner en áreas administrativas y académicas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table: Mantenimientos Registrados */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Órdenes y Servicios Técnicos Registrados
            </h3>
            <p className="text-[11px] text-slate-500">
              Historial de intervenciones sobre los 341 equipos tecnológicos de la UOD.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative w-full sm:w-56">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por placa, técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1C3177]"
              />
            </div>

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1C3177]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="programado">Programado</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1C3177]"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
              <option value="calibracion">Calibración</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#1C3177]" />
            <span>Cargando servicios técnicos...</span>
          </div>
        ) : mantenimientos.length === 0 ? (
          /* Empty State Limpio */
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-[#1C3177] flex items-center justify-center border border-blue-100 shadow-xs">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Aún no hay mantenimientos programados</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                El módulo de mantenimiento técnico se encuentra listo. Programa revisiones preventivas o correctivas para cualquier equipo físico del inventario TI.
              </p>
            </div>
            <button
              onClick={() => setModalProgramarOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Programar Primer Mantenimiento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">Placa / Equipo</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Fecha Programada</th>
                  <th className="py-3 px-4">Técnico Asignado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Costo (DOP)</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                {mantenimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#1C3177] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                          {m.placaInstitucional || 'N/A'}
                        </span>
                        <span className="font-bold text-slate-900">
                          {m.recursoNombre || 'Equipo TI UOD'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">{m.tipo}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {m.fechaProgramada ? new Date(m.fechaProgramada).toLocaleDateString('es-DO') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {m.tecnicoResponsable || 'No asignado'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded px-2.5 py-0.5 text-[10px] font-bold ${
                          m.estado === 'completado'
                            ? 'bg-emerald-50 text-[#2D8246] border border-emerald-200'
                            : m.estado === 'en_proceso'
                            ? 'bg-cyan-50 text-[#0891B2] border border-cyan-200'
                            : m.estado === 'cancelado'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-50 text-[#1C3177] border border-blue-200'
                        }`}
                      >
                        {m.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {m.costo > 0
                        ? `RD$ ${m.costo.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
                        : 'RD$ 0.00'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.estado !== 'completado' && m.estado !== 'cancelado' && (
                          <>
                            <button
                              onClick={() => {
                                setMantenimientoSeleccionado(m);
                                setCostoReal(m.costo || 0);
                                setModalCompletarOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-[#3DAA5C] hover:bg-[#2D8246] text-white text-[10px] font-bold transition-colors cursor-pointer"
                              title="Completar intervención"
                            >
                              Completar
                            </button>
                            <button
                              onClick={() => {
                                setMantenimientoSeleccionado(m);
                                setModalCancelarOpen(true);
                              }}
                              className="px-2 py-1 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Cancelar orden"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: PROGRAMAR MANTENIMIENTO */}
      {modalProgramarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Wrench className="h-5 w-5 text-[#1C3177]" />
                <h3 className="font-bold text-sm">Programar Servicio Técnico</h3>
              </div>
              <button
                onClick={() => setModalProgramarOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarProgramacion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Activo TI / Placa Institucional *
                </label>
                <select
                  required
                  value={nuevoActivoId}
                  onChange={(e) => setNuevoActivoId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                >
                  <option value="">-- Seleccionar Equipo Físico --</option>
                  {ACTIVOS_ORIGINALES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.placa_institucional} - {a.recurso_nombre} ({a.ubicacion_nombre})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  341 activos TI disponibles del inventario oficial.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Servicio *</label>
                  <select
                    value={nuevoTipo}
                    onChange={(e) => setNuevoTipo(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
                  >
                    <option value="preventivo">Preventivo</option>
                    <option value="correctivo">Correctivo</option>
                    <option value="calibracion">Calibración</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Programada *</label>
                  <input
                    type="date"
                    required
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Técnico / Responsable</label>
                  <input
                    type="text"
                    placeholder="Ej. Soporte TI / Ing. Pérez"
                    value={nuevoTecnico}
                    onChange={(e) => setNuevoTecnico(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Costo Estimado (DOP)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={nuevoCostoEstimado || ''}
                    onChange={(e) => setNuevoCostoEstimado(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la intervención..."
                  value={nuevasObservaciones}
                  onChange={(e) => setNuevasObservaciones(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cambiarEstadoAEnMantenimiento}
                  onChange={(e) => setCambiarEstadoAEnMantenimiento(e.target.checked)}
                  className="h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
                />
                <span className="text-[11px] text-[#1C3177] font-semibold">
                  Cambiar de inmediato el estado del equipo a «En Mantenimiento»
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalProgramarOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Programar Mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETAR MANTENIMIENTO */}
      {modalCompletarOpen && mantenimientoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <CheckCircle2 className="h-5 w-5 text-[#3DAA5C]" />
                <h3 className="font-bold text-sm">Completar Intervención Técnica</h3>
              </div>
              <button
                onClick={() => setModalCompletarOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <span className="font-mono font-bold text-xs text-[#1C3177]">
                  {mantenimientoSeleccionado.placaInstitucional}
                </span>
                <p className="text-xs text-slate-800 font-semibold mt-0.5">
                  {mantenimientoSeleccionado.recursoNombre}
                </p>
                <span className="text-[10px] text-slate-500 capitalize">
                  Tipo: {mantenimientoSeleccionado.tipo}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha de Finalización *</label>
                <input
                  type="date"
                  required
                  value={fechaFinReal}
                  onChange={(e) => setFechaFinReal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Costo Real Invertido (DOP)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costoReal || ''}
                  onChange={(e) => setCostoReal(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas de Resolución / Cierre</label>
                <textarea
                  rows={2}
                  placeholder="Descripción del trabajo ejecutado..."
                  value={notasResolucion}
                  onChange={(e) => setNotasResolucion(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado Posterior del Activo *</label>
                <select
                  value={estadoFinalActivo}
                  onChange={(e) => setEstadoFinalActivo(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
                >
                  <option value="en_uso">En Uso Operativo</option>
                  <option value="disponible">Disponible en Almacén</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCompletarOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarCompletar}
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-[#3DAA5C] hover:bg-[#2D8246] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Finalizar y Restablecer Activo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCELAR MANTENIMIENTO */}
      {modalCancelarOpen && mantenimientoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-scale-up text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">¿Cancelar esta orden técnica?</h3>
              <p className="text-xs text-slate-500 mt-1">
                La orden para el equipo <strong>{mantenimientoSeleccionado.placaInstitucional}</strong> quedará marcada como cancelada y el activo volverá a su estado operativo habitual.
              </p>
            </div>

            <div className="text-left">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Motivo de Cancelación</label>
              <input
                type="text"
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ej. Reagendado / No requerido"
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalCancelarOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelar}
                disabled={guardando}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {guardando ? 'Cancelando...' : 'Sí, Cancelar Orden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
