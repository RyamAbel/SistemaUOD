'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  User,
  QrCode,
  Tag,
  Download,
  LayoutGrid,
  Table as TableIcon,
  Cpu,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { ACTIVOS_ORIGINALES, ActivoTI } from '@/lib/inventoryData';
import { apiClient, ActaEntregaRecepcionDto } from '@/lib/apiClient';
import { TransferAssetModal } from './TransferAssetModal';
import { ActaEntregaModal } from './ActaEntregaModal';

export const AssetsView: React.FC = () => {
  const [activos, setActivos] = useState<ActivoTI[]>(ACTIVOS_ORIGINALES);
  const [cargandoApi, setCargandoApi] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('todas');
  const [viewMode, setViewMode] = useState<'tabla' | 'tarjetas'>('tabla');
  const [selectedActivo, setSelectedActivo] = useState<ActivoTI | null>(null);
  const [activoParaTrasladar, setActivoParaTrasladar] = useState<ActivoTI | null>(null);
  const [actaVisualizada, setActaVisualizada] = useState<ActaEntregaRecepcionDto | null>(null);

  useEffect(() => {
    let montado = true;
    const cargarDesdeApi = async () => {
      try {
        setCargandoApi(true);
        const res = await apiClient.listarActivos({ pageSize: 400 });
        if (montado && res.items && res.items.length > 0) {
          const mapeados: ActivoTI[] = res.items.map(item => ({
            id: item.id,
            recurso_id: item.recursoId,
            placa_institucional: item.placaInstitucional || '',
            numero_serie: item.numeroSerie,
            recurso_nombre: item.recursoNombre,
            categoria_nombre: item.categoriaNombre,
            ubicacion_id: item.ubicacionId,
            ubicacion_nombre: item.ubicacionNombre,
            responsable: item.responsableNombre || 'Por Asignar',
            estado: (item.estado === 'danado' ? 'danado' : item.estado === 'disponible' ? 'disponible' : 'en_uso') as 'en_uso' | 'disponible' | 'danado',
            notas: item.notas || ''
          }));
          setActivos(mapeados);
        }
      } catch (err) {
        console.warn('Usando dataset institucional local como fallback:', err);
      } finally {
        if (montado) setCargandoApi(false);
      }
    };
    cargarDesdeApi();
    return () => { montado = false; };
  }, []);

  // Lista única de ubicaciones para el filtro
  const ubicacionesUnicas = useMemo(() => {
    const set = new Set<string>();
    activos.forEach(a => set.add(a.ubicacion_nombre));
    return Array.from(set).sort();
  }, [activos]);

  // Filtrado reactivo en tiempo real
  const activosFiltrados = useMemo(() => {
    return activos.filter(activo => {
      const matchSearch =
        search.trim() === '' ||
        activo.placa_institucional.toLowerCase().includes(search.toLowerCase()) ||
        activo.numero_serie.toLowerCase().includes(search.toLowerCase()) ||
        activo.recurso_nombre.toLowerCase().includes(search.toLowerCase()) ||
        activo.responsable.toLowerCase().includes(search.toLowerCase()) ||
        activo.ubicacion_nombre.toLowerCase().includes(search.toLowerCase());

      const matchEstado =
        selectedEstado === 'todos' || activo.estado === selectedEstado;

      const matchUbicacion =
        selectedUbicacion === 'todas' || activo.ubicacion_nombre === selectedUbicacion;

      return matchSearch && matchEstado && matchUbicacion;
    });
  }, [activos, search, selectedEstado, selectedUbicacion]);

  // Contadores de estado
  const metricas = useMemo(() => {
    return {
      total: activos.length,
      enUso: activos.filter(a => a.estado === 'en_uso').length,
      disponibles: activos.filter(a => a.estado === 'disponible').length,
      danados: activos.filter(a => a.estado === 'danado').length
    };
  }, [activos]);

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'en_uso':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            En Uso
          </span>
        );
      case 'disponible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Box className="h-3 w-3" />
            Disponible
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3" />
            Dañado / Inactivo
          </span>
        );
    }
  };

  const handleAbrirActa = async (activo: ActivoTI) => {
    try {
      const acta = await apiClient.obtenerActaEntrega(activo.id);
      setActaVisualizada(acta);
    } catch {
      const anio = new Date().getFullYear();
      setActaVisualizada({
        numeroActa: `ACTA-${anio}-${activo.placa_institucional.replace(/\D/g, '').padStart(6, '0') || '000001'}`,
        fechaEmision: new Date().toISOString(),
        tipoOperacion: 'constancia_entrega',
        institucion: 'Universidad Odontológica Dominicana (UOD)',
        departamentoEmisor: 'Departamento de Tecnología de la Información (TI)',
        activoId: activo.id,
        placaInstitucional: activo.placa_institucional || 'S/P',
        numeroSerie: activo.numero_serie,
        recursoNombre: activo.recurso_nombre,
        recursoSku: 'UOD-TI-2026',
        categoriaNombre: activo.categoria_nombre || 'Tecnología',
        ubicacionAnterior: null,
        ubicacionNueva: activo.ubicacion_nombre,
        custodioAnterior: null,
        custodioNuevo: activo.responsable,
        motivo: 'Asignación patrimonial de equipo tecnológico institucional UOD',
        observaciones: activo.notas || null,
        clausulasResponsabilidad: [
          '1. El receptor asume la custodia física y el uso adecuado del equipo para fines institucionales y académicos de la UOD.',
          '2. Cualquier daño, extravío o anomalía técnica debe reportarse de inmediato al Departamento de TI.',
          '3. Queda prohibida la reubicación o cesión del bien sin autorización previa en el sistema SIIA.',
          '4. Al finalizar la asignación, el bien debe retornarse formalmente a TI con su acta de descargo.'
        ],
        firmaEmisorNombre: 'Administrador de TI',
        firmaEmisorCargo: 'Encargado de Inventario y Activos UOD',
        firmaReceptorNombre: activo.responsable,
        firmaReceptorCargo: 'Custodio Asignado'
      });
    }
  };

  const handleTrasladoExitoso = (res: any) => {
    setActivos(prev => prev.map(a => {
      if (a.id === res.activo.id || a.placa_institucional === res.activo.placaInstitucional) {
        return {
          ...a,
          ubicacion_nombre: res.activo.ubicacionNombre,
          responsable: res.activo.responsableNombre || a.responsable,
          estado: 'en_uso'
        };
      }
      return a;
    }));
    setActivoParaTrasladar(null);
    if (res.acta) {
      setActaVisualizada(res.acta);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Métricas Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-[#1C3177]" />
            Módulo de Activos Fijos TI (Levantamiento UOD 2026)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Control físico de los 341 equipos individuales con placa institucional (EQ-01 a EQ-341), custodio real y ubicación física.
          </p>
        </div>

        {/* Alternador de vista */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setViewMode('tabla')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'tabla'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="h-4 w-4" />
            Tabla
          </button>
          <button
            onClick={() => setViewMode('tarjetas')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'tarjetas'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Tarjetas
          </button>
        </div>
      </div>

      {/* KPI Cards de Activos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Equipos Reales</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{metricas.total}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Levantamiento TI 2026</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs text-emerald-700 font-medium block">Activos En Uso</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{metricas.enUso}</span>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Operativos con custodio</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs text-blue-700 font-medium block">Disponibles / Almacén</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{metricas.disponibles}</span>
          <span className="text-[11px] text-blue-600/80 mt-0.5 block">Listos para asignación</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs text-rose-700 font-medium block">Dañados / Inactivos</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{metricas.danados}</span>
          <span className="text-[11px] text-rose-600/80 mt-0.5 block">Requieren baja o revisión</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa (EQ-XX), modelo, serie, custodio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] transition-all bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Estado */}
          <div className="relative">
            <select
              value={selectedEstado}
              onChange={e => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] bg-white text-slate-700"
            >
              <option value="todos">Todos los Estados</option>
              <option value="en_uso">En Uso (337)</option>
              <option value="disponible">Disponible (1)</option>
              <option value="danado">Dañado / Inactivo (3)</option>
            </select>
          </div>

          {/* Filtro por Ubicación */}
          <div className="relative">
            <select
              value={selectedUbicacion}
              onChange={e => setSelectedUbicacion(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] bg-white text-slate-700"
            >
              <option value="todas">Todas las Ubicaciones (49)</option>
              {ubicacionesUnicas.map(u => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de resultados */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Mostrando <strong>{activosFiltrados.length}</strong> de <strong>{ACTIVOS_ORIGINALES.length}</strong> equipos
          </span>
          {(search || selectedEstado !== 'todos' || selectedUbicacion !== 'todas') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedEstado('todos');
                setSelectedUbicacion('todas');
              }}
              className="text-[#1C3177] hover:underline font-semibold"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Vista en Tabla */}
      {viewMode === 'tabla' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
                <tr>
                  <th className="py-3 px-4">Placa Institucional</th>
                  <th className="py-3 px-4">Equipo / Modelo</th>
                  <th className="py-3 px-4">Ubicación UOD</th>
                  <th className="py-3 px-4">Custodio Real</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No se encontraron equipos que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  activosFiltrados.map(activo => (
                    <tr
                      key={activo.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedActivo(activo)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#1C3177] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {activo.placa_institucional}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{activo.recurso_nombre}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Serial: {activo.numero_serie}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{activo.ubicacion_nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-[#1C3177]/10 text-[#1C3177] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {activo.responsable.charAt(0) || 'U'}
                          </div>
                          <span className="font-medium text-slate-800">{activo.responsable}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getBadgeEstado(activo.estado)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setActivoParaTrasladar(activo);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Trasladar activo y emitir acta"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleAbrirActa(activo);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Ver Acta Oficial de Entrega"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedActivo(activo);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1C3177] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Ver detalle del activo"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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

      {/* Vista en Tarjetas */}
      {viewMode === 'tarjetas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activosFiltrados.map(activo => (
            <div
              key={activo.id}
              onClick={() => setSelectedActivo(activo)}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 hover:border-[#1C3177]/40 hover:shadow-md transition-all cursor-pointer relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono font-bold text-xs text-[#1C3177] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {activo.placa_institucional}
                </span>
                {getBadgeEstado(activo.estado)}
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#1C3177] transition-colors line-clamp-1">
                  {activo.recurso_nombre}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Serial: {activo.numero_serie}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activo.ubicacion_nombre}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <User className="h-3.5 w-3.5 text-[#3DAA5C] shrink-0" />
                  <span className="truncate">Custodio: {activo.responsable}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalle de Activo Individual */}
      {selectedActivo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-xs text-[#1C3177] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {selectedActivo.placa_institucional}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {selectedActivo.recurso_nombre}
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivo(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium uppercase">Número de Serie</span>
                <span className="font-mono font-bold text-slate-800">{selectedActivo.numero_serie}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium uppercase">Estado Operativo</span>
                <div className="mt-0.5">{getBadgeEstado(selectedActivo.estado)}</div>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[10px] font-medium uppercase">Ubicación Física UOD</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-[#1C3177]" />
                  {selectedActivo.ubicacion_nombre}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[10px] font-medium uppercase">Custodio / Responsable Real</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <User className="h-3.5 w-3.5 text-[#3DAA5C]" />
                  {selectedActivo.responsable}
                </span>
              </div>
              {selectedActivo.notas && (
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Observaciones del Levantamiento</span>
                  <p className="text-slate-600 mt-0.5 italic">{selectedActivo.notas}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const act = selectedActivo;
                    setSelectedActivo(null);
                    setActivoParaTrasladar(act);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-50 text-[#1C3177] hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Trasladar
                </button>
                <button
                  onClick={() => {
                    const act = selectedActivo;
                    handleAbrirActa(act);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver Acta Oficial
                </button>
              </div>

              <button
                onClick={() => setSelectedActivo(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Traslado de Activo */}
      {activoParaTrasladar && (
        <TransferAssetModal
          activo={activoParaTrasladar}
          ubicaciones={ubicacionesUnicas}
          onClose={() => setActivoParaTrasladar(null)}
          onSuccess={handleTrasladoExitoso}
        />
      )}

      {/* Modal de Acta Oficial de Entrega / Recepción */}
      {actaVisualizada && (
        <ActaEntregaModal
          acta={actaVisualizada}
          onClose={() => setActaVisualizada(null)}
        />
      )}
    </div>
  );
};
