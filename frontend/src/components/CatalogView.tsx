'use client';

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Barcode,
  Layers
} from 'lucide-react';
import { ArticuloItem } from '@/lib/initialData';

interface CatalogViewProps {
  articulos: ArticuloItem[];
  onAddArticulo: (nuevo: ArticuloItem) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ articulos, onAddArticulo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New item form state
  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [categoria, setCategoria] = useState('Papelería y Oficina');
  const [tipo, setTipo] = useState<'consumible' | 'activo_fijo'>('consumible');
  const [unidad, setUnidad] = useState('unidad');
  const [stockActual, setStockActual] = useState(10);
  const [stockMinimo, setStockMinimo] = useState(5);
  const [costoEstimado, setCostoEstimado] = useState(150);

  const categories = ['Todas', 'Papelería y Oficina', 'Tecnología y Cómputo', 'Mobiliario y Equipamiento', 'Limpieza y Cafetería'];

  const filtered = articulos.filter((art) => {
    const matchesSearch =
      art.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.codigoBarras.includes(searchTerm);
    const matchesCategory =
      selectedCategory === 'Todas' || art.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !sku.trim()) return;

    const nuevo: ArticuloItem = {
      id: `art-${Date.now()}`,
      sku,
      codigoBarras: `746${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      nombre,
      categoria,
      tipo,
      unidad,
      stockActual,
      stockMinimo,
      ubicacionPrincipal: 'Almacén Central',
      costoEstimado,
      estado: stockActual <= stockMinimo ? 'bajo' : 'saludable'
    };

    onAddArticulo(nuevo);
    setIsModalOpen(false);
    setNombre('');
    setSku('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-400" />
            Catálogo y Control de Existencias
          </h2>
          <p className="text-xs text-slate-400">
            Suministros consumibles y activos organizados por categorías, código de barras y niveles mínimos.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" />
          Registrar Artículo
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2 w-full md:w-96 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por nombre, SKU o código de barra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Artículo & SKU</th>
                <th className="py-3.5 px-4 font-semibold">Categoría & Tipo</th>
                <th className="py-3.5 px-4 font-semibold">Ubicación</th>
                <th className="py-3.5 px-4 font-semibold">Stock Actual</th>
                <th className="py-3.5 px-4 font-semibold">Estado Stock</th>
                <th className="py-3.5 px-4 font-semibold">Costo Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{item.nombre}</div>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-slate-400">
                      <span>SKU: {item.sku}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Barcode className="h-3 w-3 text-slate-500" />
                        {item.codigoBarras}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {item.categoria}
                    </span>
                    <span className="block text-[10px] text-slate-500 capitalize mt-0.5">
                      {item.tipo.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{item.ubicacionPrincipal}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white text-sm">{item.stockActual}</span>
                    <span className="text-slate-400 text-[11px] ml-1">{item.unidad}s</span>
                    <div className="text-[10px] text-slate-500">Mínimo: {item.stockMinimo}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.stockActual <= item.stockMinimo ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                        <AlertTriangle className="h-3 w-3" />
                        Bajo Mínimo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        Saludable
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                    RD$ {item.costoEstimado.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Registrar Nuevo Artículo</h3>
            <p className="text-xs text-slate-400 mb-4">
              Completa los datos del artículo para incorporarlo al catálogo institucional.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Artículo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcadores Punta Fina para Pizarra"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Código SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: OFI-MAR-003"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {categories.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={stockActual}
                    onChange={(e) => setStockActual(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Costo Est. (RD$)</label>
                  <input
                    type="number"
                    min="0"
                    value={costoEstimado}
                    onChange={(e) => setCostoEstimado(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
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
                  Guardar Artículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
