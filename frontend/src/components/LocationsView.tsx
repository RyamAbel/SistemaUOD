'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Building2,
  Layers,
  ArrowRight
} from 'lucide-react';

interface LocationsViewProps {
  onApplyRecommendation?: () => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({ onApplyRecommendation }) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('Clínica Principal');
  const [recommendationDismissed, setRecommendationDismissed] = useState(false);

  const rooms = [
    {
      id: 'clinica-principal',
      name: 'Clínica Principal',
      stock: '1200/1500',
      capacity: '80%',
      capacityNum: 80,
      color: 'border-emerald-200 bg-emerald-50/60 text-[#2D8246]',
      x: 'w-1/2 h-1/2 top-0 left-0'
    },
    {
      id: 'almacen-central',
      name: 'Almacén Central',
      stock: '3500/4000',
      capacity: '88%',
      capacityNum: 88,
      color: 'border-blue-200 bg-blue-50/60 text-[#1C3177]',
      x: 'w-1/2 h-1/2 top-0 right-0'
    },
    {
      id: 'clinica-este',
      name: 'Clínica Este',
      stock: '300/800',
      capacity: '38%',
      capacityNum: 38,
      color: 'border-amber-200 bg-amber-50/60 text-amber-800',
      x: 'w-1/2 h-1/2 bottom-0 left-0'
    },
    {
      id: 'laboratorio',
      name: 'Laboratorio de Prótesis',
      stock: '450/500',
      capacity: '90%',
      capacityNum: 90,
      color: 'border-cyan-200 bg-cyan-50/60 text-[#0891B2]',
      x: 'w-1/2 h-1/2 bottom-0 right-0'
    }
  ];

  const stockTable = [
    { ubic: 'Clínica Principal', art: 'Guantes Látex M', stock: 150, min: 100, max: 200, status: 'OK' },
    { ubic: 'Almacén Central', art: 'Anestésicos Locales', stock: 500, min: 200, max: 600, status: 'OK' },
    { ubic: 'Clínica Este', art: 'Pasta Profilaxis', stock: 30, min: 50, max: 100, status: 'Reponer' },
    { ubic: 'Laboratorio de Prótesis', art: 'Resina Compuesta A2', stock: 45, min: 20, max: 50, status: 'OK' },
    { ubic: 'Almacén Central', art: 'Mascarillas N95', stock: 800, min: 100, max: 1000, status: 'OK' },
    { ubic: 'Clínica Este', art: 'Anestésicos Locales', stock: 25, min: 30, max: 100, status: 'Reponer' },
    { ubic: 'Almacén Central', art: 'Pasta Profilaxis', stock: 200, min: 50, max: 300, status: 'OK' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#1C3177]" />
          Ubicaciones y Existencias Odontológicas
        </h2>
        <p className="text-xs text-slate-500">
          Distribución de clínicas UOD, capacidades por metro cuadrado y balance de existencias en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Architectural Blueprint Floor Plan */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#1C3177]" />
              Plano de Instalaciones Clínicas UOD
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Selecciona una sede</span>
          </div>

          {/* Blueprint Grid Layout */}
          <div className="relative aspect-[4/3] w-full rounded-xl border border-slate-200 bg-slate-50 p-4 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:20px_20px] opacity-60 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-2 grid-rows-2 gap-3 h-full">
              {rooms.map((room) => {
                const isSelected = selectedRoom === room.name;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room.name)}
                    className={`rounded-xl border-2 p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#1C3177] bg-blue-50/80 shadow-md ring-2 ring-[#1C3177]/10'
                        : `${room.color} hover:border-slate-400`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#3DAA5C]" />
                        {room.name}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-2xs">
                        {room.capacity}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-600">
                        Stock: <span className="font-bold text-slate-900">{room.stock}</span>
                      </div>
                      {/* Capacity bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          style={{ width: room.capacity }}
                          className={`h-full rounded-full ${
                            room.capacityNum > 80
                              ? 'bg-[#3DAA5C]'
                              : room.capacityNum < 40
                              ? 'bg-amber-500'
                              : 'bg-[#1C3177]'
                          }`}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">Capacidad utilizada</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Área activa: <strong className="text-slate-900">{selectedRoom}</strong></span>
            <span className="text-[#2D8246] font-bold">Sensores sincronizados</span>
          </div>
        </div>

        {/* Right: Table Existencias por Ubicación & Floating AI Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Existencias por Ubicación
              </h3>
            </div>

            <div className="overflow-x-auto max-h-[340px]">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Ubicación</th>
                    <th className="py-2.5 px-3">Artículo</th>
                    <th className="py-2.5 px-3 text-right">Stock</th>
                    <th className="py-2.5 px-3 text-right">Mín</th>
                    <th className="py-2.5 px-3 text-right">Máx</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                  {stockTable.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.ubic === selectedRoom ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{item.ubic}</td>
                      <td className="py-2.5 px-3 text-slate-800">{item.art}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.stock}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{item.min}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{item.max}</td>
                      <td className="py-2.5 px-3 text-center">
                        {item.status === 'OK' ? (
                          <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-[#2D8246]">
                            OK
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                            Reponer
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating AI Recommendation Card */}
          {!recommendationDismissed && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/40 p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-[#1C3177] font-bold text-xs mb-1">
                  <Sparkles className="h-4 w-4 text-[#06B6D4]" />
                  <span>Recomendación IA</span>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Trasladar <strong>20 unidades</strong> de <strong>Almacén Central</strong> a <strong>Clínica Este</strong> para evitar desabastecimiento de <strong>Pasta Profilaxis</strong>.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    setRecommendationDismissed(true);
                    onApplyRecommendation?.();
                  }}
                  className="rounded-xl bg-[#3DAA5C] hover:bg-[#2D8246] text-white font-bold px-4 py-1.5 text-xs transition-colors shadow-xs"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => setRecommendationDismissed(true)}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium px-4 py-1.5 text-xs transition-colors"
                >
                  Ignorar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
