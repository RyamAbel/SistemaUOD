'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  UserCheck,
  CheckCircle2
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'traslado'>('traslado');
  const [selectedArticuloId, setSelectedArticuloId] = useState(articulos[0]?.id || '');
  const [cantidad, setCantidad] = useState(5);
  const [origen, setOrigen] = useState(ubicacionesList[0]);
  const [destino, setDestino] = useState(ubicacionesList[1]);
  const [motivo, setMotivo] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const art = articulos.find((a) => a.id === selectedArticuloId);
    if (!art || !motivo.trim()) return;

    onAddMovimiento({
      tipo,
      articuloNombre: art.nombre,
      cantidad,
      origen: tipo !== 'entrada' ? origen : undefined,
      destino: tipo !== 'salida' ? destino : undefined,
      usuario: 'Admin UOD (Operación Manual)',
      origenIa: false,
      motivo
    });

    setIsModalOpen(false);
    setMotivo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-indigo-400" />
            Movimientos y Trazabilidad de Stock
          </h2>
          <p className="text-xs text-slate-400">
            Registro transaccional inmutable de entradas, salidas y transferencias entre ubicaciones.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" />
          Registrar Movimiento
        </button>
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Comprobante</th>
                <th className="py-3.5 px-4 font-semibold">Tipo</th>
                <th className="py-3.5 px-4 font-semibold">Artículo</th>
                <th className="py-3.5 px-4 font-semibold">Cantidad</th>
                <th className="py-3.5 px-4 font-semibold">Ruta (Origen / Destino)</th>
                <th className="py-3.5 px-4 font-semibold">Responsable</th>
                <th className="py-3.5 px-4 font-semibold">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {movimientos.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                    {mov.numero}
                    <div className="text-[10px] text-slate-500 font-sans">{mov.fecha}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
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
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{mov.articuloNombre}</div>
                    <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                      "{mov.motivo}"
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white text-sm">{mov.cantidad}</td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {mov.origen && mov.destino ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">{mov.origen}</span>
                        <ArrowRight className="h-3 w-3 text-indigo-400" />
                        <span className="font-medium text-slate-200">{mov.destino}</span>
                      </div>
                    ) : (
                      <span>{mov.destino || mov.origen}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                      <span>{mov.usuario}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {mov.origenIa ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                        <Sparkles className="h-3 w-3" />
                        IA Confirmada
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Manual</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Registrar Movimiento de Inventario</h3>
            <p className="text-xs text-slate-400 mb-4">
              Cada movimiento actualiza las existencias de forma transaccional y queda auditado.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Operación</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['traslado', 'entrada', 'salida'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`rounded-xl py-2 text-xs font-semibold uppercase transition-all ${
                        tipo === t
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'border border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Artículo</label>
                <select
                  value={selectedArticuloId}
                  onChange={(e) => setSelectedArticuloId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {articulos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} (Disponibles: {a.stockActual})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {tipo !== 'entrada' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Origen</label>
                    <select
                      value={origen}
                      onChange={(e) => setOrigen(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      {ubicacionesList.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                )}
                {tipo !== 'salida' && (
                  <div className={tipo === 'entrada' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Destino</label>
                    <select
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      {ubicacionesList.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Motivo / Justificación</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej: Suministro para departamento administrativo..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
