'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Moon,
  Sun,
  Sparkles,
  LogOut,
  User,
  Settings,
  X,
  AlertTriangle,
  Package,
  Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onOpenAi: () => void;
  aiOpen: boolean;
  alertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAi, aiOpen, alertCount = 0 }) => {
  const { user, perfil, rol, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayName = perfil?.nombreCompleto || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Personal UOD';
  const displayRol = (perfil?.rol || rol || 'consulta').replace('_', ' ').toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifications = alertCount > 0 ? [
    { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Stock bajo detectado', detail: `${alertCount} artículos requieren reorden`, time: 'Ahora' },
    { icon: Package, color: 'text-[#1C3177]', bg: 'bg-blue-50 border-blue-200', label: 'Movimiento auditado', detail: 'Traslado MOV-2026-00105 registrado', time: '5 min' },
    { icon: Activity, color: 'text-[#3DAA5C]', bg: 'bg-emerald-50 border-emerald-200', label: 'Sistema operativo', detail: 'Todas las clínicas sincronizadas', time: '1 h' },
  ] : [];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white border-b border-slate-200 px-5 gap-4 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center h-12">
          <img
            src="/uod-logo.png"
            alt="Universidad Odontológica Dominicana"
            className="h-10 w-auto max-w-[160px] object-contain"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
          <span className="text-xs font-black text-[#1C3177] tracking-wider uppercase">SIIA</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#2D8246] border border-emerald-200">
            v1.0 UOD
          </span>
        </div>
      </div>

      {/* Search */}
      <div className={`flex items-center flex-1 max-w-lg mx-2 relative transition-all duration-200 ${searchFocused ? 'max-w-xl' : ''}`}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          id="global-search"
          placeholder="Buscar activos TI, clínicas, responsables, movimientos..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-10 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#1C3177] focus:ring-2 focus:ring-[#1C3177]/10 transition-all duration-200"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-500 font-mono shadow-xs hidden sm:flex items-center gap-0.5">
          ⌘K
        </kbd>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 shrink-0">

        {/* AI Button */}
        <button
          id="ai-assistant-btn"
          onClick={onOpenAi}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            aiOpen
              ? 'bg-[#1C3177] text-white shadow-md shadow-[#1C3177]/20 ring-2 ring-[#06B6D4]/30'
              : 'bg-cyan-50 text-[#0891B2] border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300'
          }`}
        >
          <Sparkles className={`h-3.5 w-3.5 ${aiOpen ? 'text-[#06B6D4]' : 'text-[#0891B2] animate-pulse'}`} />
          <span className="hidden md:inline">Asistente IA</span>
          <span className={`h-2 w-2 rounded-full ${aiOpen ? 'bg-[#06B6D4]' : 'bg-[#0891B2]'}`} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-btn"
            onClick={() => setNotifOpen(v => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all"
            aria-label="Ver notificaciones"
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-white">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 z-50 animate-fade-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-900">Notificaciones</span>
                <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Sin notificaciones activas</div>
                ) : notifications.map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className={`mt-0.5 h-7 w-7 rounded-lg ${n.bg} flex items-center justify-center shrink-0 border`}>
                        <Icon className={`h-3.5 w-3.5 ${n.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800">{n.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{n.detail}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0 mt-0.5">{n.time}</span>
                    </div>
                  );
                })}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                  <button className="text-[10px] text-[#1C3177] hover:text-[#2B4BA0] font-bold transition-colors">
                    Ver todas las alertas →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-btn"
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-90 transition-opacity"
            aria-label="Menú de usuario"
          >
            <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-[#1C3177]/20 bg-[#1C3177]/10 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-[#1C3177]">{initials}</span>
              )}
            </div>
            <div className="hidden lg:flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate">{displayName}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email || 'usuario@uod.edu.do'}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[9px] font-bold text-[#1C3177]">
                    {displayRol}
                  </span>
                </div>
              </div>
              <div className="py-1.5">
                {[
                  { icon: User, label: 'Mi perfil', color: 'text-slate-600' },
                  { icon: Settings, label: 'Configuración', color: 'text-slate-600' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button key={i} className="flex w-full items-center gap-3 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 py-1.5">
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-3 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
