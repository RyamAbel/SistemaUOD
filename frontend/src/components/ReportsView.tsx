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
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1C3177]" />
            Reportes y Análisis Inteligente
          </h2>
          <p className="text-xs text-slate-500">
            Analítica de consumo clínico, pronóstico de compras asistido por Gemini y detección de anomalías.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs">
          <Calendar className="h-3.5 w-3.5 text-[#1C3177]" />
          <span className="font-semibold">01/08/2026 - 31/10/2026</span>
        </div>
      </div>

      {/* 5 Subtabs: General, Consumo, Predicciones, Anomalías, Auditoría */}
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
            {tab === 'anomalias' ? 'Anomalías' : tab}
          </button>
        ))}
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tendencia Consumo */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 relative shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C3177] mb-1 font-bold">
            <span>Tendencia de consumo Q3</span>
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] text-[#1C3177] font-bold">
              AI
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">Aumento del 12% en insumos dentales</div>
          <p className="text-[11px] text-slate-500 mt-1">Incremento de pacientes en clínica</p>
        </div>

        {/* Card 2: Rotación Lenta */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="text-xs text-amber-800 font-bold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Artículos con rotación lenta</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">5 artículos identificados</div>
          <p className="text-[11px] text-slate-500 mt-1">Riesgo potencial de vencimiento</p>
        </div>

        {/* Card 3: Predicción de Reposición */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 relative shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#2D8246] mb-1 font-bold">
            <span>Predicción de reposición</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] text-[#2D8246] font-bold">
              AI
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">3 artículos necesitan reorden</div>
          <p className="text-[11px] text-slate-500 mt-1">Fecha sugerida: antes del 25/10</p>
        </div>

        {/* Card 4: Anomalía Detectada */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <div className="text-xs text-rose-700 font-bold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>Anomalía detectada en stock</span>
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1">2 registros inconsistentes</div>
          <p className="text-[11px] text-slate-500 mt-1">Diferencia entre conteo físico y sistema</p>
        </div>
      </div>

      {/* Main Row: Forecast Chart (Left) + AI Assistant Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Valor del Inventario con Pronóstico de IA */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Valor del Inventario con Pronóstico de IA (Q4 2026)
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#1C3177]" /> Valor histórico
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#06B6D4]" /> Pronóstico IA
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#2D8246]">
                <span className="h-2 w-2 rounded-full bg-[#3DAA5C]" /> Confianza 92%
              </span>
            </div>
          </div>

          {/* Visual Dual Line & Bar Chart Representation */}
          <div className="h-56 w-full flex items-end justify-between gap-4 pt-6 px-4">
            {[
              { cat: 'Biomateriales', val: 75, pred: 88 },
              { cat: 'Implantes', val: 90, pred: 110 },
              { cat: 'Farmacología', val: 45, pred: 55 },
              { cat: 'Instrumental', val: 60, pred: 65 },
              { cat: 'Equipos Mayores', val: 80, pred: 85 }
            ].map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <div
                    style={{ height: `${col.val}%` }}
                    className="w-4 bg-[#1C3177] rounded-t-sm"
                    title={`Histórico: ${col.val}%`}
                  />
                  <div
                    style={{ height: `${col.pred}%` }}
                    className="w-4 bg-[#06B6D4] rounded-t-sm"
                    title={`Predicción: ${col.pred}%`}
                  />
                </div>
                <span className="text-[10px] text-slate-500 text-center font-medium truncate w-full">
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
                "Genera un reporte de consumo del último trimestre"
              </button>
              <button
                onClick={onOpenAi}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/30 transition-colors font-medium"
              >
                "¿Cuáles son los artículos con mayor consumo clínico?"
              </button>
              <button
                onClick={onOpenAi}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-[#1C3177] hover:bg-blue-50/30 transition-colors font-medium"
              >
                "Previsión de stock para el próximo mes"
              </button>
            </div>
          </div>

          <button
            onClick={onOpenAi}
            className="w-full rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white font-bold py-2.5 text-xs transition-colors shadow-xs"
          >
            Abrir Asistente Completo
          </button>
        </div>
      </div>

      {/* Table with Export Buttons */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Detalle de Artículos y Análisis de Consumo
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">ID Artículo</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Stock Actual</th>
                <th className="py-3 px-4 text-right">Consumo Q3</th>
                <th className="py-3 px-4 text-center">Tendencia</th>
                <th className="py-3 px-4 text-center">Exportar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {[
                { id: '1010108', desc: 'Resina Compuesta A2 (Filtek)', cat: 'Biomateriales', stock: '200', cons: '12%', up: true },
                { id: '1013010', desc: 'Implante Titanio Grado 5', cat: 'Implantes', stock: '70', cons: '30%', up: true },
                { id: '1013012', desc: 'Guantes Nitrilo M (Caja 100)', cat: 'Protección', stock: '30', cons: '20%', up: false },
                { id: '1013148', desc: 'Pasta Profilaxis con Flúor', cat: 'Profilaxis', stock: '10', cons: '23%', up: false }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 font-bold">{row.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{row.desc}</td>
                  <td className="py-3 px-4 text-slate-500">{row.cat}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">{row.stock}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#1C3177] font-bold">{row.cons}</td>
                  <td className="py-3 px-4 text-center">
                    {row.up ? (
                      <span className="inline-flex items-center gap-0.5 text-[#2D8246] font-bold text-[10px]">
                        <TrendingUp className="h-3 w-3" /> +12%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold text-[10px]">
                        <TrendingDown className="h-3 w-3" /> -5%
                      </span>
                    )}
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
