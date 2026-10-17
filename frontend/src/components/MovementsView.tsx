'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  RotateCcw,
  XCircle,
  Plus,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { MovimientoItem, ArticuloItem, ubicacionesList } from '@/lib/initialData';

interface MovementsViewProps {
  movimientos: MovimientoItem[];
  articulos: ArticuloItem[];
  onAddMovimiento: (mov: Omit<MovimientoItem, 'id' | 'numero' | 'fecha'>) => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  movimientos,
  articulos,
  onAddMovimiento
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'traslado' | 'ajuste' | 'baja'>('traslado');
  const [selectedArticulo, setSelectedArticulo] = useState('Implante de Titanio');
  const [cantidad, setCantidad] = useState(20);
  const [origen, setOrigen] = useState('Almacén Central');
  const [destino, setDestino] = useState('Clínica Este');
  const [motivo, setMotivo] = useState('Reabastecimiento para jornada quirúrgica');
  const [responsable, setResponsable] = useState('Dr. Morales (Cirugía)');
  const [fecha, setFecha] = useState('2026-10-16');

  const recentRows = [
    { id: '101', tipo: 'Entrada', art: 'Implante de Titanio', cant: 300, ruta: 'Origen → Titanio', resp: 'Alumínio', fecha: '05/03/2024', status: 'Completado', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    { id: '102', tipo: 'Salida', art: 'Implante de Titanio', cant: 400, ruta: 'Origen → Titanio', resp: 'Alumínio', fecha: '05/03/2024', status: 'Completado', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    { id: '103', tipo: 'Traslado', art: 'Traslado', cant: 20, ruta: 'Origen → Traslado', resp: 'Mactranonas', fecha: '05/03/2024', status: 'Pendiente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    { id: '104', tipo: 'Baja', art: 'Baja', cant: 1, ruta: 'Origen → Destino', resp: 'Alutárnao', fecha: '05/03/2024', status: 'Pendiente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    { id: '105', tipo: 'Ajuste', art: 'Ajuste', cant: 20, ruta: 'Implante de Titanio', resp: 'Responsable', fecha: '05/03/2024', status: 'Completado', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMovimiento({
      tipo: tipo as any,
      articuloNombre: selectedArticulo,
      cantidad,
      origen,
      destino,
      usuario: responsable,
      origenIa: false,
      motivo
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-emerald-400" />
            Movimientos de Inventario
          </h2>
          <p className="text-xs text-slate-400">
            Control transaccional de transferencias clínicas, ingresos y bajas con trazabilidad.
          </p>
        </div>

        {/* 4 Colored Action Buttons Matching Screenshot Exactly */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTipo('entrada')}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-md shadow-emerald-600/25"
          >
            Nueva Entrada
          </button>
          <button
            onClick={() => setTipo('salida')}
            className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-md shadow-rose-600/25"
          >
            Nueva Salida
          </button>
          <button
            onClick={() => setTipo('traslado')}
            className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-md shadow-amber-600/25"
          >
            Traslado
          </button>
          <button
            onClick={() => setTipo('ajuste')}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-md shadow-blue-600/25"
          >
            Ajuste
          </button>
        </div>
      </div>

      {/* 5 Big Category Filter Pills Matching Screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'entrada', label: 'Entrada', icon: ArrowDownLeft, color: 'text-emerald-400' },
          { id: 'salida', label: 'Salida', icon: ArrowUpRight, color: 'text-rose-400' },
          { id: 'traslado', label: 'Traslado', icon: ArrowRight, color: 'text-amber-400' },
          { id: 'devolucion', label: 'Devolución', icon: RotateCcw, color: 'text-cyan-400' },
          { id: 'baja', label: 'Baja', icon: XCircle, color: 'text-rose-500' }
        ].map((pill) => {
          const Icon = pill.icon;
          const isSelected = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(isSelected ? 'todos' : pill.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-lg shadow-emerald-500/20'
                  : 'border-slate-800 bg-[#0F172A]/70 text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${pill.color}`} />
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout: Form (Left) + Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Nuevo Movimiento Matching Screenshot Exactly */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#0F172A]/90 p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Nuevo Movimiento
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tipo de Movimiento</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white capitalize focus:outline-none focus:border-emerald-500"
              >
                <option value="traslado">Traslado entre Clínicas</option>
                <option value="entrada">Entrada / Compra</option>
                <option value="salida">Salida / Consumo</option>
                <option value="ajuste">Ajuste de Stock</option>
                <option value="baja">Baja por Daño/Vencimiento</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Artículo</label>
              <input
                type="text"
                value={selectedArticulo}
                onChange={(e) => setSelectedArticulo(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ubicación Origen</label>
                <input
                  type="text"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-white text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ubicación Destino</label>
                <input
                  type="text"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-white text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Motivo</label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Responsable</label>
                <input
                  type="text"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-white text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-white text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Adjuntos (Conduce / Factura)</label>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 p-2.5 text-[11px] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>Adjuntar comprobante</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 transition-colors shadow-md shadow-emerald-600/30"
            >
              Registrar Movimiento
            </button>
          </form>
        </div>

        {/* Right Table: Movimientos Recientes Matching Screenshot Exactly */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 shadow-xl overflow-hidden flex-1">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Movimientos Recientes
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Artículo</th>
                    <th className="py-3 px-3 text-right">Cantidad</th>
                    <th className="py-3 px-3">Origen → Destino</th>
                    <th className="py-3 px-3">Responsable</th>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px] font-medium">
                  {recentRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400 font-bold">{r.id}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white">{r.tipo}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">{r.art}</td>
                      <td className="py-3 px-3 text-right font-bold text-white font-mono">{r.cant}</td>
                      <td className="py-3 px-3 text-slate-400">{r.ruta}</td>
                      <td className="py-3 px-3 text-slate-300">{r.resp}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">{r.fecha}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold border ${r.color}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom AI Recommendation Banner Matching Screenshot */}
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/80 to-slate-900 p-4 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-cyan-300 block mb-0.5">Recomendación IA Automatizada:</span>
                <span className="text-slate-200">
                  Basado en el historial, se recomienda programar reabastecimiento de <strong>[Implante de Titanio]</strong> para evitar demoras en la jornada quirúrgica.
                </span>
              </div>
            </div>
            <button className="shrink-0 flex items-center justify-center h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
