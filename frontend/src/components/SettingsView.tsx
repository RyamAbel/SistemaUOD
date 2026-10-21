'use client';

import React, { useState } from 'react';
import {
  Settings,
  Users,
  Shield,
  Bot,
  Bell,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  Lock,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'usuarios' | 'roles' | 'seguridad' | 'notificaciones' | 'integraciones' | 'ia'>('usuarios');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [autoRecommendations, setAutoRecommendations] = useState(true);
  const [aiTone, setAiTone] = useState<'Formal' | 'Casual' | 'Neutral'>('Formal');
  const [confidence, setConfidence] = useState(70);

  const usersList = [
    { name: 'Administrador UOD', email: 'admin@uod.edu.do', role: 'Super Administrador', lastAccess: '20 Oct 2026 21:05', status: 'Activo', active: true },
    { name: 'Ryam Abel', email: 'ryam@uod.edu.do', role: 'Gestor de Inventario', lastAccess: '20 Oct 2026 20:45', status: 'Activo', active: true },
    { name: 'Andrew', email: 'andrew@uod.edu.do', role: 'Soporte y Redes', lastAccess: '20 Oct 2026 19:10', status: 'Activo', active: true },
    { name: 'Soporte Técnico UOD', email: 'soporte@uod.edu.do', role: 'Operador de Almacén', lastAccess: '20 Oct 2026 17:30', status: 'Activo', active: true },
    { name: 'Auditoría Interna UOD', email: 'auditoria@uod.edu.do', role: 'Auditor Institucional', lastAccess: '19 Oct 2026 11:20', status: 'Activo', active: true }
  ];

  const rolesList = [
    { title: 'Super Administrador', perms: 'Acceso total y configuración del sistema SIIA', color: 'border-emerald-200 bg-emerald-50/50 text-[#2D8246]' },
    { title: 'Administrador de Inventario', perms: 'Altas, bajas, duplicación y configuración de catálogo', color: 'border-blue-200 bg-blue-50/50 text-[#1C3177]' },
    { title: 'Gestor de Inventario', perms: 'Aprobación de movimientos, traslados y ajustes de stock', color: 'border-cyan-200 bg-cyan-50/50 text-[#0891B2]' },
    { title: 'Encargado de Almacén', perms: 'Recepción de equipos, salidas y control de existencias', color: 'border-blue-200 bg-blue-50/50 text-[#2B4BA0]' },
    { title: 'Operador de Almacén', perms: 'Conteo físico de activos, escaneo QR y registro de series', color: 'border-indigo-200 bg-indigo-50/50 text-indigo-800' },
    { title: 'Auditor Institucional', perms: 'Inspección de bitácora inmutable de auditoría (Ley 172-13)', color: 'border-amber-200 bg-amber-50/50 text-amber-800' },
    { title: 'Consulta', perms: 'Visualización de catálogo y existencias sin permisos de escritura', color: 'border-slate-200 bg-slate-50 text-slate-700' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#1C3177]" />
          Configuración del Sistema SIIA
        </h2>
        <p className="text-xs text-slate-500">
          Administración de accesos institucionales UOD, políticas de seguridad y parámetros de IA.
        </p>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
        {[
          { id: 'general', label: 'General' },
          { id: 'usuarios', label: 'Usuarios' },
          { id: 'roles', label: 'Roles' },
          { id: 'seguridad', label: 'Seguridad' },
          { id: 'notificaciones', label: 'Notificaciones' },
          { id: 'integraciones', label: 'Integraciones' },
          { id: 'ia', label: 'IA' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 px-3.5 capitalize transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-[#1C3177] text-[#1C3177] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section: Usuarios Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Usuarios Institucionales
          </h3>
          <button className="rounded-xl bg-[#3DAA5C] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#2D8246] transition-colors shadow-xs">
            + Invitar Usuario
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Correo Institucional</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Último Acceso</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {usersList.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{u.role}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[10px]">{u.lastAccess}</td>
                  <td className="py-3 px-4 text-center">
                    {u.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-bold text-[#2D8246]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3DAA5C]" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[9px] font-bold text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Inactivo
                      </span>
                    )}
                  </td>
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

      {/* Section: Roles 6 Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Roles y Privilegios
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {rolesList.map((r, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3.5 flex flex-col justify-between shadow-xs ${r.color}`}
            >
              <div>
                <h4 className="font-bold text-xs text-slate-900 mb-1">{r.title}</h4>
                <p className="text-[10px] text-slate-600">{r.perms}</p>
              </div>
              <span className="mt-3 text-[9px] uppercase font-bold text-[#2D8246]">Configurado</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Seguridad (Left) + IA Controls (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seguridad */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#1C3177]" />
            Seguridad & Sesiones Institucionales
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-900">Google OAuth 2.0 + 2FA Obligatorio</div>
              <div className="text-[11px] text-slate-500">Exigir inicio de sesión exclusivo @uod.edu.do</div>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className="text-[#3DAA5C]"
              aria-label="Alternar doble factor"
            >
              {twoFactorEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Registro de Auditoría Reciente (Ley 172-13)
            </span>
            {[
              { text: 'Bitácora: Traslado MOV-2026-00105 auditado', time: '5 min ago' },
              { text: 'Bitácora: Sesión iniciada por Admin UOD', time: '1 hora ago' },
              { text: 'Auditoría: Verificación automática de stock completada', time: '4 horas ago' }
            ].map((log, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium">{log.text}</span>
                <span className="text-slate-400 font-mono text-[10px]">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* IA Assistant Parameters */}
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/30 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#0891B2] uppercase tracking-wider flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#06B6D4]" />
            Parámetros del Asistente IA (Gemini 3.8 Flash)
          </h3>

          <div>
            <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Tono de Interacción</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Formal', 'Casual', 'Neutral'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAiTone(t)}
                  className={`rounded-xl py-1.5 text-xs font-bold transition-all ${
                    aiTone === t
                      ? 'bg-[#1C3177] text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-700 mb-1 font-medium">
              <span>Umbral de Confianza para Sugerencias</span>
              <span className="font-mono text-[#1C3177] font-bold">{confidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-[#1C3177] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div>
              <div className="text-xs font-bold text-slate-900">Recomendaciones Preventivas Activas</div>
              <div className="text-[11px] text-slate-500">Proponer traslados para evitar quiebre de stock</div>
            </div>
            <button
              onClick={() => setAutoRecommendations(!autoRecommendations)}
              className="text-[#3DAA5C]"
              aria-label="Alternar recomendaciones automáticas"
            >
              {autoRecommendations ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
