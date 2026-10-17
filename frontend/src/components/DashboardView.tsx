'use client';

import React from 'react';
import {
  Package,
  TrendingDown,
  CircleDollarSign,
  Laptop,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Clock
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
  const articulosBajos = articulos.filter((a) => a.stockActual <= a.stockMinimo);
  const totalArticulos = articulos.reduce((acc, curr) => acc + curr.stockActual, 0);
  const valorTotalInventario = articulos.reduce(
    (acc, curr) => acc + curr.stockActual * curr.costoEstimado,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if low stock exists */}
      {articulosBajos.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Atención: {articulosBajos.length} artículos bajo el umbral de stock mínimo
              </h4>
              <p className="text-xs text-amber-300/80">
                Se recomienda reponer existencias para evitar desabastecimiento operativo.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAi}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
          >
            <Sparkles className="h-4 w-4" />
            Planificar Reposición con IA
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Artículos Totales */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Unidades en Stock</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalArticulos}</div>
          <p className="mt-1 text-[11px] text-slate-400">
            Distribuidos en {articulos.length} artículos del catálogo
          </p>
        </div>

        {/* KPI 2: Valor Estimado */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Valorización Estimada</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CircleDollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            RD$ {valorTotalInventario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Costo promedio según existencias</p>
        </div>

        {/* KPI 3: Stock Crítico */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Alertas de Stock Bajo</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {articulosBajos.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Requieren orden de compra próxima</p>
        </div>

        {/* KPI 4: Activos Fijos */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Activos en Custodia</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Laptop className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400 tracking-tight">24</div>
          <p className="mt-1 text-[11px] text-slate-400">Identificados con placa y serial</p>
        </div>
      </div>

      {/* Main Grid: Artículos en Alerta & Movimientos Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Artículos Críticos */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Artículos que Requieren Reposición
            </h3>
            <button
              onClick={() => onNavigateTab('catalogo')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {articulosBajos.map((art) => (
              <div
                key={art.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 p-3"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200">{art.nombre}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    SKU: {art.sku} • {art.ubicacionPrincipal}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-400">
                    {art.stockActual} / {art.stockMinimo} {art.unidad}s
                  </div>
                  <span className="inline-block mt-0.5 text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Bajo Mínimo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Columns: Movimientos Recientes */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              Últimos Movimientos Auditados
            </h3>
            <button
              onClick={() => onNavigateTab('movimientos')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver histórico completo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Comprobante</th>
                  <th className="pb-3 font-semibold">Tipo</th>
                  <th className="pb-3 font-semibold">Artículo</th>
                  <th className="pb-3 font-semibold">Cantidad</th>
                  <th className="pb-3 font-semibold">Ruta</th>
                  <th className="pb-3 font-semibold">Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono font-medium text-slate-300">{mov.numero}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          mov.tipo === 'entrada'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : mov.tipo === 'salida'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {mov.tipo === 'entrada' && <ArrowDownLeft className="h-3 w-3" />}
                        {mov.tipo === 'salida' && <ArrowUpRight className="h-3 w-3" />}
                        {mov.tipo === 'traslado' && <ArrowRight className="h-3 w-3" />}
                        {mov.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-white">{mov.articuloNombre}</td>
                    <td className="py-3 font-bold text-slate-200">{mov.cantidad}</td>
                    <td className="py-3 text-slate-400">
                      {mov.origen && mov.destino
                        ? `${mov.origen} → ${mov.destino}`
                        : mov.destino || mov.origen}
                    </td>
                    <td className="py-3">
                      {mov.origenIa ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          <Sparkles className="h-3 w-3" />
                          IA Asistida
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Humano</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
