'use client';

import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Table,
  AlignJustify,
  Bell,
  Mail,
  ShieldAlert,
  Boxes,
  Wrench,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useTheme, ThemeMode, TableDensity } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export const SettingsView: React.FC = () => {
  const { theme, setTheme, tableDensity, setTableDensity, notifPreferences, updateNotifPreferences } = useTheme();
  const { user, perfil, signOut } = useAuth();

  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveSuccessPill, setSaveSuccessPill] = useState<string | null>(null);

  const showPill = (msg: string) => {
    setSaveSuccessPill(msg);
    setTimeout(() => setSaveSuccessPill(null), 3000);
  };

  // Cierre de sesión real y seguro
  const handleCerrarSesion = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Aviso en signOut:', err);
    } finally {
      // 1. Limpiar almacenamiento local sensible
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // 2. Redirigir reemplazando el historial para que atrás no cargue información privada
        window.location.replace('/');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#1C3177]" />
            Configuración del Sistema SIIA
          </h2>
          <p className="text-xs text-slate-500">
            Personaliza el tema, la densidad de visualización, tus alertas y gestiona tu sesión activa.
          </p>
        </div>

        {saveSuccessPill && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 flex items-center gap-2 text-xs text-[#2D8246] animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-[#3DAA5C] shrink-0" />
            <span className="font-semibold">{saveSuccessPill}</span>
          </div>
        )}
      </div>

      {/* 1. SECCIÓN: TEMA Y APARIENCIA */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            Tema de Interfaz
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            El tema se aplica de inmediato a todo el sistema, tablas, tarjetas y gráficos, con contraste adaptativo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Opción Claro */}
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              showPill('Tema claro aplicado.');
            }}
            className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-[#1C3177] bg-blue-50/40 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sun className="h-4 w-4" />
              </div>
              {theme === 'light' && (
                <div className="h-5 w-5 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-900">Modo Claro</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Blanco clínico institucional UOD (#F7F9FC).
            </span>
          </button>

          {/* Opción Oscuro */}
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              showPill('Tema oscuro aplicado.');
            }}
            className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-[#1C3177] bg-slate-900/10 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="h-8 w-8 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center">
                <Moon className="h-4 w-4" />
              </div>
              {theme === 'dark' && (
                <div className="h-5 w-5 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-900">Modo Oscuro</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Azul naval profundo (#0D1B2A) de alto descanso visual.
            </span>
          </button>

          {/* Opción Automático */}
          <button
            type="button"
            onClick={() => {
              setTheme('auto');
              showPill('Tema automático sincronizado con tu dispositivo.');
            }}
            className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              theme === 'auto'
                ? 'border-[#1C3177] bg-blue-50/40 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="h-8 w-8 rounded-xl bg-blue-100 text-[#1C3177] flex items-center justify-center">
                <Laptop className="h-4 w-4" />
              </div>
              {theme === 'auto' && (
                <div className="h-5 w-5 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-900">Automático</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Sigue la preferencia del sistema operativo del usuario.
            </span>
          </button>
        </div>
      </div>

      {/* 2. SECCIÓN: DENSIDAD DE TABLAS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Table className="h-4 w-4 text-[#1C3177]" />
            Densidad de Tablas y Listados
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Ajusta la altura de las filas y el espaciado en catálogo, movimientos, existencias y auditorías.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cómoda */}
          <button
            type="button"
            onClick={() => {
              setTableDensity('comoda');
              showPill('Densidad cómoda seleccionada.');
            }}
            className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              tableDensity === 'comoda'
                ? 'border-[#1C3177] bg-blue-50/40 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#1C3177] flex items-center justify-center shrink-0">
              <AlignJustify className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Cómoda (Espaciada)</span>
                {tableDensity === 'comoda' && (
                  <div className="h-4 w-4 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Filas con mayor respiro y fotos más visibles. Recomendada para monitores de alta resolución.
              </p>
            </div>
          </button>

          {/* Compacta */}
          <button
            type="button"
            onClick={() => {
              setTableDensity('compacta');
              showPill('Densidad compacta seleccionada.');
            }}
            className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              tableDensity === 'compacta'
                ? 'border-[#1C3177] bg-blue-50/40 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#1C3177] flex items-center justify-center shrink-0">
              <Table className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Compacta (Densa)</span>
                {tableDensity === 'compacta' && (
                  <div className="h-4 w-4 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Filas de menor altura para visualizar un mayor volumen de activos y registros sin desplazarse tanto.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. SECCIÓN: PREFERENCIAS DE NOTIFICACIÓN */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#3DAA5C]" />
            Preferencias de Notificaciones y Alertas
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Selecciona qué eventos institucionales deseas monitorear y por cuáles canales recibirlos.
          </p>
        </div>

        {/* Tipos de Alertas */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-800">Eventos de Inventario</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Alerta Stock Bajo */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.stockBajo}
                onChange={(e) => {
                  updateNotifPreferences({ stockBajo: e.target.checked });
                  showPill('Preferencias de stock bajo actualizadas.');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  Stock bajo (Punto de reorden)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Aviso cuando un recurso alcance su cantidad mínima requerida.
                </span>
              </div>
            </label>

            {/* Alerta Stock Agotado */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.stockAgotado}
                onChange={(e) => {
                  updateNotifPreferences({ stockAgotado: e.target.checked });
                  showPill('Preferencias de stock agotado actualizadas.');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                  Stock crítico (0 unidades)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Aviso urgente ante quiebre de stock en almacén.
                </span>
              </div>
            </label>

            {/* Alerta Movimientos */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.movimientos}
                onChange={(e) => {
                  updateNotifPreferences({ movimientos: e.target.checked });
                  showPill('Preferencias de movimientos actualizadas.');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-blue-500" />
                  Movimientos y Traslados
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Entradas, salidas o reubicaciones entre clínicas y departamentos.
                </span>
              </div>
            </label>

            {/* Alerta Mantenimiento */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.mantenimientos}
                onChange={(e) => {
                  updateNotifPreferences({ mantenimientos: e.target.checked });
                  showPill('Preferencias de mantenimiento actualizadas.');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-[#3DAA5C]" />
                  Mantenimientos Programados
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Recordatorios de servicio preventivo para laptops, servidores y UPS.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Canales de Notificación */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <p className="text-xs font-bold text-slate-800">Canales de Entrega</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.canalPantalla}
                onChange={(e) => {
                  updateNotifPreferences({ canalPantalla: e.target.checked });
                  showPill('Canal en pantalla actualizado.');
                }}
                className="h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-800">
                  En pantalla (Campana en Navbar y banners)
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.canalCorreo}
                onChange={(e) => {
                  updateNotifPreferences({ canalCorreo: e.target.checked });
                  showPill('Canal por correo actualizado.');
                }}
                className="h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-800">
                  Correo institucional ({user?.email || 'Google Workspace'})
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 4. SECCIÓN: SEGURIDAD Y CIERRE DE SESIÓN */}
      <div className="rounded-2xl border border-rose-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <LogOut className="h-4 w-4 text-rose-600" />
              Sesión y Seguridad de Acceso
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Control de sesión institucional protegida por Google OAuth 2.0 y Supabase Auth.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#2D8246] border border-emerald-200 text-[10px] font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-[#3DAA5C]" />
            Sesión Autenticada
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-900">
                {perfil?.nombreCompleto || user?.user_metadata?.full_name || 'Operador UOD'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">({user?.email || 'N/A'})</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Al cerrar sesión se invalidarán todos los tokens de acceso y se limpiará la caché local.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmLogoutOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Modal de Confirmación de Cierre de Sesión */}
      {confirmLogoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-scale-up text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ¿Confirmas cerrar tu sesión?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Se cerrará tu sesión activa en SIIA, se eliminarán los tokens locales y volverás a la pantalla de acceso.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setConfirmLogoutOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleCerrarSesion}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors disabled:opacity-60"
              >
                {isLoggingOut ? 'Cerrando...' : 'Sí, cerrar sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
