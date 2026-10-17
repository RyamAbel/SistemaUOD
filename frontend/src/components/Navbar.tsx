'use client';

import React from 'react';
import Image from 'next/image';
import {
  Search,
  Bell,
  ChevronDown,
  Globe,
  Moon,
  Sparkles,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onOpenAi: () => void;
  aiOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAi, aiOpen }) => {
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Admin UOD';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#0B1120] px-6">
      {/* Brand: UOD Dental Logo + SIIA */}
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-28">
          <Image
            src="/logo-uod.png"
            alt="UOD"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
          <span className="text-xs font-bold text-slate-300 tracking-wider">SIIA</span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            Odontología
          </span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex items-center w-full max-w-md mx-6 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar artículos, categorías, ubicaciones..."
          className="w-full rounded-xl border border-slate-700/60 bg-slate-900/90 pl-10 pr-12 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right Controls: AI, Notifications, Profile, Language, Theme */}
      <div className="flex items-center gap-3">
        {/* AI Assistant Button */}
        <button
          onClick={onOpenAi}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
            aiOpen
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/20'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span className="hidden md:inline">Asistente IA</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
            4
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-emerald-400">UO</span>
            )}
          </div>
          <div className="hidden lg:flex items-center gap-1.5 cursor-pointer">
            <span className="text-xs font-semibold text-slate-200">{displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Language Selector: ES */}
        <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer pl-1">
          <Globe className="h-3.5 w-3.5" />
          <span>ES</span>
          <ChevronDown className="h-3 w-3" />
        </div>

        {/* Theme Dark/Light Icon */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-amber-400 transition-colors">
          <Moon className="h-4 w-4" />
        </button>

        {/* Logout if authenticated */}
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
    </header>
  );
};
