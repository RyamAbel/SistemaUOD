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
      {/* 6 Top KPI Metrics Matching Screenshot Exactly */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Artículos</span>
            <div className="h-6 w-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">1,500</div>
          <div className="mt-1 text-[10px] text-slate-500">Unidades registradas</div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stock Bajo</span>
            <div className="h-6 w-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">35</div>
          <div className="mt-1 text-[10px] text-rose-400/80">Requieren reorden</div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Entradas Hoy</span>
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">50</div>
          <div className="mt-1 text-[10px] text-slate-500">Recepción proveedores</div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Salidas Hoy</span>
            <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">42</div>
          <div className="mt-1 text-[10px] text-slate-500">Entregas a clínicas</div>
        </div>

        {/* Metric 5 */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Valor Inventariado</span>
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CircleDollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">$250,000</div>
          <div className="mt-1 text-[10px] text-slate-500">Valoración total activa</div>
        </div>

        {/* Metric 6: AI Prediction Card with Gold accents */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/60 to-slate-900 p-4 relative overflow-hidden shadow-md shadow-blue-950/50">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Predicción IA
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
              Q4
            </span>
          </div>
          <div className="text-sm font-bold text-white tracking-tight mt-1">
            Demanda Alta en 3 Meses
          </div>
          <div className="mt-1 text-[10px] text-blue-200">
            Aumento proyectado del 18%
          </div>
        </div>
      </div>

      {/* 3 Visual Analytics Charts (Donut, Multi-Bar, AI Wave Chart) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart 1: Donut Categorías de Equipos */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/70 p-5">
          <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center justify-between">
            <span>Categorías de Equipos</span>
            <span className="text-[10px] text-slate-500">Proporción</span>
          </h3>

          <div className="flex items-center justify-center my-3 relative">
            {/* SVG Donut */}
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1e293b" strokeWidth="16" />
              {/* Segment 1: Implantes (Emerald) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="95 238" strokeDashoffset="0" />
              {/* Segment 2: Instrumental (Cyan) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06b6d4" strokeWidth="16" strokeDasharray="65 238" strokeDashoffset="-95" />
              {/* Segment 3: Biomateriales (Indigo) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#4f46e5" strokeWidth="16" strokeDasharray="50 238" strokeDashoffset="-160" />
              {/* Segment 4: Equipos Mayores (Amber) */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="28 238" strokeDashoffset="-210" />
            </svg>
            <div className="absolute text-center">
              <div className="text-lg font-bold text-white">100%</div>
              <div className="text-[9px] text-slate-400">Total</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Implantes (40%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Instrumental (28%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>Biomaterial (20%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Equipos (12%)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Movimientos Mensuales */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/70 p-5">
          <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center justify-between">
            <span>Movimientos Mensuales</span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Entradas
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Salidas
              </span>
            </div>
          </h3>

          {/* Bar Chart Bars */}
          <div className="h-40 flex items-end justify-between gap-1 pt-6 px-2">
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
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  <div
                    style={{ height: `${bar.e}%` }}
                    className="w-1.5 bg-emerald-400/80 rounded-t-sm group-hover:bg-emerald-300 transition-all"
                    title={`Entradas: ${bar.e}`}
                  />
                  <div
                    style={{ height: `${bar.s}%` }}
                    className="w-1.5 bg-cyan-400/80 rounded-t-sm group-hover:bg-cyan-300 transition-all"
                    title={`Salidas: ${bar.s}`}
                  />
                </div>
                <span className="text-[8px] text-slate-500 font-mono">{bar.m[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: AI Demand Prediction Area Chart */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/70 p-5">
          <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              AI Demand Prediction
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">+18.4%</span>
          </h3>
          <p className="text-[10px] text-slate-400 mb-4">Pronóstico para insumos clínicos Q4</p>

          <div className="h-40 relative flex items-end">
            {/* SVG Wave */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,80 Q40,40 80,65 T160,35 T240,50 T300,15 L300,120 L0,120 Z"
                fill="url(#aiGrad)"
              />
              <path
                d="M0,80 Q40,40 80,65 T160,35 T240,50 T300,15"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
              {/* Prediction dashed continuation */}
              <circle cx="300" cy="15" r="4" fill="#f59e0b" className="animate-ping" />
              <circle cx="300" cy="15" r="3" fill="#f59e0b" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-800">
            <span>Histórico validado</span>
            <span className="text-amber-300 font-medium">Proyección asistida por Gemini</span>
          </div>
        </div>
      </div>

      {/* Table: Inventario Reciente Matching Screenshot */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Inventario Reciente
          </h3>
          <button
            onClick={() => onNavigateTab('catalogo')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            Ver catálogo completo <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Código</th>
                <th className="py-3 px-4 font-semibold">Nombre</th>
                <th className="py-3 px-4 font-semibold">Categoría</th>
                <th className="py-3 px-4 font-semibold">Ubicación</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {[
                {
                  code: '0080001',
                  nombre: 'Resina Compuesta A2 (Filtek Z250)',
                  cat: 'Biomateriales',
                  ubic: 'Clínica Principal',
                  stock: '1,500',
                  status: 'En Stock',
                  statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                },
                {
                  code: '0080002',
                  nombre: 'Implante Titanio Grado 5 (3.75x10mm)',
                  cat: 'Implantes',
                  ubic: 'Almacén Central',
                  stock: '35',
                  status: 'Stock Bajo',
                  statusColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                },
                {
                  code: '0080003',
                  nombre: 'Anestésico Local Mepivacaína 2%',
                  cat: 'Farmacología',
                  ubic: 'Clínica Este',
                  stock: '50',
                  status: 'Stock Bajo',
                  statusColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                },
                {
                  code: '0080004',
                  nombre: 'Pasta Profilaxis con Flúor (Caja 200u)',
                  cat: 'Prevención',
                  ubic: 'Clínica Este',
                  stock: '0',
                  status: 'Out of Stock',
                  statusColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{row.code}</td>
                  <td className="py-3 px-4 font-semibold text-white">{row.nombre}</td>
                  <td className="py-3 px-4 text-slate-400">{row.cat}</td>
                  <td className="py-3 px-4 text-slate-300">{row.ubic}</td>
                  <td className="py-3 px-4 font-bold text-white">{row.stock}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button className="p-1 hover:text-white transition-colors" title="Ver detalle">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1 hover:text-amber-400 transition-colors" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1 hover:text-rose-400 transition-colors" title="Eliminar">
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
