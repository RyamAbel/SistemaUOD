'use client';

import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RotateCcw,
  QrCode,
  Download,
  Filter,
  Check
} from 'lucide-react';
import { ACTIVOS_ORIGINALES, ActivoTI } from '@/lib/inventoryData';

interface PhysicalAuditViewProps {
  onOpenScanner?: () => void;
}

export const PhysicalAuditView: React.FC<PhysicalAuditViewProps> = ({ onOpenScanner }) => {
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('todas');
  const [search, setSearch] = useState('');
  const [verificados, setVerificados] = useState<Record<string, string>>({}); // { activoId: timestamp }

  // Ubicaciones únicas
  const ubicacionesUnicas = useMemo(() => {
    const set = new Set<string>();
    ACTIVOS_ORIGINALES.forEach(a => set.add(a.ubicacion_nombre));
    return Array.from(set).sort();
  }, []);

  // Filtrado por ubicación y texto
  const activosFiltrados = useMemo(() => {
    return ACTIVOS_ORIGINALES.filter(activo => {
      const matchUbic =
        selectedUbicacion === 'todas' || activo.ubicacion_nombre === selectedUbicacion;

      const matchSearch =
        search.trim() === '' ||
        activo.placa_institucional.toLowerCase().includes(search.toLowerCase()) ||
        activo.numero_serie.toLowerCase().includes(search.toLowerCase()) ||
        activo.recurso_nombre.toLowerCase().includes(search.toLowerCase()) ||
        activo.responsable.toLowerCase().includes(search.toLowerCase());

      return matchUbic && matchSearch;
    });
  }, [selectedUbicacion, search]);

  const totalFiltrados = activosFiltrados.length;
  const countVerificados = activosFiltrados.filter(a => verificados[a.id]).length;
  const porcentaje = totalFiltrados > 0 ? Math.round((countVerificados / totalFiltrados) * 100) : 0;

  const toggleVerificado = (id: string) => {
    setVerificados(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return next;
    });
  };

  const marcarTodosVisibles = () => {
    setVerificados(prev => {
      const next = { ...prev };
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      activosFiltrados.forEach(a => {
        next[a.id] = now;
      });
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#1C3177]" />
            Inventario Físico y Auditoría In Situ (Levantamiento 2026)
          </h2>
          <p className="text-xs text-slate-500">
            Conteo físico directo de los 341 activos institucionales, verificación por QR y conciliación de presencia.
          </p>
        </div>

        {onOpenScanner && (
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white px-4 py-2 text-xs font-bold transition-colors shadow-xs"
          >
            <Camera className="h-4 w-4" />
            Escanear Código / QR
          </button>
        )}
      </div>

      {/* Progress & Summary Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">Avance de Auditoría Física</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {countVerificados} <span className="text-sm font-semibold text-slate-400">/ {totalFiltrados} equipos verificados</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={marcarTodosVisibles}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              ✓ Marcar visibles como verificados
            </button>
            {countVerificados > 0 && (
              <button
                onClick={() => setVerificados({})}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 p-1.5"
                title="Reiniciar conteo"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
            <div
              style={{ width: `${porcentaje}%` }}
              className="h-full bg-linear-to-r from-[#1C3177] to-[#3DAA5C] rounded-full transition-all duration-300"
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>0%</span>
            <span className="text-[#1C3177] font-mono">{porcentaje}% completado</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa (EQ-XX), serie, modelo o custodio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] bg-slate-50/50"
          />
        </div>

        <div className="relative">
          <select
            value={selectedUbicacion}
            onChange={e => setSelectedUbicacion(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] bg-white text-slate-700"
          >
            <option value="todas">Todas las Ubicaciones (49)</option>
            {ubicacionesUnicas.map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Checklist Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Estado</th>
                <th className="py-3 px-4">Placa Institucional</th>
                <th className="py-3 px-4">Equipo / Modelo</th>
                <th className="py-3 px-4">Ubicación UOD</th>
                <th className="py-3 px-4">Custodio Real</th>
                <th className="py-3 px-4 text-center">Hora Conteo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron activos para la ubicación o búsqueda seleccionada.
                  </td>
                </tr>
              ) : (
                activosFiltrados.map(activo => {
                  const isChecked = Boolean(verificados[activo.id]);
                  return (
                    <tr
                      key={activo.id}
                      onClick={() => toggleVerificado(activo.id)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleVerificado(activo.id)}
                          className="h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177] border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                          isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-[#1C3177] border border-blue-200'
                        }`}>
                          {activo.placa_institucional}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {activo.recurso_nombre}
                        <div className="text-[11px] text-slate-400 font-mono font-normal">
                          Serial: {activo.numero_serie}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {activo.ubicacion_nombre}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {activo.responsable}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isChecked ? (
                          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                            ✓ {verificados[activo.id]}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
