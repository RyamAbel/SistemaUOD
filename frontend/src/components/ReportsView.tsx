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
  ArrowRight
} from 'lucide-react';

interface ReportsViewProps {
  onOpenAi: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenAi }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'consumo' | 'predicciones' | 'anomalias' | 'auditoria'>('general');

  return (
    <div className="space-y-6">
      {/* Top Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Reportes y Análisis Inteligente
          </h2>
          <p className="text-xs text-slate-400">
            Analítica de consumo, pronóstico de compras asistido por Gemini y detección de anomalías.
          </p>
        </div>

        {/* Date Filter Matching Screenshot */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
          <span>01/07/2024 - 30/09/2024</span>
        </div>
      </div>

      {/* 5 Subtabs: General, Consumo, Predicciones, Anomalías, Auditoría */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-semibold overflow-x-auto no-scrollbar">
        {(['general', 'consumo', 'predicciones', 'anomalias', 'auditoria'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 px-3 capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'anomalias' ? 'Anomalías' : tab}
          </button>
        ))}
      </div>

      {/* 4 Summary Cards Matching Screenshot Exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tendencia Consumo */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/60 to-slate-900 p-4 relative shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-300 mb-1 font-semibold">
            <span>Tendencia de consumo Q3</span>
            <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-300 font-bold">
              AI
            </span>
          </div>
          <div className="text-sm font-bold text-white mt-1">Aumento del 12% en insumos dentales</div>
          <p className="text-[10px] text-slate-400 mt-1">Incremento de pacientes en clínica</p>
        </div>

        {/* Card 2: Rotación Lenta */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-4 shadow-lg">
          <div className="text-xs text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Artículos con rotación lenta</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">5 artículos identificados</div>
          <p className="text-[10px] text-slate-400 mt-1">Riesgo potencial de vencimiento</p>
        </div>

        {/* Card 3: Predicción de Reposición */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-4 relative shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-1 font-semibold">
            <span>Predicción de reposición</span>
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-300 font-bold">
              AI
            </span>
          </div>
          <div className="text-sm font-bold text-white mt-1">3 artículos necesitan reorden</div>
          <p className="text-[10px] text-slate-300 mt-1">Fecha sugerida: antes del 15/10</p>
        </div>

        {/* Card 4: Anomalía Detectada */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 shadow-lg">
          <div className="text-xs text-rose-300 font-semibold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Anomalía detectada en stock</span>
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">2 registros inconsistentes</div>
          <p className="text-[10px] text-slate-400 mt-1">Diferencia entre conteo físico y sistema</p>
        </div>
      </div>

      {/* Main Row: Forecast Chart (Left) + AI Assistant Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Valor del Inventario con Pronóstico de IA */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Valor del Inventario con Pronóstico de IA (Q3 2024)
            </h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Valor histórico
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Pronóstico IA
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Confianza 92%
              </span>
            </div>
          </div>

          {/* Visual Dual Line & Bar Chart Representation */}
          <div className="h-56 w-full flex items-end justify-between gap-4 pt-6 px-4">
            {[
              { cat: 'Biomateriales', val: 75, pred: 88 },
              { cat: 'Implantes', val: 90, pred: 110 },
              { cat: 'Farmacia', val: 45, pred: 55 },
              { cat: 'Instrumental', val: 60, pred: 65 },
              { cat: 'Equipos Mayores', val: 80, pred: 85 }
            ].map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <div
                    style={{ height: `${col.val}%` }}
                    className="w-4 bg-cyan-500/80 rounded-t-sm"
                    title={`Histórico: ${col.val}%`}
                  />
                  <div
                    style={{ height: `${col.pred}%` }}
                    className="w-4 bg-amber-500/80 rounded-t-sm border border-amber-400/50"
                    title={`Predicción: ${col.pred}%`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 text-center font-medium truncate w-full">
                  {col.cat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right AI Assistant Queries Panel Matching Screenshot */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#0F172A]/90 p-5 shadow-xl space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-3">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span>AI Assistant - Consultas Rápidas</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={onOpenAi}
                className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 hover:border-cyan-500/50 transition-colors"
              >
                "Genera un reporte de consumo del último trimestre"
              </button>
              <button
                onClick={onOpenAi}
                className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 hover:border-cyan-500/50 transition-colors"
              >
                "¿Cuáles son los artículos con mayor consumo clínico?"
              </button>
              <button
                onClick={onOpenAi}
                className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 hover:border-cyan-500/50 transition-colors"
              >
                "Previsión de stock para el próximo mes"
              </button>
            </div>
          </div>

          <button
            onClick={onOpenAi}
            className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 text-xs transition-colors shadow-md shadow-cyan-500/20"
          >
            Abrir Asistente Completo
          </button>
        </div>
      </div>

      {/* Table with Export Buttons: PDF, Excel, CSV Matching Screenshot */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Detalle de Artículos y Análisis de Consumo
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">ID Artículo</th>
                <th className="py-3 px-4 font-semibold">Descripción</th>
                <th className="py-3 px-4 font-semibold">Categoría</th>
                <th className="py-3 px-4 font-semibold text-right">Stock Actual</th>
                <th className="py-3 px-4 font-semibold text-right">Consumo Q3</th>
                <th className="py-3 px-4 font-semibold text-center">Tendencia</th>
                <th className="py-3 px-4 font-semibold text-center">Exportar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px] font-medium">
              {[
                { id: '1010108', desc: 'Resina Compuesta A2 (Filtek)', cat: 'Biomateriales', stock: '200', cons: '12%', up: true },
                { id: '1013010', desc: 'Implante Titanio Grado 5', cat: 'Implantes', stock: '70', cons: '30%', up: true },
                { id: '1013012', desc: 'Guantes Nitrilo M (Caja 100)', cat: 'Protección', stock: '30', cons: '20%', up: false },
                { id: '1013148', desc: 'Pasta Profilaxis con Flúor', cat: 'Profilaxis', stock: '10', cons: '23%', up: false }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{row.id}</td>
                  <td className="py-3 px-4 font-semibold text-white">{row.desc}</td>
                  <td className="py-3 px-4 text-slate-300">{row.cat}</td>
                  <td className="py-3 px-4 text-right font-bold text-white font-mono">{row.stock}</td>
                  <td className="py-3 px-4 text-right font-mono text-cyan-400 font-bold">{row.cons}</td>
                  <td className="py-3 px-4 text-center">
                    {row.up ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold text-[10px]">
                        <TrendingUp className="h-3 w-3" /> +12%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-rose-400 font-semibold text-[10px]">
                        <TrendingDown className="h-3 w-3" /> -5%
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold">
                      <button className="rounded px-2 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white transition-colors border border-slate-700">
                        PDF
                      </button>
                      <button className="rounded px-2 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white transition-colors border border-slate-700">
                        Excel
                      </button>
                      <button className="rounded px-2 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white transition-colors border border-slate-700">
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
