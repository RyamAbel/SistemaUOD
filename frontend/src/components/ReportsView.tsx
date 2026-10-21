'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Sparkles,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Cpu,
  Monitor,
  Printer,
  Zap,
  HardDrive,
  Building2
} from 'lucide-react';
import { RESUMEN_INVENTARIO, CATEGORIAS_ORIGINALES } from '@/lib/inventoryData';

interface ReportsViewProps {
  onOpenAi: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenAi }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'consumo' | 'predicciones' | 'anomalias' | 'auditoria'>('general');

  // Datos reales del levantamiento TI 2026 organizados por categoría
  const categoriasAnalisis = [
    { cat: 'Computación', val: 78, pred: 85, equipos: 84 },
    { cat: 'Monitores', val: 88, pred: 92, equipos: 76 },
    { cat: 'Periféricos', val: 95, pred: 98, equipos: 92 },
    { cat: 'Impresión', val: 65, pred: 70, equipos: 24 },
    { cat: 'UPS / Respaldo', val: 82, pred: 88, equipos: 45 },
    { cat: 'Redes / Tel', val: 90, pred: 95, equipos: 12 },
    { cat: 'Audiovisual', val: 50, pred: 60, equipos: 8 }
  ];

  // Artículos tecnológicos reales del levantamiento UOD 2026
  const articulosReporte = [
    { id: 'SKU-LAP-001', desc: 'Laptop DELL INSPIRON 15 Core i7 16GB', cat: 'Computación y Equipos', stock: '2', cons: '98% En uso', up: true },
    { id: 'SKU-MON-109', desc: 'Monitor LENOVO ThinkVision 22"', cat: 'Pantallas y Monitores', stock: '1', cons: '100% En uso', up: true },
    { id: 'SKU-IMP-039', desc: 'Impresora RICOH Multifuncional de Red', cat: 'Impresión y Digitalización', stock: '1', cons: 'Alto volumen', up: true },
    { id: 'SKU-UPS-110', desc: 'Ups FORZA NT SERIES 750V', cat: 'Energía y Respaldo (UPS)', stock: '1', cons: 'Operativo', up: true },
    { id: 'SKU-TEL-003', desc: 'Teléfono IPHONE 13 PRO 256GB', cat: 'Redes y Telecomunicaciones', stock: '1', cons: 'Asignado', up: false },
    { id: 'SKU-CPU-108', desc: 'Cpu BRE NUC BRE N6M', cat: 'Computación y Equipos', stock: '2', cons: '100% En uso', up: true }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1C3177]" />
            Reportes y Analítica de Activos TI (Levantamiento 2026)
          </h2>
          <p className="text-xs text-slate-500">
            Analítica de asignación por departamento, pronóstico de renovación de hardware y control de activos físicos UOD.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs">
          <Calendar className="h-3.5 w-3.5 text-[#1C3177]" />
          <span className="font-semibold">Inventario Activo 2026</span>
        </div>
      </div>

      {/* 5 Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
        {(['general', 'consumo', 'predicciones', 'anomalias', 'auditoria'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 px-3 capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'anomalias' ? 'Anomalías' : tab === 'consumo' ? 'Distribución' : tab}
          </button>
        ))}
      </div>

      {/* 4 Summary Cards Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Equipos */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 relative shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C3177] mb-1 font-bold">
            <span>Parque Tecnológico</span>
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] text-[#1C3177] font-bold">
              UOD
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{RESUMEN_INVENTARIO.totalEquipos} Equipos</div>
          <p className="text-[11px] text-slate-500 mt-1">{RESUMEN_INVENTARIO.enUso} operativos en uso</p>
        </div>

        {/* Card 2: Ubicaciones */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="text-xs text-[#2D8246] font-bold mb-1 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#3DAA5C]" />
            <span>Cobertura Institucional</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{RESUMEN_INVENTARIO.totalUbicaciones} Ubicaciones</div>
          <p className="text-[11px] text-slate-500 mt-1">Clínicas, Aulas y Oficinas</p>
        </div>

        {/* Card 3: Modelos Registrados */}
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 relative shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#0891B2] mb-1 font-bold">
            <span>Catálogo Homologado</span>
            <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] text-[#0891B2] font-bold">
              AI
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{RESUMEN_INVENTARIO.totalModelos} Modelos</div>
          <p className="text-[11px] text-slate-500 mt-1">7 categorías tecnológicas</p>
        </div>

        {/* Card 4: Equipos Dañados / En Revisión */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="text-xs text-amber-700 font-bold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Requieren Atención</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{RESUMEN_INVENTARIO.danadosOInactivos} Equipos</div>
          <p className="text-[11px] text-slate-500 mt-1">Para desincorporación o arreglo</p>
        </div>
      </div>

      {/* Main Graph & AI Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Bar Chart Representation */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Distribución y Tasa de Uso por Categoría TI
              </h3>
              <p className="text-[11px] text-slate-500">
                Porcentaje de operatividad actual vs proyección de capacidad
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#1C3177]" /> Operatividad Actual
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#06B6D4]" /> Proyección IA
              </span>
            </div>
          </div>

          {/* Visual Dual Line & Bar Chart Representation */}
          <div className="h-56 w-full flex items-end justify-between gap-4 pt-6 px-4">
            {categoriasAnalisis.map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <div
                    style={{ height: `${col.val}%` }}
                    className="w-5 bg-[#1C3177] rounded-t-sm"
                    title={`Operatividad: ${col.val}%`}
                  />
                  <div
                    style={{ height: `${col.pred}%` }}
                    className="w-5 bg-[#06B6D4] rounded-t-sm"
                    title={`Proyección: ${col.pred}%`}
                  />
                </div>
                <span className="text-[10px] text-slate-600 text-center font-semibold truncate w-full">
                  {col.cat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right AI Assistant Queries Panel */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#1C3177] font-bold text-xs mb-3">
              <Sparkles className="h-4 w-4 text-[#06B6D4]" />
              <span>AI Assistant - Consultas Rápidas</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={onOpenAi}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/30 transition-colors font-medium"
              >
                "¿Cuántas laptops Dell y Lenovo tenemos en uso?"
              </button>
              <button
                onClick={onOpenAi}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/30 transition-colors font-medium"
              >
                "Listar los equipos asignados al departamento de Tecnología"
              </button>
              <button
                onClick={onOpenAi}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/30 transition-colors font-medium"
              >
                "¿Qué ubicaciones tienen mayor concentración de monitores?"
              </button>
            </div>
          </div>

          <button
            onClick={onOpenAi}
            className="w-full rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white font-bold py-2.5 text-xs transition-colors shadow-xs"
          >
            Consultar con Asistente IA
          </button>
        </div>
      </div>

      {/* Table with Export Buttons */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Detalle de Modelos y Control de Activos TI Reales
          </h3>
          <span className="text-xs text-slate-500">
            Total referencias: <strong>{RESUMEN_INVENTARIO.totalModelos}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">SKU Institucional</th>
                <th className="py-3 px-4">Descripción del Equipo</th>
                <th className="py-3 px-4">Categoría TI</th>
                <th className="py-3 px-4 text-right">Existencias</th>
                <th className="py-3 px-4 text-center">Estado Operativo</th>
                <th className="py-3 px-4 text-center">Exportar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {articulosReporte.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-[#1C3177] font-bold">{row.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{row.desc}</td>
                  <td className="py-3 px-4 text-slate-600">{row.cat}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">{row.stock}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[#2D8246] font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {row.cons}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold">
                      <button className="rounded px-2 py-1 bg-slate-50 hover:bg-[#1C3177] hover:text-white transition-colors border border-slate-200 text-slate-700">
                        PDF
                      </button>
                      <button className="rounded px-2 py-1 bg-slate-50 hover:bg-[#3DAA5C] hover:text-white transition-colors border border-slate-200 text-slate-700">
                        Excel
                      </button>
                      <button className="rounded px-2 py-1 bg-slate-50 hover:bg-[#1C3177] hover:text-white transition-colors border border-slate-200 text-slate-700">
                        CSV
                      </button>
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
