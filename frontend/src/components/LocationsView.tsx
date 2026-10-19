'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Building2,
  Layers,
  ArrowRight,
  Search,
  Monitor,
  Cpu,
  Printer
} from 'lucide-react';
import { UBICACIONES_ORIGINALES, ACTIVOS_ORIGINALES } from '@/lib/inventoryData';

interface LocationsViewProps {
  onApplyRecommendation?: () => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({ onApplyRecommendation }) => {
  const [selectedLocationName, setSelectedLocationName] = useState<string>('TECNOLOGIA');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');

  // Mapear conteo de equipos por ubicación
  const assetsByLocation: Record<string, typeof ACTIVOS_ORIGINALES> = {};
  ACTIVOS_ORIGINALES.forEach((a) => {
    if (!assetsByLocation[a.ubicacion_nombre]) {
      assetsByLocation[a.ubicacion_nombre] = [];
    }
    assetsByLocation[a.ubicacion_nombre].push(a);
  });

  const filteredLocations = UBICACIONES_ORIGINALES.filter((u) => {
    const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || u.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'todos' || u.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const selectedAssets = assetsByLocation[selectedLocationName] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1C3177]" />
            Ubicaciones y Dependencias UOD
          </h2>
          <p className="text-xs text-slate-500">
            Control físico de las 49 áreas, clínicas, laboratorios y oficinas institucionales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ubicación o clínica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1C3177] w-56 shadow-xs"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#1C3177] shadow-xs"
          >
            <option value="todos">Todos los tipos</option>
            <option value="clinica">Clínicas</option>
            <option value="laboratorio">Laboratorios</option>
            <option value="almacen">Tecnología / Almacén</option>
            <option value="edificio">Oficinas / Departamentos</option>
            <option value="sede">Rectoría / Sede</option>
          </select>
        </div>
      </div>

      {/* Grid: Locations List (Left) and Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 49 Locations Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[650px] overflow-y-auto pr-1">
          {filteredLocations.map((loc) => {
            const isSelected = selectedLocationName === loc.nombre;
            const count = (assetsByLocation[loc.nombre] || []).length;

            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLocationName(loc.nombre)}
                className={`rounded-2xl border p-4 transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#1C3177] ring-2 ring-[#1C3177]/20 bg-blue-50/20'
                    : 'border-slate-200/80 bg-white hover:border-[#3DAA5C] hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#1C3177] shrink-0 font-bold text-xs">
                      {loc.codigo}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">{loc.nombre}</h4>
                      <span className="text-[10px] text-slate-500 capitalize">{loc.tipo}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${count > 0 ? 'bg-emerald-50 text-[#2D8246] border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                    {count} {count === 1 ? 'equipo' : 'equipos'}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Inventario auditado</span>
                  <span className="font-semibold text-[#1C3177] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Ver activos <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Location Detail */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalle de Ubicación</span>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#1C3177]">
                {selectedAssets.length} equipos físicos
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 mt-1">{selectedLocationName}</h3>
            <p className="text-xs text-slate-500">Universidad Odontológica Dominicana • Sede Principal</p>
          </div>

          {/* AI Auditor Widget */}
          <div className="p-3.5 rounded-xl border border-cyan-100 bg-cyan-50/50 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-[#06B6D4] shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-slate-900">Auditoría IA de Ubicación</div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {selectedAssets.length > 0
                  ? `Se registran ${selectedAssets.length} activos TI en esta dependencia. Todos con placa institucional asignada.`
                  : 'No se registran equipos fijos asignados actualmente a esta dependencia.'}
              </p>
            </div>
          </div>

          {/* Equipment List in Selected Location */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Equipos Asignados a esta Ubicación:</h4>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {selectedAssets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Sin activos registrados en esta área.
                </div>
              ) : (
                selectedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[#1C3177]">
                          {asset.placa_institucional}
                        </span>
                        <span className="font-semibold text-slate-900">{asset.recurso_nombre}</span>
                      </div>
                      {asset.responsable && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Responsable: <span className="font-medium text-slate-700">{asset.responsable}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {asset.estado === 'en_uso' ? 'En Uso' : asset.estado}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
