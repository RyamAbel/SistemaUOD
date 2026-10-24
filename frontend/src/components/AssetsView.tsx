'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  FileText,
  Calculator,
  Wrench,
  AlertOctagon,
  Pencil,
  Layers,
  Trash2,
  Loader2,
  Plus,
  ExternalLink,
  RefreshCw,
  FileCheck,
  Upload
} from 'lucide-react';
import { ACTIVOS_ORIGINALES, UBICACIONES_ORIGINALES, ActivoTI } from '@/lib/inventoryData';
import { apiClient, UbicacionDto, ActaEntregaRecepcionDto, ActaDescargoPatrimonialDto, ActivoSerieDto } from '@/lib/apiClient';
import { ActaEntregaModal } from './ActaEntregaModal';
import { DepreciationModal } from './DepreciationModal';
import { MaintenanceModal } from './MaintenanceModal';
import { ActaDescargoModal } from './ActaDescargoModal';
import { EditAssetModal } from './EditAssetModal';
import { GroupedAssetsView } from './GroupedAssetsView';
import { CreateAssetModal } from './CreateAssetModal';

interface AssetsViewProps {
  onNavigateToMovements?: () => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ onNavigateToMovements }) => {
  const [activos, setActivos] = useState<ActivoTI[]>(ACTIVOS_ORIGINALES);
  const [cargandoApi, setCargandoApi] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('todas');
  const [viewMode, setViewMode] = useState<'tabla' | 'tarjetas' | 'agrupado'>('tabla');
  const [selectedActivo, setSelectedActivo] = useState<ActivoTI | null>(null);
  const [activoParaEditar, setActivoParaEditar] = useState<ActivoTI | null>(null);
  const [actaVisualizada, setActaVisualizada] = useState<ActaEntregaRecepcionDto | null>(null);
  const [activoParaDepreciacion, setActivoParaDepreciacion] = useState<ActivoTI | null>(null);
  const [activoParaMantenimiento, setActivoParaMantenimiento] = useState<ActivoTI | null>(null);
  const [actaDescargoVisualizada, setActaDescargoVisualizada] = useState<ActaDescargoPatrimonialDto | null>(null);
  const [activoParaEliminar, setActivoParaEliminar] = useState<ActivoTI | null>(null);
  const [eliminandoActivo, setEliminandoActivo] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [exportandoCsv, setExportandoCsv] = useState(false);
  const [creandoActivo, setCreandoActivo] = useState(false);
  const [subiendoFactura, setSubiendoFactura] = useState(false);
  const fileInputFacturaRef = useRef<HTMLInputElement>(null);

  const resolverCustodioReal = (item: {
    responsableNombre?: string | null;
    notas?: string | null;
    placaInstitucional?: string | null;
    numeroSerie?: string | null;
    id?: string;
  }): string => {
    // 1. Si la API o backend ya proveyó el custodio explícito
    if (item.responsableNombre && item.responsableNombre.trim() !== '' && item.responsableNombre.toLowerCase() !== 'por asignar') {
      return item.responsableNombre.trim();
    }
    // 2. Extraer de las observaciones/notas del levantamiento ('Responsable: RYAM')
    if (item.notas && typeof item.notas === 'string') {
      const match = item.notas.match(/responsable:\s*([^\r\n;|]+)/i);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    // 3. Búsqueda en el dataset institucional original UOD 2026 por placa o serial
    const placa = (item.placaInstitucional || '').trim().toLowerCase();
    const serial = (item.numeroSerie || '').trim().toLowerCase();
    const orig = ACTIVOS_ORIGINALES.find(o =>
      (placa && o.placa_institucional.toLowerCase() === placa) ||
      (serial && o.numero_serie.toLowerCase() === serial) ||
      o.id === item.id
    );
    if (orig?.responsable && orig.responsable.trim()) {
      return orig.responsable.trim();
    }
    return 'Por Asignar';
  };

  const [ubicacionesDb, setUbicacionesDb] = useState<UbicacionDto[]>([]);

  useEffect(() => {
    let montado = true;
    const cargarDesdeApi = async () => {
      try {
        setCargandoApi(true);
        const [res, ubiRes] = await Promise.all([
          apiClient.listarActivos({ pageSize: 500 }),
          apiClient.listarUbicaciones({ pageSize: 100, soloActivas: true }).catch(() => null)
        ]);
        if (montado) {
          if (res.items && res.items.length > 0) {
            const mapeados: ActivoTI[] = res.items.map(item => ({
              id: item.id,
              recurso_id: item.recursoId,
              placa_institucional: item.placaInstitucional || '',
              numero_serie: item.numeroSerie,
              recurso_nombre: item.recursoNombre,
              categoria_nombre: item.categoriaNombre,
              ubicacion_id: item.ubicacionId,
              ubicacion_nombre: item.ubicacionNombre,
              responsable: resolverCustodioReal(item),
              estado: (item.estado === 'dado_de_baja' ? 'dado_de_baja' : item.estado === 'danado' ? 'danado' : item.estado === 'disponible' ? 'disponible' : 'en_uso') as 'en_uso' | 'disponible' | 'danado' | 'dado_de_baja',
              notas: item.notas || '',
              costo_adquisicion: item.costoAdquisicion,
              factura_url: item.facturaUrl,
              factura_nombre: item.facturaNombre,
              foto_url: item.fotoPrincipalUrl
            }));
            setActivos(mapeados);
          }
          if (ubiRes && ubiRes.items) {
            setUbicacionesDb(ubiRes.items);
          }
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

  // Conteo exacto por ubicación
  const conteoPorUbicacion = useMemo(() => {
    const map: Record<string, number> = {};
    activos.forEach(a => {
      map[a.ubicacion_nombre] = (map[a.ubicacion_nombre] || 0) + 1;
    });
    return map;
  }, [activos]);

  // Lista de ubicaciones para el filtro leída desde BD
  const listaUbicacionesFiltro = useMemo(() => {
    if (ubicacionesDb.length > 0) {
      return ubicacionesDb.map(u => ({
        id: u.id,
        nombre: u.nombre,
        codigo: u.codigo,
        conteo: conteoPorUbicacion[u.nombre] ?? u.totalActivosFisicos ?? 0
      })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    const set = new Set<string>();
    activos.forEach(a => set.add(a.ubicacion_nombre));
    return Array.from(set).sort().map(u => ({
      id: u,
      nombre: u,
      codigo: '',
      conteo: conteoPorUbicacion[u] || 0
    }));
  }, [ubicacionesDb, activos, conteoPorUbicacion]);

  // Lista de nombres únicos para modales
  const ubicacionesUnicas = useMemo(() => {
    return listaUbicacionesFiltro.map(u => u.nombre);
  }, [listaUbicacionesFiltro]);

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
        selectedEstado === 'todos' ||
        (selectedEstado === 'en_uso' && activo.estado === 'en_uso') ||
        (selectedEstado === 'disponible' && activo.estado === 'disponible') ||
        (selectedEstado === 'danado' && (activo.estado === 'danado' || activo.estado === 'dado_de_baja')) ||
        (selectedEstado === 'dado_de_baja' && activo.estado === 'dado_de_baja');

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
      danados: activos.filter(a => a.estado === 'danado' || a.estado === 'dado_de_baja').length
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
      case 'dado_de_baja':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertOctagon className="h-3 w-3 text-rose-600" />
            Descargo Patrimonial
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



  const handleConfirmarEliminar = async () => {
    if (!activoParaEliminar) return;
    try {
      setEliminandoActivo(true);
      await apiClient.eliminarActivoDefinitivo(activoParaEliminar.id);
      setActivos(prev => prev.filter(a => a.id !== activoParaEliminar.id));
      if (selectedActivo?.id === activoParaEliminar.id) {
        setSelectedActivo(null);
      }
      if (actaDescargoVisualizada?.activoId === activoParaEliminar.id) {
        setActaDescargoVisualizada(null);
      }
      setToastMsg(`Activo ${activoParaEliminar.placa_institucional || activoParaEliminar.numero_serie} eliminado definitivamente del sistema.`);
      setTimeout(() => setToastMsg(null), 4000);
      setActivoParaEliminar(null);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el activo definitivamente');
    } finally {
      setEliminandoActivo(false);
    }
  };

  const handleActivoActualizado = (actActualizado: any) => {
    setActivos(prev => prev.map(a => {
      if (a.id === actActualizado.id) {
        return {
          ...a,
          placa_institucional: actActualizado.placaInstitucional || a.placa_institucional,
          numero_serie: actActualizado.numeroSerie || a.numero_serie,
          recurso_nombre: actActualizado.recursoNombre || a.recurso_nombre,
          categoria_nombre: actActualizado.categoriaNombre || a.categoria_nombre,
          ubicacion_id: actActualizado.ubicacionId || a.ubicacion_id,
          ubicacion_nombre: actActualizado.ubicacionNombre || a.ubicacion_nombre,
          responsable: actActualizado.responsableNombre || a.responsable,
          estado: (actActualizado.estado === 'dado_de_baja' ? 'dado_de_baja' : actActualizado.estado === 'danado' ? 'danado' : actActualizado.estado === 'disponible' ? 'disponible' : 'en_uso') as any,
          costo_adquisicion: actActualizado.costoAdquisicion,
          factura_url: actActualizado.facturaUrl,
          factura_nombre: actActualizado.facturaNombre,
          notas: actActualizado.notas || a.notas
        };
      }
      return a;
    }));
    if (selectedActivo && selectedActivo.id === actActualizado.id) {
      setSelectedActivo(prev => prev ? {
        ...prev,
        placa_institucional: actActualizado.placaInstitucional || prev.placa_institucional,
        numero_serie: actActualizado.numeroSerie || prev.numero_serie,
        recurso_nombre: actActualizado.recursoNombre || prev.recurso_nombre,
        categoria_nombre: actActualizado.categoriaNombre || prev.categoria_nombre,
        ubicacion_id: actActualizado.ubicacionId || prev.ubicacion_id,
        ubicacion_nombre: actActualizado.ubicacionNombre || prev.ubicacion_nombre,
        responsable: actActualizado.responsableNombre || prev.responsable,
        estado: (actActualizado.estado === 'dado_de_baja' ? 'dado_de_baja' : actActualizado.estado === 'danado' ? 'danado' : actActualizado.estado === 'disponible' ? 'disponible' : 'en_uso') as any,
        costo_adquisicion: actActualizado.costoAdquisicion,
        factura_url: actActualizado.facturaUrl,
        factura_nombre: actActualizado.facturaNombre,
        notas: actActualizado.notas || prev.notas
      } : null);
    }
  };

  const handleAbrirActaDescargo = async (activo: ActivoTI) => {
    try {
      const acta = await apiClient.obtenerActaDescargo(activo.id);
      setActaDescargoVisualizada(acta);
    } catch (err: any) {
      alert(err?.message || 'No se pudo generar el acta de descargo patrimonial');
    }
  };

  const handleExportarDepreciacionCsv = async () => {
    try {
      setExportandoCsv(true);
      await apiClient.exportarDepreciacionCsv();
    } catch (err: any) {
      alert(err?.message || 'Error al exportar reporte contable de depreciación');
    } finally {
      setExportandoCsv(false);
    }
  };

  const siguientePlacaSugerida = useMemo(() => {
    let maxNum = 0;
    activos.forEach(a => {
      const m = (a.placa_institucional || '').match(/EQ-(\d+)/i);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `EQ-${maxNum + 1 || 342}`;
  }, [activos]);

  const handleNuevoActivoCreado = (nuevo: ActivoSerieDto) => {
    const mapeado: ActivoTI = {
      id: nuevo.id,
      recurso_id: nuevo.recursoId,
      placa_institucional: nuevo.placaInstitucional || siguientePlacaSugerida,
      numero_serie: nuevo.numeroSerie,
      recurso_nombre: nuevo.recursoNombre,
      categoria_nombre: nuevo.categoriaNombre || 'Tecnología',
      ubicacion_id: nuevo.ubicacionId,
      ubicacion_nombre: nuevo.ubicacionNombre,
      responsable: nuevo.responsableNombre || 'Por Asignar',
      estado: (nuevo.estado === 'dado_de_baja' ? 'dado_de_baja' : nuevo.estado === 'danado' ? 'danado' : nuevo.estado === 'disponible' ? 'disponible' : 'en_uso') as any,
      notas: nuevo.notas || '',
      costo_adquisicion: nuevo.costoAdquisicion,
      factura_url: nuevo.facturaUrl,
      factura_nombre: nuevo.facturaNombre,
      foto_url: nuevo.fotoPrincipalUrl
    };
    setActivos(prev => [mapeado, ...prev]);
    setToastMsg(`Activo ${mapeado.placa_institucional} incorporado con éxito al inventario institucional.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSubirFacturaSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedActivo) return;
    try {
      setSubiendoFactura(true);
      const actActualizado = await apiClient.subirFacturaActivo(selectedActivo.id, file);
      setSelectedActivo(prev => prev ? {
        ...prev,
        factura_url: actActualizado.facturaUrl,
        factura_nombre: actActualizado.facturaNombre
      } : null);
      setActivos(prev => prev.map(a => a.id === selectedActivo.id ? {
        ...a,
        factura_url: actActualizado.facturaUrl,
        factura_nombre: actActualizado.facturaNombre
      } : a));
      setToastMsg('Factura digital adjuntada y almacenada con éxito.');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'Error al subir la factura digital');
    } finally {
      setSubiendoFactura(false);
      if (fileInputFacturaRef.current) fileInputFacturaRef.current.value = '';
    }
  };

  const handleEliminarFacturaSelected = async () => {
    if (!selectedActivo) return;
    if (!confirm('¿Seguro que deseas eliminar la factura adjunta de este activo?')) return;
    try {
      setSubiendoFactura(true);
      await apiClient.eliminarFacturaActivo(selectedActivo.id);
      setSelectedActivo(prev => prev ? {
        ...prev,
        factura_url: null,
        factura_nombre: null
      } : null);
      setActivos(prev => prev.map(a => a.id === selectedActivo.id ? {
        ...a,
        factura_url: null,
        factura_nombre: null
      } : a));
      setToastMsg('Factura digital eliminada del activo.');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar la factura digital');
    } finally {
      setSubiendoFactura(false);
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

        {/* Acciones del encabezado: Nuevo Activo, Exportación Contable DGII y Alternador de vista */}
        <div className="flex items-center gap-3 self-start flex-wrap">
          <button
            onClick={() => setCreandoActivo(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1C3177] text-white hover:bg-[#2B4BA0] transition-colors shadow-xs cursor-pointer"
            title="Registrar nuevo equipo físico con placa institucional y factura"
          >
            <Plus className="h-4 w-4" />
            Nuevo Activo Fijo
          </button>

          <button
            onClick={handleExportarDepreciacionCsv}
            disabled={exportandoCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            title="Descargar libro contable de depreciación fiscal DGII (Categoría 2 - 25% anual)"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            {exportandoCsv ? 'Generando CSV...' : 'Reporte Fiscal DGII (CSV)'}
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
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
            <button
              onClick={() => setViewMode('agrupado')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'agrupado'
                  ? 'bg-white text-[#1C3177] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ver los activos agrupados por tipo (Laptops, Bocinas, Monitores, etc.)"
            >
              <Layers className="h-4 w-4" />
              Agrupado por tipo
            </button>
          </div>
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

      {/* Barra de Búsqueda y Filtros (Solo para vista de Tabla o Tarjetas) */}
      {viewMode !== 'agrupado' && (
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
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] bg-white text-slate-700 font-medium"
              >
                <option value="todos">Todos los Estados ({metricas.total})</option>
                <option value="en_uso">En Uso ({metricas.enUso})</option>
                <option value="disponible">Disponible ({metricas.disponibles})</option>
                <option value="danado">Dañado / Inactivo ({metricas.danados})</option>
              </select>
            </div>

            {/* Filtro por Ubicación */}
            <div className="relative">
              <select
                value={selectedUbicacion}
                onChange={e => setSelectedUbicacion(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] bg-white text-slate-700 font-medium"
              >
                <option value="todas">Todas las Ubicaciones ({metricas.total})</option>
                {listaUbicacionesFiltro.map(u => (
                  <option key={u.id} value={u.nombre}>
                    {u.nombre} ({u.conteo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumen de resultados */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Mostrando <strong>{activosFiltrados.length}</strong> de <strong>{activos.length}</strong> equipos
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
      )}

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
                              setActivoParaEditar(activo);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#1C3177] hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Editar activo (datos, fotos, QR y factura)"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (onNavigateToMovements) {
                                setToastMsg(`Redirigiendo a Movimientos para registrar el traslado de ${activo.placa_institucional}...`);
                                setTimeout(() => onNavigateToMovements(), 350);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Ir a Movimientos para registrar traslado"
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
                              setActivoParaMantenimiento(activo);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Historial y Servicios Técnicos (Mantenimiento)"
                          >
                            <Wrench className="h-4 w-4" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (activo.estado === 'danado' || activo.estado === 'dado_de_baja') {
                                handleAbrirActaDescargo(activo);
                              } else if (onNavigateToMovements) {
                                setToastMsg(`Redirigiendo a Movimientos para tramitar la baja de ${activo.placa_institucional}...`);
                                setTimeout(() => onNavigateToMovements(), 350);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={
                              activo.estado === 'danado' || activo.estado === 'dado_de_baja'
                                ? 'Ver Acta Oficial de Descargo Patrimonial'
                                : 'Ir a Movimientos para tramitar baja patrimonial'
                            }
                          >
                            <AlertOctagon className="h-4 w-4" />
                          </button>
                          {(activo.estado === 'danado' || activo.estado === 'dado_de_baja') && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setActivoParaEliminar(activo);
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                              title="Eliminar activo definitivamente del sistema"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
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
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setActivoParaEditar(activo);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-[#1C3177] hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Editar activo (datos, fotos, QR y factura)"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setActivoParaDepreciacion(activo);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Calcular depreciación DGII"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setActivoParaMantenimiento(activo);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Servicios técnicos y bitácora de mantenimiento"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (activo.estado === 'danado' || activo.estado === 'dado_de_baja') {
                        handleAbrirActaDescargo(activo);
                      } else if (onNavigateToMovements) {
                        setToastMsg(`Redirigiendo a Movimientos para tramitar la baja de ${activo.placa_institucional}...`);
                        setTimeout(() => onNavigateToMovements(), 350);
                      }
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={
                      activo.estado === 'danado' || activo.estado === 'dado_de_baja'
                        ? 'Ver Acta Oficial de Descargo Patrimonial'
                        : 'Ir a Movimientos para tramitar baja patrimonial'
                    }
                  >
                    <AlertOctagon className="h-3.5 w-3.5" />
                  </button>
                  {(activo.estado === 'danado' || activo.estado === 'dado_de_baja') && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setActivoParaEliminar(activo);
                      }}
                      className="p-1 rounded-md text-rose-500 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      title="Eliminar activo definitivamente del sistema"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {getBadgeEstado(activo.estado)}
                </div>
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

      {/* Vista Agrupada por Tipo de Activo (Idea 1) */}
      {viewMode === 'agrupado' && (
        <GroupedAssetsView
          activos={activos}
          onEditAsset={activo => setActivoParaEditar(activo)}
          onSelectAsset={activo => setSelectedActivo(activo)}
          onTransferAsset={activo => {
            if (onNavigateToMovements) {
              setToastMsg(`Redirigiendo a Movimientos para trasladar ${activo.placa_institucional}...`);
              setTimeout(() => onNavigateToMovements(), 350);
            }
          }}
          onDeleteAsset={activo => setActivoParaEliminar(activo)}
          ubicacionesDisponibles={ubicacionesUnicas}
          initialSearch={search}
        />
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
              {/* Costo y Factura Status */}
              <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Costo de Adquisición</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedActivo.costo_adquisicion ? `RD$ ${Number(selectedActivo.costo_adquisicion).toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : 'No especificado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Factura Digital</span>
                  {selectedActivo.factura_url ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Adjunta
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Sin adjuntar
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Factura y Documentos Digitales */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1C3177]" />
                  <span className="text-xs font-bold text-slate-800">Factura y Documentos de Compra</span>
                </div>
                {subiendoFactura && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#1C3177] font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando...</span>
                  </div>
                )}
              </div>

              {selectedActivo.factura_url ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {selectedActivo.factura_nombre || 'factura_adquisicion.pdf'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          ✓ Factura digital registrada y verificada
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={selectedActivo.factura_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#1C3177] hover:bg-slate-100 transition-colors"
                        title="Ver en pestaña externa"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <a
                        href={selectedActivo.factura_url}
                        download={selectedActivo.factura_nombre || 'factura.pdf'}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Descargar factura"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => fileInputFacturaRef.current?.click()}
                        disabled={subiendoFactura}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Reemplazar factura"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleEliminarFacturaSelected}
                        disabled={subiendoFactura}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar factura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vista previa embebida si es imagen */}
                  {(selectedActivo.factura_url.startsWith('data:image') || selectedActivo.factura_url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) ? (
                    <div className="border rounded-xl overflow-hidden max-h-48 flex items-center justify-center bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedActivo.factura_url}
                        alt="Factura"
                        className="object-contain max-h-44 w-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="p-2.5 bg-blue-50/50 rounded-xl text-center text-xs text-slate-600 border border-blue-100 flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4 text-[#1C3177]" />
                      <span>Documento PDF disponible para previsualización y descarga.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700">Sin factura digital adjunta</p>
                    <p className="text-[11px] text-slate-400">Sube la factura en formato PDF o imagen (máx 10 MB)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputFacturaRef.current?.click()}
                    disabled={subiendoFactura}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-[#1C3177] hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Adjuntar Factura
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputFacturaRef}
                className="hidden"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleSubirFacturaSelected}
              />
            </div>

            <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const act = selectedActivo;
                    setSelectedActivo(null);
                    setActivoParaEditar(act);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-[#1C3177] text-white hover:bg-[#2B4BA0] transition-colors cursor-pointer shadow-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar Activo
                </button>
                <button
                  onClick={() => {
                    const act = selectedActivo;
                    setSelectedActivo(null);
                    if (onNavigateToMovements) {
                      setToastMsg(`Redirigiendo a Movimientos para registrar el traslado de ${act.placa_institucional}...`);
                      setTimeout(() => onNavigateToMovements(), 350);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-50 text-[#1C3177] hover:bg-blue-100 transition-colors cursor-pointer"
                  title="Ir al módulo de Movimientos para registrar traslado formal"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Ir a Movimientos (Traslado)
                </button>
                <button
                  onClick={() => {
                    const act = selectedActivo;
                    handleAbrirActa(act);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Ver Acta Oficial de Entrega"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver Acta Oficial
                </button>
                <button
                  onClick={() => {
                    const act = selectedActivo;
                    setSelectedActivo(null);
                    setActivoParaDepreciacion(act);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                  title="Depreciación DGII"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Depreciación DGII
                </button>
                <button
                  onClick={() => {
                    const act = selectedActivo;
                    setSelectedActivo(null);
                    setActivoParaMantenimiento(act);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Mantenimiento"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  Mantenimiento
                </button>
                {selectedActivo.estado === 'danado' || selectedActivo.estado === 'dado_de_baja' ? (
                  <>
                    <button
                      onClick={() => {
                        const act = selectedActivo;
                        handleAbrirActaDescargo(act);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <AlertOctagon className="h-3.5 w-3.5" />
                      Ver Acta de Descargo
                    </button>
                    <button
                      onClick={() => {
                        const act = selectedActivo;
                        setSelectedActivo(null);
                        setActivoParaEliminar(act);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar Definitivamente
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const act = selectedActivo;
                      setSelectedActivo(null);
                      if (onNavigateToMovements) {
                        setToastMsg(`Redirigiendo a Movimientos para tramitar la baja de ${act.placa_institucional}...`);
                        setTimeout(() => onNavigateToMovements(), 350);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Ir al módulo de Movimientos para tramitar desincorporación patrimonial"
                  >
                    <AlertOctagon className="h-3.5 w-3.5" />
                    Ir a Movimientos (Baja)
                  </button>
                )}
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

      {/* Modal de Acta Oficial de Entrega / Recepción */}
      {actaVisualizada && (
        <ActaEntregaModal
          acta={actaVisualizada}
          onClose={() => setActaVisualizada(null)}
        />
      )}

      {/* Modal de Historial y Servicios Técnicos (Mantenimiento TI) */}
      {activoParaMantenimiento && (
        <MaintenanceModal
          isOpen={!!activoParaMantenimiento}
          onClose={() => setActivoParaMantenimiento(null)}
          activoId={activoParaMantenimiento.id}
          placaInstitucional={activoParaMantenimiento.placa_institucional}
        />
      )}

      {/* Modal de Acta Oficial de Descargo Patrimonial */}
      {actaDescargoVisualizada && (
        <ActaDescargoModal
          acta={actaDescargoVisualizada}
          onClose={() => setActaDescargoVisualizada(null)}
          onDeleteAsset={(id) => {
            const act = activos.find(a => a.id === id);
            setActaDescargoVisualizada(null);
            if (act) setActivoParaEliminar(act);
          }}
        />
      )}

      {/* Modal de Edición Completa de Activo */}
      {activoParaEditar && (
        <EditAssetModal
          activoId={activoParaEditar.id}
          isOpen={!!activoParaEditar}
          onClose={() => setActivoParaEditar(null)}
          onSaved={handleActivoActualizado}
        />
      )}

      {/* Modal de Confirmación de Eliminación Definitiva */}
      {activoParaEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Eliminar activo definitivamente?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción es permanente e irreversible
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Placa / ID:</span>
                <span className="font-mono font-bold text-[#1C3177] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {activoParaEliminar.placa_institucional || 'S/P'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Equipo / Modelo:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                  {activoParaEliminar.recurso_nombre}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Número de Serie:</span>
                <span className="font-mono text-slate-700">
                  {activoParaEliminar.numero_serie}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Estado:</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                  {activoParaEliminar.estado === 'dado_de_baja' ? 'Descargo Patrimonial' : 'Dañado / Inactivo'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              El activo ya ha sido dado de baja institucionalmente. Al eliminarlo permanentemente, se removerá por completo de la base de datos de activos físicos y del catálogo general.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={eliminandoActivo}
                onClick={() => setActivoParaEliminar(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminandoActivo}
                onClick={handleConfirmarEliminar}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {eliminandoActivo ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Sí, eliminar definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Nuevo Activo Fijo */}
      <CreateAssetModal
        isOpen={creandoActivo}
        onClose={() => setCreandoActivo(false)}
        onCreated={handleNuevoActivoCreado}
        ubicaciones={ubicacionesDb.length > 0 ? ubicacionesDb : (UBICACIONES_ORIGINALES as any)}
        siguientePlacaSugerida={siguientePlacaSugerida}
      />

      {/* Floating Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-xs text-white shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

