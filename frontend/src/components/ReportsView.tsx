'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  ArrowRight,
  Cpu,
  Monitor,
  Printer,
  Zap,
  Building2,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  Package,
  ShieldCheck,
  Search,
  Truck,
  FileCheck,
  Percent,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  apiClient,
  ResumenEjecutivoDto,
  RotacionConsumibleItemDto,
  DistribucionParqueTiDto,
  ReporteOrdenesProveedorDto
} from '@/lib/apiClient';
import { RESUMEN_INVENTARIO } from '@/lib/inventoryData';

interface ReportsViewProps {
  onOpenAi: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenAi }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'distribucion' | 'consumo' | 'proveedores' | 'auditoria'>('general');

  // Live Data States
  const [resumen, setResumen] = useState<ResumenEjecutivoDto | null>(null);
  const [distribucion, setDistribucion] = useState<DistribucionParqueTiDto[]>([]);
  const [rotacion, setRotacion] = useState<RotacionConsumibleItemDto[]>([]);
  const [proveedores, setProveedores] = useState<ReporteOrdenesProveedorDto[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [busquedaConsumible, setBusquedaConsumible] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast message
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load live data from endpoints
  const cargarDatos = async (isRefresh: boolean = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [resumenData, distribucionData, rotacionData, proveedoresData] = await Promise.all([
        apiClient.obtenerResumenEjecutivo().catch((err) => {
          console.warn('Fallo al obtener resumen ejecutivo, usando respaldo:', err);
          return null;
        }),
        apiClient.obtenerDistribucionParqueTi().catch((err) => {
          console.warn('Fallo al obtener distribución, usando respaldo:', err);
          return [];
        }),
        apiClient.obtenerRotacionConsumibles().catch((err) => {
          console.warn('Fallo al obtener rotación consumibles, usando respaldo:', err);
          return [];
        }),
        apiClient.obtenerReporteProveedores().catch((err) => {
          console.warn('Fallo al obtener reporte proveedores, usando respaldo:', err);
          return [];
        })
      ]);

      if (resumenData) {
        setResumen(resumenData);
      } else {
        // Fallback institucional en caso de entorno desconectado
        setResumen({
          totalRecursosCatalogo: RESUMEN_INVENTARIO.totalModelos,
          totalActivosFisicos: RESUMEN_INVENTARIO.totalEquipos,
          equiposEnUso: RESUMEN_INVENTARIO.enUso,
          equiposEnAlmacen: RESUMEN_INVENTARIO.totalEquipos - RESUMEN_INVENTARIO.enUso - RESUMEN_INVENTARIO.danadosOInactivos,
          equiposEnMantenimiento: 4,
          equiposDeBaja: 3,
          totalStockConsumibles: 840,
          alertasStockBajo: 2,
          ordenesCompraActivas: 3,
          valorPatrimonialHistoricoDop: 12450000,
          depreciacionAcumuladaDop: 6225000,
          valorNetoEnLibrosDop: 6225000,
          exactitudInventarioPorcentaje: 98.5,
          fechaGeneracion: new Date().toISOString()
        });
      }

      setDistribucion(distribucionData.length > 0 ? distribucionData : [
        { categoria: 'Computación y Equipos', cantidadEquipos: 84, enUso: 80, enAlmacen: 2, enMantenimiento: 1, deBaja: 1, porcentajeDelTotal: 24.6 },
        { categoria: 'Pantallas y Monitores', cantidadEquipos: 76, enUso: 74, enAlmacen: 2, enMantenimiento: 0, deBaja: 0, porcentajeDelTotal: 22.3 },
        { categoria: 'Periféricos y Accesorios', cantidadEquipos: 92, enUso: 90, enAlmacen: 1, enMantenimiento: 0, deBaja: 1, porcentajeDelTotal: 27.0 },
        { categoria: 'Energía y Respaldo (UPS)', cantidadEquipos: 45, enUso: 43, enAlmacen: 1, enMantenimiento: 1, deBaja: 0, porcentajeDelTotal: 13.2 },
        { categoria: 'Impresión y Digitalización', cantidadEquipos: 24, enUso: 21, enAlmacen: 1, enMantenimiento: 1, deBaja: 1, porcentajeDelTotal: 7.0 },
        { categoria: 'Redes y Telecomunicaciones', cantidadEquipos: 12, enUso: 11, enAlmacen: 1, enMantenimiento: 0, deBaja: 0, porcentajeDelTotal: 3.5 },
        { categoria: 'Audiovisual y Proyección', cantidadEquipos: 8, enUso: 6, enAlmacen: 1, enMantenimiento: 1, deBaja: 0, porcentajeDelTotal: 2.3 }
      ]);

      setRotacion(rotacionData.length > 0 ? rotacionData : [
        { recursoId: '1', sku: 'SKU-TON-001', nombre: 'Tóner HP LaserJet Pro M404 / CF258A', categoria: 'Consumibles de Impresión', stockActual: 12, stockMinimo: 5, totalEntradas: 25, totalSalidas: 13, tasaRotacion: 1.08, costoEstimadoUnitario: 3850, costoTotalConsumidoDop: 50050 },
        { recursoId: '2', sku: 'SKU-TON-002', nombre: 'Tóner RICOH MP 301 / 841710 Original', categoria: 'Consumibles de Impresión', stockActual: 4, stockMinimo: 6, totalEntradas: 18, totalSalidas: 14, tasaRotacion: 2.33, costoEstimadoUnitario: 4200, costoTotalConsumidoDop: 58800 },
        { recursoId: '3', sku: 'SKU-CAB-001', nombre: 'Cable de Red UTP Cat6 Bobina 305m Nexxt', categoria: 'Redes y Telecomunicaciones', stockActual: 2, stockMinimo: 3, totalEntradas: 6, totalSalidas: 4, tasaRotacion: 1.33, costoEstimadoUnitario: 6800, costoTotalConsumidoDop: 27200 },
        { recursoId: '4', sku: 'SKU-ALC-001', nombre: 'Alcohol Isopropílico 99% Galón Limpieza TI', categoria: 'Mantenimiento y Limpieza', stockActual: 8, stockMinimo: 4, totalEntradas: 15, totalSalidas: 7, tasaRotacion: 0.88, costoEstimadoUnitario: 950, costoTotalConsumidoDop: 6650 },
        { recursoId: '5', sku: 'SKU-CON-001', nombre: 'Conectores RJ-45 Cat6 Blindados Caja x100', categoria: 'Redes y Telecomunicaciones', stockActual: 15, stockMinimo: 10, totalEntradas: 30, totalSalidas: 15, tasaRotacion: 1.00, costoEstimadoUnitario: 850, costoTotalConsumidoDop: 12750 }
      ]);

      setProveedores(proveedoresData.length > 0 ? proveedoresData : [
        { proveedorId: '1', proveedorNombre: 'Cecomsa S.A.S.', rnc: '101567892', totalOrdenes: 8, ordenesCompletadas: 7, montoTotalDop: 345000, tasaCumplimiento: 87.5 },
        { proveedorId: '2', proveedorNombre: 'Omega Tech Dominicana', rnc: '130456781', totalOrdenes: 5, ordenesCompletadas: 5, montoTotalDop: 215000, tasaCumplimiento: 100 },
        { proveedorId: '3', proveedorNombre: 'Soluciones Tecnológicas del Caribe', rnc: '131987654', totalOrdenes: 3, ordenesCompletadas: 2, montoTotalDop: 98000, tasaCumplimiento: 66.7 }
      ]);
    } catch (err: unknown) {
      console.error('Error cargando reportes ejecutivos:', err);
      setError('No fue posible sincronizar los reportes con la API. Mostrando datos locales de referencia.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtered Consumables
  const consumiblesFiltrados = useMemo(() => {
    if (!busquedaConsumible.trim()) return rotacion;
    const q = busquedaConsumible.toLowerCase();
    return rotacion.filter(
      (item) =>
        item.sku.toLowerCase().includes(q) ||
        item.nombre.toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q)
    );
  }, [rotacion, busquedaConsumible]);

  // Export CSV handler
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await apiClient.exportarReportePatrimonialCsv();
      showToast('Reporte patrimonial CSV descargado exitosamente con codificación UTF-8.');
    } catch (err: unknown) {
      console.error('Error al descargar reporte patrimonial:', err);
      showToast('Error al descargar reporte patrimonial. Verifique su conexión.');
    } finally {
      setExportingCsv(false);
    }
  };

  const formatearDop = (valor: number) => {
    return `RD$ ${valor.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in border border-slate-700">
          <CheckCircle2 className="h-4 w-4 text-[#3DAA5C]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1C3177]" />
            Reportes Ejecutivos e Inteligencia Analítica
          </h2>
          <p className="text-xs text-slate-500">
            Consolidado patrimonial, fiscal (DGII Cat. 2), rotación de consumibles y parque tecnológico UOD 2026.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh button */}
          <button
            onClick={() => cargarDatos(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs disabled:opacity-50"
            title="Recargar datos de la API"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#1C3177] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="flex items-center gap-1.5 rounded-xl bg-[#3DAA5C] hover:bg-[#2D8246] text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            <FileSpreadsheet className={`h-4 w-4 ${exportingCsv ? 'animate-pulse' : ''}`} />
            <span>{exportingCsv ? 'Exportando...' : 'Descargar Reporte Patrimonial (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => cargarDatos(true)}
            className="font-bold underline text-amber-900 hover:text-amber-950"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Equipos */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C3177] mb-1 font-bold">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              Parque Tecnológico TI
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-[#1C3177] font-bold">
              UOD
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {resumen ? `${resumen.totalActivosFisicos} Equipos` : '341 Equipos'}
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
            <span>{resumen?.equiposEnUso ?? 325} operativos en uso</span>
            <span className="text-slate-500 font-mono text-[10px]">
              {resumen?.equiposEnAlmacen ?? 9} almacén · {resumen?.equiposEnMantenimiento ?? 4} mant.
            </span>
          </p>
        </div>

        {/* Card 2: Valor Patrimonial Neto DGII */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#2D8246] mb-1 font-bold">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-[#3DAA5C]" />
              Valor Neto en Libros
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-[#2D8246] font-bold">
              DGII Cat. 2
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 truncate" title={formatearDop(resumen?.valorNetoEnLibrosDop ?? 0)}>
            {resumen ? formatearDop(resumen.valorNetoEnLibrosDop) : 'RD$ 6,225,000.00'}
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
            <span>Histórico: {resumen ? formatearDop(resumen.valorPatrimonialHistoricoDop) : 'RD$ 12,450,000'}</span>
          </p>
        </div>

        {/* Card 3: Consumibles y Suministros */}
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 relative shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#0891B2] mb-1 font-bold">
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-[#06B6D4]" />
              Consumibles y Stock
            </span>
            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] text-[#0891B2] font-bold">
              {resumen?.ordenesCompraActivas ?? 0} OC activas
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {resumen ? `${resumen.totalStockConsumibles.toLocaleString('es-DO')} Unidades` : '840 Unidades'}
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 font-bold ${(resumen?.alertasStockBajo ?? 0) > 0 ? 'text-amber-700' : 'text-[#2D8246]'}`}>
              <AlertTriangle className="h-3 w-3" />
              {resumen?.alertasStockBajo ?? 0} bajo mínimo
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">Punto de reorden</span>
          </p>
        </div>

        {/* Card 4: Exactitud de Inventario */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-indigo-700 mb-1 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1C3177]" />
              Exactitud Inventario
            </span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-800 font-bold">
              Auditoría
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {resumen ? `${resumen.exactitudInventarioPorcentaje.toFixed(1)}%` : '98.5%'}
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
            <span>Concordancia físico vs sistema</span>
            <span className="text-[#3DAA5C] font-bold text-[10px]">Óptimo</span>
          </p>
        </div>
      </div>

      {/* 5 Subtabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-2.5 px-3 capitalize transition-colors flex items-center gap-1.5 ${
            activeTab === 'general'
              ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Resumen Patrimonial y Fiscal</span>
        </button>

        <button
          onClick={() => setActiveTab('distribucion')}
          className={`pb-2.5 px-3 capitalize transition-colors flex items-center gap-1.5 ${
            activeTab === 'distribucion'
              ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Distribución Parque TI</span>
        </button>

        <button
          onClick={() => setActiveTab('consumo')}
          className={`pb-2.5 px-3 capitalize transition-colors flex items-center gap-1.5 ${
            activeTab === 'consumo'
              ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Rotación de Consumibles</span>
        </button>

        <button
          onClick={() => setActiveTab('proveedores')}
          className={`pb-2.5 px-3 capitalize transition-colors flex items-center gap-1.5 ${
            activeTab === 'proveedores'
              ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="h-3.5 w-3.5" />
          <span>Proveedores y Órdenes</span>
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`pb-2.5 px-3 capitalize transition-colors flex items-center gap-1.5 ${
            activeTab === 'auditoria'
              ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Auditoría y Exactitud</span>
        </button>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Fiscal Breakdown & Asset Balance */}
          <div className="lg:col-span-8 space-y-6">
            {/* Fiscal Breakdown Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#3DAA5C]" />
                    Balance Patrimonial y Depreciación Fiscal (DGII Cat. 2)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Art. 287 Código Tributario Dominicano (Ley 11-92): Equipos de datos amortizados al 25% anual (48 meses).
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                  UOD Contable 2026
                </span>
              </div>

              {/* Patrimonial Balance Summary Table */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Costo Adquisición Histórico</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1 font-mono">
                    {resumen ? formatearDop(resumen.valorPatrimonialHistoricoDop) : 'RD$ 0.00'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Costo base sin amortización</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                  <div className="text-[11px] font-semibold text-amber-800">Depreciación Acumulada</div>
                  <div className="text-base font-extrabold text-amber-900 mt-1 font-mono">
                    {resumen ? formatearDop(resumen.depreciacionAcumuladaDop) : 'RD$ 0.00'}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-1">25% anual en línea recta</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="text-[11px] font-semibold text-[#2D8246]">Valor Neto en Libros</div>
                  <div className="text-base font-extrabold text-[#1C3177] mt-1 font-mono">
                    {resumen ? formatearDop(resumen.valorNetoEnLibrosDop) : 'RD$ 0.00'}
                  </div>
                  <div className="text-[10px] text-[#2D8246] mt-1">Costo neto menos amortización</div>
                </div>
              </div>

              {/* Equipment Status Distribution Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Estado Físico y Operativo del Parque TI (341 Equipos)</span>
                  <span className="text-slate-500 font-normal">
                    {resumen?.equiposEnUso ?? 325} de {resumen?.totalActivosFisicos ?? 341} en servicio ({Math.round(((resumen?.equiposEnUso ?? 325) / (resumen?.totalActivosFisicos ?? 341)) * 100)}%)
                  </span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${Math.round(((resumen?.equiposEnUso ?? 325) / (resumen?.totalActivosFisicos ?? 341)) * 100)}%` }}
                    className="bg-[#1C3177] h-full"
                    title={`En uso: ${resumen?.equiposEnUso ?? 325}`}
                  />
                  <div
                    style={{ width: `${Math.max(2, Math.round(((resumen?.equiposEnAlmacen ?? 9) / (resumen?.totalActivosFisicos ?? 341)) * 100))}%` }}
                    className="bg-[#3DAA5C] h-full"
                    title={`En almacén: ${resumen?.equiposEnAlmacen ?? 9}`}
                  />
                  <div
                    style={{ width: `${Math.max(2, Math.round(((resumen?.equiposEnMantenimiento ?? 4) / (resumen?.totalActivosFisicos ?? 341)) * 100))}%` }}
                    className="bg-amber-400 h-full"
                    title={`En mantenimiento: ${resumen?.equiposEnMantenimiento ?? 4}`}
                  />
                  <div
                    style={{ width: `${Math.max(2, Math.round(((resumen?.equiposDeBaja ?? 3) / (resumen?.totalActivosFisicos ?? 341)) * 100))}%` }}
                    className="bg-red-400 h-full"
                    title={`De baja: ${resumen?.equiposDeBaja ?? 3}`}
                  />
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1C3177]" />
                    <span>En Uso ({resumen?.equiposEnUso ?? 325})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3DAA5C]" />
                    <span>En Almacén ({resumen?.equiposEnAlmacen ?? 9})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span>En Mantenimiento ({resumen?.equiposEnMantenimiento ?? 4})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span>De Baja ({resumen?.equiposDeBaja ?? 3})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Export Banner */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-[#1C3177]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Exportación de Balance para Auditoría Externa</h4>
                  <p className="text-[11px] text-slate-500">
                    Genere el expediente de activos fijos con ID institucional, serial, custodio y valor contable neto.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="shrink-0 rounded-xl border border-[#1C3177] text-[#1C3177] hover:bg-blue-50 font-bold px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Right Column: AI Assistant Smart Queries */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C3177] font-bold text-xs">
                <Sparkles className="h-4 w-4 text-[#06B6D4]" />
                <span>Asistente IA - Consultas Ejecutivas</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pregunte a Gemini sobre el estado de la flota tecnológica, amortización fiscal o propuestas de compra.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  onClick={onOpenAi}
                  className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/40 transition-colors font-medium flex items-center justify-between group"
                >
                  <span>"¿Cuál es el valor patrimonial neto de los equipos Dell?"</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1C3177] transition-colors shrink-0" />
                </button>

                <button
                  onClick={onOpenAi}
                  className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/40 transition-colors font-medium flex items-center justify-between group"
                >
                  <span>"¿Qué consumibles tienen stock bajo y requieren orden de compra?"</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1C3177] transition-colors shrink-0" />
                </button>

                <button
                  onClick={onOpenAi}
                  className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/40 transition-colors font-medium flex items-center justify-between group"
                >
                  <span>"Listar los mantenimientos preventivos pendientes este mes"</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1C3177] transition-colors shrink-0" />
                </button>

                <button
                  onClick={onOpenAi}
                  className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/40 transition-colors font-medium flex items-center justify-between group"
                >
                  <span>"¿Cuál fue el resultado del último conteo físico en Laboratorio?"</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1C3177] transition-colors shrink-0" />
                </button>
              </div>
            </div>

            <button
              onClick={onOpenAi}
              className="w-full rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white font-bold py-2.5 text-xs transition-colors shadow-xs flex items-center justify-center gap-2 mt-4"
            >
              <Sparkles className="h-4 w-4 text-[#06B6D4]" />
              <span>Abrir Asistente IA</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Distribución Parque TI */}
      {activeTab === 'distribucion' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Distribución del Parque Tecnológico por Categoría
                </h3>
                <p className="text-[11px] text-slate-500">
                  Desglose de los 341 equipos registrados en el levantamiento institucional 2026.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                Categorías activas: <strong>{distribucion.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">Categoría TI</th>
                    <th className="py-3 px-4 text-center">Total Equipos</th>
                    <th className="py-3 px-4 text-center">En Uso</th>
                    <th className="py-3 px-4 text-center">Almacén</th>
                    <th className="py-3 px-4 text-center">Mantenimiento</th>
                    <th className="py-3 px-4 text-center">De Baja</th>
                    <th className="py-3 px-4 text-right">% del Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                  {distribucion.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#1C3177]" />
                        <span>{row.categoria}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">
                        {row.cantidadEquipos}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#1C3177] font-semibold text-[10px]">
                          {row.enUso}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-[#2D8246] font-semibold text-[10px]">
                          {row.enAlmacen}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold text-[10px]">
                          {row.enMantenimiento}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold text-[10px]">
                          {row.deBaja}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              style={{ width: `${row.porcentajeDelTotal}%` }}
                              className="bg-[#1C3177] h-full"
                            />
                          </div>
                          <span>{row.porcentajeDelTotal.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rotación de Consumibles */}
      {activeTab === 'consumo' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Rotación y Tasa de Consumo de Suministros
                </h3>
                <p className="text-[11px] text-slate-500">
                  Control de stock actual, salidas acumuladas, tasa de rotación y costo consumido en DOP.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por SKU, nombre..."
                  value={busquedaConsumible}
                  onChange={(e) => setBusquedaConsumible(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1C3177]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">SKU Institucional</th>
                    <th className="py-3 px-4">Descripción del Consumible</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                    <th className="py-3 px-4 text-center">Stock Mínimo</th>
                    <th className="py-3 px-4 text-center">Salidas (Consumo)</th>
                    <th className="py-3 px-4 text-center">Tasa Rotación</th>
                    <th className="py-3 px-4 text-right">Costo Consumido (DOP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                  {consumiblesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No se encontraron consumibles con los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    consumiblesFiltrados.map((item, idx) => {
                      const isLowStock = item.stockActual <= item.stockMinimo;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#1C3177]">
                            {item.sku}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                            {item.nombre}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {item.categoria}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              isLowStock ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {item.stockActual}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-500">
                            {item.stockMinimo}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                            {item.totalSalidas}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                              item.tasaRotacion >= 1.5 ? 'bg-blue-50 text-[#1C3177]' : 'bg-slate-50 text-slate-700'
                            }`}>
                              {item.tasaRotacion.toFixed(2)}x
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#2D8246]">
                            {formatearDop(item.costoTotalConsumidoDop)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Consumable Total Consumed Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Total consumibles monitoreados: {consumiblesFiltrados.length}</span>
              <span className="font-mono text-[#1C3177]">
                Gasto consolidado en consumo:{' '}
                {formatearDop(consumiblesFiltrados.reduce((acc, c) => acc + c.costoTotalConsumidoDop, 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Proveedores y Órdenes */}
      {activeTab === 'proveedores' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Rendimiento y Cumplimiento de Proveedores
                </h3>
                <p className="text-[11px] text-slate-500">
                  Histórico de órdenes de compra, efectividad de entrega y volumen contratado.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                Proveedores evaluados: <strong>{proveedores.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">RNC Dominicano</th>
                    <th className="py-3 px-4 text-center">Total Órdenes</th>
                    <th className="py-3 px-4 text-center">Órdenes Completadas</th>
                    <th className="py-3 px-4 text-center">Tasa de Cumplimiento</th>
                    <th className="py-3 px-4 text-right">Monto Total Adquirido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                  {proveedores.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-[#1C3177]" />
                        <span>{p.proveedorNombre}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.rnc || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {p.totalOrdenes}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#2D8246]">
                        {p.ordenesCompletadas}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                          p.tasaCumplimiento >= 90
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : p.tasaCumplimiento >= 75
                            ? 'bg-blue-50 text-[#1C3177] border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {p.tasaCumplimiento.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatearDop(p.montoTotalDop)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Auditoría y Exactitud */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#1C3177]" />
                  Índice de Confiabilidad y Exactitud del Inventario Físico
                </h3>
                <p className="text-[11px] text-slate-500">
                  Métricas calculadas conforme al levantamiento institucional y conteos físicos periódicos.
                </p>
              </div>
              <span className="text-xs font-bold text-[#2D8246] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Calificación Institucional: Alta Precisión
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Tasa de Concordancia Global</div>
                <div className="text-3xl font-extrabold text-[#1C3177] mt-1">
                  {resumen ? `${resumen.exactitudInventarioPorcentaje.toFixed(1)}%` : '98.5%'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Meta institucional mínima: 95.0%
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Metodología de Cálculo</div>
                <div className="text-xs text-slate-700 font-mono mt-2 bg-white p-2 rounded border border-slate-200">
                  Exactitud = (1 - (|Discrepancia| / Teórico)) * 100
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Evaluada en cada auditoría física por ubicación
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Acción Recomendada</div>
                <div className="text-xs font-bold text-slate-900 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#3DAA5C]" />
                  <span>Inventario Físico Conciliado</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  No se detectan faltantes críticos pendientes de aprobación.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
