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
    { name: 'Adan Aumin', email: 'admin-pxio@gmail.com', role: 'Super Administrador', lastAccess: '23 Apr 2026 07:36', status: 'Activo', active: true },
    { name: 'Marthen Wasiliez', email: 'admin-rm@gmail.com', role: 'Administrador', lastAccess: '27 Apr 2026 03:38', status: 'Inactivo', active: false },
    { name: 'Bava Brofenn', email: 'admin@gmail.com', role: 'Auditor', lastAccess: '27 Apr 2026 08:49', status: 'Inactivo', active: false },
  ];

  const rolesList = [
    { title: 'Super Administrador', perms: 'Todo el sistema sin restricciones', color: 'border-emerald-500/40 text-emerald-300' },
    { title: 'Administrador de Inventario', perms: 'Gestionar, Ver catálogo y compras', color: 'border-cyan-500/40 text-cyan-300' },
    { title: 'Encargado de Almacén', perms: 'Ver, Mover existencias y conteos', color: 'border-indigo-500/40 text-indigo-300' },
    { title: 'Solicitante', perms: 'Solicitar consumibles y ver asignados', color: 'border-blue-500/40 text-blue-300' },
    { title: 'Auditor', perms: 'Ver Reportes y Bitácora de Auditoría', color: 'border-amber-500/40 text-amber-300' },
    { title: 'Invitado', perms: 'Ver Limitado sin permisos de edición', color: 'border-slate-600 text-slate-300' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          Configuración del Sistema
        </h2>
        <p className="text-xs text-slate-400">
          Administración de accesos institucionales, políticas de seguridad 2FA y parámetros de IA.
        </p>
      </div>

      {/* Subtabs Matching Page 1 Top Screenshot */}
      <div className="flex items-center gap-1 border-b border-slate-800 text-xs font-semibold overflow-x-auto no-scrollbar">
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
                ? 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section: Usuarios Table Matching Screenshot Exactly */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Usuarios
          </h3>
          <button className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500">
            + Invitar Usuario
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Nombre</th>
                <th className="py-3 px-4 font-semibold">Correo</th>
                <th className="py-3 px-4 font-semibold">Rol</th>
                <th className="py-3 px-4 font-semibold">Último Acceso</th>
                <th className="py-3 px-4 font-semibold text-center">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px] font-medium">
              {usersList.map((u, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                  <td className="py-3 px-4 text-slate-400">{u.email}</td>
                  <td className="py-3 px-4 text-slate-200">{u.role}</td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{u.lastAccess}</td>
                  <td className="py-3 px-4 text-center">
                    {u.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[9px] font-bold text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Inactivo
                      </span>
                    )}
                  </td>
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

      {/* Section: Roles 6 Cards Matching Screenshot Exactly */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Roles y Privilegios
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {rolesList.map((r, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3.5 flex flex-col justify-between bg-[#0F172A]/70 ${r.color}`}
            >
              <div>
                <h4 className="font-bold text-xs text-white mb-1">{r.title}</h4>
                <p className="text-[10px] text-slate-400">{r.perms}</p>
              </div>
              <span className="mt-3 text-[9px] uppercase font-bold text-emerald-400">Configurado</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Seguridad (Left) + IA Controls (Right) Matching Screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seguridad */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            Seguridad & Sesiones
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">2FA Autenticación en Dos Pasos</div>
              <div className="text-[10px] text-slate-400">Exigir verificación Google Workspace</div>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className="text-emerald-400"
            >
              {twoFactorEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-slate-600" />}
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registro de Auditoría Reciente
            </span>
            {[
              { text: 'Registro de Auditoría - Encargados de Almacén', time: '3 horas ago' },
              { text: 'Registro de Auditoría - Acciones de personal', time: '4 horas ago' },
              { text: 'Auditoría mensual cerrada', time: '1 día ago' }
            ].map((log, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] text-slate-300 p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                <span>{log.text}</span>
                <span className="text-slate-500 font-mono">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* IA Assistant Parameters Matching Screenshot */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-slate-900 p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-400" />
            Parámetros del Asistente IA (Gemini)
          </h3>

          <div>
            <label className="text-[11px] text-slate-300 block mb-1 font-medium">Tone Selector</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Formal', 'Casual', 'Neutral'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAiTone(t)}
                  className={`rounded-xl py-1.5 text-xs font-semibold transition-all ${
                    aiTone === t
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'border border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Confidence Threshold</span>
              <span className="font-mono text-cyan-400 font-bold">{confidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">Automatic Recommendations Toggle</div>
              <div className="text-[10px] text-slate-400">Sugerir traslados preventivos de stock</div>
            </div>
            <button
              onClick={() => setAutoRecommendations(!autoRecommendations)}
              className="text-cyan-400"
            >
              {autoRecommendations ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
