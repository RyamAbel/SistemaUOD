'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  Download,
  RefreshCw,
  X,
  QrCode,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckSquare,
  Square,
  Trash2,
  ExternalLink,
  DollarSign,
  FileSpreadsheet,
  Maximize2,
  Edit2,
  Copy,
  Printer,
  Camera,
  Loader2
} from 'lucide-react';
import {
  apiClient,
  RecursoDto,
  RecursoFiltrosDto,
  CategoriaDto,
  PagedResult
} from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { ResourceFormDrawer } from './ResourceFormDrawer';
import { ResourceDetailModal } from './ResourceDetailModal';
import { QrLabelsPrintModal } from './QrLabelsPrintModal';
import { CameraScannerModal } from './CameraScannerModal';
import { ImportResourcesModal } from './ImportResourcesModal';

interface CatalogViewProps {
  articulos?: any[];
  onAddArticulo?: (nuevo: any) => void;
  onOpenResourceDetail?: (id: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onOpenResourceDetail, onAddArticulo }) => {
  const { rol } = useAuth();
  const canManage = rol === 'super_admin' || rol === 'admin_inventario' || rol === 'gestor_inventario';

  // 1. Estado de visualización (Grid vs Tabla) persistido en localStorage
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('siia_catalog_view_mode') as 'grid' | 'table';
      if (saved) setViewMode(saved);
    }
  }, []);

  const handleToggleView = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('siia_catalog_view_mode', mode);
    }
  };

  // 2. Estado del panel lateral de filtros
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  // 3. Filtros combinables
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [tipo, setTipo] = useState<string>('');
  const [stockBajo, setStockBajo] = useState(false);
  const [stockAgotado, setStockAgotado] = useState(false);
  const [conFoto, setConFoto] = useState<boolean | null>(null);
  const [conQr, setConQr] = useState<boolean | null>(null);
  const [costoMin, setCostoMin] = useState<string>('');
  const [costoMax, setCostoMax] = useState<string>('');
  const [soloActivos, setSoloActivos] = useState(true);
  const [sortBy, setSortBy] = useState('sku');
  const [isDescending, setIsDescending] = useState(false);

  // Paginación
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // 4. Datos del catálogo
  const [data, setData] = useState<PagedResult<RecursoDto>>({
    items: [],
    pageIndex: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  });
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);

  // 5. Selección múltiple para acciones en lote
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchActionModalOpen, setBatchActionModalOpen] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'desactivar' | 'activar' | null>(null);
  const [processingBatch, setProcessingBatch] = useState(false);

  // 6. Modal de vista previa QR
  const [qrModalItem, setQrModalItem] = useState<RecursoDto | null>(null);

  // 7. Drawer de creación / edición / duplicación de recurso
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [duplicatingResource, setDuplicatingResource] = useState<RecursoDto | null>(null);

  // 8. Ficha de detalle de recurso y modal de impresión en lote
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailResourceId, setDetailResourceId] = useState<string | null>(null);
  const [batchPrintModalOpen, setBatchPrintModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // 9. Modal de edición rápida de umbrales de stock RF-12 (Prompt 7.5)
  const [stockModalItem, setStockModalItem] = useState<RecursoDto | null>(null);
  const [editStockMinimo, setEditStockMinimo] = useState<number>(0);
  const [editStockMaximo, setEditStockMaximo] = useState<number | ''>('');
  const [editPuntoReorden, setEditPuntoReorden] = useState<number | ''>('');
  const [guardandoStock, setGuardandoStock] = useState(false);

  const handleOpenStockModal = (recurso: RecursoDto) => {
    setStockModalItem(recurso);
    setEditStockMinimo(recurso.stockMinimo);
    setEditStockMaximo(recurso.stockMaximo ?? '');
    setEditPuntoReorden(recurso.puntoReorden ?? '');
  };

  const handleGuardarStock = async () => {
    if (!stockModalItem) return;
    setGuardandoStock(true);
    try {
      const actualizado = await apiClient.actualizarUmbralesStock(stockModalItem.id, {
        stockMinimo: Number(editStockMinimo) || 0,
        stockMaximo: editStockMaximo !== '' ? Number(editStockMaximo) : null,
        puntoReorden: editPuntoReorden !== '' ? Number(editPuntoReorden) : null
      });
      showToast(`Umbrales RF-12 actualizados exitosamente para ${stockModalItem.sku}.`);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((r) =>
          r.id === stockModalItem.id
            ? {
                ...r,
                stockMinimo: actualizado.stockMinimo,
                stockMaximo: actualizado.stockMaximo,
                puntoReorden: actualizado.puntoReorden
              }
            : r
        )
      }));
      setStockModalItem(null);
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar umbrales de stock', 'error');
    } finally {
      setGuardandoStock(false);
    }
  };

  const handleOpenDetail = (id: string) => {
    setDetailResourceId(id);
    setDetailModalOpen(true);
    onOpenResourceDetail?.(id);
  };

  // Toast feedback
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar categorías disponibles para el filtro
  useEffect(() => {
    apiClient.listarCategorias(true).then(setCategorias).catch(() => {});
  }, []);

  // Cargar recursos desde la API
  const fetchRecursos = useCallback(async () => {
    setLoading(true);
    try {
      const filtros: RecursoFiltrosDto = {
        pageIndex,
        pageSize,
        search: search.trim() || undefined,
        categoriaId: categoriaId || undefined,
        tipo: (tipo as any) || undefined,
        stockBajo: stockBajo || undefined,
        stockAgotado: stockAgotado || undefined,
        conFoto: conFoto !== null ? conFoto : undefined,
        conQr: conQr !== null ? conQr : undefined,
        costoMin: costoMin ? Number(costoMin) : undefined,
        costoMax: costoMax ? Number(costoMax) : undefined,
        activo: soloActivos ? true : undefined,
        sortBy,
        isDescending
      };

      const result = await apiClient.listarRecursos(filtros);
      setData(result);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar catálogo', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    search,
    categoriaId,
    tipo,
    stockBajo,
    stockAgotado,
    conFoto,
    conQr,
    costoMin,
    costoMax,
    soloActivos,
    sortBy,
    isDescending
  ]);

  // Debounced search y recarga al cambiar filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecursos();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchRecursos]);

  // Limpiar filtros activos
  const handleClearFilters = () => {
    setSearch('');
    setCategoriaId('');
    setTipo('');
    setStockBajo(false);
    setStockAgotado(false);
    setConFoto(null);
    setConQr(null);
    setCostoMin('');
    setCostoMax('');
    setSoloActivos(true);
    setPageIndex(1);
  };

  // Conteo de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (categoriaId) count++;
    if (tipo) count++;
    if (stockBajo) count++;
    if (stockAgotado) count++;
    if (conFoto !== null) count++;
    if (conQr !== null) count++;
    if (costoMin || costoMax) count++;
    if (!soloActivos) count++;
    return count;
  }, [search, categoriaId, tipo, stockBajo, stockAgotado, conFoto, conQr, costoMin, costoMax, soloActivos]);

  // Manejo de Selección múltiple
  const handleToggleSelectAll = () => {
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.items.map((i) => i.id)));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Ejecución de acciones en lote
  const handleExecuteBatchAction = async () => {
    if (!batchActionType || selectedIds.size === 0) return;
    setProcessingBatch(true);
    try {
      const ids = Array.from(selectedIds);
      const isActivar = batchActionType === 'activar';

      await Promise.all(
        ids.map((id) => apiClient.cambiarEstadoRecurso(id, isActivar))
      );

      showToast(
        `Se han ${isActivar ? 'activado' : 'desactivado'} ${ids.length} recursos exitosamente.`
      );
      setSelectedIds(new Set());
      setBatchActionModalOpen(false);
      await fetchRecursos();
    } catch (err: any) {
      showToast(err.message || 'Error al ejecutar acción en lote', 'error');
    } finally {
      setProcessingBatch(false);
    }
  };

  // Exportar resultado filtrado a CSV
  const handleExportCsv = () => {
    if (data.items.length === 0) {
      showToast('No hay datos para exportar con los filtros actuales', 'error');
      return;
    }

    const headers = ['SKU', 'Nombre', 'Categoria', 'Tipo', 'UnidadMedida', 'StockActual', 'StockMinimo', 'CostoEstimado', 'Estado'];
    const rows = data.items.map((r) => [
      `"${r.sku}"`,
      `"${r.nombre.replace(/"/g, '""')}"`,
      `"${r.categoriaNombre}"`,
      `"${r.tipo}"`,
      `"${r.unidadMedida}"`,
      r.stockActual,
      r.stockMinimo,
      r.costoEstimado.toFixed(2),
      r.activo ? 'Activo' : 'Inactivo'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIIA_UOD_Catalogo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo CSV exportado exitosamente');
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xl transition-all ${
            toast.type === 'success' ? 'bg-[#3DAA5C]' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1C3177] uppercase tracking-wider border border-blue-200">
              Catálogo Oficial UOD
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {data.totalCount} registros encontrados
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#1C3177]" />
            Inventario Central de Recursos y Equipos
          </h2>
        </div>

        {/* Toolbar: Search, Filters, View Mode & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar SKU, equipo, serie, QR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1C3177] focus:ring-2 focus:ring-[#1C3177]/10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filters Toggle Button */}
          <button
            onClick={() => setFiltersDrawerOpen((prev) => !prev)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
              activeFiltersCount > 0
                ? 'bg-blue-50 text-[#1C3177] border-[#1C3177]/40 ring-2 ring-[#1C3177]/10'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-[#1C3177] text-white px-1.5 py-0.2 text-[9px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Toggle Grid/Table */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => handleToggleView('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-[#1C3177] text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista en tabla detallada"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleToggleView('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[#1C3177] text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista en tarjetas con foto"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Export Csv */}
          <button
            onClick={handleExportCsv}
            title="Exportar registros filtrados a CSV"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Scanner Button */}
          <button
            onClick={() => setScannerModalOpen(true)}
            title="Escanear código QR o barras con la cámara"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Camera className="h-3.5 w-3.5 text-[#1C3177]" />
            <span className="hidden sm:inline">Escanear</span>
          </button>

          {/* Reload */}
          <button
            onClick={fetchRecursos}
            title="Actualizar datos"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#1C3177]' : ''}`} />
          </button>

          {/* Importar CSV Button (Etapa 12) */}
          {canManage && (
            <button
              onClick={() => setImportModalOpen(true)}
              title="Importación masiva de recursos desde archivo CSV / Excel"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#3DAA5C]" />
              <span className="hidden sm:inline">Importar CSV</span>
            </button>
          )}

          {/* Nuevo Recurso Button */}
          {canManage && (
            <button
              onClick={() => {
                setEditingResourceId(null);
                setDuplicatingResource(null);
                setDrawerOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#3DAA5C] hover:bg-[#2D8246] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Recurso</span>
            </button>
          )}
        </div>
      </div>

      {/* Chips de Filtros Activos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtros activos:</span>
          {search && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-[#1C3177]">
              Texto: "{search}"
              <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setSearch('')} />
            </span>
          )}
          {categoriaId && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-[#1C3177]">
              Cat: {categorias.find((c) => c.id === categoriaId)?.nombre || 'Categoría'}
              <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setCategoriaId('')} />
            </span>
          )}
          {tipo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-[#1C3177]">
              Tipo: {tipo === 'consumible' ? 'Consumible' : 'Activo Fijo'}
              <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setTipo('')} />
            </span>
          )}
          {stockBajo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-800">
              Stock Bajo
              <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setStockBajo(false)} />
            </span>
          )}
          {stockAgotado && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-800">
              Agotado (0 existencias)
              <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setStockAgotado(false)} />
            </span>
          )}
          {conFoto !== null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-[#1C3177]">
              {conFoto ? 'Con Fotografía' : 'Sin Fotografía'}
              <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setConFoto(null)} />
            </span>
          )}
          {conQr !== null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-[#1C3177]">
              {conQr ? 'Con Código QR' : 'Sin Código QR'}
              <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setConQr(null)} />
            </span>
          )}
          {(costoMin || costoMax) && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-[#1C3177]">
              Costo: RD${costoMin || 0} – RD${costoMax || '∞'}
              <X
                className="h-3 w-3 cursor-pointer hover:text-rose-600"
                onClick={() => {
                  setCostoMin('');
                  setCostoMax('');
                }}
              />
            </span>
          )}
          {!soloActivos && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">
              Incluye Inactivos
              <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setSoloActivos(true)} />
            </span>
          )}

          <button
            onClick={handleClearFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline ml-2 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Barra de Acciones en Lote (cuando hay ítems seleccionados) */}
      {selectedIds.size > 0 && canManage && (
        <div className="flex items-center justify-between rounded-xl bg-[#1C3177] px-4 py-2.5 text-white shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#3DAA5C]" />
            <span className="text-xs font-bold">
              {selectedIds.size} recurso(s) seleccionado(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBatchPrintModalOpen(true)}
              className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-[11px] font-bold text-white transition-colors flex items-center space-x-1"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Etiquetas QR ({selectedIds.size})</span>
            </button>
            <button
              onClick={() => {
                setBatchActionType('desactivar');
                setBatchActionModalOpen(true);
              }}
              className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-[11px] font-bold text-white transition-colors"
            >
              Desactivar seleccionados
            </button>
            <button
              onClick={() => {
                setBatchActionType('activar');
                setBatchActionModalOpen(true);
              }}
              className="rounded-lg bg-[#3DAA5C] hover:bg-[#2D8246] px-3 py-1.5 text-[11px] font-bold text-white transition-colors"
            >
              Activar seleccionados
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-white/80 hover:text-white px-2 py-1"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace (Drawer + Content) */}
      <div className="flex gap-4">
        {/* Panel Lateral de 17 Filtros (Colapsable) */}
        {filtersDrawerOpen && (
          <aside className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm animate-fade-in self-start">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#1C3177]" />
                <span className="text-xs font-bold text-slate-900">Panel de Filtros</span>
              </div>
              <button
                onClick={() => setFiltersDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Categoría Taxonómica</label>
              <select
                value={categoriaId}
                onChange={(e) => {
                  setCategoriaId(e.target.value);
                  setPageIndex(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-[#1C3177] focus:outline-none"
              >
                <option value="">-- Todas las categorías --</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} - {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de recurso */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Tipo de Bien</label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setPageIndex(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-[#1C3177] focus:outline-none"
              >
                <option value="">-- Todos los tipos --</option>
                <option value="consumible">Consumible Odontológico / Clínico</option>
                <option value="activo_fijo">Activo Fijo / Equipo Duradero</option>
              </select>
            </div>

            {/* Estado de Existencias */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-700 block">Condición de Stock</label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stockBajo}
                  onChange={(e) => {
                    setStockBajo(e.target.checked);
                    setPageIndex(1);
                  }}
                  className="rounded border-slate-300 text-[#1C3177] focus:ring-[#1C3177]"
                />
                Stock Bajo (≤ stock mínimo)
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stockAgotado}
                  onChange={(e) => {
                    setStockAgotado(e.target.checked);
                    setPageIndex(1);
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                Agotado (0 existencias)
              </label>
            </div>

            {/* Filtros multimedia (Foto / QR) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-700 block">Multimedia y Etiquetado</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setConFoto((prev) => (prev === true ? null : true));
                    setPageIndex(1);
                  }}
                  className={`rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    conFoto === true
                      ? 'bg-blue-50 border-[#1C3177] text-[#1C3177]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Con Foto
                </button>
                <button
                  onClick={() => {
                    setConQr((prev) => (prev === true ? null : true));
                    setPageIndex(1);
                  }}
                  className={`rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    conQr === true
                      ? 'bg-blue-50 border-[#1C3177] text-[#1C3177]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Con QR
                </button>
              </div>
            </div>

            {/* Rango de Costo */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-700 block">Rango de Costo (RD$)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={costoMin}
                  onChange={(e) => {
                    setCostoMin(e.target.value);
                    setPageIndex(1);
                  }}
                  className="rounded-xl border border-slate-200 px-2 py-1.5 text-xs text-slate-800 focus:border-[#1C3177] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={costoMax}
                  onChange={(e) => {
                    setCostoMax(e.target.value);
                    setPageIndex(1);
                  }}
                  className="rounded-xl border border-slate-200 px-2 py-1.5 text-xs text-slate-800 focus:border-[#1C3177] focus:outline-none"
                />
              </div>
            </div>

            {/* Ordenamiento */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-700 block">Ordenar Resultados Por</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-[#1C3177] focus:outline-none"
                >
                  <option value="sku">SKU</option>
                  <option value="nombre">Nombre</option>
                  <option value="costo">Costo</option>
                  <option value="categoria">Categoría</option>
                </select>
                <select
                  value={isDescending ? 'desc' : 'asc'}
                  onChange={(e) => setIsDescending(e.target.value === 'desc')}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-[#1C3177] focus:outline-none"
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
              </div>
            </div>

            {/* Solo Activos Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloActivos}
                  onChange={(e) => {
                    setSoloActivos(e.target.checked);
                    setPageIndex(1);
                  }}
                  className="rounded border-slate-300 text-[#1C3177] focus:ring-[#1C3177]"
                />
                Ocultar recursos desactivados
              </label>
            </div>
          </aside>
        )}

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 animate-pulse space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
              <Package className="h-12 w-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No se encontraron recursos</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay artículos o equipos que coincidan con la búsqueda o filtros aplicados.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="rounded-xl bg-[#1C3177] text-white px-4 py-2 text-xs font-bold hover:bg-[#2B4BA0] transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* VISTA TABLA DENSA (MASTER.md §6d) */
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#EEF2F8] text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {canManage && (
                        <th className="py-3 px-3 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === data.items.length && data.items.length > 0}
                            onChange={handleToggleSelectAll}
                            className="rounded border-slate-300 text-[#1C3177] focus:ring-[#1C3177]"
                          />
                        </th>
                      )}
                      <th className="py-3 px-3 w-12 text-center">Foto</th>
                      <th className="py-3 px-4">SKU / Código</th>
                      <th className="py-3 px-4">Nombre del Recurso</th>
                      <th className="py-3 px-4 hidden md:table-cell">Categoría</th>
                      <th className="py-3 px-3 text-center hidden sm:table-cell">Tipo</th>
                      <th className="py-3 px-3 text-center">Existencias</th>
                      <th className="py-3 px-3 text-right hidden lg:table-cell">Costo Est.</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {data.items.map((recurso) => {
                      const isSelected = selectedIds.has(recurso.id);
                      const isLowStock = recurso.stockActual <= recurso.stockMinimo;

                      return (
                        <tr
                          key={recurso.id}
                          className={`hover:bg-[#EEF2F8]/70 transition-colors ${
                            isSelected ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          {canManage && (
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectItem(recurso.id)}
                                className="rounded border-slate-300 text-[#1C3177] focus:ring-[#1C3177]"
                              />
                            </td>
                          )}

                          {/* Foto o miniatura */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden mx-auto flex items-center justify-center">
                              {recurso.fotoPrincipalUrl ? (
                                <img
                                  src={recurso.fotoPrincipalUrl}
                                  alt={recurso.nombre}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-3 px-4 font-mono font-bold text-[#1C3177]">
                            {recurso.sku}
                          </td>

                          {/* Nombre */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 leading-snug">
                              {recurso.nombre}
                            </div>
                            {recurso.descripcion && (
                              <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                {recurso.descripcion}
                              </div>
                            )}
                          </td>

                          {/* Categoría */}
                          <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              {recurso.categoriaNombre}
                            </span>
                          </td>

                          {/* Tipo */}
                          <td className="py-3 px-3 text-center hidden sm:table-cell">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                recurso.tipo === 'activo_fijo'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-blue-50 text-[#1C3177] border border-blue-200'
                              }`}
                            >
                              {recurso.tipo === 'activo_fijo' ? 'Activo' : 'Consumible'}
                            </span>
                          </td>

                          {/* Existencias e Indicadores de Stock */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={`font-extrabold ${
                                  recurso.stockActual === 0
                                    ? 'text-rose-600'
                                    : isLowStock
                                    ? 'text-amber-600'
                                    : 'text-slate-800'
                                }`}
                              >
                                {recurso.stockActual}
                              </span>
                              <span className="text-[10px] text-slate-400">{recurso.unidadMedida}</span>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenStockModal(recurso)}
                                  title={`Ajustar umbrales RF-12 (Mín: ${recurso.stockMinimo}${recurso.puntoReorden ? `, Reorden: ${recurso.puntoReorden}` : ''}${recurso.stockMaximo ? `, Máx: ${recurso.stockMaximo}` : ''})`}
                                  className="p-1 rounded text-slate-400 hover:text-[#1C3177] hover:bg-slate-100 transition-colors"
                                >
                                  <SlidersHorizontal className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="mt-0.5">
                              {recurso.stockActual === 0 ? (
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700">
                                  Agotado
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                                  Stock Bajo (Mín: {recurso.stockMinimo})
                                </span>
                              ) : recurso.puntoReorden && recurso.stockActual <= recurso.puntoReorden ? (
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Punto Reorden ({recurso.puntoReorden})
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-[#2D8246]">
                                  En Stock
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Costo Estimado */}
                          <td className="py-3 px-3 text-right font-mono text-slate-700 hidden lg:table-cell">
                            RD${recurso.costoEstimado.toFixed(2)}
                          </td>

                          {/* Estado */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                recurso.activo
                                  ? 'bg-emerald-50 text-[#2D8246] border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  recurso.activo ? 'bg-[#3DAA5C]' : 'bg-slate-400'
                                }`}
                              />
                              {recurso.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setQrModalItem(recurso)}
                                title="Ver código QR para escaneo o impresión"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                              </button>
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingResourceId(recurso.id);
                                      setDuplicatingResource(null);
                                      setDrawerOpen(true);
                                    }}
                                    title="Editar recurso"
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#1C3177] transition-colors"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingResourceId(null);
                                      setDuplicatingResource(recurso);
                                      setDrawerOpen(true);
                                    }}
                                    title="Duplicar como plantilla"
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleOpenDetail(recurso.id)}
                                className="rounded-lg bg-blue-50 text-[#1C3177] px-2.5 py-1 text-[11px] font-bold hover:bg-blue-100 transition-colors"
                              >
                                Ficha
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VISTA TARJETAS GRID (MASTER.md §6e) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.items.map((recurso) => {
                const isSelected = selectedIds.has(recurso.id);
                const isLowStock = recurso.stockActual <= recurso.stockMinimo;

                return (
                  <div
                    key={recurso.id}
                    className={`rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1C3177] ring-2 ring-[#1C3177]/20'
                        : 'border-slate-200/90 hover:border-[#1C3177]/30'
                    }`}
                  >
                    <div>
                      {/* Imagen con badge */}
                      <div className="relative h-36 bg-slate-100 overflow-hidden">
                        {recurso.fotoPrincipalUrl ? (
                          <img
                            src={recurso.fotoPrincipalUrl}
                            alt={recurso.nombre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-50">
                            <Package className="h-10 w-10 text-slate-300" />
                          </div>
                        )}

                        {/* Badges superiores */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {canManage && (
                            <button
                              onClick={() => handleToggleSelectItem(recurso.id)}
                              className="rounded-md bg-white/90 p-1 shadow-xs hover:bg-white text-slate-700"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-3.5 w-3.5 text-[#1C3177]" />
                              ) : (
                                <Square className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </button>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold shadow-xs ${
                              recurso.tipo === 'activo_fijo'
                                ? 'bg-purple-600 text-white'
                                : 'bg-[#1C3177] text-white'
                            }`}
                          >
                            {recurso.tipo === 'activo_fijo' ? 'Activo Fijo' : 'Consumible'}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold shadow-xs ${
                              recurso.activo
                                ? 'bg-emerald-50 text-[#2D8246] border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                recurso.activo ? 'bg-[#3DAA5C]' : 'bg-slate-400'
                              }`}
                            />
                            {recurso.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>

                      {/* Cuerpo de la tarjeta */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-[#1C3177]">
                            {recurso.sku}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {recurso.categoriaNombre}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {recurso.nombre}
                        </h3>

                        {/* Existencias y Costo con Indicador de Stock */}
                        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 block">Stock Actual</span>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenStockModal(recurso);
                                  }}
                                  title="Ajustar umbrales RF-12"
                                  className="p-0.5 text-slate-400 hover:text-[#1C3177]"
                                >
                                  <SlidersHorizontal className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            <span
                              className={`font-extrabold ${
                                recurso.stockActual === 0
                                  ? 'text-rose-600'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              {recurso.stockActual} {recurso.unidadMedida}
                            </span>
                            <div className="mt-0.5">
                              {recurso.stockActual === 0 ? (
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-rose-100 text-rose-700">
                                  Agotado
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-amber-100 text-amber-700">
                                  Bajo (Mín: {recurso.stockMinimo})
                                </span>
                              ) : recurso.puntoReorden && recurso.stockActual <= recurso.puntoReorden ? (
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Reorden ({recurso.puntoReorden})
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-emerald-50 text-[#2D8246]">
                                  En Stock
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Costo Est.</span>
                            <span className="font-mono font-semibold text-slate-700">
                              RD${recurso.costoEstimado.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer con acciones */}
                    <div className="p-4 pt-0 flex items-center gap-1.5">
                      <button
                        onClick={() => setQrModalItem(recurso)}
                        title="Ver QR institucional"
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => {
                              setEditingResourceId(recurso.id);
                              setDuplicatingResource(null);
                              setDrawerOpen(true);
                            }}
                            title="Editar recurso"
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-[#1C3177] transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingResourceId(null);
                              setDuplicatingResource(recurso);
                              setDrawerOpen(true);
                            }}
                            title="Duplicar recurso"
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleOpenDetail(recurso.id)}
                        className="flex-1 rounded-xl bg-[#1C3177] py-2 text-xs font-bold text-white hover:bg-[#2B4BA0] transition-colors text-center"
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación (MASTER.md §6d) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs text-slate-600">
            <div>
              Mostrando{' '}
              <span className="font-bold text-slate-900">
                {data.items.length === 0 ? 0 : (data.pageIndex - 1) * data.pageSize + 1}
              </span>{' '}
              a{' '}
              <span className="font-bold text-slate-900">
                {Math.min(data.pageIndex * data.pageSize, data.totalCount)}
              </span>{' '}
              de <span className="font-bold text-slate-900">{data.totalCount}</span> recursos
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500">Por página:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-[#1C3177] focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <div className="flex items-center gap-1 ml-2">
                <button
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-bold text-slate-800">
                  {data.pageIndex} / {data.totalPages || 1}
                </span>
                <button
                  disabled={!data.hasNextPage}
                  onClick={() => setPageIndex((p) => p + 1)}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ACCIÓN EN LOTE */}
      {batchActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Confirmar Acción en Lote</h3>
              </div>
              <button
                onClick={() => setBatchActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Está seguro de que desea{' '}
              <strong className="text-slate-900 font-bold">
                {batchActionType === 'desactivar' ? 'desactivar' : 'activar'}
              </strong>{' '}
              los <strong className="font-bold text-[#1C3177]">{selectedIds.size}</strong> recursos
              seleccionados? Se registrará la trazabilidad completa en la bitácora de auditoría.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBatchActionModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processingBatch}
                onClick={handleExecuteBatchAction}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                  batchActionType === 'desactivar'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#3DAA5C] hover:bg-[#2D8246]'
                }`}
              >
                {processingBatch ? 'Procesando...' : 'Confirmar Acción'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISTA PREVIA Y DESCARGA DE QR */}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-[#1C3177]">Código QR Institucional SIIA</span>
              <button
                onClick={() => setQrModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <img
                src={apiClient.obtenerUrlDescargaQr(qrModalItem.id)}
                alt={`QR ${qrModalItem.sku}`}
                className="h-48 w-48 object-contain mx-auto"
              />
            </div>

            <div>
              <span className="font-mono text-xs font-bold text-[#1C3177] block">{qrModalItem.sku}</span>
              <h4 className="text-xs font-semibold text-slate-900 mt-0.5">{qrModalItem.nombre}</h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Contiene enlace seguro y canónico para escáner móvil o lector óptico.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href={apiClient.obtenerUrlDescargaQr(qrModalItem.id)}
                download={`QR_${qrModalItem.sku}.png`}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#1C3177] py-2 text-xs font-bold text-white hover:bg-[#2B4BA0] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar PNG
              </a>
              <button
                onClick={() => setQrModalItem(null)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Formulario de Recurso (Prompt 6.6) */}
      <ResourceFormDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingResourceId(null);
          setDuplicatingResource(null);
        }}
        recursoIdToEdit={editingResourceId}
        initialDataToDuplicate={duplicatingResource}
        onSaved={(savedRecurso, keepOpen) => {
          fetchRecursos();
          showToast(`Recurso "${savedRecurso.nombre}" guardado exitosamente`);
          if (!keepOpen) {
            setDrawerOpen(false);
            setEditingResourceId(null);
            setDuplicatingResource(null);
          }
        }}
      />

      {/* Modal Ficha Técnica del Recurso (Prompt 6.7) */}
      <ResourceDetailModal
        isOpen={detailModalOpen}
        recursoId={detailResourceId}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailResourceId(null);
        }}
        onEditResource={(id) => {
          setDetailModalOpen(false);
          setEditingResourceId(id);
          setDuplicatingResource(null);
          setDrawerOpen(true);
        }}
      />

      {/* Modal Impresión en Lote de Etiquetas QR (Prompt 6.7) */}
      <QrLabelsPrintModal
        isOpen={batchPrintModalOpen}
        onClose={() => setBatchPrintModalOpen(false)}
        recursos={data.items.filter((r) => selectedIds.has(r.id))}
      />

      {/* Escáner con Cámara PWA (Prompt 6.8) */}
      <CameraScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onOpenResourceDetail={(id) => {
          handleOpenDetail(id);
        }}
        onCreateResourceWithCode={(codigo) => {
          setEditingResourceId(null);
          setDuplicatingResource(null);
          setDrawerOpen(true);
        }}
      />

      {/* Modal Importación Masiva de Recursos CSV / Excel (Etapa 12) */}
      <ImportResourcesModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          fetchRecursos();
        }}
      />

      {/* Modal Ajuste Rápido de Umbrales de Stock RF-12 (Prompt 7.5) */}
      {stockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1C3177] flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Ajustar Umbrales de Stock (RF-12)
                  </h3>
                  <span className="text-[11px] font-mono text-[#1C3177] font-semibold">
                    {stockModalItem.sku} • {stockModalItem.nombre}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 text-[11px] space-y-1">
                <span className="font-bold block">Reglas de Reabastecimiento Automático:</span>
                <p className="text-slate-600">
                  El sistema generará alertas preventivas cuando las existencias disponibles caigan por debajo del stock mínimo o alcancen el punto de reorden.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Stock Mínimo (Alerta de escasez) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editStockMinimo}
                  onChange={(e) => setEditStockMinimo(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Existencias mínimas tolerables antes de considerarse en déficit crítico.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Punto de Reorden (Sugerencia de compra)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editPuntoReorden}
                  onChange={(e) => setEditPuntoReorden(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Ej: 10 (Opcional)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Nivel de existencias que dispara la solicitud de reposición al departamento de compras.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Stock Máximo (Capacidad tope)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editStockMaximo}
                  onChange={(e) => setEditStockMaximo(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Ej: 100 (Opcional)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Capacidad máxima para evitar sobreinventario y costos innecesarios de almacenamiento.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStockModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoStock}
                onClick={handleGuardarStock}
                className="px-5 py-2 rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                {guardandoStock ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guardar Umbrales</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
