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
  ChevronRight
} from 'lucide-react';
import { ArticuloItem, MovimientoItem } from '@/lib/initialData';

interface DashboardViewProps {
  articulos: ArticuloItem[];
  movimientos: MovimientoItem[];
  onOpenAi: () => void;
  onNavigateTab: (tab: any) => void;
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 relative overflow-hidden shadow-xs hover:border-[#1C3177]/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Total Artículos</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#1C3177] flex items-center justify-center border border-blue-100">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">1,500</div>
          <div className="mt-1 text-[11px] text-slate-500">Unidades registradas</div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 relative overflow-hidden shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span className="font-semibold">Stock Bajo</span>
            <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">35</div>
          <div className="mt-1 text-[11px] text-rose-700 font-medium">Requieren reorden</div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 relative overflow-hidden shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs text-[#2D8246] mb-1">
            <span className="font-semibold">Entradas Hoy</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-[#2D8246] flex items-center justify-center border border-emerald-200">
              <ArrowDownLeft className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#2D8246] tracking-tight">50</div>
          <div className="mt-1 text-[11px] text-slate-600">Recepción proveedores</div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 relative overflow-hidden shadow-xs hover:border-[#2B4BA0]/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Salidas Hoy</span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">42</div>
          <div className="mt-1 text-[11px] text-slate-500">Entregas a clínicas</div>
        </div>

        {/* Metric 5 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 relative overflow-hidden shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Valor Inventariado</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-[#3DAA5C] flex items-center justify-center border border-emerald-100">
              <CircleDollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">RD$ 14.2M</div>
          <div className="mt-1 text-[11px] text-slate-500">Valoración total activa</div>
        </div>

        {/* Metric 6: AI Prediction Card */}
        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/60 p-4 relative overflow-hidden shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-xs text-[#0891B2] mb-1">
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#06B6D4]" />
              Predicción IA
            </span>
            <span className="text-[10px] bg-cyan-100 text-[#0891B2] px-1.5 py-0.5 rounded-full font-bold border border-cyan-200">
              Q4
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 tracking-tight mt-1">
            Demanda Alta en 3 Meses
          </div>
          <div className="mt-1 text-[11px] text-slate-600 font-medium">
            Aumento proyectado del 18%
          </div>
        </div>
      </div>

      {/* 3 Visual Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Chart 1: Donut Categorías de Equipos */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Categorías de Equipos</span>
            <span className="text-[11px] text-slate-400 font-medium">Proporción</span>
          </h3>

          <div className="flex items-center justify-center my-3 relative">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="16" />
              {/* Implantes (Verde UOD #3DAA5C) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3DAA5C" strokeWidth="16" strokeDasharray="95 238" strokeDashoffset="0" />
              {/* Instrumental (Azul Marino #1C3177) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1C3177" strokeWidth="16" strokeDasharray="65 238" strokeDashoffset="-95" />
              {/* Biomateriales (Turquesa #06B6D4) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06B6D4" strokeWidth="16" strokeDasharray="50 238" strokeDashoffset="-160" />
              {/* Equipos Mayores (Ámbar #F59E0B) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" strokeWidth="16" strokeDasharray="28 238" strokeDashoffset="-210" />
            </svg>
            <div className="absolute text-center">
              <div className="text-lg font-bold text-slate-900">100%</div>
              <div className="text-[10px] text-slate-500 font-medium">Total</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-600 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3DAA5C]" />
              <span>Implantes (40%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1C3177]" />
              <span>Instrumental (28%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#06B6D4]" />
              <span>Biomaterial (20%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              <span>Equipos (12%)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Movimientos Mensuales */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Movimientos Mensuales</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-[#2D8246] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#3DAA5C]" /> Entradas
              </span>
              <span className="flex items-center gap-1 text-[#1C3177] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#1C3177]" /> Salidas
              </span>
            </div>
          </h3>

          {/* Bar Chart Bars */}
          <div className="h-40 flex items-end justify-between gap-1.5 pt-6 px-1">
            {[
              { m: 'Ene', e: 35, s: 20 },
              { m: 'Feb', e: 45, s: 30 },
              { m: 'Mar', e: 60, s: 50 },
              { m: 'Abr', e: 40, s: 35 },
              { m: 'May', e: 70, s: 55 },
              { m: 'Jun', e: 85, s: 70 },
              { m: 'Jul', e: 65, s: 60 },
              { m: 'Ago', e: 75, s: 65 },
              { m: 'Sep', e: 90, s: 80 },
              { m: 'Oct', e: 80, s: 75 },
              { m: 'Nov', e: 60, s: 50 },
              { m: 'Dic', e: 50, s: 40 }
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  <div
                    style={{ height: `${bar.e}%` }}
                    className="w-1.5 bg-[#3DAA5C] rounded-t-sm group-hover:bg-[#2D8246] transition-all"
                    title={`Entradas: ${bar.e}`}
                  />
                  <div
                    style={{ height: `${bar.s}%` }}
                    className="w-1.5 bg-[#1C3177] rounded-t-sm group-hover:bg-[#2B4BA0] transition-all"
                    title={`Salidas: ${bar.s}`}
                  />
                </div>
                <span className="text-[9px] text-slate-400 font-medium">{bar.m[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: AI Demand Prediction Area Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#0891B2]" />
              AI Demand Prediction
            </span>
            <span className="text-[11px] text-[#2D8246] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+18.4%</span>
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Pronóstico para insumos clínicos Q4</p>

          <div className="h-40 relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="aiGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,80 Q40,40 80,65 T160,35 T240,50 T300,15 L300,120 L0,120 Z"
                fill="url(#aiGradLight)"
              />
              <path
                d="M0,80 Q40,40 80,65 T160,35 T240,50 T300,15"
                fill="none"
                stroke="#0891B2"
                strokeWidth="2.5"
              />
              <circle cx="300" cy="15" r="4" fill="#F59E0B" className="animate-ping" />
              <circle cx="300" cy="15" r="3.5" fill="#F59E0B" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            <span>Histórico validado</span>
            <span className="text-[#1C3177] font-semibold">Proyección Gemini Flash</span>
          </div>
        </div>
      </div>

      {/* Table: Inventario Reciente */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Inventario Reciente
          </h3>
          <button
            onClick={() => onNavigateTab('catalogo')}
            className="text-xs text-[#1C3177] hover:text-[#2B4BA0] font-bold flex items-center gap-1 transition-colors"
          >
            Ver catálogo completo <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 font-bold">Código</th>
                <th className="py-3 px-4 font-bold">Nombre</th>
                <th className="py-3 px-4 font-bold">Categoría</th>
                <th className="py-3 px-4 font-bold">Ubicación</th>
                <th className="py-3 px-4 font-bold">Stock</th>
                <th className="py-3 px-4 font-bold">Estado</th>
                <th className="py-3 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[
                {
                  code: '0080001',
                  nombre: 'Resina Compuesta A2 (Filtek Z250)',
                  cat: 'Biomateriales',
                  ubic: 'Clínica Principal',
                  stock: '1,500',
                  status: 'En Stock',
                  statusColor: 'bg-emerald-50 text-[#2D8246] border-emerald-200'
                },
                {
                  code: '0080002',
                  nombre: 'Implante Titanio Grado 5 (3.75x10mm)',
                  cat: 'Implantes',
                  ubic: 'Almacén Central',
                  stock: '35',
                  status: 'Stock Bajo',
                  statusColor: 'bg-amber-50 text-amber-700 border-amber-200'
                },
                {
                  code: '0080003',
                  nombre: 'Anestésico Local Mepivacaína 2%',
                  cat: 'Farmacología',
                  ubic: 'Clínica Este',
                  stock: '50',
                  status: 'Stock Bajo',
                  statusColor: 'bg-amber-50 text-amber-700 border-amber-200'
                },
                {
                  code: '0080004',
                  nombre: 'Pasta Profilaxis con Flúor (Caja 200u)',
                  cat: 'Prevención',
                  ubic: 'Clínica Este',
                  stock: '0',
                  status: 'Agotado',
                  statusColor: 'bg-rose-50 text-rose-700 border-rose-200'
                }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 font-semibold">{row.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{row.nombre}</td>
                  <td className="py-3 px-4 text-slate-500">{row.cat}</td>
                  <td className="py-3 px-4 text-slate-700">{row.ubic}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{row.stock}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button className="p-1 hover:text-[#1C3177] transition-colors" title="Ver detalle" aria-label="Ver detalle">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1 hover:text-amber-600 transition-colors" title="Editar" aria-label="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1 hover:text-rose-600 transition-colors" title="Eliminar" aria-label="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
