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
  ExternalLink
} from 'lucide-react';
import { ArticuloItem } from '@/lib/initialData';

interface CatalogViewProps {
  articulos: ArticuloItem[];
  onAddArticulo: (nuevo: ArticuloItem) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ articulos, onAddArticulo }) => {
  const [selectedItem, setSelectedItem] = useState<ArticuloItem>(articulos[0]);
  const [activeDetailTab, setActiveDetailTab] = useState<'general' | 'existencias' | 'movimientos' | 'proveedores' | 'historial'>('general');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dental Products with Rich Imagery
  const dentalProducts = [
    {
      id: 'dent-1',
      code: 'RC001',
      name: 'Cepillos de Dientes Profilácticos',
      category: 'Higiene & Cepillos',
      stock: '500 un.',
      image: '🪥',
      tag: 'Cepillos',
      desc: 'Cepillos dentales con cerdas suaves para limpieza clínica y entrega a pacientes.'
    },
    {
      id: 'dent-2',
      code: 'RC002',
      name: 'Resina Compuesta A2 (Filtek)',
      category: 'Biomateriales',
      stock: '500 un.',
      image: '💉',
      tag: 'Resina Comp.',
      desc: 'Resina microhíbrida para restauración estética dental con alta resistencia al desgaste.'
    },
    {
      id: 'dent-3',
      code: 'RC003',
      name: 'Guantes de Nitrilo Quirúrgicos',
      category: 'Protección',
      stock: '500 un.',
      image: '🧤',
      tag: 'Nitrilo',
      desc: 'Cajas de 100 unidades guantes azules libres de polvo para cirugía odontológica.'
    },
    {
      id: 'dent-4',
      code: 'RC004',
      name: 'Anestésico Local Lidocaína 2%',
      category: 'Farmacología',
      stock: '250 un.',
      image: '🧪',
      tag: 'Anestesia',
      desc: 'Cartuchos dentales con epinefrina 1:100,000 para procedimientos quirúrgicos.'
    },
    {
      id: 'dent-5',
      code: 'RC005',
      name: 'Implante Titanio Grado 5',
      category: 'Implantología',
      stock: '35 un.',
      image: '🔩',
      tag: 'Implante',
      desc: 'Tornillo de fijación cónico autoperforante estéril de titanio grado quirúrgico.'
    },
    {
      id: 'dent-6',
      code: 'RC006',
      name: 'Pasta Profilaxis con Flúor',
      category: 'Profilaxis',
      stock: '80 un.',
      image: '🧴',
      tag: 'Pasta',
      desc: 'Pasta abrasiva de grano medio con flúor para eliminación de placa y pulido coronal.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-400" />
            Catálogo de Artículos Odontológicos
          </h2>
          <p className="text-xs text-slate-400">
            Insumos consumibles, instrumental quirúrgico y biomateriales de la facultad y clínicas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/30"
          >
            <Plus className="h-4 w-4" />
            Nuevo Artículo
          </button>
        </div>
      </div>

      {/* Filters Bar Matching Page 4 Top Screenshot */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-3.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Categoría:</span>
          <select className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500">
            <option>Todos</option>
            <option>Biomateriales</option>
            <option>Implantes</option>
            <option>Protección</option>
            <option>Farmacología</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Ubicación:</span>
          <select className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500">
            <option>Todas</option>
            <option>Clínica Principal</option>
            <option>Almacén Central</option>
            <option>Clínica Este</option>
            <option>Laboratorio</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Estado:</span>
          <select className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500">
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Fecha:</span>
          <select className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500">
            <option>Últimos 30 Días</option>
            <option>Últimos 90 Días</option>
            <option>Este Año</option>
          </select>
        </div>

        <button className="text-slate-400 hover:text-white ml-auto text-[11px] underline">
          Limpiar Filtros
        </button>
      </div>

      {/* Main Grid: Products Cards (Left) and Detail Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Grid of Product Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {dentalProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => setSelectedItem({
                id: prod.id,
                sku: prod.code,
                codigoBarras: '7461234567890',
                nombre: prod.name,
                categoria: prod.category,
                tipo: 'consumible',
                unidad: 'unidad',
                stockActual: parseInt(prod.stock),
                stockMinimo: 20,
                ubicacionPrincipal: 'Almacén Central',
                costoEstimado: 850,
                estado: 'saludable'
              })}
              className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-3.5 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer group"
            >
              {/* Product Visual Box */}
              <div className="relative aspect-square w-full rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-5xl mb-3 border border-slate-800/80 group-hover:scale-105 transition-transform">
                <span>{prod.image}</span>
                <span className="absolute top-2 right-2 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                  {prod.code}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-xs text-white line-clamp-1">{prod.name}</h4>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Cat: <span className="text-slate-300">{prod.tag}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-400">{prod.stock}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Detailed Product Drawer Matching Page 4 Top */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0F172A]/90 p-5 shadow-2xl space-y-4">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Resina Compuesta A2</h3>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400 border border-slate-700">
                  RC002
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Marca: Dental Corp • Fabricación Suiza</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              En Stock
            </span>
          </div>

          {/* Product Picture Box */}
          <div className="h-32 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 flex items-center justify-center text-6xl border border-slate-800">
            💉
          </div>

          {/* Tabs: General, Existencias, Movimientos, Proveedores, Historial */}
          <div className="flex items-center gap-1 border-b border-slate-800 text-[11px] font-medium overflow-x-auto no-scrollbar">
            {(['general', 'existencias', 'movimientos', 'proveedores', 'historial'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDetailTab(tab)}
                className={`px-2.5 py-1.5 capitalize transition-colors ${
                  activeDetailTab === tab
                    ? 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content: Existencias por clínica */}
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Distribución en Sedes
              </span>
              <div className="flex items-center justify-between text-slate-200 pt-1">
                <span>Clínica 1</span>
                <strong className="text-white font-mono">15 un.</strong>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>Almacén Central</span>
                <strong className="text-white font-mono">35 un.</strong>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Código QR & Trazabilidad
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ID: RC002-UOD-2026</span>
                <button className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline mt-1 font-medium">
                  <Download className="h-3 w-3" /> Descargar etiqueta
                </button>
              </div>
              {/* QR Code representation */}
              <div className="h-16 w-16 rounded-lg bg-white p-1 shadow-md flex items-center justify-center">
                <QrCode className="h-14 w-14 text-slate-950" />
              </div>
            </div>

            {/* Provider and AI Recommendation Box */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Proveedor: <strong className="text-white">Dental Corp.</strong></span>
                <span className="text-emerald-400 font-mono text-[10px]">#0093888000333</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-900/40">
                <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  Recomendación IA:
                </span>
                <button className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-slate-950 hover:bg-emerald-400">
                  Reordenar 15 un.
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
