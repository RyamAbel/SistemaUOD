'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  ShieldAlert
} from 'lucide-react';

export const MaintenanceView: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState('Unidad Dental A1');
  const [activeTab, setActiveTab] = useState<'checklist' | 'historial' | 'partes'>('checklist');

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header and Top Alert Pill */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#1C3177]" />
            Mantenimiento Programado de Equipos
          </h2>
          <p className="text-xs text-slate-500">
            Control preventivo y correctivo de sillones odontológicos, autoclaves y turbinas clínicas UOD.
          </p>
        </div>

        {/* Top Alert Pill */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-1.5 flex items-center gap-2 text-xs text-[#1C3177]">
          <ShieldAlert className="h-4 w-4 text-[#1C3177] shrink-0" />
          <span>Alertas: Mantenimiento preventivo agendado para <strong>Unidad Dental A1</strong></span>
        </div>
      </div>

      {/* Main Grid: Calendar (Left) + Unit Health Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar & Monthly Plan */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#1C3177]" />
              <h3 className="font-bold text-sm text-slate-900">Octubre 2026</h3>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors" aria-label="Mes anterior">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold px-2 text-slate-700">Mes Completo</span>
              <button className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors" aria-label="Mes siguiente">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="font-bold text-slate-400 py-1">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const hasEventA1 = day === 15 || day === 23;
              const hasEventA2 = day === 8 || day === 22;
              const isOverdue = day === 29;

              return (
                <div
                  key={day}
                  className={`min-h-[52px] rounded-lg border p-1 text-left flex flex-col justify-between transition-colors ${
                    hasEventA1
                      ? 'border-emerald-300 bg-emerald-50/60'
                      : hasEventA2
                      ? 'border-blue-300 bg-blue-50/60'
                      : isOverdue
                      ? 'border-rose-300 bg-rose-50/60'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="font-mono text-slate-500 text-[10px] font-bold">{day}</span>
                  {hasEventA1 && (
                    <span className="text-[8px] font-bold rounded bg-[#3DAA5C] text-white px-1 py-0.5 truncate block">
                      Unidad A1
                    </span>
                  )}
                  {hasEventA2 && (
                    <span className="text-[8px] font-bold rounded bg-[#1C3177] text-white px-1 py-0.5 truncate block">
                      Unidad A2
                    </span>
                  )}
                  {isOverdue && (
                    <span className="text-[8px] font-bold rounded bg-rose-600 text-white px-1 py-0.5 truncate block">
                      Vencido
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 4 Status Pills Below Calendar */}
          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-center">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5">
              <span className="text-xs text-[#1C3177] font-semibold block">Próximos</span>
              <strong className="text-lg font-bold text-[#1C3177] font-mono">5</strong>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-2.5">
              <span className="text-xs text-[#0891B2] font-semibold block">En Curso</span>
              <strong className="text-lg font-bold text-[#0891B2] font-mono">2</strong>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
              <span className="text-xs text-[#2D8246] font-semibold block">Completados</span>
              <strong className="text-lg font-bold text-[#2D8246] font-mono">12</strong>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2.5">
              <span className="text-xs text-rose-700 font-semibold block">Vencidos</span>
              <strong className="text-lg font-bold text-rose-600 font-mono">1</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Unidad Dental A1 Health & AI Prediction Panel */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Unidad Dental A1</h3>
              <p className="text-[11px] text-slate-500">Sillón Quirúrgico • Clínica Principal</p>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-[#2D8246]">
              Operativo
            </span>
          </div>

          {/* Subtabs: Checklist, Historial, Partes Usadas */}
          <div className="flex items-center gap-1 border-b border-slate-200 text-[11px] font-medium">
            {(['checklist', 'historial', 'partes'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  activeTab === t
                    ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'partes' ? 'Partes Usadas' : t}
              </button>
            ))}
          </div>

          {/* Checklist items with green checkmarks */}
          <div className="space-y-2 text-xs text-slate-700">
            {[
              'Checklist bases unidad e hidráulica',
              'Checklist presión de compresor y filtros',
              'Limpieza de mangueras y eyectores',
              'Inspección de micromotor y turbina',
              'Calibración de lámpara LED quirúrgica'
            ].map((check, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3DAA5C] shrink-0" />
                <span className="text-[11px] font-medium">{check}</span>
              </div>
            ))}
          </div>

          {/* AI Life Expectancy Prediction Box */}
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0891B2]">
              <Sparkles className="h-4 w-4 text-[#06B6D4]" />
              <span>AI Predicción de Vida Útil</span>
            </div>
            <div className="text-sm font-black text-slate-900">
              Vida útil estimada: <span className="text-[#2D8246]">18 meses más</span>
            </div>
            <p className="text-[11px] text-slate-600">
              El análisis de ciclos de trabajo indica desgaste normal dentro de tolerancias clínicas.
            </p>
          </div>

          {/* Partes Usadas Progress Bars */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
              Desgaste de Componentes
            </span>
            {[
              { name: 'Válvula Reguladora de Aire', life: '2 meses más', pct: 25 },
              { name: 'Manguera de Pieza de Mano', life: '5 meses más', pct: 50 },
              { name: 'Filtro de Agua Grado Médico', life: '8 meses más', pct: 75 }
            ].map((part, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-slate-700 font-medium">
                  <span>{part.name}</span>
                  <span className="text-slate-500">{part.life}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div style={{ width: `${part.pct}%` }} className="h-full bg-[#1C3177] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Activos Clínicos */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Control de Sillones y Equipos Clínicos
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Activo</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4">Último Mantenimiento</th>
                <th className="py-3 px-4">Próximo</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {[
                { name: 'Unidad Dental A1', ubic: 'Clínica Principal - Sala 1', ult: '2026-04-15', prox: '2026-10-25', status: 'Programado', resp: 'Dra. López' },
                { name: 'Unidad Dental A2', ubic: 'Clínica Principal - Sala 2', ult: '2026-05-10', prox: '2026-11-10', status: 'Programado', resp: 'Dra. López' },
                { name: 'Autoclave Digital Tuttnauer', ubic: 'Esterilización Central', ult: '2026-08-01', prox: '2026-11-01', status: 'Al día', resp: 'Lic. Pérez' },
                { name: 'Sensor Radiografía RVG 6200', ubic: 'Radiología Oral', ult: '2026-07-20', prox: '2026-12-20', status: 'Al día', resp: 'Dr. Morales' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#3DAA5C]" />
                    <span>{row.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.ubic}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{row.ult}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{row.prox}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-[#2D8246]">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{row.resp}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button className="p-1 hover:text-[#1C3177] transition-colors" title="Ver" aria-label="Ver"><Eye className="h-3.5 w-3.5" /></button>
                      <button className="p-1 hover:text-amber-600 transition-colors" title="Editar" aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="p-1 hover:text-rose-600 transition-colors" title="Eliminar" aria-label="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
