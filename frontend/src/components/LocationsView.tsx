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
      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
      x: 'w-1/2 h-1/2 top-0 left-0'
    },
    {
      id: 'almacen-central',
      name: 'Almacén Central',
      stock: '3500/4000',
      capacity: '88%',
      capacityNum: 88,
      color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
      x: 'w-1/2 h-1/2 top-0 right-0'
    },
    {
      id: 'clinica-este',
      name: 'Clínica Este',
      stock: '300/800',
      capacity: '38%',
      capacityNum: 38,
      color: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
      x: 'w-1/2 h-1/2 bottom-0 left-0'
    },
    {
      id: 'laboratorio',
      name: 'Laboratorio',
      stock: '450/500',
      capacity: '90%',
      capacityNum: 90,
      color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300',
      x: 'w-1/2 h-1/2 bottom-0 right-0'
    }
  ];

  const stockTable = [
    { ubic: 'Clínica Principal', art: 'Guantes Látex M', stock: 150, min: 100, max: 200, status: 'OK' },
    { ubic: 'Almacén Central', art: 'Anestésicos Locales', stock: 500, min: 200, max: 600, status: 'OK' },
    { ubic: 'Clínica Este', art: 'Pasta Profilaxis', stock: 30, min: 50, max: 100, status: 'Reponer' },
    { ubic: 'Laboratorio', art: 'Resina Compuesta A2', stock: 45, min: 20, max: 50, status: 'OK' },
    { ubic: 'Almacén Central', art: 'Mascarillas N95', stock: 800, min: 100, max: 1000, status: 'OK' },
    { ubic: 'Clínica Este', art: 'Anestésicos Locales', stock: 25, min: 30, max: 100, status: 'Reponer' },
    { ubic: 'Almacén Central', art: 'Pasta Profilaxis', stock: 200, min: 50, max: 300, status: 'OK' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-400" />
          Ubicaciones y Existencias
        </h2>
        <p className="text-xs text-slate-400">
          Distribución de sedes odontológicas, capacidades por metro cuadrado y balance de existencias.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Architectural Blueprint Floor Plan */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-400" />
              Plano de Instalaciones Clínicas UOD
            </h3>
            <span className="text-[10px] text-slate-400">Selecciona un área</span>
          </div>

          {/* Blueprint Grid Layout */}
          <div className="relative aspect-[4/3] w-full rounded-xl border border-cyan-500/20 bg-[#070D18] p-4 overflow-hidden">
            {/* Blueprint Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f2744_1px,transparent_1px),linear-gradient(to_bottom,#0f2744_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-2 grid-rows-2 gap-3 h-full">
              {rooms.map((room) => {
                const isSelected = selectedRoom === room.name;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room.name)}
                    className={`rounded-xl border-2 p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20'
                        : `${room.color} hover:border-white/40`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {room.name}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-slate-200 border border-white/10">
                        {room.capacity}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-300">
                        Stock: <span className="font-semibold text-white">{room.stock}</span>
                      </div>
                      {/* Capacity bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          style={{ width: room.capacity }}
                          className={`h-full rounded-full ${
                            room.capacityNum > 80
                              ? 'bg-emerald-400'
                              : room.capacityNum < 40
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`}
                        />
                      </div>
                      <div className="text-[9px] text-slate-400">Capacidad utilizada</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Área activa: <strong className="text-white">{selectedRoom}</strong></span>
            <span className="text-emerald-400 font-medium">Sincronización de sensores en vivo</span>
          </div>
        </div>

        {/* Right: Table Existencias por Ubicación & Floating AI Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Existencias por Ubicación
              </h3>
            </div>

            <div className="overflow-x-auto max-h-[340px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Ubicación</th>
                    <th className="py-2.5 px-3">Artículo</th>
                    <th className="py-2.5 px-3 text-right">Stock</th>
                    <th className="py-2.5 px-3 text-right">Mín</th>
                    <th className="py-2.5 px-3 text-right">Máx</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-[11px]">
                  {stockTable.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        item.ubic === selectedRoom ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-300 font-semibold">{item.ubic}</td>
                      <td className="py-2.5 px-3 text-white">{item.art}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">{item.stock}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{item.min}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{item.max}</td>
                      <td className="py-2.5 px-3 text-center">
                        {item.status === 'OK' ? (
                          <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                            OK
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-400">
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

          {/* Floating AI Recommendation Card Matching Page 2 Top Exactly */}
          {!recommendationDismissed && (
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/80 to-slate-900 p-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-1">
                  <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                  <span>Recomendación IA</span>
                </div>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Trasladar <strong>20 unidades</strong> de <strong>Almacén Central</strong> a <strong>Clínica Este</strong> para evitar desabastecimiento de <strong>Pasta Profilaxis</strong>.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    setRecommendationDismissed(true);
                    onApplyRecommendation?.();
                  }}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5 text-xs transition-colors shadow-md shadow-cyan-500/20"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => setRecommendationDismissed(true)}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-1.5 text-xs transition-colors"
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
