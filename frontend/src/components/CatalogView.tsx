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
  Truck
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
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#1C3177]" />
            Catálogo de Artículos Odontológicos
          </h2>
          <p className="text-xs text-slate-500">
            Insumos consumibles, instrumental quirúrgico y biomateriales de las clínicas UOD.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#3DAA5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#2D8246] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo Artículo
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Categoría:</span>
          <select className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#1C3177]">
            <option>Todos</option>
            <option>Biomateriales</option>
            <option>Implantes</option>
            <option>Protección</option>
            <option>Farmacología</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Ubicación:</span>
          <select className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#1C3177]">
            <option>Todas</option>
            <option>Clínica Principal</option>
            <option>Almacén Central</option>
            <option>Clínica Este</option>
            <option>Laboratorio</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Estado:</span>
          <select className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#1C3177]">
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Fecha:</span>
          <select className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#1C3177]">
            <option>Últimos 30 Días</option>
            <option>Últimos 90 Días</option>
            <option>Este Año</option>
          </select>
        </div>

        <button className="text-slate-400 hover:text-slate-700 ml-auto text-[11px] font-medium underline">
          Limpiar Filtros
        </button>
      </div>

      {/* Main Grid: Products Cards (Left) and Detail Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Grid of Product Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
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
              className="rounded-2xl border border-slate-200/80 bg-white p-3.5 flex flex-col justify-between hover:border-[#3DAA5C] hover:shadow-md transition-all cursor-pointer group shadow-xs"
            >
              {/* Product Visual Box */}
              <div className="relative aspect-square w-full rounded-xl bg-slate-50 flex items-center justify-center text-5xl mb-3 border border-slate-100 group-hover:scale-105 transition-transform">
                <span>{prod.image}</span>
                <span className="absolute top-2 right-2 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-[#1C3177] shadow-xs">
                  {prod.code}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{prod.name}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Cat: <span className="text-slate-700 font-medium">{prod.tag}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-[#2D8246]">{prod.stock}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#3DAA5C] transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Detailed Product Drawer */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{selectedItem?.nombre || 'Resina Compuesta A2'}</h3>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-[#1C3177] font-bold border border-blue-100">
                  {selectedItem?.sku || 'RC002'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Marca: Dental Corp • Fabricación Suiza</p>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-[#2D8246]">
              En Stock
            </span>
          </div>

          {/* Product Picture Box */}
          <div className="h-32 rounded-xl bg-slate-50 flex items-center justify-center text-6xl border border-slate-100">
            💉
          </div>

          {/* Tabs: General, Existencias, Movimientos, Proveedores, Historial */}
          <div className="flex items-center gap-1 border-b border-slate-200 text-[11px] font-medium overflow-x-auto no-scrollbar">
            {(['general', 'existencias', 'movimientos', 'proveedores', 'historial'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDetailTab(tab)}
                className={`px-2.5 py-1.5 capitalize transition-colors ${
                  activeDetailTab === tab
                    ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content: Existencias por clínica */}
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#1C3177]" />
                Distribución en Sedes UOD
              </span>
              <div className="flex items-center justify-between text-slate-700 pt-1">
                <span>Clínica Odontológica Principal</span>
                <strong className="text-slate-900 font-mono font-bold">15 un.</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Almacén Central Institucional</span>
                <strong className="text-slate-900 font-mono font-bold">35 un.</strong>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Código QR & Trazabilidad
                </span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">ID: RC002-UOD-2026</span>
                <button className="flex items-center gap-1 text-[11px] text-[#1C3177] hover:underline mt-1.5 font-bold">
                  <Download className="h-3 w-3" /> Descargar etiqueta QR
                </button>
              </div>
              <div className="h-16 w-16 rounded-xl bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center">
                <QrCode className="h-14 w-14 text-slate-800" />
              </div>
            </div>

            {/* Provider and AI Recommendation Box */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Proveedor: <strong className="text-slate-900">Dental Corp. Dominicana</strong></span>
                <span className="text-[#2D8246] font-mono text-[10px] font-bold">#0093888000333</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-emerald-100">
                <span className="text-[11px] text-[#2D8246] font-bold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#3DAA5C]" />
                  Recomendación IA:
                </span>
                <button className="rounded-lg bg-[#3DAA5C] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#2D8246] transition-colors shadow-xs">
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
