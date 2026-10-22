'use client';

import React from 'react';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Sparkles,
  Eye,
  Pencil,
  Trash2,
  TrendingUp,
  ChevronRight,
  Cpu,
  Building2,
  HardDrive,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { ArticuloItem, MovimientoItem } from '@/lib/initialData';
import { RESUMEN_INVENTARIO } from '@/lib/inventoryData';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  articulos: ArticuloItem[];
  movimientos: MovimientoItem[];
  onOpenAi: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  articulos,
  movimientos,
  onOpenAi,
  onNavigateTab
}) => {
  return (
    <div className="space-y-6">
      {/* 6 Top KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigateTab('activos')}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 relative overflow-hidden shadow-xs hover:border-[#1C3177]/40 hover:shadow-md transition-all cursor-pointer group"
          title="Ver todos los activos TI"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium group-hover:text-[#1C3177] transition-colors">Total Equipos</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#1C3177] flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{RESUMEN_INVENTARIO.totalEquipos}</div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Activos TI levantados</span>
            <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-[#1C3177] transition-colors" />
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigateTab('activos')}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 relative overflow-hidden shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
          title="Ver activos en uso operativo"
        >
          <div className="flex items-center justify-between text-xs text-[#2D8246] mb-1">
            <span className="font-semibold">En Uso Operativo</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-[#2D8246] flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#2D8246] tracking-tight">{RESUMEN_INVENTARIO.enUso}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center justify-between">
            <span>98.8% en asignación</span>
            <ChevronRight className="h-3 w-3 text-[#2D8246]/60 group-hover:text-[#2D8246] transition-colors" />
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateTab('activos')}
          className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 relative overflow-hidden shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
          title="Ver equipos disponibles en almacén"
        >
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
            <span className="font-semibold">En Almacén</span>
            <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 group-hover:scale-105 transition-transform">
              <HardDrive className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-800 tracking-tight">{RESUMEN_INVENTARIO.enAlmacen}</div>
          <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Disponible reserva</span>
            <ChevronRight className="h-3 w-3 text-amber-600/60 group-hover:text-amber-700 transition-colors" />
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateTab('mantenimiento')}
          className="rounded-2xl border border-rose-200 bg-rose-50/30 p-4 relative overflow-hidden shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
          title="Ver equipos en mantenimiento o revisión"
        >
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span className="font-medium">Requieren Revisión</span>
            <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 tracking-tight">{RESUMEN_INVENTARIO.danadosOInactivos}</div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Inactivos / Dañados</span>
            <ChevronRight className="h-3 w-3 text-rose-400 group-hover:text-rose-600 transition-colors" />
          </div>
        </div>

        {/* Metric 5 */}
        <div
          onClick={() => onNavigateTab('ubicaciones')}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 relative overflow-hidden shadow-xs hover:border-[#1C3177]/40 hover:shadow-md transition-all cursor-pointer group"
          title="Ver las dependencias y clínicas UOD"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium group-hover:text-[#1C3177] transition-colors">Ubicaciones UOD</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#1C3177] flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{RESUMEN_INVENTARIO.totalUbicaciones}</div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Clínicas y dependencias</span>
            <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-[#1C3177] transition-colors" />
          </div>
        </div>

        {/* Metric 6: AI Prediction Card */}
        <div
          onClick={onOpenAi}
          className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/60 p-4 relative overflow-hidden shadow-xs hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group"
          title="Abrir Asistente IA"
        >
          <div className="flex items-center justify-between text-xs text-[#0891B2] mb-1">
            <span className="font-bold flex items-center gap-1 group-hover:text-[#06B6D4] transition-colors">
              <Sparkles className="h-3 w-3 text-[#06B6D4]" />
              Auditor IA
            </span>
            <span className="text-[10px] bg-cyan-100 text-[#0891B2] px-1.5 py-0.5 rounded-full font-bold border border-cyan-200">
              Activo
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 tracking-tight mt-1">
            Levantamiento Verificado
          </div>
          <div className="mt-1 text-[11px] text-slate-600 font-medium flex items-center justify-between">
            <span>100% de placas identificadas</span>
            <ChevronRight className="h-3 w-3 text-[#0891B2]/60 group-hover:text-[#0891B2] transition-colors" />
          </div>
        </div>
      </div>

      {/* 3 Visual Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Chart 1: Donut Categorías de Equipos TI */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Distribución de Activos TI</span>
            <span className="text-[11px] text-slate-400 font-medium">Proporción</span>
          </h3>

          <div className="flex items-center justify-center my-3 relative">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="16" />
              {/* Periféricos (43%) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3DAA5C" strokeWidth="16" strokeDasharray="102 238" strokeDashoffset="0" />
              {/* Computación (15%) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1C3177" strokeWidth="16" strokeDasharray="36 238" strokeDashoffset="-102" />
              {/* Monitores (14%) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06B6D4" strokeWidth="16" strokeDasharray="33 238" strokeDashoffset="-138" />
              {/* UPS (13%) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" strokeWidth="16" strokeDasharray="31 238" strokeDashoffset="-171" />
              {/* Redes y Teléfonos (10%) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#6366F1" strokeWidth="16" strokeDasharray="24 238" strokeDashoffset="-202" />
              {/* Impresión (7%) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8B5CF6" strokeWidth="16" strokeDasharray="17 238" strokeDashoffset="-226" />
            </svg>
            <div className="absolute text-center">
              <div className="text-xl font-bold text-slate-900">341</div>
              <div className="text-[10px] text-slate-500 font-medium">Equipos</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3DAA5C]" />
              <span>Periféricos (146)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1C3177]" />
              <span>Computación (51)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#06B6D4]" />
              <span>Monitores (48)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              <span>UPS Energía (44)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" />
              <span>Telefonía (31)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
              <span>Impresoras (25)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Top Dependencias con más Activos */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Top Dependencias con más Equipos</span>
              <span className="text-[10px] font-medium text-slate-400">Levantamiento</span>
            </h3>

            <div className="space-y-2.5 mt-2">
              {[
                { name: 'Tecnología', count: 24, max: 24, color: 'bg-[#1C3177]' },
                { name: 'Vicerrectora Administrativa', count: 11, max: 24, color: 'bg-[#2B4BA0]' },
                { name: 'Contabilidad Directora', count: 11, max: 24, color: 'bg-[#3DAA5C]' },
                { name: 'Directora de Clínica', count: 10, max: 24, color: 'bg-[#2D8246]' },
                { name: 'Director de Postgrado', count: 10, max: 24, color: 'bg-[#06B6D4]' },
                { name: 'Panorámica', count: 10, max: 24, color: 'bg-[#F59E0B]' }
              ].map((dep, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium text-slate-700">{dep.name}</span>
                    <span className="font-bold text-slate-900">{dep.count} un.</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dep.color}`}
                      style={{ width: `${(dep.count / dep.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ubicaciones')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-[#1C3177] hover:underline flex items-center justify-between w-full cursor-pointer"
          >
            <span>Ver las 49 dependencias</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Chart 3: Auditoría y Resumen de Estado */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Estado Físico de Activos</span>
              <span className="text-[10px] bg-emerald-50 text-[#2D8246] px-1.5 py-0.5 rounded font-bold">Auditado</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2 mt-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Operatividad global:</span>
                <span className="font-bold text-[#2D8246]">98.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Equipos identificados:</span>
                <span className="font-bold text-slate-800">341 de 341</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cambios registrados:</span>
                <span className="font-bold text-slate-800">1 equipo (EQ-324)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Última actualización:</span>
                <span className="font-medium text-slate-700">Octubre 2026</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl border border-blue-100 bg-blue-50/40 text-xs">
              <div className="font-semibold text-[#1C3177] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#06B6D4]" />
                Siguiente Paso del Sistema
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Conectar la sesión de usuario para asignar custodios y generar códigos QR para cada equipo desde la app.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('catalogo')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-[#3DAA5C] hover:underline flex items-center justify-between w-full cursor-pointer"
          >
            <span>Explorar catálogo completo (113 modelos)</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Recent Movements Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Movimientos y Asignaciones Recientes</h3>
            <p className="text-[11px] text-slate-500">Trazabilidad de equipos y responsables en dependencias UOD.</p>
          </div>
          <button
            onClick={() => onNavigateTab('movimientos')}
            className="text-xs font-bold text-[#1C3177] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ver historial completo <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px]">
                <th className="py-2.5 px-3">Código Movimiento</th>
                <th className="py-2.5 px-3">Activo TI</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Destino / Dependencia</th>
                <th className="py-2.5 px-3">Responsable</th>
                <th className="py-2.5 px-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.slice(0, 6).map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{mov.numero}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{mov.articuloNombre}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1C3177] border border-blue-200">
                      Asignación
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{mov.destino || 'Clínica UOD'}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{mov.usuario}</td>
                  <td className="py-2.5 px-3 text-slate-500">{mov.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
