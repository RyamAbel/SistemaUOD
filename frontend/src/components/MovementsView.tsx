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
  const [fecha, setFecha] = useState('2026-10-18');

  const recentRows = [
    { id: '101', tipo: 'Entrada', art: 'Implante de Titanio', cant: 300, ruta: 'Almacén Central → Quirófano 1', resp: 'Dr. Morales', fecha: '18/10/2026', status: 'Completado', color: 'bg-emerald-50 text-[#2D8246] border-emerald-200' },
    { id: '102', tipo: 'Salida', art: 'Resina Compuesta A2', cant: 40, ruta: 'Clínica Principal → Consumo', resp: 'Dra. López', fecha: '18/10/2026', status: 'Completado', color: 'bg-blue-50 text-[#1C3177] border-blue-200' },
    { id: '103', tipo: 'Traslado', art: 'Pasta Profilaxis', cant: 20, ruta: 'Almacén Central → Clínica Este', resp: 'Lic. Pérez', fecha: '18/10/2026', status: 'En Tránsito', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: '104', tipo: 'Baja', art: 'Anestésico Vencido', cant: 2, ruta: 'Clínica Este → Descarte', resp: 'Dra. Gómez', fecha: '17/10/2026', status: 'Auditado', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: '105', tipo: 'Ajuste', art: 'Guantes Nitrilo', cant: 15, ruta: 'Inventario Físico → Ajuste', resp: 'Admin UOD', fecha: '17/10/2026', status: 'Completado', color: 'bg-emerald-50 text-[#2D8246] border-emerald-200' },
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
      {/* Header and 4 Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-[#1C3177]" />
            Movimientos de Inventario
          </h2>
          <p className="text-xs text-slate-500">
            Control transaccional de transferencias clínicas, ingresos y bajas con trazabilidad.
          </p>
        </div>

        {/* 4 Colored Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTipo('entrada')}
            className="rounded-xl bg-[#3DAA5C] hover:bg-[#2D8246] text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-xs"
          >
            Nueva Entrada
          </button>
          <button
            onClick={() => setTipo('salida')}
            className="rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-xs"
          >
            Nueva Salida
          </button>
          <button
            onClick={() => setTipo('traslado')}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-xs"
          >
            Traslado
          </button>
          <button
            onClick={() => setTipo('ajuste')}
            className="rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-xs"
          >
            Ajuste
          </button>
        </div>
      </div>

      {/* 5 Big Category Filter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'entrada', label: 'Entrada', icon: ArrowDownLeft, color: 'text-[#2D8246]' },
          { id: 'salida', label: 'Salida', icon: ArrowUpRight, color: 'text-[#1C3177]' },
          { id: 'traslado', label: 'Traslado', icon: ArrowRight, color: 'text-amber-600' },
          { id: 'devolucion', label: 'Devolución', icon: RotateCcw, color: 'text-[#0891B2]' },
          { id: 'baja', label: 'Baja', icon: XCircle, color: 'text-rose-600' }
        ].map((pill) => {
          const Icon = pill.icon;
          const isSelected = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(isSelected ? 'todos' : pill.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition-all shadow-xs ${
                isSelected
                  ? 'border-[#1C3177] bg-blue-50 text-[#1C3177]'
                  : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
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
        {/* Left Form: Nuevo Movimiento */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Nuevo Movimiento
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] text-slate-600 font-medium block mb-1">Tipo de Movimiento</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#1C3177]"
              >
                <option value="traslado">Traslado entre Clínicas</option>
                <option value="entrada">Entrada / Compra</option>
                <option value="salida">Salida / Consumo</option>
                <option value="ajuste">Ajuste de Stock</option>
                <option value="baja">Baja por Daño/Vencimiento</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 font-medium block mb-1">Artículo</label>
              <input
                type="text"
                value={selectedArticulo}
                onChange={(e) => setSelectedArticulo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#1C3177]"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-600 font-medium block mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#1C3177]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">Ubicación Origen</label>
                <input
                  type="text"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-800 text-[11px] font-medium focus:bg-white focus:outline-none focus:border-[#1C3177]"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">Ubicación Destino</label>
                <input
                  type="text"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-800 text-[11px] font-medium focus:bg-white focus:outline-none focus:border-[#1C3177]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 font-medium block mb-1">Motivo</label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#1C3177]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">Responsable</label>
                <input
                  type="text"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-800 text-[11px] font-medium focus:bg-white focus:outline-none focus:border-[#1C3177]"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-slate-800 text-[11px] font-medium focus:bg-white focus:outline-none focus:border-[#1C3177]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 font-medium block mb-1">Adjuntos (Conduce / Factura)</label>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-2.5 text-[11px] text-slate-500 hover:text-[#1C3177] hover:border-[#1C3177] transition-colors bg-slate-50/50"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>Adjuntar comprobante</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#3DAA5C] hover:bg-[#2D8246] text-white font-bold py-2.5 transition-colors shadow-xs"
            >
              Registrar Movimiento
            </button>
          </form>
        </div>

        {/* Right Table: Movimientos Recientes */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex-1">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Movimientos Recientes
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
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
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                  {recentRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 font-bold">{r.id}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{r.tipo}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-800">{r.art}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">{r.cant}</td>
                      <td className="py-3 px-3 text-slate-600">{r.ruta}</td>
                      <td className="py-3 px-3 text-slate-700">{r.resp}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">{r.fecha}</td>
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

          {/* Bottom AI Recommendation Banner */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-cyan-50/40 to-white p-4 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1C3177] border border-blue-200 shadow-2xs">
                <Sparkles className="h-4 w-4 text-[#06B6D4]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#1C3177] block mb-0.5">Recomendación IA Automatizada:</span>
                <span className="text-slate-600">
                  Basado en el historial, se recomienda programar reabastecimiento de <strong>[Implante de Titanio]</strong> para evitar demoras en la jornada quirúrgica.
                </span>
              </div>
            </div>
            <button className="shrink-0 flex items-center justify-center h-8 w-8 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors" aria-label="Ver recomendación completa">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
