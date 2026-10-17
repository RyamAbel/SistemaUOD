'use client';

import React from 'react';
import { Sparkles, Bell, Search, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onOpenAi: () => void;
  aiOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAi, aiOpen }) => {
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Admin UOD';
  const email = user?.email || 'admin@sistemauod.edu.do';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#0B1020]/90 px-6 backdrop-blur-md">
      {/* Brand & Sede */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/20">
            <span className="font-bold text-white text-lg tracking-wider">UOD</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">SIIA • SistemaUOD</h1>
              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-400 border border-indigo-500/30">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">Campus Central • Santo Domingo, R.D.</p>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex items-center w-96 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar artículos, SKU, activos o movimientos... (Ctrl + K)"
          className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 pl-10 pr-12 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right Actions: AI Assistant Button, Alerts, User Profile */}
      <div className="flex items-center gap-3">
        {/* IA Assistant Quick Trigger */}
        <button
          onClick={onOpenAi}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            aiOpen
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-900/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950/40 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/20'
          }`}
        >
          <Sparkles className={`h-4 w-4 ${aiOpen ? 'text-slate-950' : 'text-cyan-400 animate-pulse'}`} />
          <span>Asistente IA</span>
          <span className="flex h-2 w-2 rounded-full bg-cyan-400"></span>
        </button>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
            2
          </span>
        </button>

        {/* Google OAuth Profile Badge & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-9 w-9 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-900 border border-indigo-600 text-xs font-semibold text-white">
              {initials}
            </div>
          )}

          <div className="hidden lg:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-200">{displayName}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-[11px] text-slate-400">{email}</span>
          </div>

          {user && (
            <button
              onClick={() => signOut()}
              title="Cerrar sesión"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
