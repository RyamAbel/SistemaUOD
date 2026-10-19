'use client';

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Barcode,
  Layers,
  QrCode,
  Download,
  Share2,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Building2,
  Cpu,
  Monitor,
  Printer,
  ShieldCheck,
  PhoneCall,
  HardDrive
} from 'lucide-react';
import { ArticuloItem } from '@/lib/initialData';

interface CatalogViewProps {
  articulos: ArticuloItem[];
  onAddArticulo: (nuevo: ArticuloItem) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ articulos, onAddArticulo }) => {
  const [selectedItem, setSelectedItem] = useState<ArticuloItem>(articulos[0]);
  const [activeDetailTab, setActiveDetailTab] = useState<'general' | 'existencias' | 'especificaciones' | 'historial'>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Categorías presentes
  const categories = ['Todos', 'Computación y Equipos', 'Pantallas y Monitores', 'Periféricos y Accesorios', 'Impresión y Digitalización', 'Energía y Respaldo (UPS)', 'Redes y Telecomunicaciones', 'Audiovisual y Multimedia'];

  const filteredArticulos = articulos.filter((art) => {
    const matchCat = selectedCategory === 'Todos' || art.categoria === selectedCategory;
    const matchSearch =
      art.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.codigoBarras.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.ubicacionPrincipal.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const getIconForType = (nombre: string, categoria: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('cpu') || n.includes('laptop')) return '💻';
    if (n.includes('monitor')) return '🖥️';
    if (n.includes('impresora')) return '🖨️';
    if (n.includes('ups')) return '⚡';
    if (n.includes('teléfono') || n.includes('telefono')) return '📱';
    if (n.includes('cámara') || n.includes('camara')) return '📷';
    if (n.includes('teclado')) return '⌨️';
    if (n.includes('mouse')) return '🖱️';
    if (n.includes('bocina') || n.includes('headset') || n.includes('micrófono')) return '🎧';
    if (n.includes('switch')) return '🔀';
    return '📦';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#1C3177]" />
            Catálogo de Activos Tecnológicos UOD
          </h2>
          <p className="text-xs text-slate-500">
            Inventario detallado de cómputo, pantallas, periféricos, telecomunicaciones y energía de la UOD.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por equipo, ID o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1C3177] w-64 shadow-xs"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#3DAA5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#2D8246] transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nuevo Activo
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-medium shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#1C3177] text-white border-[#1C3177] shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Products Cards (Left) and Detail Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Grid of Product Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[700px] overflow-y-auto pr-1">
          {filteredArticulos.map((prod) => {
            const isSelected = selectedItem?.id === prod.id;
            const emoji = getIconForType(prod.nombre, prod.categoria);

            return (
              <div
                key={prod.id}
                onClick={() => setSelectedItem(prod)}
                className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all cursor-pointer group shadow-xs ${
                  isSelected
                    ? 'border-[#1C3177] ring-2 ring-[#1C3177]/20 bg-blue-50/20'
                    : 'border-slate-200/80 bg-white hover:border-[#3DAA5C] hover:shadow-md'
                }`}
              >
                {/* Visual Box */}
                <div className="relative aspect-square w-full rounded-xl bg-slate-50 flex items-center justify-center text-4xl mb-3 border border-slate-100 group-hover:scale-105 transition-transform">
                  <span>{emoji}</span>
                  <span className="absolute top-2 right-2 rounded-md bg-white/95 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-[#1C3177] shadow-xs font-mono">
                    {prod.codigoBarras}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">{prod.nombre}</h4>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span className="truncate max-w-[100px]">{prod.ubicacionPrincipal}</span>
                    <span className="font-semibold text-slate-700">{prod.categoria.split(' ')[0]}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-[#2D8246]">
                    {prod.stockActual} {prod.stockActual === 1 ? 'equipo' : 'equipos'}
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-colors ${isSelected ? 'text-[#1C3177]' : 'text-slate-400 group-hover:text-[#3DAA5C]'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Product Drawer */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{selectedItem?.nombre}</h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Placa Institucional: <span className="font-mono font-bold text-[#1C3177]">{selectedItem?.codigoBarras}</span> • SKU: {selectedItem?.sku}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-[#2D8246]">
              {selectedItem?.stockActual} en existencia
            </span>
          </div>

          {/* Picture Box */}
          <div className="h-32 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center text-6xl border border-slate-100">
            {getIconForType(selectedItem?.nombre || '', selectedItem?.categoria || '')}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 text-[11px] font-medium overflow-x-auto no-scrollbar">
            {(['general', 'existencias', 'especificaciones', 'historial'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDetailTab(tab)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  activeDetailTab === tab
                    ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content: General */}
          {activeDetailTab === 'general' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Categoría TI</span>
                  <span className="font-semibold text-slate-800">{selectedItem?.categoria}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Ubicación Registrada</span>
                  <span className="font-semibold text-slate-800">{selectedItem?.ubicacionPrincipal}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Costo Estimado</span>
                  <span className="font-bold text-[#2D8246]">RD$ {selectedItem?.costoEstimado.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Estado Operativo</span>
                  <span className="font-semibold text-emerald-700">En uso / Activo</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-cyan-100 bg-cyan-50/50 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-[#06B6D4] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-900">Asistente IA SIIA</div>
                  <div className="text-[11px] text-slate-600">
                    Activo tecnológico verificado en el levantamiento 2026. Cumple con la normativa de auditoría institucional.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Existencias */}
          {activeDetailTab === 'existencias' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#1C3177]" />
                  <span className="font-medium text-slate-800">{selectedItem?.ubicacionPrincipal}</span>
                </div>
                <span className="font-bold text-[#1C3177]">{selectedItem?.stockActual} un.</span>
              </div>
            </div>
          )}

          {/* Tab Content: Especificaciones */}
          {activeDetailTab === 'especificaciones' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Placa / Identificador:</span>
                  <span className="font-bold font-mono text-slate-900">{selectedItem?.codigoBarras}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tipo de Bien:</span>
                  <span className="font-medium text-slate-900">Activo Fijo Tecnológico</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Institución:</span>
                  <span className="font-medium text-slate-900">Universidad Odontológica Dominicana</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Historial */}
          {activeDetailTab === 'historial' && (
            <div className="space-y-2 text-xs text-slate-500">
              <div className="p-2.5 border-l-2 border-[#3DAA5C] bg-slate-50 rounded-r-lg">
                <div className="font-semibold text-slate-800">Levantamiento TI 2026</div>
                <div className="text-[10px]">Verificado e inventariado físicamente en {selectedItem?.ubicacionPrincipal}.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
