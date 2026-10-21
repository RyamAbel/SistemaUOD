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
  ShieldAlert,
  Laptop,
  Printer,
  Server,
  Zap,
  Building2,
  User
} from 'lucide-react';
import { ACTIVOS_ORIGINALES } from '@/lib/inventoryData';

export const MaintenanceView: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState('EQ-01 - Laptop DELL Inspiron 15');
  const [activeTab, setActiveTab] = useState<'checklist' | 'historial' | 'partes'>('checklist');

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  // Equipos representativos del inventario real para mantenimiento
  const equiposMantenimiento = [
    {
      placa: 'EQ-01',
      name: 'Laptop DELL INSPIRON 15',
      tipo: 'Laptop / Computación',
      ubic: 'TECNOLOGIA',
      ult: '2026-08-10',
      prox: '2026-10-25',
      status: 'Programado',
      resp: 'RYAM',
      icon: Laptop
    },
    {
      placa: 'EQ-02',
      name: 'Telefono NEO NUBIA 03 Z2464N',
      tipo: 'Smartphone Institucional',
      ubic: 'TECNOLOGIA',
      ult: '2026-09-01',
      prox: '2026-11-15',
      status: 'Al día',
      resp: 'ANDREW',
      icon: Zap
    },
    {
      placa: 'EQ-39',
      name: 'Impresora RICOH Multifuncional',
      tipo: 'Impresión y Digitalización',
      ubic: 'REGISTRO RICOH',
      ult: '2026-07-20',
      prox: '2026-11-01',
      status: 'Al día',
      resp: 'Directora Registro',
      icon: Printer
    },
    {
      placa: 'EQ-29',
      name: 'PC Laboratorio Cómputo Core i7',
      tipo: 'Computación y Equipos',
      ubic: 'LABORATORIO COMPUTO',
      ult: '2026-06-15',
      prox: '2026-10-28',
      status: 'Programado',
      resp: 'Soporte Técnico',
      icon: Server
    },
    {
      placa: 'EQ-12',
      name: 'Computadora Clínica B (Materiales)',
      tipo: 'Computación y Equipos',
      ubic: 'CLINICA B MATERIALES',
      ult: '2026-05-12',
      prox: '2026-11-20',
      status: 'Al día',
      resp: 'Encargada Clínica B',
      icon: Laptop
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Top Alert Pill */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#1C3177]" />
            Mantenimiento y Soporte Técnico de Equipos TI
          </h2>
          <p className="text-xs text-slate-500">
            Control preventivo y correctivo de laptops, servidores, impresoras de red y UPS de la Universidad Odontológica Dominicana.
          </p>
        </div>

        {/* Top Alert Pill */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-1.5 flex items-center gap-2 text-xs text-[#1C3177]">
          <ShieldAlert className="h-4 w-4 text-[#1C3177] shrink-0" />
          <span>Alertas: Mantenimiento preventivo agendado para <strong>EQ-01 (Laptop DELL)</strong></span>
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
              const hasEventEQ01 = day === 25;
              const hasEventEQ29 = day === 28;
              const hasEventBackup = day === 15;

              return (
                <div
                  key={day}
                  className={`min-h-[52px] rounded-lg border p-1 text-left flex flex-col justify-between transition-colors ${
                    hasEventEQ01
                      ? 'border-emerald-300 bg-emerald-50/60'
                      : hasEventEQ29
                      ? 'border-blue-300 bg-blue-50/60'
                      : hasEventBackup
                      ? 'border-cyan-300 bg-cyan-50/60'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="font-mono text-slate-500 text-[10px] font-bold">{day}</span>
                  {hasEventEQ01 && (
                    <span className="text-[8px] font-bold rounded bg-[#3DAA5C] text-white px-1 py-0.5 truncate block">
                      EQ-01 Dell
                    </span>
                  )}
                  {hasEventEQ29 && (
                    <span className="text-[8px] font-bold rounded bg-[#1C3177] text-white px-1 py-0.5 truncate block">
                      EQ-29 Lab
                    </span>
                  )}
                  {hasEventBackup && (
                    <span className="text-[8px] font-bold rounded bg-[#0891B2] text-white px-1 py-0.5 truncate block">
                      Test UPS
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
              <strong className="text-lg font-bold text-[#1C3177] font-mono">4</strong>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-2.5">
              <span className="text-xs text-[#0891B2] font-semibold block">En Revisión</span>
              <strong className="text-lg font-bold text-[#0891B2] font-mono">2</strong>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
              <span className="text-xs text-[#2D8246] font-semibold block">Completados</span>
              <strong className="text-lg font-bold text-[#2D8246] font-mono">18</strong>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
              <span className="text-xs text-slate-600 font-semibold block">Total Activos</span>
              <strong className="text-lg font-bold text-slate-900 font-mono">341</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Health & AI Prediction Panel */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="font-mono text-xs font-bold text-[#1C3177] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                EQ-01
              </span>
              <h3 className="font-bold text-sm text-slate-900 mt-1">Laptop DELL INSPIRON 15</h3>
              <p className="text-[11px] text-slate-500">Tecnología • Custodio: RYAM</p>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-[#2D8246]">
              Operativo
            </span>
          </div>

          {/* Subtabs */}
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
                {t === 'partes' ? 'Diagnóstico' : t}
              </button>
            ))}
          </div>

          {/* Checklist items */}
          <div className="space-y-2 text-xs text-slate-700">
            {[
              'Verificación de memoria RAM y temperatura CPU',
              'Inspección y salud de disco SSD NVMe',
              'Actualización de SO y parches institucionales',
              'Limpieza de ventiladores y pasta térmica',
              'Comprobación de conectividad a la red UOD'
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
              <span>Diagnóstico IA de Rendimiento</span>
            </div>
            <div className="text-sm font-black text-slate-900">
              Vida útil óptima estimada: <span className="text-[#2D8246]">36 meses más</span>
            </div>
            <p className="text-[11px] text-slate-600">
              La batería y los ciclos de carga del equipo se encuentran al 94% de su capacidad nominal.
            </p>
          </div>

          {/* Hardware Health Progress Bars */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
              Estado de Componentes
            </span>
            {[
              { name: 'Salud de Batería', status: '94% Capacidad', pct: 94 },
              { name: 'Vida Útil SSD NVMe', status: '98% Saludable', pct: 98 },
              { name: 'Eficiencia Térmica', status: 'Normal (42°C)', pct: 85 }
            ].map((part, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-slate-700 font-medium">
                  <span>{part.name}</span>
                  <span className="text-slate-500">{part.status}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div style={{ width: `${part.pct}%` }} className="h-full bg-[#1C3177] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Activos TI con Mantenimiento */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Control de Mantenimiento Preventivo de Activos TI Reales
          </h3>
          <span className="text-xs text-slate-500">
            Total activos en seguimiento: <strong>{equiposMantenimiento.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Placa / Activo</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Ubicación UOD</th>
                <th className="py-3 px-4">Última Revisión</th>
                <th className="py-3 px-4">Próxima Fecha</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Custodio Real</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {equiposMantenimiento.map((row, i) => {
                const IconComponent = row.icon;
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#1C3177] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                          {row.placa}
                        </span>
                        <span className="font-bold text-slate-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.tipo}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{row.ubic}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{row.ult}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{row.prox}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-[#2D8246]">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <User className="h-3.5 w-3.5 text-[#3DAA5C] shrink-0" />
                        <span>{row.resp}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button className="p-1 hover:text-[#1C3177] transition-colors" title="Ver" aria-label="Ver"><Eye className="h-3.5 w-3.5" /></button>
                        <button className="p-1 hover:text-amber-600 transition-colors" title="Editar" aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                        <button className="p-1 hover:text-rose-600 transition-colors" title="Eliminar" aria-label="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
