'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  FolderTree,
  Table,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  MapPin,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Save,
  X,
  UserCheck,
  RefreshCw,
  SlidersHorizontal,
  Box,
  Eye,
  Check
} from 'lucide-react';
import {
  apiClient,
  UbicacionDto,
  UbicacionNodoArbolDto,
  CrearUbicacionDto,
  PagedResult
} from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { ACTIVOS_ORIGINALES } from '@/lib/inventoryData';

interface LocationsViewProps {
  onApplyRecommendation?: () => void;
}

export const LocationsView: React.FC<LocationsViewProps> = () => {
  const { rol } = useAuth();
  const canManage = rol === 'super_admin' || rol === 'admin_inventario' || rol === 'gestor_inventario';

  // 1. Estados de vista
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [loading, setLoading] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);

  // 2. Datos
  const [ubicaciones, setUbicaciones] = useState<UbicacionDto[]>([]);
  const [arbolUbicaciones, setArbolUbicaciones] = useState<UbicacionNodoArbolDto[]>([]);
  const [selectedUbicacion, setSelectedUbicacion] = useState<UbicacionDto | null>(null);

  // 3. Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [soloActivas, setSoloActivas] = useState(true);

  // 4. Nodos expandidos en el árbol
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 5. Drawer / Modal de Creación y Edición
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState('departamento');
  const [formPadreId, setFormPadreId] = useState<string>('');
  const [formActiva, setFormActiva] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 6. Modal de Prevención / Confirmación de Borrado
  const [deleteModalItem, setDeleteModalItem] = useState<UbicacionDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
  }, [soloActivas]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [pagedRes, treeRes] = await Promise.all([
        apiClient.listarUbicaciones({ pageSize: 100, soloActivas: soloActivas || undefined }),
        apiClient.obtenerArbolUbicaciones(soloActivas)
      ]);
      setUbicaciones(pagedRes.items || []);
      setArbolUbicaciones(treeRes || []);

      // Auto-seleccionar la primera ubicación si no hay seleccionada
      if (!selectedUbicacion && pagedRes.items?.length > 0) {
        setSelectedUbicacion(pagedRes.items[0]);
      }

      // Expandir por defecto las raíces del árbol
      const roots = new Set((treeRes || []).map(r => r.id));
      setExpandedNodes(roots);
    } catch (err: any) {
      console.error('Error cargando ubicaciones:', err);
      showToast('Error al cargar ubicaciones desde la API central', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle de nodo de árbol
  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Abrir formulario para crear
  const handleOpenCreate = (padreId?: string) => {
    setEditingId(null);
    setFormCodigo('');
    setFormNombre('');
    setFormTipo('departamento');
    setFormPadreId(padreId || '');
    setFormActiva(true);
    setFormError(null);
    setDrawerOpen(true);
  };

  // Abrir formulario para editar
  const handleOpenEdit = (ubicacion: UbicacionDto) => {
    setEditingId(ubicacion.id);
    setFormCodigo(ubicacion.codigo);
    setFormNombre(ubicacion.nombre);
    setFormTipo(ubicacion.tipo);
    setFormPadreId(ubicacion.ubicacionPadreId || '');
    setFormActiva(ubicacion.activa);
    setFormError(null);
    setDrawerOpen(true);
  };

  // Guardar ubicación
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCodigo.trim()) {
      setFormError('El código de la ubicación es obligatorio.');
      return;
    }
    if (!formNombre.trim()) {
      setFormError('El nombre de la ubicación es obligatorio.');
      return;
    }

    const payload: CrearUbicacionDto = {
      codigo: formCodigo.trim().toUpperCase(),
      nombre: formNombre.trim(),
      tipo: formTipo,
      ubicacionPadreId: formPadreId ? formPadreId : null,
      activa: formActiva
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiClient.actualizarUbicacion(editingId, payload);
        showToast(`Ubicación "${payload.nombre}" actualizada con éxito`);
      } else {
        await apiClient.crearUbicacion(payload);
        showToast(`Ubicación "${payload.nombre}" creada con éxito`);
      }
      setDrawerOpen(false);
      await cargarDatos();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  // Alternar estado activo / inactivo
  const handleToggleEstado = async (ubicacion: UbicacionDto) => {
    try {
      await apiClient.cambiarEstadoUbicacion(ubicacion.id, !ubicacion.activa);
      showToast(
        `Ubicación "${ubicacion.nombre}" ${!ubicacion.activa ? 'activada' : 'desactivada'} correctamente`
      );
      await cargarDatos();
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar estado de la ubicación', 'error');
    }
  };

  // Ejecutar eliminación
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.eliminarUbicacion(deleteModalItem.id);
      showToast(`Ubicación "${deleteModalItem.nombre}" eliminada exitosamente`);
      setDeleteModalItem(null);
      await cargarDatos();
    } catch (err: any) {
      setDeleteError(err.message || 'No se pudo eliminar la ubicación.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtrado para tabla plana
  const ubicacionesFiltradas = useMemo(() => {
    return ubicaciones.filter(u => {
      const matchSearch =
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = selectedTipo === 'todos' || u.tipo.toLowerCase() === selectedTipo.toLowerCase();
      return matchSearch && matchTipo;
    });
  }, [ubicaciones, searchTerm, selectedTipo]);

  // Activos asignados a la ubicación seleccionada
  const activosEnUbicacion = useMemo(() => {
    if (!selectedUbicacion) return [];
    const nomLower = selectedUbicacion.nombre.toLowerCase();
    const codLower = selectedUbicacion.codigo.toLowerCase();
    return ACTIVOS_ORIGINALES.filter(a => {
      const aNom = a.ubicacion_nombre.toLowerCase();
      return aNom.includes(nomLower) || aNom.includes(codLower) || nomLower.includes(aNom);
    });
  }, [selectedUbicacion]);

  // Render recursivo del árbol
  const renderArbolNodos = (nodos: UbicacionNodoArbolDto[], nivel = 0) => {
    return nodos.map(nodo => {
      const isExpanded = expandedNodes.has(nodo.id);
      const isSelected = selectedUbicacion?.id === nodo.id;
      const hasChildren = nodo.hijos && nodo.hijos.length > 0;

      return (
        <div key={nodo.id} className="select-none">
          <div
            className={`group flex items-center justify-between py-2 px-3 rounded-xl transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#1C3177] text-white shadow-sm'
                : 'hover:bg-slate-100/80 text-slate-800'
            }`}
            style={{ paddingLeft: `${nivel * 16 + 12}px` }}
            onClick={() => {
              const fullDto = ubicaciones.find(u => u.id === nodo.id);
              if (fullDto) setSelectedUbicacion(fullDto);
            }}
          >
            <div className="flex items-center space-x-2 min-w-0">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    toggleExpand(nodo.id);
                  }}
                  className={`p-0.5 rounded hover:bg-black/10 transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="w-4" />
              )}

              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  isSelected
                    ? 'bg-white/20 text-blue-100'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {nodo.codigo}
              </span>

              <span className="text-xs font-semibold truncate">{nodo.nombre}</span>
            </div>

            <div className="flex items-center space-x-2 text-[10px]">
              <span
                className={`px-1.5 py-0.5 rounded font-medium ${
                  isSelected
                    ? 'bg-white/10 text-white'
                    : 'bg-blue-50 text-[#1C3177]'
                }`}
              >
                {nodo.tipo}
              </span>

              {nodo.totalActivosFisicos > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    isSelected
                      ? 'bg-emerald-500/30 text-emerald-200'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {nodo.totalActivosFisicos} equipos
                </span>
              )}
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-0.5 border-l border-slate-200/80 ml-4">
              {renderArbolNodos(nodo.hijos, nivel + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xl transition-all ${
            toast.type === 'success' ? 'bg-[#3DAA5C]' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1C3177] uppercase tracking-wider border border-blue-200">
              Estructura Física UOD
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {ubicaciones.length} ubicaciones institucionales registradas
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1C3177]" />
            Ubicaciones, Clínicas y Dependencias Institucionales
          </h2>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternancia Árbol / Tabla */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-semibold ${
                viewMode === 'tree'
                  ? 'bg-[#1C3177] text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Árbol Jerárquico"
            >
              <FolderTree className="h-3.5 w-3.5" />
              <span>Árbol</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-semibold ${
                viewMode === 'table'
                  ? 'bg-[#1C3177] text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Tabla Plana"
            >
              <Table className="h-3.5 w-3.5" />
              <span>Tabla</span>
            </button>
          </div>

          {/* Filtro Tipo */}
          <select
            value={selectedTipo}
            onChange={e => setSelectedTipo(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:border-[#1C3177]"
          >
            <option value="todos">Todos los tipos</option>
            <option value="sede">Sede Central</option>
            <option value="clinica">Clínicas Odontológicas</option>
            <option value="laboratorio">Laboratorios</option>
            <option value="almacen">Almacenes / Tecnología</option>
            <option value="departamento">Departamentos</option>
            <option value="aula">Aulas</option>
            <option value="oficina">Oficinas Administrativas</option>
          </select>

          {/* Recargar */}
          <button
            onClick={cargarDatos}
            title="Recargar ubicaciones"
            className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1C3177]' : ''}`} />
          </button>

          {/* Botón Nueva Ubicación */}
          {canManage && (
            <button
              onClick={() => handleOpenCreate(selectedUbicacion?.id)}
              className="flex items-center gap-1.5 rounded-xl bg-[#3DAA5C] hover:bg-[#2D8246] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Ubicación</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Principal: Árbol o Tabla (Izquierda) + Detalle de Ubicación (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda (7 cols): Árbol o Tabla */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, nombre o responsable..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1C3177] transition-colors"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1C3177]" />
              <p className="text-xs">Cargando ubicaciones institucionales...</p>
            </div>
          ) : viewMode === 'tree' ? (
            /* VISTA ÁRBOL JERÁRQUICO */
            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {arbolUbicaciones.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  No se encontraron ubicaciones registradas en el árbol.
                </div>
              ) : (
                renderArbolNodos(arbolUbicaciones)
              )}
            </div>
          ) : (
            /* VISTA TABLA PLANA */
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Estado</th>
                    {canManage && <th className="py-2.5 px-3 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ubicacionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No se encontraron ubicaciones con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    ubicacionesFiltradas.map(u => {
                      const isSelected = selectedUbicacion?.id === u.id;
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUbicacion(u)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1C3177]">
                            {u.codigo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-900">{u.nombre}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                              {u.tipo}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                u.activa
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.activa ? 'bg-[#3DAA5C]' : 'bg-slate-400'
                                }`}
                              />
                              {u.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          {canManage && (
                            <td className="py-2.5 px-3 text-right">
                              <div
                                className="flex items-center justify-end space-x-1"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleOpenEdit(u)}
                                  className="p-1 rounded text-slate-500 hover:text-[#1C3177] hover:bg-slate-100"
                                  title="Editar"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteModalItem(u)}
                                  className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna Derecha (5 cols): Detalle de la Ubicación Seleccionada */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {selectedUbicacion ? (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#1C3177] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {selectedUbicacion.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedUbicacion.activa
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {selectedUbicacion.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {selectedUbicacion.nombre}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium capitalize">
                    Tipo: {selectedUbicacion.tipo}
                  </span>
                </div>

                {canManage && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(selectedUbicacion)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#1C3177] hover:bg-slate-50 transition-colors"
                      title="Editar datos de la ubicación"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteModalItem(selectedUbicacion)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-50 transition-colors"
                      title="Eliminar ubicación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Métricas de la ubicación */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Equipos Físicos Asignados
                  </span>
                  <span className="text-xl font-black text-[#1C3177] mt-0.5 block">
                    {activosEnUbicacion.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Subdependencias
                  </span>
                  <span className="text-xl font-black text-slate-800 mt-0.5 block">
                    {selectedUbicacion.totalSububicaciones}
                  </span>
                </div>
              </div>

              {/* Responsable */}
              <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Responsable / Custodio Institucional
                </span>
                <div className="flex items-center space-x-2 text-slate-800 font-semibold mt-1">
                  <UserCheck className="w-4 h-4 text-[#3DAA5C]" />
                  <span>
                    {selectedUbicacion.responsableNombre || 'Sin custodio directo asignado'}
                  </span>
                </div>
              </div>

              {/* Lista de Equipos Asignados */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Equipos en esta Ubicación ({activosEnUbicacion.length})
                  </h4>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  {activosEnUbicacion.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No hay equipos registrados físicamente en esta ubicación.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {activosEnUbicacion.map(activo => (
                        <div
                          key={activo.id}
                          className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#1C3177] text-[11px]">
                              {activo.placa_institucional || activo.id}
                            </span>
                            <span className="text-slate-800 font-semibold ml-2">
                              {activo.recurso_nombre}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Responsable: {activo.responsable || 'No asignado'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {activo.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">Selecciona una ubicación para consultar sus detalles</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer / Modal de Formulario */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-[#1C3177] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {editingId ? 'Editar Ubicación Institucional' : 'Nueva Ubicación Institucional'}
                </h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código Institucional <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={e => setFormCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej. CLIN-B, AULA-101"
                    className="w-full font-mono uppercase px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Ubicación <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formTipo}
                    onChange={e => setFormTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] outline-none bg-white font-medium"
                  >
                    <option value="clinica">Clínica Odontológica</option>
                    <option value="laboratorio">Laboratorio</option>
                    <option value="almacen">Almacén / Tecnología</option>
                    <option value="departamento">Departamento</option>
                    <option value="aula">Aula</option>
                    <option value="oficina">Oficina Administrativa</option>
                    <option value="sede">Sede Central</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre Descriptivo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  placeholder="Ej. Clínica Odontológica B - Planta Baja"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ubicación Jerárquica Superior (Padre)
                </label>
                <select
                  value={formPadreId}
                  onChange={e => setFormPadreId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] outline-none bg-white font-medium"
                >
                  <option value="">-- Ninguna (Nivel Superior / Sede) --</option>
                  {ubicaciones
                    .filter(u => u.id !== editingId)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.codigo} - {u.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-ubic-activa"
                  checked={formActiva}
                  onChange={e => setFormActiva(e.target.checked)}
                  className="w-4 h-4 text-[#1C3177] border-slate-300 rounded focus:ring-[#1C3177]"
                />
                <label htmlFor="chk-ubic-activa" className="font-semibold text-slate-700 cursor-pointer">
                  Ubicación activa para traslados y asignaciones
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1C3177] hover:bg-[#2B4BA0] text-white rounded-xl font-bold disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingId ? 'Actualizar' : 'Crear Ubicación'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación / Prevención de Borrado */}
      {deleteModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteModalItem(null)} />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">
                ¿Eliminar Ubicación «{deleteModalItem.nombre}»?
              </h3>
              <p className="text-xs text-slate-500">
                Código: <strong className="font-mono">{deleteModalItem.codigo}</strong>
              </p>
            </div>

            {/* Alerta de Existencias o Activos */}
            {(deleteModalItem.totalExistencias > 0 || deleteModalItem.totalActivosFisicos > 0 || deleteModalItem.totalSububicaciones > 0) ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <p className="font-bold flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Restricción de integridad institucional</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Esta ubicación tiene <strong>{deleteModalItem.totalActivosFisicos} activo(s)</strong>,{' '}
                  <strong>{deleteModalItem.totalExistencias} existencia(s)</strong> o subdependencias asociadas. El sistema impide el borrado permanente para resguardar la bitácora legal (Ley 172-13).
                </p>
                <p className="text-[11px] font-semibold text-emerald-800 pt-1">
                  Recomendación: Desactívela en su lugar para ocultarla de los formularios.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 text-center">
                Esta ubicación no posee recursos asignados. Se eliminará del catálogo de ubicaciones.
              </p>
            )}

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              {deleteModalItem.totalExistencias > 0 || deleteModalItem.totalActivosFisicos > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleEstado(deleteModalItem);
                    setDeleteModalItem(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Desactivar en su lugar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors shadow-sm"
                >
                  {deleting ? 'Eliminando...' : 'Confirmar Eliminación'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
