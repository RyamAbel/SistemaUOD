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
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-emerald-400" />
            Mantenimiento Programado de Equipos
          </h2>
          <p className="text-xs text-slate-400">
            Control preventivo y correctivo de sillones odontológicos, autoclaves y turbinas clínicas.
          </p>
        </div>

        {/* Top Alert Pill Matching Screenshot */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/40 px-3.5 py-1.5 flex items-center gap-2 text-xs text-blue-200">
          <ShieldAlert className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Alertas: Alerta de mantenimiento programado para <strong>Unidad Dental A1</strong></span>
        </div>
      </div>

      {/* Main Grid: Calendar (Left) + Unit Health Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar & Monthly Plan */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Septiembre 2026</h3>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium px-2 text-slate-300">Mes Completo</span>
              <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
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
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : hasEventA2
                      ? 'border-cyan-500/40 bg-cyan-950/20'
                      : isOverdue
                      ? 'border-rose-500/40 bg-rose-950/20'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono text-slate-400 text-[10px]">{day}</span>
                  {hasEventA1 && (
                    <span className="text-[8px] font-bold rounded bg-emerald-500 text-slate-950 px-1 py-0.5 truncate block">
                      Unidad A1
                    </span>
                  )}
                  {hasEventA2 && (
                    <span className="text-[8px] font-bold rounded bg-cyan-500 text-slate-950 px-1 py-0.5 truncate block">
                      Unidad A2
                    </span>
                  )}
                  {isOverdue && (
                    <span className="text-[8px] font-bold rounded bg-rose-500 text-white px-1 py-0.5 truncate block">
                      Vencido
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 4 Status Pills Below Calendar Matching Screenshot */}
          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-center">
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-2.5">
              <span className="text-xs text-blue-300 font-medium block">Próximos</span>
              <strong className="text-lg font-bold text-blue-400 font-mono">5</strong>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-2.5">
              <span className="text-xs text-cyan-300 font-medium block">En Curso</span>
              <strong className="text-lg font-bold text-cyan-400 font-mono">2</strong>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2.5">
              <span className="text-xs text-emerald-300 font-medium block">Completados</span>
              <strong className="text-lg font-bold text-emerald-400 font-mono">12</strong>
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-2.5">
              <span className="text-xs text-rose-300 font-medium block">Vencidos</span>
              <strong className="text-lg font-bold text-rose-400 font-mono">1</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Unidad Dental A1 Health & AI Prediction Panel */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#0F172A]/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white">Unidad Dental A1</h3>
              <p className="text-[11px] text-slate-400">Sillón Odontológico Quirúrgico • Sala 1</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Operativo
            </span>
          </div>

          {/* Subtabs: Checklist, Historial, Partes Usadas */}
          <div className="flex items-center gap-1 border-b border-slate-800 text-[11px] font-medium">
            {(['checklist', 'historial', 'partes'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  activeTab === t
                    ? 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'partes' ? 'Partes Usadas' : t}
              </button>
            ))}
          </div>

          {/* Checklist items with green checkmarks */}
          <div className="space-y-2 text-xs text-slate-300">
            {[
              'Checklist bases unidad e hidráulica',
              'Checklist formacion y presurización',
              'Checklist compresor de aire y filtros',
              'Limpieza de mangueras y eyectores',
              'Inspección de micromotor y turbina',
              'Calibración de lámpara LED quirúrgica'
            ].map((check, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px]">{check}</span>
              </div>
            ))}
          </div>

          {/* AI Life Expectancy Prediction Box */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/40 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>AI Predicción de Vida Útil</span>
            </div>
            <div className="text-sm font-extrabold text-white">
              Vida útil estimada: <span className="text-emerald-400">18 meses más</span>
            </div>
            <p className="text-[10px] text-blue-200">
              El análisis de ciclos de trabajo indica un desgaste normal dentro de tolerancias.
            </p>
          </div>

          {/* Partes Usadas Progress Bars Matching Screenshot */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Desgaste de Componentes
            </span>
            {[
              { name: 'Válvula Reguladora de Aire', life: '2 meses más', pct: 25 },
              { name: 'Manguera de Pieza de Mano', life: '5 meses más', pct: 50 },
              { name: 'Filtro de Agua Grado Médico', life: '8 meses más', pct: 75 }
            ].map((part, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>{part.name}</span>
                  <span className="text-slate-400">{part.life}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div style={{ width: `${part.pct}%` }} className="h-full bg-cyan-400 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Activos Clínicos Matching Screenshot Exactly */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Control de Sillones y Equipos Clínicos
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Activo</th>
                <th className="py-3 px-4 font-semibold">Ubicación</th>
                <th className="py-3 px-4 font-semibold">Último Mantenimiento</th>
                <th className="py-3 px-4 font-semibold">Próximo</th>
                <th className="py-3 px-4 font-semibold text-center">Estado</th>
                <th className="py-3 px-4 font-semibold">Responsable</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px] font-medium">
              {[
                { name: 'Unidad Dental A1', ubic: 'Sala 1', ult: '2023-10-15', prox: '2024-04-15', status: 'Programado', resp: 'Dra. López' },
                { name: 'Unidad Dental A2', ubic: 'Sala 1', ult: '2023-10-15', prox: '2024-04-15', status: 'Programado', resp: 'Dra. López' },
                { name: 'Unidad Dental A3', ubic: 'Sala 1', ult: '2023-10-15', prox: '2024-04-15', status: 'Programado', resp: 'Dra. López' },
                { name: 'Unidad Dental A4', ubic: 'Sala 1', ult: '2023-10-15', prox: '2024-04-15', status: 'Programado', resp: 'Dra. López' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{row.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{row.ubic}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{row.ult}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{row.prox}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block rounded bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{row.resp}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button className="p-1 hover:text-white" title="Ver"><Eye className="h-3.5 w-3.5" /></button>
                      <button className="p-1 hover:text-amber-400" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="p-1 hover:text-rose-400" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
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
