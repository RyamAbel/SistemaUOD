'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  RotateCcw,
  XCircle,
  Plus,
  Trash2,
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  ShieldCheck,
  FileText,
  Clock,
  Calendar,
  Building2,
  Package,
  Layers,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Eye,
  RefreshCw,
  X,
  UserCheck,
  Download,
  FileSpreadsheet,
  Filter,
  Sparkles,
  Upload,
  Tag,
  DollarSign,
  Box,
  FileUp,
  Hash,
  Check
} from 'lucide-react';
import {
  apiClient,
  MovimientoDto,
  CrearMovimientoDto,
  CrearMovimientoLineaDto,
  PrevisualizarMovimientoResultadoDto,
  RecursoDto,
  UbicacionDto,
  CategoriaDto,
  ProveedorDto,
  PagedResult
} from '@/lib/apiClient';
import { CATEGORIAS_ORIGINALES, UBICACIONES_ORIGINALES } from '@/lib/inventoryData';
import { useAuth } from '@/context/AuthContext';
import { CameraScannerModal } from './CameraScannerModal';

interface MovementsViewProps {
  movimientos?: any[];
  articulos?: any[];
  onAddMovimiento?: (mov: any) => void;
  onOpenResourceDetail?: (id: string) => void;
}

type TipoMovimiento = 'entrada' | 'salida' | 'traslado' | 'ajuste' | 'devolucion' | 'baja';

interface TipoConfig {
  tipo: TipoMovimiento;
  label: string;
  descripcion: string;
  color: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  icon: React.ReactNode;
}

const TIPOS_CONFIG: Record<TipoMovimiento, TipoConfig> = {
  entrada: {
    tipo: 'entrada',
    label: 'Entrada',
    descripcion: 'Recepción de compras, insumos institucionales o donaciones',
    color: '#3DAA5C',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-[#2D8246]',
    icon: <ArrowDownLeft className="w-4 h-4" />
  },
  salida: {
    tipo: 'salida',
    label: 'Salida / Entrega',
    descripcion: 'Entrega a cátedras, departamentos o personal custodio',
    color: '#1C3177',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-[#1C3177]',
    icon: <ArrowUpRight className="w-4 h-4" />
  },
  traslado: {
    tipo: 'traslado',
    label: 'Traslado',
    descripcion: 'Transferencia interna entre almacenes y dependencias UOD',
    color: '#D97706',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    icon: <ArrowLeftRight className="w-4 h-4" />
  },
  ajuste: {
    tipo: 'ajuste',
    label: 'Ajuste de Conteo',
    descripcion: 'Corrección física tras conteo o inventario rotativo',
    color: '#7C3AED',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    icon: <SlidersHorizontal className="w-4 h-4" />
  },
  devolucion: {
    tipo: 'devolucion',
    label: 'Devolución',
    descripcion: 'Reingreso de material sobrante o retorno a proveedor',
    color: '#0891B2',
    bgLight: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-800',
    icon: <RotateCcw className="w-4 h-4" />
  },
  baja: {
    tipo: 'baja',
    label: 'Baja / Desecho',
    descripcion: 'Desincorporación por daño, obsolescencia o merma física',
    color: '#DC2626',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: <XCircle className="w-4 h-4" />
  }
};

export const MovementsView: React.FC<MovementsViewProps> = ({
  onOpenResourceDetail
}) => {
  const { rol } = useAuth();
  const canOperate = rol === 'super_admin' || rol === 'admin_inventario' || rol === 'encargado_almacen';

  // 1. Modos de pantalla
  const [activeTab, setActiveTab] = useState<'wizard' | 'historial'>('wizard');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // 2. Catálogos maestros para selección
  const [ubicaciones, setUbicaciones] = useState<UbicacionDto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [recursosBusqueda, setRecursosBusqueda] = useState<RecursoDto[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // 3. Estado del Wizard - Paso 1: Datos Generales
  const [tipo, setTipo] = useState<TipoMovimiento>('entrada');
  const [caminoEntrada, setCaminoEntrada] = useState<'nuevo' | 'existente'>('existente');
  const [origenUbicacionId, setOrigenUbicacionId] = useState<string>('');
  const [destinoUbicacionId, setDestinoUbicacionId] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');

  // Metadatos de Entrada / Factura / Proveedor
  const [numeroFactura, setNumeroFactura] = useState<string>('');
  const [archivoFactura, setArchivoFactura] = useState<File | null>(null);
  const [facturaPreviewUrl, setFacturaPreviewUrl] = useState<string | null>(null);
  const [proveedorNombre, setProveedorNombre] = useState<string>('');
  const [proveedorId, setProveedorId] = useState<string>('');
  const [fechaMovimiento, setFechaMovimiento] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Camino A: Estado para nuevo recurso inline
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevaCategoriaId, setNuevaCategoriaId] = useState<string>('');
  const [nuevoTipo, setNuevoTipo] = useState<'activo_fijo' | 'consumible'>('activo_fijo');
  const [nuevoCostoEstimado, setNuevoCostoEstimado] = useState<number>(0);
  const [nuevoUnidadMedida, setNuevoUnidadMedida] = useState<string>('unidad');
  const [nuevoFotoFile, setNuevoFotoFile] = useState<File | null>(null);
  const [nuevoFotoPreview, setNuevoFotoPreview] = useState<string | null>(null);
  const [nuevasSeriesTexto, setNuevasSeriesTexto] = useState<string>('');
  const [nuevaCantidadConsumible, setNuevaCantidadConsumible] = useState<number>(1);

  // Camino B: Estado para ingresar múltiples series en recurso existente
  const [seriesExistenteTexto, setSeriesExistenteTexto] = useState<string>('');

  // 4. Estado del Wizard - Paso 2: Líneas de Recursos
  interface LineaMovimientoItem {
    tempId: string;
    recurso: RecursoDto;
    cantidad: number;
    costoUnitario: number;
    stockDisponibleOrigen?: number;
    numerosSerie?: string[];
    esNuevoRecurso?: boolean;
    nuevoRecursoPayload?: {
      sku: string;
      nombre: string;
      categoriaId: string;
      tipo: 'activo_fijo' | 'consumible';
      costoEstimado: number;
      unidadMedida: string;
      fotoFile?: File | null;
    };
  }

  const [lineas, setLineas] = useState<LineaMovimientoItem[]>([]);

  // Selector temporal para añadir una nueva línea
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecurso, setSelectedRecurso] = useState<RecursoDto | null>(null);
  const [stockDisponibleSeleccionado, setStockDisponibleSeleccionado] = useState<number | null>(null);
  const [cantidadLinea, setCantidadLinea] = useState<number>(1);
  const [costoLinea, setCostoLinea] = useState<number>(0);
  const [buscandoRecursos, setBuscandoRecursos] = useState(false);

  // 5. Estado del Wizard - Paso 3: Simulación / Previsualización
  const [simulacion, setSimulacion] = useState<PrevisualizarMovimientoResultadoDto | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [movimientoExitoso, setMovimientoExitoso] = useState<MovimientoDto | null>(null);

  // 6. Historial de Movimientos y Bitácora
  const [historialMovimientos, setHistorialMovimientos] = useState<MovimientoDto[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialTipoFiltro, setHistorialTipoFiltro] = useState<string>('todos');
  const [historialUbicacionFiltro, setHistorialUbicacionFiltro] = useState<string>('');
  const [historialFechaDesde, setHistorialFechaDesde] = useState<string>('');
  const [historialFechaHasta, setHistorialFechaHasta] = useState<string>('');
  const [historialBusqueda, setHistorialBusqueda] = useState<string>('');
  const [historialPage, setHistorialPage] = useState<number>(1);
  const [historialTotalPages, setHistorialTotalPages] = useState<number>(1);
  const [historialTotalCount, setHistorialTotalCount] = useState<number>(0);
  const [selectedHistorialMov, setSelectedHistorialMov] = useState<MovimientoDto | null>(null);
  const [exportandoCsv, setExportandoCsv] = useState(false);

  // 7. Escáner de Códigos
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper para dividir y sanitizar números de serie
  const parseSerialNumbers = useCallback((raw: string): string[] => {
    return raw
      .split(/[\r\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }, []);

  // Cargar catálogos maestros
  useEffect(() => {
    const cargarCatalogos = async () => {
      setLoadingCatalogos(true);
      try {
        const [ubicRes, catRes] = await Promise.all([
          apiClient.listarUbicaciones({ pageSize: 100, soloActivas: true }),
          apiClient.listarCategorias(true).catch(() => [])
        ]);
        setUbicaciones(ubicRes.items);
        setCategorias(catRes);
        setProveedores([]);
        if (catRes.length > 0) {
          setNuevaCategoriaId(catRes[0].id);
        }
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      } finally {
        setLoadingCatalogos(false);
      }
    };
    cargarCatalogos();
  }, []);

  // Cargar historial de movimientos filtrable
  const cargarHistorial = useCallback(async (page: number = 1) => {
    setLoadingHistorial(true);
    try {
      const res = await apiClient.listarMovimientos({
        pageIndex: page,
        pageSize: 15,
        search: historialBusqueda.trim() || undefined,
        tipo: historialTipoFiltro !== 'todos' ? historialTipoFiltro : undefined,
        ubicacionId: historialUbicacionFiltro || undefined,
        fechaDesde: historialFechaDesde ? new Date(historialFechaDesde).toISOString() : undefined,
        fechaHasta: historialFechaHasta ? new Date(historialFechaHasta + 'T23:59:59').toISOString() : undefined,
        sortBy: 'creadoEn',
        isDescending: true
      });
      setHistorialMovimientos(res.items);
      setHistorialPage(res.pageIndex);
      setHistorialTotalPages(res.totalPages);
      setHistorialTotalCount(res.totalCount);
    } catch (err) {
      console.error('Error cargando historial de movimientos:', err);
    } finally {
      setLoadingHistorial(false);
    }
  }, [historialBusqueda, historialTipoFiltro, historialUbicacionFiltro, historialFechaDesde, historialFechaHasta]);

  // Ejecutar carga de historial al cambiar de pestaña o variar filtros
  useEffect(() => {
    if (activeTab === 'historial') {
      cargarHistorial(1);
    }
  }, [activeTab, historialTipoFiltro, historialUbicacionFiltro, historialFechaDesde, historialFechaHasta, cargarHistorial]);

  // Exportar a CSV con BOM UTF-8
  const handleExportarCsv = async () => {
    setExportandoCsv(true);
    try {
      await apiClient.exportarMovimientosCsv({
        search: historialBusqueda.trim() || undefined,
        tipo: historialTipoFiltro !== 'todos' ? historialTipoFiltro : undefined,
        ubicacionId: historialUbicacionFiltro || undefined,
        fechaDesde: historialFechaDesde ? new Date(historialFechaDesde).toISOString() : undefined,
        fechaHasta: historialFechaHasta ? new Date(historialFechaHasta + 'T23:59:59').toISOString() : undefined
      });
      showToast('Bitácora de movimientos descargada exitosamente en formato CSV.');
    } catch (err: any) {
      showToast(err.message || 'Error al exportar movimientos a CSV');
    } finally {
      setExportandoCsv(false);
    }
  };

  const handleLimpiarFiltrosHistorial = () => {
    setHistorialBusqueda('');
    setHistorialTipoFiltro('todos');
    setHistorialUbicacionFiltro('');
    setHistorialFechaDesde('');
    setHistorialFechaHasta('');
  };

  // Búsqueda de recursos con debounce para el selector
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setRecursosBusqueda([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoRecursos(true);
      try {
        const res = await apiClient.listarRecursos({
          search: searchTerm.trim(),
          pageSize: 10,
          activo: true
        });
        setRecursosBusqueda(res.items);
      } catch (err) {
        console.error('Error buscando recursos:', err);
      } finally {
        setBuscandoRecursos(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Consultar existencias de recurso seleccionado en la ubicación origen
  useEffect(() => {
    if (!selectedRecurso) {
      setStockDisponibleSeleccionado(null);
      return;
    }

    setCostoLinea(selectedRecurso.costoEstimado || 0);

    const consultarExistencias = async () => {
      if (tipo === 'entrada' || !origenUbicacionId) {
        setStockDisponibleSeleccionado(selectedRecurso.stockActual);
        return;
      }

      try {
        const existencias = await apiClient.obtenerExistenciasDetalladas(
          selectedRecurso.id,
          origenUbicacionId
        );
        const cant = existencias.reduce((sum, e) => sum + e.cantidadDisponible, 0);
        setStockDisponibleSeleccionado(cant);
      } catch (err) {
        setStockDisponibleSeleccionado(0);
      }
    };

    consultarExistencias();
  }, [selectedRecurso, origenUbicacionId, tipo]);


  // Validaciones del Paso 1
  const paso1Valido = useMemo(() => {
    if (!motivo || motivo.trim().length < 5) return false;
    if (tipo === 'entrada') return !!destinoUbicacionId;
    if (tipo === 'salida' || tipo === 'baja') return !!origenUbicacionId;
    if (tipo === 'traslado') {
      return !!origenUbicacionId && !!destinoUbicacionId && origenUbicacionId !== destinoUbicacionId;
    }
    if (tipo === 'ajuste' || tipo === 'devolucion') {
      return !!origenUbicacionId || !!destinoUbicacionId;
    }
    return false;
  }, [tipo, origenUbicacionId, destinoUbicacionId, motivo]);

  // Comprobar si alguna línea excede el stock disponible
  const hayLineasConDeficit = useMemo(() => {
    if (tipo === 'entrada') return false;
    return lineas.some(l => l.stockDisponibleOrigen !== undefined && l.cantidad > l.stockDisponibleOrigen);
  }, [lineas, tipo]);

  // Manejo Camino A: Agregar nuevo producto / activo al catálogo y a la entrada
  const handleAgregarNuevoRecurso = () => {
    if (!nuevoNombre.trim() || nuevoNombre.trim().length < 3) {
      showToast('El nombre del producto o activo debe tener al menos 3 caracteres.');
      return;
    }
    const catId = nuevaCategoriaId || categorias[0]?.id || CATEGORIAS_ORIGINALES[0]?.id;
    if (!catId) {
      showToast('Selecciona una categoría válida.');
      return;
    }

    let cantidadFinal = 1;
    let seriesFinales: string[] = [];

    if (nuevoTipo === 'activo_fijo') {
      seriesFinales = parseSerialNumbers(nuevasSeriesTexto);
      if (seriesFinales.length === 0) {
        showToast('Ingresa al menos un número de serie para el activo individual.');
        return;
      }
      cantidadFinal = seriesFinales.length;
    } else {
      cantidadFinal = Math.max(1, nuevaCantidadConsumible);
    }

    const skuSugerido = `SKU-EQ-${Date.now().toString().slice(-4)}`;
    const catNombre = categorias.find(c => c.id === catId)?.nombre || 'Tecnología';

    const nuevoRecursoVirtual: RecursoDto = {
      id: `virtual-${Date.now()}`,
      sku: skuSugerido,
      nombre: nuevoNombre.trim(),
      categoriaId: catId,
      categoriaNombre: catNombre,
      tipo: nuevoTipo,
      unidadMedida: nuevoUnidadMedida || 'unidad',
      stockMinimo: 1,
      costoEstimado: nuevoCostoEstimado,
      activo: true,
      stockActual: 0,
      totalFotos: nuevoFotoFile ? 1 : 0,
      totalActivosSerie: nuevoTipo === 'activo_fijo' ? cantidadFinal : 0,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      fotoPrincipalUrl: nuevoFotoPreview
    };

    setLineas(prev => [
      ...prev,
      {
        tempId: `linea-nueva-${Date.now()}`,
        recurso: nuevoRecursoVirtual,
        cantidad: cantidadFinal,
        costoUnitario: nuevoCostoEstimado,
        numerosSerie: seriesFinales.length > 0 ? seriesFinales : undefined,
        esNuevoRecurso: true,
        nuevoRecursoPayload: {
          sku: skuSugerido,
          nombre: nuevoNombre.trim(),
          categoriaId: catId,
          tipo: nuevoTipo,
          costoEstimado: nuevoCostoEstimado,
          unidadMedida: nuevoUnidadMedida || 'unidad',
          fotoFile: nuevoFotoFile
        }
      }
    ]);

    // Reset de campos de nuevo recurso
    setNuevoNombre('');
    setNuevasSeriesTexto('');
    setNuevaCantidadConsumible(1);
    setNuevoCostoEstimado(0);
    setNuevoFotoFile(null);
    setNuevoFotoPreview(null);
    showToast(`Artículo "${nuevoNombre.trim()}" agregado a la lista (+${cantidadFinal} ${cantidadFinal === 1 ? 'unidad' : 'unidades'}).`);
  };

  // Manejo Camino B / Otros tipos: Agregar línea de recurso existente
  const handleAgregarLinea = () => {
    if (!selectedRecurso) return;

    let cant = cantidadLinea;
    let series: string[] = [];

    if (tipo === 'entrada' && selectedRecurso.tipo === 'activo_fijo') {
      series = parseSerialNumbers(seriesExistenteTexto);
      if (series.length === 0) {
        showToast('Ingresa los números de serie para las unidades del activo.');
        return;
      }
      cant = series.length;
    } else {
      if (cant <= 0) return;
    }

    // Verificar si ya existe en la lista
    const indexExistente = lineas.findIndex(l => l.recurso.id === selectedRecurso.id && !l.esNuevoRecurso);
    if (indexExistente >= 0) {
      const nuevasLineas = [...lineas];
      nuevasLineas[indexExistente].cantidad += cant;
      nuevasLineas[indexExistente].costoUnitario = costoLinea;
      if (series.length > 0) {
        nuevasLineas[indexExistente].numerosSerie = [
          ...(nuevasLineas[indexExistente].numerosSerie || []),
          ...series
        ];
      }
      setLineas(nuevasLineas);
    } else {
      setLineas(prev => [
        ...prev,
        {
          tempId: `linea-${Date.now()}-${Math.random()}`,
          recurso: selectedRecurso,
          cantidad: cant,
          costoUnitario: costoLinea,
          stockDisponibleOrigen: stockDisponibleSeleccionado ?? undefined,
          numerosSerie: series.length > 0 ? series : undefined
        }
      ]);
    }

    // Reset de campos
    setSelectedRecurso(null);
    setSearchTerm('');
    setCantidadLinea(1);
    setSeriesExistenteTexto('');
    showToast(`Línea agregada: +${cant} uds de "${selectedRecurso.nombre}".`);
  };

  const handleRemoverLinea = (tempId: string) => {
    setLineas(prev => prev.filter(l => l.tempId !== tempId));
  };

  // Ejecutar simulación previa antes de avanzar al paso 3
  const handleAvanzarAPaso3 = async () => {
    if (lineas.length === 0 || hayLineasConDeficit) return;

    setSimulando(true);
    try {
      const lineasExistentes = lineas.filter(l => !l.esNuevoRecurso);
      const lineasNuevas = lineas.filter(l => l.esNuevoRecurso);

      let lineasPrevSimulacion: any[] = [];
      let erroresSimulacion: string[] = [];
      let esValidoSimulacion = true;

      // 1. Simular líneas existentes en el backend
      if (lineasExistentes.length > 0) {
        const payload: CrearMovimientoDto = {
          tipo,
          origenUbicacionId: origenUbicacionId ? origenUbicacionId : null,
          destinoUbicacionId: destinoUbicacionId ? destinoUbicacionId : null,
          motivo: motivo.trim(),
          comprobanteUrl: comprobanteUrl ? comprobanteUrl.trim() : null,
          numeroFactura: numeroFactura.trim() || null,
          facturaUrl: facturaPreviewUrl || null,
          proveedorId: proveedorId || null,
          proveedorNombre: proveedorNombre.trim() || null,
          fechaMovimiento: fechaMovimiento ? new Date(fechaMovimiento).toISOString() : null,
          lineas: lineasExistentes.map(l => ({
            recursoId: l.recurso.id,
            cantidad: l.cantidad,
            costoUnitario: l.costoUnitario,
            numerosSerie: l.numerosSerie
          }))
        };

        const res = await apiClient.previsualizarMovimiento(payload);
        lineasPrevSimulacion = [...res.lineas];
        erroresSimulacion = [...res.errores];
        esValidoSimulacion = res.esValido;
      }

      // 2. Para líneas nuevas de Camino A (entrada positiva en destino)
      if (lineasNuevas.length > 0 && tipo === 'entrada' && destinoUbicacionId) {
        const destUbi = ubicaciones.find(u => u.id === destinoUbicacionId);
        lineasNuevas.forEach((ln, idx) => {
          const series = ln.numerosSerie || [];
          const placas = series.map((_, i) => `EQ-Sugerida (${i + 1})`);
          lineasPrevSimulacion.push({
            recursoId: ln.recurso.id,
            recursoSku: ln.recurso.sku,
            recursoNombre: ln.recurso.nombre,
            ubicacionId: destinoUbicacionId,
            ubicacionNombre: destUbi?.nombre || 'Ubicación Destino',
            stockActual: 0,
            cantidadOperacion: ln.cantidad,
            stockResultante: ln.cantidad,
            esValido: true,
            numerosSerie: series,
            placasSugeridas: placas
          });
        });
      }

      setSimulacion({
        tipo,
        totalLineas: lineas.length,
        esValido: esValidoSimulacion && erroresSimulacion.length === 0,
        errores: erroresSimulacion,
        lineas: lineasPrevSimulacion
      });

      setWizardStep(3);
    } catch (err: any) {
      showToast(err.message || 'Error al simular impacto de existencias');
    } finally {
      setSimulando(false);
    }
  };

  // Confirmar y Guardar Movimiento Transaccional
  const handleConfirmarMovimiento = async () => {
    if (!paso1Valido || lineas.length === 0) return;

    setGuardando(true);
    try {
      // 1. Si hay líneas con nuevo recurso (Camino A), crearlos primero en el catálogo
      const lineasParaEnviar: CrearMovimientoLineaDto[] = [];
      for (const l of lineas) {
        if (l.esNuevoRecurso && l.nuevoRecursoPayload) {
          const payloadRec = l.nuevoRecursoPayload;
          const nuevoRec = await apiClient.crearRecurso({
            sku: payloadRec.sku,
            nombre: payloadRec.nombre,
            categoriaId: payloadRec.categoriaId,
            tipo: payloadRec.tipo,
            unidadMedida: payloadRec.unidadMedida,
            costoEstimado: payloadRec.costoEstimado,
            stockMinimo: 1,
            activo: true
          });

          // Si seleccionó foto, subirla al recurso creado
          if (payloadRec.fotoFile) {
            try {
              await apiClient.subirFotoRecurso(nuevoRec.id, payloadRec.fotoFile, true);
            } catch (fotoErr) {
              console.warn('No se pudo subir la foto del recurso:', fotoErr);
            }
          }

          lineasParaEnviar.push({
            recursoId: nuevoRec.id,
            cantidad: l.cantidad,
            costoUnitario: l.costoUnitario,
            numerosSerie: l.numerosSerie
          });
        } else {
          lineasParaEnviar.push({
            recursoId: l.recurso.id,
            cantidad: l.cantidad,
            costoUnitario: l.costoUnitario,
            numerosSerie: l.numerosSerie
          });
        }
      }

      // 2. Resolver proveedor si el usuario escribió un nombre o seleccionó de la lista
      let provIdFinal = proveedorId || null;
      if (!provIdFinal && proveedorNombre.trim()) {
        const provMatch = proveedores.find(
          p => p.nombreComercial?.toLowerCase() === proveedorNombre.trim().toLowerCase() ||
               p.razonSocial?.toLowerCase() === proveedorNombre.trim().toLowerCase()
        );
        if (provMatch) {
          provIdFinal = provMatch.id;
        }
      }

      // Registrar el movimiento en la API
      const payload: CrearMovimientoDto = {
        tipo,
        origenUbicacionId: origenUbicacionId ? origenUbicacionId : null,
        destinoUbicacionId: destinoUbicacionId ? destinoUbicacionId : null,
        motivo: motivo.trim(),
        comprobanteUrl: comprobanteUrl ? comprobanteUrl.trim() : null,
        numeroFactura: numeroFactura.trim() || null,
        facturaUrl: facturaPreviewUrl || null,
        proveedorId: provIdFinal,
        proveedorNombre: proveedorNombre.trim() || null,
        fechaMovimiento: fechaMovimiento ? new Date(fechaMovimiento).toISOString() : null,
        idempotenciaKey: `MOV-REQ-${Date.now()}`,
        lineas: lineasParaEnviar
      };

      const nuevoMov = await apiClient.registrarMovimiento(payload, payload.idempotenciaKey);
      setMovimientoExitoso(nuevoMov);
      showToast(`Movimiento ${nuevoMov.numeroMovimiento} registrado exitosamente.`);
    } catch (err: any) {
      console.error('Error al registrar movimiento:', err);
      showToast(err.problem?.detail || err.message || 'Error al ejecutar movimiento transaccional');
    } finally {
      setGuardando(false);
    }
  };

  // Reset del formulario para crear otro movimiento
  const handleReiniciarFormulario = () => {
    setWizardStep(1);
    setTipo('entrada');
    setCaminoEntrada('existente');
    setOrigenUbicacionId('');
    setDestinoUbicacionId('');
    setMotivo('');
    setComprobanteUrl('');
    setNumeroFactura('');
    setArchivoFactura(null);
    setFacturaPreviewUrl(null);
    setProveedorNombre('');
    setProveedorId('');
    setLineas([]);
    setSelectedRecurso(null);
    setSearchTerm('');
    setSeriesExistenteTexto('');
    setNuevoNombre('');
    setNuevasSeriesTexto('');
    setNuevaCantidadConsumible(1);
    setNuevoCostoEstimado(0);
    setNuevoFotoFile(null);
    setNuevoFotoPreview(null);
    setSimulacion(null);
    setMovimientoExitoso(null);
  };

  // Recepción de recurso desde el escáner QR
  const handleRecursoEscaneado = (recurso: RecursoDto) => {
    setSelectedRecurso(recurso);
    setSearchTerm(`${recurso.sku} - ${recurso.nombre}`);
    setCantidadLinea(1);
    setScannerOpen(false);
    showToast(`Recurso "${recurso.nombre}" escaneado con éxito.`);
  };

  // Totales de líneas añadidas
  const totalUnidades = useMemo(() => lineas.reduce((acc, l) => acc + l.cantidad, 0), [lineas]);
  const costoTotal = useMemo(() => lineas.reduce((acc, l) => acc + (l.cantidad * l.costoUnitario), 0), [lineas]);

  return (
    <div className="space-y-6">
      {/* 1. Header con Pestañas Principales */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1C3177] flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-[#1C3177]" />
            Movimientos y Saldo de Existencias
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro transaccional atómico de transferencias, consumos clínicos y recepciones con auditoría Ley 172-13.
          </p>
        </div>

        {/* Alternador de Vistas */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'wizard'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Movimiento</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'historial'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Historial y Bitácora</span>
          </button>
        </div>
      </div>

      {/* 2. Pestaña WIZARD: Registro en 3 Pasos */}
      {activeTab === 'wizard' && (
        <div className="space-y-6">
          {/* Si ya se completó el movimiento exitosamente */}
          {movimientoExitoso ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#3DAA5C] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900">
                  ¡Movimiento Registrado Exitosamente!
                </h3>
                <p className="text-xs text-slate-600">
                  La transacción transaccional fue ejecutada sin inconsistencias. El saldo físico de existencias ha sido actualizado en tiempo real.
                </p>
                <div className="inline-block px-4 py-2 bg-slate-100 rounded-xl font-mono text-sm font-bold text-[#1C3177] border border-slate-200">
                  {movimientoExitoso.numeroMovimiento}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Tipo:</span>
                  <span className="font-bold text-slate-900 uppercase">{movimientoExitoso.tipo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Líneas:</span>
                  <span className="font-bold text-slate-900">{movimientoExitoso.totalLineas} artículos</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unidades:</span>
                  <span className="font-bold text-slate-900">{movimientoExitoso.totalUnidades} uds</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total DOP:</span>
                  <span className="font-bold text-[#2D8246]">${movimientoExitoso.costoTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleReiniciarFormulario}
                  className="px-5 py-2.5 bg-[#1C3177] hover:bg-[#2B4BA0] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Otro Movimiento</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('historial');
                    setMovimientoExitoso(null);
                  }}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Ver en Historial</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stepper Visual de 3 Pasos */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-slate-100/90 rounded-2xl border border-slate-200">
                <div
                  className={`flex items-center gap-2.5 p-3 rounded-xl transition-all ${
                    wizardStep === 1
                      ? 'bg-white shadow-xs border border-slate-200 text-[#1C3177]'
                      : wizardStep > 1
                      ? 'bg-emerald-50 text-[#2D8246]'
                      : 'text-slate-500'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    wizardStep === 1 ? 'bg-[#1C3177] text-white' : wizardStep > 1 ? 'bg-[#3DAA5C] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {wizardStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold block leading-none">Datos Generales</span>
                    <span className="text-[10px] text-slate-500">Tipo, rutas y motivo</span>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2.5 p-3 rounded-xl transition-all ${
                    wizardStep === 2
                      ? 'bg-white shadow-xs border border-slate-200 text-[#1C3177]'
                      : wizardStep > 2
                      ? 'bg-emerald-50 text-[#2D8246]'
                      : 'text-slate-500'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    wizardStep === 2 ? 'bg-[#1C3177] text-white' : wizardStep > 2 ? 'bg-[#3DAA5C] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {wizardStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold block leading-none">
                      Líneas ({lineas.length})
                    </span>
                    <span className="text-[10px] text-slate-500">Recursos y cantidades</span>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2.5 p-3 rounded-xl transition-all ${
                    wizardStep === 3
                      ? 'bg-white shadow-xs border border-slate-200 text-[#1C3177]'
                      : 'text-slate-500'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    wizardStep === 3 ? 'bg-[#1C3177] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    3
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold block leading-none">Impacto y Balance</span>
                    <span className="text-[10px] text-slate-500">Confirmación final</span>
                  </div>
                </div>
              </div>

              {/* PASO 1: Datos Generales */}
              {wizardStep === 1 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      1. Selecciona el Tipo de Movimiento
                    </h3>
                    <p className="text-xs text-slate-500">
                      Define la naturaleza transaccional de la operación de inventario.
                    </p>
                  </div>

                  {/* Tarjetas de Tipos de Movimiento */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {(Object.keys(TIPOS_CONFIG) as TipoMovimiento[]).map(t => {
                      const cfg = TIPOS_CONFIG[t];
                      const isSelected = tipo === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipo(t)}
                          className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? `${cfg.bgLight} ${cfg.borderColor} ring-2 ring-[${cfg.color}] shadow-xs`
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={`p-1.5 rounded-lg ${cfg.bgLight} ${cfg.textColor}`}>
                                {cfg.icon}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#3DAA5C]" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {cfg.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-2 line-clamp-2 leading-tight">
                            {cfg.descripcion}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ENTRADA: Selección de Camino A vs Camino B */}
                  {tipo === 'entrada' && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3DAA5C]"></span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Selecciona cómo ingresarás este recurso
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Camino A */}
                        <button
                          type="button"
                          onClick={() => setCaminoEntrada('nuevo')}
                          className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                            caminoEntrada === 'nuevo'
                              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-[#3DAA5C] shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-[#2D8246]">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Camino A</span>
                              </span>
                              {caminoEntrada === 'nuevo' && (
                                <CheckCircle2 className="w-4 h-4 text-[#3DAA5C]" />
                              )}
                            </div>
                            <div>
                              <span className="text-sm font-bold text-slate-900 block">
                                Nuevo producto o activo
                              </span>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                No existe aún en el catálogo. Crearás su ficha técnica (nombre, categoría, foto, costo) e ingresarás sus unidades iniciales.
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Camino B */}
                        <button
                          type="button"
                          onClick={() => setCaminoEntrada('existente')}
                          className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                            caminoEntrada === 'existente'
                              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-[#1C3177] shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-[#1C3177]">
                                <Layers className="w-3.5 h-3.5" />
                                <span>Camino B</span>
                              </span>
                              {caminoEntrada === 'existente' && (
                                <CheckCircle2 className="w-4 h-4 text-[#1C3177]" />
                              )}
                            </div>
                            <div>
                              <span className="text-sm font-bold text-slate-900 block">
                                Agregar más unidades de un recurso existente
                              </span>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Busca un bien ya registrado en el catálogo institucional. Podrás ingresar múltiples números de serie o sumar existencias.
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ubicaciones de Origen y Destino */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Origen */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Ubicación de Origen {tipo !== 'entrada' && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        disabled={tipo === 'entrada'}
                        value={origenUbicacionId}
                        onChange={e => setOrigenUbicacionId(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                          tipo === 'entrada'
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-300 text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]'
                        }`}
                      >
                        <option value="">-- Seleccionar Ubicación de Origen --</option>
                        {ubicaciones.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.codigo} - {u.nombre} ({u.tipo})
                          </option>
                        ))}
                      </select>
                      {tipo === 'entrada' && (
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          No aplica en entradas (provienen de proveedor externo o compra institucional).
                        </span>
                      )}
                    </div>

                    {/* Destino */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Ubicación de Destino {(tipo === 'entrada' || tipo === 'traslado') && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        disabled={tipo === 'salida' || tipo === 'baja'}
                        value={destinoUbicacionId}
                        onChange={e => setDestinoUbicacionId(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                          tipo === 'salida' || tipo === 'baja'
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-300 text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]'
                        }`}
                      >
                        <option value="">-- Seleccionar Ubicación de Destino --</option>
                        {ubicaciones.map(u => (
                          <option key={u.id} value={u.id} disabled={u.id === origenUbicacionId}>
                            {u.codigo} - {u.nombre} ({u.tipo}) {u.id === origenUbicacionId ? '(Mismo que origen)' : ''}
                          </option>
                        ))}
                      </select>
                      {(tipo === 'salida' || tipo === 'baja') && (
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          No aplica en salidas definitivas o desincorporaciones.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Campos específicos de Entrada: Proveedor, Fecha y Factura */}
                  {tipo === 'entrada' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      {/* Proveedor */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Proveedor o Suplidor
                        </label>
                        <input
                          type="text"
                          value={proveedorNombre}
                          onChange={e => setProveedorNombre(e.target.value)}
                          placeholder="Ej: Dell Dominicana, TechSupply SRL"
                          list="proveedores-sugeridos"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] bg-white"
                        />
                        <datalist id="proveedores-sugeridos">
                          {proveedores.map(p => (
                            <option key={p.id} value={p.nombreComercial} />
                          ))}
                        </datalist>
                      </div>

                      {/* Fecha de Entrada */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Fecha de Entrada</span>
                        </label>
                        <input
                          type="date"
                          value={fechaMovimiento}
                          onChange={e => setFechaMovimiento(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] bg-white"
                        />
                      </div>

                      {/* Número de Factura */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-slate-500" />
                          <span>Número de Factura / Conduce</span>
                        </label>
                        <input
                          type="text"
                          value={numeroFactura}
                          onChange={e => setNumeroFactura(e.target.value)}
                          placeholder="Ej: B150000123 / CON-482"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] bg-white"
                        />
                      </div>

                      {/* Factura Adjunta (Opcional) */}
                      <div className="sm:col-span-3 pt-1">
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Adjuntar Factura o Documento de Compra (PDF o Imagen)
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="px-3.5 py-2 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-700 transition-colors">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span>{archivoFactura ? archivoFactura.name : 'Subir archivo de factura'}</span>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setArchivoFactura(file);
                                  setFacturaPreviewUrl(URL.createObjectURL(file));
                                  if (!numeroFactura) {
                                    setNumeroFactura(file.name.replace(/\.[^/.]+$/, ''));
                                  }
                                }
                              }}
                            />
                          </label>
                          {archivoFactura && (
                            <button
                              type="button"
                              onClick={() => {
                                setArchivoFactura(null);
                                setFacturaPreviewUrl(null);
                              }}
                              className="text-xs text-red-600 hover:text-red-700 font-bold"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Motivo y Documento de Soporte */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Motivo / Justificación Institucional <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-[10px] ${motivo.trim().length >= 5 ? 'text-[#3DAA5C] font-semibold' : 'text-slate-400'}`}>
                          {motivo.trim().length}/5 caracteres mín.
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                        placeholder="Ejemplo: Reabastecimiento de suministros institucionales o recepción de compra según Factura B150000123"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                      />
                    </div>

                    {tipo !== 'entrada' && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Documento o Conduce de Respaldo (Opcional)
                        </label>
                        <div className="relative">
                          <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={comprobanteUrl}
                            onChange={e => setComprobanteUrl(e.target.value)}
                            placeholder="Número de conduce, acta de entrega o URL del documento adjunto"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botón de Avance a Paso 2 */}
                  <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={!paso1Valido}
                      onClick={() => setWizardStep(2)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        paso1Valido
                          ? 'bg-[#1C3177] hover:bg-[#2B4BA0] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Siguiente: {tipo === 'entrada' && caminoEntrada === 'nuevo' ? 'Registrar Ficha del Bien' : 'Agregar Líneas de Recursos'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: Líneas de Recursos */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  {/* CAMINO A: Formulario de nuevo recurso inline */}
                  {tipo === 'entrada' && caminoEntrada === 'nuevo' ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-[#2D8246]">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Camino A</span>
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">
                              Registrar Ficha del Nuevo Producto o Activo
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Este bien se agregará automáticamente al catálogo de SIIA y a la ubicación de destino seleccionada.
                          </p>
                        </div>
                      </div>

                      {/* Tipo de Bien: Activo Fijo vs Suministro */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 block">
                          Tipo de Bien Institucional <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setNuevoTipo('activo_fijo')}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              nuevoTipo === 'activo_fijo'
                                ? 'bg-blue-50/80 border-blue-300 ring-2 ring-[#1C3177]'
                                : 'bg-slate-50 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-900 block">
                              Activo Fijo Individual
                            </span>
                            <span className="text-[11px] text-slate-500 mt-1 block">
                              Equipos como computadoras, proyectores, bocinas. Cada uno tendrá su número de serie, placa EQ-XXX y QR propio.
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNuevoTipo('consumible')}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              nuevoTipo === 'consumible'
                                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-[#3DAA5C]'
                                : 'bg-slate-50 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-900 block">
                              Suministro Consumible
                            </span>
                            <span className="text-[11px] text-slate-500 mt-1 block">
                              Materiales de almacén (tóner, resinas, papel, gasas). Se controlan por cantidad global de existencias.
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Datos Básicos: Nombre, Categoría, Costo */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Nombre del Producto o Activo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={nuevoNombre}
                            onChange={e => setNuevoNombre(e.target.value)}
                            placeholder="Ej: Monitor Dell 24 pulgadas UltraSharp P2419H"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Categoría <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={nuevaCategoriaId}
                            onChange={e => setNuevaCategoriaId(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] bg-white"
                          >
                            {categorias.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Costo Unitario de Adquisición (DOP)
                          </label>
                          <div className="relative">
                            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={nuevoCostoEstimado || ''}
                              onChange={e => setNuevoCostoEstimado(parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                            />
                          </div>
                        </div>

                        {/* Subir Fotografía del Bien */}
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Fotografía del Producto (Opcional)
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-700 transition-colors">
                              <Upload className="w-4 h-4 text-slate-400" />
                              <span>{nuevoFotoFile ? nuevoFotoFile.name : 'Seleccionar fotografía'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setNuevoFotoFile(file);
                                    setNuevoFotoPreview(URL.createObjectURL(file));
                                  }
                                }}
                              />
                            </label>
                            {nuevoFotoPreview && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={nuevoFotoPreview}
                                  alt="Previsualización"
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNuevoFotoFile(null);
                                    setNuevoFotoPreview(null);
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700 font-bold"
                                >
                                  Quitar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Si es Activo Fijo: Carga múltiple de números de serie */}
                      {nuevoTipo === 'activo_fijo' ? (
                        <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <Hash className="w-4 h-4 text-[#1C3177]" />
                              <span>Números de Serie de las Unidades a Ingresar <span className="text-red-500">*</span></span>
                            </label>
                            {parseSerialNumbers(nuevasSeriesTexto).length > 0 && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1C3177] text-white">
                                {parseSerialNumbers(nuevasSeriesTexto).length} {parseSerialNumbers(nuevasSeriesTexto).length === 1 ? 'unidad detectada' : 'unidades detectadas'}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600">
                            Escribe o pega los números de serie de cada unidad (uno por línea, o separados por coma o punto y coma). El sistema asignará a cada una su placa consecutiva <strong className="text-[#1C3177]">EQ-XXX</strong> y su código QR propio.
                          </p>

                          <textarea
                            rows={3}
                            value={nuevasSeriesTexto}
                            onChange={e => setNuevasSeriesTexto(e.target.value)}
                            placeholder="Ejemplo:&#10;SN-DELL-90112&#10;SN-DELL-90113&#10;SN-DELL-90114"
                            className="w-full font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] bg-white"
                          />

                          {/* Previsualización en chips de las series detectadas */}
                          {parseSerialNumbers(nuevasSeriesTexto).length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Vista previa de unidades individuales ({parseSerialNumbers(nuevasSeriesTexto).length}):
                              </span>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                {parseSerialNumbers(nuevasSeriesTexto).map((serie, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white border border-slate-300 text-slate-800 shadow-2xs"
                                  >
                                    <span className="text-slate-400">#{idx + 1}</span>
                                    <span>{serie}</span>
                                    <span className="text-[#3DAA5C]">→ Placa EQ-XXX</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Si es Consumible: Cantidad y Unidad de Medida */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Cantidad Inicial a Ingresar <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={nuevaCantidadConsumible}
                              onChange={e => setNuevaCantidadConsumible(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Unidad de Medida
                            </label>
                            <select
                              value={nuevoUnidadMedida}
                              onChange={e => setNuevoUnidadMedida(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
                            >
                              <option value="unidad">Unidades (uds)</option>
                              <option value="caja">Cajas</option>
                              <option value="paquete">Paquetes</option>
                              <option value="frasco">Frascos / Botellas</option>
                              <option value="resma">Resmas</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleAgregarNuevoRecurso}
                          className="px-5 py-2.5 bg-[#3DAA5C] hover:bg-[#2D8246] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Artículo a la Entrada</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CAMINO B o MOVIMIENTO NORMAL: Selector de recurso existente */
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {tipo === 'entrada' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-[#1C3177]">
                                <Layers className="w-3.5 h-3.5" />
                                <span>Camino B</span>
                              </span>
                            )}
                            <h3 className="text-sm font-bold text-slate-900">
                              2. Selecciona el Recurso y Cantidades
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Escribe el nombre o SKU institucional, o escanea el código físico con la cámara.
                          </p>
                        </div>

                        {/* Botón de Escáner QR con Cámara */}
                        <button
                          type="button"
                          onClick={() => setScannerOpen(true)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#1C3177] text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-2"
                        >
                          <QrCode className="w-4 h-4 text-[#1C3177]" />
                          <span>Escanear Código / QR</span>
                        </button>
                      </div>

                      {/* Buscador predictivo de recursos */}
                      <div className="relative">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={e => {
                              setSearchTerm(e.target.value);
                              setSelectedRecurso(null);
                            }}
                            placeholder="Buscar por SKU (ej. SKU-EX-001) o nombre del recurso..."
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                          />
                          {buscandoRecursos && (
                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                          )}
                        </div>

                        {/* Menú flotante de resultados predictivos */}
                        {recursosBusqueda.length > 0 && !selectedRecurso && (
                          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                            {recursosBusqueda.map(r => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setSelectedRecurso(r);
                                  setSearchTerm(`${r.sku} - ${r.nombre}`);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                              >
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-900 block">{r.nombre}</span>
                                  <span className="font-mono text-[11px] text-[#1C3177] font-semibold">{r.sku}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-slate-700 block">Stock: {r.stockActual} {r.unidadMedida}</span>
                                  <span className="text-[10px] text-slate-400">{r.categoriaNombre} • {r.tipo === 'activo_fijo' ? 'Activo Fijo' : 'Consumible'}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Ficha de Recurso Seleccionado + Input de Cantidad / Series */}
                      {selectedRecurso && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">{selectedRecurso.nombre}</span>
                              <span className="font-mono text-[11px] text-[#1C3177]">
                                {selectedRecurso.sku} • {selectedRecurso.categoriaNombre} •{' '}
                                <span className={selectedRecurso.tipo === 'activo_fijo' ? 'text-indigo-600 font-bold' : 'text-emerald-600 font-bold'}>
                                  {selectedRecurso.tipo === 'activo_fijo' ? 'Activo Fijo Individual' : 'Suministro Consumible'}
                                </span>
                              </span>
                            </div>

                            {/* Badge de Stock */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {tipo === 'entrada' ? 'Stock global:' : 'Stock disponible origen:'}
                              </span>
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                (stockDisponibleSeleccionado ?? 0) > 0
                                  ? 'bg-emerald-100 text-[#2D8246]'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {stockDisponibleSeleccionado ?? 0} {selectedRecurso.unidadMedida}
                              </span>
                            </div>
                          </div>

                          {/* Si es ENTRADA y el recurso es ACTIVO FIJO: Input de múltiples series */}
                          {tipo === 'entrada' && selectedRecurso.tipo === 'activo_fijo' ? (
                            <div className="space-y-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-[#1C3177]" />
                                  <span>Números de serie de las unidades a ingresar</span>
                                </label>
                                {parseSerialNumbers(seriesExistenteTexto).length > 0 && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1C3177] text-white">
                                    {parseSerialNumbers(seriesExistenteTexto).length} unidades físicas detectadas
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-600">
                                Pega o escribe los números de serie (uno por línea o separados por coma). Cada unidad recibirá automáticamente su placa correlativa <strong className="text-[#1C3177]">EQ-XXX</strong> y su código QR.
                              </p>

                              <textarea
                                rows={3}
                                value={seriesExistenteTexto}
                                onChange={e => setSeriesExistenteTexto(e.target.value)}
                                placeholder="Ej:&#10;SN-HP-4011&#10;SN-HP-4012&#10;SN-HP-4013"
                                className="w-full font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] bg-white"
                              />

                              {parseSerialNumbers(seriesExistenteTexto).length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    Vista previa ({parseSerialNumbers(seriesExistenteTexto).length} unidades):
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                    {parseSerialNumbers(seriesExistenteTexto).map((s, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white border border-slate-300 text-slate-800"
                                      >
                                        <span className="text-slate-400">#{idx + 1}</span>
                                        <span>{s}</span>
                                        <span className="text-[#3DAA5C]">→ Placa EQ-XXX</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 items-end">
                                <div>
                                  <label className="text-xs font-bold text-slate-700 block mb-1">
                                    Costo Unitario (DOP)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={costoLinea}
                                    onChange={e => setCostoLinea(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={handleAgregarLinea}
                                  className="w-full py-2 bg-[#1C3177] hover:bg-[#2B4BA0] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Añadir {parseSerialNumbers(seriesExistenteTexto).length || ''} Unidades Físicas</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Modo Estándar: Cantidad y Costo */
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                              <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                  Cantidad a operar
                                </label>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => setCantidadLinea(Math.max(1, cantidadLinea - 1))}
                                    className="px-3 py-2 border border-slate-300 rounded-l-xl bg-white hover:bg-slate-100 text-xs font-bold"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    value={cantidadLinea}
                                    onChange={e => setCantidadLinea(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full text-center py-2 border-y border-slate-300 text-xs font-bold text-slate-900 focus:outline-none bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setCantidadLinea(cantidadLinea + 1)}
                                    className="px-3 py-2 border border-slate-300 rounded-r-xl bg-white hover:bg-slate-100 text-xs font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                  Costo Unitario (DOP)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={costoLinea}
                                  onChange={e => setCostoLinea(parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleAgregarLinea}
                                className="w-full py-2 bg-[#3DAA5C] hover:bg-[#2D8246] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Añadir a la Lista</span>
                              </button>
                            </div>
                          )}

                          {/* Advertencia Inmediata de Stock Insuficiente */}
                          {tipo !== 'entrada' &&
                            stockDisponibleSeleccionado !== null &&
                            cantidadLinea > stockDisponibleSeleccionado && (
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                <span>
                                  ⚠️ Advertencia inmediata: La cantidad ({cantidadLinea}) supera las existencias disponibles ({stockDisponibleSeleccionado}).
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tabla de Líneas Añadidas */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Líneas Agregadas a la Operación ({lineas.length})
                      </h4>
                      {lineas.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setLineas([])}
                          className="text-xs text-red-600 hover:text-red-700 font-bold"
                        >
                          Limpiar todo
                        </button>
                      )}
                    </div>

                    {lineas.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2 text-slate-400">
                        <Package className="w-8 h-8 mx-auto stroke-1" />
                        <p className="text-xs font-medium">Aún no has agregado recursos a este movimiento.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                            <tr>
                              <th className="py-2.5 px-3">Recurso / Bien</th>
                              <th className="py-2.5 px-3">Cantidad</th>
                              <th className="py-2.5 px-3">Costo Unit.</th>
                              <th className="py-2.5 px-3">Subtotal</th>
                              <th className="py-2.5 px-3 text-center">Tipo / Estado</th>
                              <th className="py-2.5 px-3 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lineas.map(l => {
                              const tieneDeficit =
                                tipo !== 'entrada' &&
                                l.stockDisponibleOrigen !== undefined &&
                                l.cantidad > l.stockDisponibleOrigen;

                              return (
                                <tr key={l.tempId} className="hover:bg-slate-50/60">
                                  <td className="py-3 px-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 block">{l.recurso.nombre}</span>
                                        {l.esNuevoRecurso && (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-[#2D8246]">
                                            Nuevo en catálogo
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-mono text-[11px] text-[#1C3177]">{l.recurso.sku} • {l.recurso.categoriaNombre}</span>

                                      {/* Series asociadas si existen */}
                                      {l.numerosSerie && l.numerosSerie.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {l.numerosSerie.map((s, si) => (
                                            <span
                                              key={si}
                                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-mono text-[#1C3177] border border-blue-200"
                                            >
                                              SN: {s}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 font-bold text-slate-900">
                                    {l.cantidad} {l.recurso.unidadMedida}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">
                                    ${l.costoUnitario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-[#2D8246]">
                                    ${(l.cantidad * l.costoUnitario).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {tieneDeficit ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                        <AlertTriangle className="w-3 h-3" />
                                        Insuficiente ({l.stockDisponibleOrigen})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#2D8246]">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {tipo === 'entrada' ? 'Ingreso Válido' : 'Disponible'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoverLinea(l.tempId)}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                      title="Remover línea"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Resumen Totalizador */}
                    {lineas.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-6 text-xs">
                          <div>
                            <span className="text-slate-500 block">Total Artículos:</span>
                            <span className="font-bold text-slate-900">{lineas.length} líneas</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Total Unidades:</span>
                            <span className="font-bold text-slate-900">{totalUnidades} uds</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Valor Acumulado:</span>
                            <span className="font-bold text-[#2D8246]">${costoTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP</span>
                          </div>
                        </div>

                        {hayLineasConDeficit && (
                          <div className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Corrige las líneas con stock insuficiente antes de continuar</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botones de Navegación de Paso 2 */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Atrás: Datos Generales</span>
                      </button>

                      <button
                        type="button"
                        disabled={lineas.length === 0 || hayLineasConDeficit || simulando}
                        onClick={handleAvanzarAPaso3}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          lineas.length > 0 && !hayLineasConDeficit && !simulando
                            ? 'bg-[#1C3177] hover:bg-[#2B4BA0] text-white shadow-xs'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {simulando ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Simulando impacto...</span>
                          </>
                        ) : (
                          <>
                            <span>Siguiente: Previsualizar Impacto</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: Vista Previa del Impacto y Confirmación Transaccional */}
              {wizardStep === 3 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      3. Vista Previa del Impacto en Existencias
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comprueba cómo quedarán los balances físicos antes de asentar la transacción en base de datos.
                    </p>
                  </div>

                  {/* Resumen de la Cabecera */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block">Tipo:</span>
                      <span className="font-bold text-slate-900 uppercase">{tipo}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {tipo === 'entrada' ? 'Destino UOD:' : 'Origen:'}
                      </span>
                      <span className="font-bold text-slate-900">
                        {tipo === 'entrada'
                          ? (ubicaciones.find(u => u.id === destinoUbicacionId)?.nombre || 'Destino UOD')
                          : (ubicaciones.find(u => u.id === origenUbicacionId)?.nombre || 'Externo / Proveedor')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {tipo === 'entrada' ? 'Proveedor / Suplidor:' : 'Destino:'}
                      </span>
                      <span className="font-bold text-slate-900">
                        {tipo === 'entrada'
                          ? (proveedorNombre || 'Proveedor Externo')
                          : (ubicaciones.find(u => u.id === destinoUbicacionId)?.nombre || 'Consumo / Descarte')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {tipo === 'entrada' && numeroFactura ? 'Factura / Fecha:' : 'Motivo:'}
                      </span>
                      <span className="font-bold text-slate-900 line-clamp-1">
                        {tipo === 'entrada' && numeroFactura ? `${numeroFactura} (${fechaMovimiento})` : motivo}
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Simulación de Impacto */}
                  {simulacion && (
                    <div className="space-y-4">
                      {!simulacion.esValido ? (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-bold">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>La transacción no puede ejecutarse debido a los siguientes conflictos:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 pl-2">
                            {simulacion.errores.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">Recurso</th>
                                <th className="py-2.5 px-3">Ubicación Afectada</th>
                                <th className="py-2.5 px-3 text-center">Stock Actual</th>
                                <th className="py-2.5 px-3 text-center">Operación</th>
                                <th className="py-2.5 px-3 text-center">Stock Resultante</th>
                                <th className="py-2.5 px-3 text-center">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {simulacion.lineas.map((linea, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-3">
                                    <span className="font-bold text-slate-900 block">{linea.recursoNombre}</span>
                                    <span className="font-mono text-[10px] text-[#1C3177]">{linea.recursoSku}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-700">
                                    {linea.ubicacionNombre || 'Ubicación'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                                    {linea.stockActual}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold">
                                    <span className={linea.cantidadOperacion > 0 ? 'text-[#3DAA5C]' : 'text-red-600'}>
                                      {linea.cantidadOperacion > 0 ? `+${linea.cantidadOperacion}` : linea.cantidadOperacion}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">
                                    {linea.stockResultante}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#2D8246]">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Balance Válido
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Tarjeta de Unidades Físicas / Activos Individuales a Registrar */}
                      {simulacion.lineas.some(l => l.numerosSerie && l.numerosSerie.length > 0) && (
                        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#1C3177]" />
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                Unidades Físicas que se Registrarán con Placa UOD y Código QR
                              </h4>
                            </div>
                            <span className="text-[11px] font-bold text-[#1C3177]">
                              {simulacion.lineas.reduce((acc, l) => acc + (l.numerosSerie?.length || 0), 0)} unidades individuales
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                            {simulacion.lineas.flatMap(l =>
                              (l.numerosSerie || []).map((serie, sIdx) => {
                                const placa = l.placasSugeridas?.[sIdx] || 'EQ-Consecutiva';
                                return (
                                  <div
                                    key={`${l.recursoId}-${sIdx}`}
                                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[#1C3177] font-mono text-[11px]">
                                        {placa}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[#2D8246] font-bold text-[10px]">
                                        QR Listo
                                      </span>
                                    </div>
                                    <div className="font-semibold text-slate-800 truncate" title={l.recursoNombre}>
                                      {l.recursoNombre}
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-500">
                                      Serie: <span className="font-bold text-slate-700">{serie}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      Destino: {ubicaciones.find(u => u.id === destinoUbicacionId)?.nombre || 'UOD'}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Acciones de Confirmación Final */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Modificar Líneas</span>
                    </button>

                    <button
                      type="button"
                      disabled={!simulacion?.esValido || guardando}
                      onClick={handleConfirmarMovimiento}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        simulacion?.esValido && !guardando
                          ? 'bg-[#3DAA5C] hover:bg-[#2D8246] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {guardando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Asentando Transacción...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Confirmar y Ejecutar {tipo === 'entrada' ? 'Entrada' : 'Movimiento'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 3. Pestaña HISTORIAL: Bitácora de Movimientos Pasados */}
      {activeTab === 'historial' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          {/* Header de la Bitácora y Botón Exportar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#1C3177]" />
                Bitácora Transaccional Inmutable (Ley 172-13)
              </h3>
              <p className="text-[11px] text-slate-500">
                Historial cronológico de todos los movimientos y ajustes asentados en el inventario institucional.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportarCsv}
                disabled={exportandoCsv || loadingHistorial}
                className="px-3.5 py-2 bg-emerald-50 text-[#2D8246] hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
                title="Descargar movimientos filtrados en formato CSV compatible con Microsoft Excel"
              >
                {exportandoCsv ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#2D8246]" />
                ) : (
                  <Download className="w-4 h-4 text-[#2D8246]" />
                )}
                <span>{exportandoCsv ? 'Exportando...' : 'Exportar CSV'}</span>
              </button>

              {(historialBusqueda || historialTipoFiltro !== 'todos' || historialUbicacionFiltro || historialFechaDesde || historialFechaHasta) && (
                <button
                  type="button"
                  onClick={handleLimpiarFiltrosHistorial}
                  className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Barra de Filtros Combinables */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Input de Búsqueda */}
            <div className="relative md:col-span-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historialBusqueda}
                onChange={e => setHistorialBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cargarHistorial(1)}
                placeholder="Buscar por correlativo MOV, motivo..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
              />
            </div>

            {/* Selector de Ubicación */}
            <div className="md:col-span-3">
              <select
                value={historialUbicacionFiltro}
                onChange={e => setHistorialUbicacionFiltro(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] bg-white"
              >
                <option value="">Todas las ubicaciones ({ubicaciones.reduce((acc, u) => acc + (u.totalActivosFisicos || 0), 0)})</option>
                {ubicaciones.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.totalActivosFisicos})
                  </option>
                ))}
              </select>
            </div>

            {/* Rango de Fechas */}
            <div className="md:col-span-5 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={historialFechaDesde}
                  onChange={e => setHistorialFechaDesde(e.target.value)}
                  title="Fecha inicial"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                />
              </div>
              <span className="text-slate-400 text-xs">a</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={historialFechaHasta}
                  onChange={e => setHistorialFechaHasta(e.target.value)}
                  title="Fecha final"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                />
              </div>
            </div>
          </div>

          {/* Chips de filtro por tipo de movimiento */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['todos', 'entrada', 'salida', 'traslado', 'ajuste', 'devolucion', 'baja'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setHistorialTipoFiltro(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  historialTipoFiltro === t
                    ? 'bg-[#1C3177] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tabla de Historial */}
          {loadingHistorial ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1C3177]" />
              <p className="text-xs font-medium">Cargando bitácora de movimientos...</p>
            </div>
          ) : historialMovimientos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Clock className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-xs font-medium">No se encontraron movimientos registrados con los filtros aplicados.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Correlativo</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Ruta</th>
                      <th className="py-2.5 px-3">Líneas / Uds</th>
                      <th className="py-2.5 px-3">Total DOP</th>
                      <th className="py-2.5 px-3">Responsable</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historialMovimientos.map(m => {
                      const cfg = TIPOS_CONFIG[m.tipo] || TIPOS_CONFIG.traslado;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-mono font-bold text-[#1C3177]">
                            {m.numeroMovimiento}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bgLight} ${cfg.textColor}`}>
                              {cfg.icon}
                              <span className="capitalize">{m.tipo}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {m.origenUbicacionNombre || 'Externo'} → {m.destinoUbicacionNombre || 'Externo'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {m.totalLineas} artículos ({m.totalUnidades} uds)
                          </td>
                          <td className="py-3 px-3 font-bold text-[#2D8246]">
                            ${m.costoTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {m.usuarioNombre}
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(m.creadoEn).toLocaleDateString('es-DO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedHistorialMov(m)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#1C3177] hover:bg-slate-100 transition-colors"
                              title="Ver detalle de líneas"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Total: {historialTotalCount} movimientos registrados</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={historialPage <= 1}
                    onClick={() => cargarHistorial(historialPage - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-slate-700">
                    Página {historialPage} de {historialTotalPages || 1}
                  </span>
                  <button
                    type="button"
                    disabled={historialPage >= historialTotalPages}
                    onClick={() => cargarHistorial(historialPage + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Drawer de Detalle de Movimiento Histórico */}
      {selectedHistorialMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1C3177]" />
                  Comprobante: {selectedHistorialMov.numeroMovimiento}
                </h3>
                <span className="text-[11px] text-slate-500 capitalize">
                  Movimiento de tipo {selectedHistorialMov.tipo} • Ley 172-13
                </span>
              </div>
              <button
                onClick={() => setSelectedHistorialMov(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Origen:</span>
                  <span className="font-bold text-slate-900">{selectedHistorialMov.origenUbicacionNombre || 'Externo'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Destino:</span>
                  <span className="font-bold text-slate-900">{selectedHistorialMov.destinoUbicacionNombre || 'Externo'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Usuario:</span>
                  <span className="font-bold text-slate-900">{selectedHistorialMov.usuarioNombre}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha UTC:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedHistorialMov.creadoEn).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1 font-semibold">Motivo registrado:</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                  {selectedHistorialMov.motivo}
                </p>
              </div>

              {selectedHistorialMov.comprobanteUrl && (
                <div>
                  <span className="text-slate-500 block mb-1 font-semibold">Comprobante de soporte:</span>
                  <span className="font-mono text-[11px] text-[#1C3177] bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                    {selectedHistorialMov.comprobanteUrl}
                  </span>
                </div>
              )}

              {/* Detalle de Líneas */}
              <div className="space-y-2 pt-2">
                <span className="text-slate-700 font-bold block">
                  Artículos del Movimiento ({selectedHistorialMov.lineas.length})
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Artículo / SKU</th>
                        <th className="py-2 px-3">Cantidad</th>
                        <th className="py-2 px-3">Costo Unit.</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedHistorialMov.lineas.map(l => (
                        <tr key={l.id}>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900 block">{l.recursoNombre}</span>
                            <span className="font-mono text-[10px] text-[#1C3177]">{l.recursoSku}</span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {l.cantidad} {l.unidadMedida}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            ${l.costoUnitario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 font-bold text-[#2D8246] text-right">
                            ${l.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setSelectedHistorialMov(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escáner de Códigos Integrado */}
      <CameraScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelectResource={handleRecursoEscaneado}
        onOpenResourceDetail={onOpenResourceDetail}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-xs text-slate-900 font-semibold shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <Info className="h-4 w-4 text-[#1C3177] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
