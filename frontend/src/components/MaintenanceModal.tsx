'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  History,
  FileCheck,
  Ban,
  Activity,
  Layers
} from 'lucide-react';
import {
  apiClient,
  MantenimientoDto,
  ResumenMantenimientosActivoDto,
  CrearMantenimientoDto,
  CompletarMantenimientoDto,
  CancelarMantenimientoDto
} from '@/lib/apiClient';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activoId: string | null;
  placaInstitucional?: string;
  onActivoActualizado?: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  activoId,
  placaInstitucional,
  onActivoActualizado
}) => {
  const [tabActiva, setTabActiva] = useState<'historial' | 'programar'>('historial');
  const [loading, setLoading] = useState<boolean>(true);
  const [resumen, setResumen] = useState<ResumenMantenimientosActivoDto | null>(null);
  const [mantenimientos, setMantenimientos] = useState<MantenimientoDto[]>([]);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estado para el formulario de programación
  const [nuevoTipo, setNuevoTipo] = useState<'preventivo' | 'correctivo' | 'calibracion'>('preventivo');
  const [nuevoTecnico, setNuevoTecnico] = useState<string>('');
  const [nuevoCosto, setNuevoCosto] = useState<number>(0);
  const [nuevaDescripcion, setNuevaDescripcion] = useState<string>('');
  const [nuevaFecha, setNuevaFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [cambiarEstadoAEnMantenimiento, setCambiarEstadoAEnMantenimiento] = useState<boolean>(false);

  // Estado para completar servicio in-situ
  const [mantenimientoACompletar, setMantenimientoACompletar] = useState<MantenimientoDto | null>(null);
  const [costoFinal, setCostoFinal] = useState<number>(0);
  const [observacionesCierre, setObservacionesCierre] = useState<string>('');
  const [estadoFinalActivo, setEstadoFinalActivo] = useState<'disponible' | 'en_uso'>('disponible');

  useEffect(() => {
    if (isOpen && activoId) {
      cargarDatos();
    }
  }, [isOpen, activoId]);

  const cargarDatos = async () => {
    if (!activoId) return;
    try {
      setLoading(true);
      setError(null);
      const [resLista, resResumen] = await Promise.all([
        apiClient.listarMantenimientosPorActivo(activoId),
        apiClient.obtenerResumenMantenimientosActivo(activoId)
      ]);
      setMantenimientos(resLista);
      setResumen(resResumen);
    } catch (err: any) {
      console.error('Error al cargar historial técnico:', err);
      setError(err?.message || 'Error al obtener el historial de mantenimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleProgramarMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activoId) return;
    if (!nuevaDescripcion.trim()) {
      setError('La descripción del mantenimiento es obligatoria.');
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      const dto: CrearMantenimientoDto = {
        activoSerieId: activoId,
        tipo: nuevoTipo,
        tecnicoResponsable: nuevoTecnico.trim() || undefined,
        costo: Number(nuevoCosto) || 0,
        descripcion: nuevaDescripcion.trim(),
        fechaProgramada: new Date(nuevaFecha).toISOString(),
        cambiarEstadoActivoAEnMantenimiento: cambiarEstadoAEnMantenimiento || nuevoTipo === 'correctivo'
      };

      await apiClient.registrarMantenimiento(dto);
      setMensajeExito('Intervención técnica programada exitosamente.');
      setNuevaDescripcion('');
      setNuevoTecnico('');
      setNuevoCosto(0);
      setTabActiva('historial');
      await cargarDatos();
      if (onActivoActualizado) onActivoActualizado();
      setTimeout(() => setMensajeExito(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el mantenimiento');
    } finally {
      setGuardando(false);
    }
  };

  const handleCompletarServicio = async () => {
    if (!mantenimientoACompletar) return;

    try {
      setGuardando(true);
      setError(null);
      const dto: CompletarMantenimientoDto = {
        fechaRealizada: new Date().toISOString(),
        costoFinal: Number(costoFinal) || 0,
        tecnicoResponsable: mantenimientoACompletar.tecnicoResponsable,
        observacionesFinales: observacionesCierre.trim() || undefined,
        estadoFinalActivo
      };

      await apiClient.completarMantenimiento(mantenimientoACompletar.id, dto);
      setMantenimientoACompletar(null);
      setMensajeExito('Intervención técnica marcada como completada y equipo restablecido.');
      await cargarDatos();
      if (onActivoActualizado) onActivoActualizado();
      setTimeout(() => setMensajeExito(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Error al completar el mantenimiento');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarServicio = async (m: MantenimientoDto) => {
    const motivo = prompt('Ingrese el motivo de cancelación de este servicio técnico:');
    if (!motivo || !motivo.trim()) return;

    try {
      setGuardando(true);
      setError(null);
      await apiClient.cancelarMantenimiento(m.id, { motivo: motivo.trim() });
      setMensajeExito('Servicio técnico cancelado.');
      await cargarDatos();
      if (onActivoActualizado) onActivoActualizado();
      setTimeout(() => setMensajeExito(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Error al cancelar el mantenimiento');
    } finally {
      setGuardando(false);
    }
  };

  const formatearDOP = (monto: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    }).format(monto);
  };

  const getBadgeTipo = (tipo: string) => {
    switch (tipo) {
      case 'preventivo':
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            Preventivo
          </span>
        );
      case 'correctivo':
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Correctivo
          </span>
        );
      case 'calibracion':
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Calibración
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700">
            {tipo}
          </span>
        );
    }
  };

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'completado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completado
          </span>
        );
      case 'en_proceso':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Activity className="w-3 h-3" /> En Proceso
          </span>
        );
      case 'programado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3" /> Programado
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            <Ban className="w-3 h-3" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700">
            {estado}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera UOD */}
        <div className="bg-[#1C3177] px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="maintenance-modal-title" className="text-lg font-bold text-white tracking-wide">
                  Historial y Servicios Técnicos
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  Bitácora TI
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Placa institucional:{' '}
                <span className="font-mono font-semibold text-white">
                  {resumen?.placaInstitucional || placaInstitucional || 'N/A'}
                </span>{' '}
                • {resumen?.recursoNombre || 'Equipo Tecnológico UOD'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Notificaciones y Error */}
        {mensajeExito && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* KPIs del Equipo */}
        {resumen && (
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 block font-medium">Total Servicios</span>
              <span className="text-base font-bold text-slate-900">{resumen.totalMantenimientos}</span>
              <span className="text-[10px] text-slate-500 block">
                {resumen.totalPreventivos} prev. • {resumen.totalCorrectivos} corr.
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 block font-medium">Costo Invertido</span>
              <span className="text-base font-bold text-emerald-700">{formatearDOP(resumen.costoTotalInvertidoDop)}</span>
              <span className="text-[10px] text-slate-500 block">Histórico total</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 block font-medium">Último Servicio</span>
              <span className="text-xs font-semibold text-slate-800 block mt-1">
                {resumen.ultimoMantenimientoFecha
                  ? new Date(resumen.ultimoMantenimientoFecha).toLocaleDateString('es-DO')
                  : 'Sin registros previos'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 block font-medium">Próximo Programado</span>
              <span className="text-xs font-semibold text-blue-700 block mt-1">
                {resumen.proximoMantenimientoProgramado
                  ? new Date(resumen.proximoMantenimientoProgramado).toLocaleDateString('es-DO')
                  : 'Ninguno pendiente'}
              </span>
            </div>
          </div>
        )}

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4">
          <button
            onClick={() => setTabActiva('historial')}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              tabActiva === 'historial'
                ? 'border-[#1C3177] text-[#1C3177]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Intervenciones ({mantenimientos.length})
          </button>
          <button
            onClick={() => setTabActiva('programar')}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              tabActiva === 'programar'
                ? 'border-[#1C3177] text-[#1C3177]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            Programar Nueva Intervención
          </button>
        </div>

        {/* Contenido Dinámico */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F7F9FC]">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-8 h-8 border-3 border-[#1C3177] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Cargando bitácora técnica institucional...</p>
            </div>
          )}

          {!loading && tabActiva === 'historial' && (
            <div className="space-y-4">
              {mantenimientos.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
                  <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No hay servicios técnicos registrados para este activo.</p>
                  <p className="text-xs text-slate-400">
                    Puedes programar el primer mantenimiento preventivo o correctivo utilizando la pestaña superior.
                  </p>
                  <button
                    onClick={() => setTabActiva('programar')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1C3177] hover:bg-[#2B4BA0] rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Programar Mantenimiento
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {mantenimientos.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-xs hover:border-[#1C3177]/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          {getBadgeTipo(m.tipo)}
                          {getBadgeEstado(m.estado)}
                          <span className="text-xs font-semibold text-slate-700 font-mono">
                            {new Date(m.fechaProgramada).toLocaleDateString('es-DO')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900 block font-mono">
                            {formatearDOP(m.costo)}
                          </span>
                          <span className="text-[10px] text-slate-400">Costo total</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                        {m.descripcion}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {m.tecnicoResponsable || 'Técnico UOD no especificado'}
                          </span>
                          {m.fechaRealizada && (
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Ejecutado: {new Date(m.fechaRealizada).toLocaleDateString('es-DO')}
                            </span>
                          )}
                        </div>

                        {/* Acciones para mantenimientos programados o en proceso */}
                        {(m.estado === 'programado' || m.estado === 'en_proceso') && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setMantenimientoACompletar(m);
                                setCostoFinal(m.costo);
                                setObservacionesCierre('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              Completar Servicio
                            </button>
                            <button
                              onClick={() => handleCancelarServicio(m)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && tabActiva === 'programar' && (
            <form onSubmit={handleProgramarMantenimiento} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Wrench className="w-4 h-4 text-[#1C3177]" />
                Datos de la Nueva Intervención Técnica
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Mantenimiento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Mantenimiento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={nuevoTipo}
                    onChange={(e: any) => setNuevoTipo(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-[#1C3177] focus:outline-none"
                  >
                    <option value="preventivo">Preventivo (Limpieza, revisión y optimización)</option>
                    <option value="correctivo">Correctivo (Reparación de fallos o averías)</option>
                    <option value="calibracion">Calibración (Ajuste técnico especializado)</option>
                  </select>
                </div>

                {/* Fecha Programada */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Programación <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={nuevaFecha}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#1C3177] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Técnico Responsable */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Técnico Responsable o Taller Autorizado
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Ej. Ing. Juan Pérez / Taller TI Central"
                      value={nuevoTecnico}
                      onChange={(e) => setNuevoTecnico(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#1C3177] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Costo Presupuestado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Costo Presupuestado (DOP)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={nuevoCosto}
                      onChange={(e) => setNuevoCosto(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium font-mono focus:ring-2 focus:ring-[#1C3177] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción Detallada del Trabajo o Síntoma <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalle el mantenimiento a ejecutar, repuestos estimados o el fallo reportado en la sede..."
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-[#1C3177] focus:outline-none"
                  required
                />
              </div>

              {/* Switch de cambio de estado operativo */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">
                    Poner activo en estado «En Mantenimiento»
                  </span>
                  <span className="text-[11px] text-amber-700 block mt-0.5">
                    El equipo dejará de figurar como disponible hasta que se complete o cancele la intervención.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={cambiarEstadoAEnMantenimiento || nuevoTipo === 'correctivo'}
                  onChange={(e) => setCambiarEstadoAEnMantenimiento(e.target.checked)}
                  disabled={nuevoTipo === 'correctivo'}
                  className="w-4 h-4 text-[#1C3177] rounded focus:ring-[#1C3177] cursor-pointer"
                />
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTabActiva('historial')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1C3177] hover:bg-[#2B4BA0] rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Programando...' : 'Programar Mantenimiento'}
                </button>
              </div>
            </form>
          )}

          {/* Diálogo / Modal in-situ para Completar Servicio */}
          {mantenimientoACompletar && (
            <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Cierre de Intervención Técnica
                  </h4>
                  <button
                    onClick={() => setMantenimientoACompletar(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><span className="font-semibold text-slate-800">Servicio:</span> {mantenimientoACompletar.descripcion}</p>
                  <p><span className="font-semibold text-slate-800">Tipo:</span> {mantenimientoACompletar.tipo.toUpperCase()}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Costo Real Final Incurrido (DOP)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={costoFinal}
                      onChange={(e) => setCostoFinal(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Observaciones de Cierre / Trabajo Realizado
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Indique pruebas realizadas, componentes sustituidos o conformidad del usuario..."
                      value={observacionesCierre}
                      onChange={(e) => setObservacionesCierre(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estado Operativo Resultante del Equipo
                    </label>
                    <select
                      value={estadoFinalActivo}
                      onChange={(e: any) => setEstadoFinalActivo(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800"
                    >
                      <option value="disponible">Disponible (Almacén / Listo para entrega)</option>
                      <option value="en_uso">En Uso (Continúa con su custodio)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setMantenimientoACompletar(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleCompletarServicio}
                    disabled={guardando}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                  >
                    {guardando ? 'Finalizando...' : 'Finalizar y Cerrar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1C3177] hover:bg-[#2B4BA0] rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Bitácora
          </button>
        </div>
      </div>
    </div>
  );
};
