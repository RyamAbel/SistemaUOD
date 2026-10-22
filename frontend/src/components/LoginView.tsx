'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  AlertCircle,
  XCircle,
  Sun,
  Moon,
  ExternalLink,
  Mail,
  ArrowUpRight,
  Package,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginViewProps {
  onBypassDemo?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBypassDemo }) => {
  const { signInWithGoogle, loading, authError, clearAuthError } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('siia_theme');
      // Por defecto modo claro institucional UOD (#F7F9FC)
      const initialDark = savedTheme === 'dark';
      setIsDark(initialDark);
      if (initialDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const newTheme = nextDark ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('siia_theme', newTheme);
      if (nextDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-3 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden transition-colors duration-500"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #050B14 0%, #0D1B2A 50%, #07101B 100%)'
          : 'linear-gradient(135deg, #EEF2F8 0%, #E3E9F3 50%, #D8E0EE 100%)'
      }}
    >
      {/* Luces ambientales con la paleta institucional UOD (Azul Marino #1C3177 + Verde #3DAA5C + Turquesa #06B6D4) */}
      <div
        className="absolute top-10 left-1/4 w-[650px] h-[650px] rounded-full pointer-events-none blur-3xl opacity-40"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(28,49,119,0.5) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(28,49,119,0.22) 0%, transparent 70%)'
        }}
      />
      <div
        className="absolute bottom-10 right-1/4 w-[550px] h-[550px] rounded-full pointer-events-none blur-3xl opacity-35"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(61,170,92,0.22) 0%, transparent 70%)'
        }}
      />

      {/* Botón flotante selector de tema */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={toggleTheme}
        className={`absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border backdrop-blur-md shadow-md transition-all cursor-pointer ${
          isDark
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            : 'bg-white/80 border-slate-300 text-slate-700 hover:bg-white'
        }`}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label="Alternar tema claro u oscuro"
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-[#1C3177]" />}
      </motion.button>

      {/* Contenedor Principal Split (Visual Showcase + Login Oficial) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-5xl rounded-3xl sm:rounded-[32px] overflow-hidden border shadow-2xl backdrop-blur-2xl relative z-10 transition-colors duration-500 ${
          isDark
            ? 'bg-[#101F33]/95 border-[#1E3A6E] text-white shadow-black/70'
            : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-2xl shadow-slate-900/10'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* ── COLUMNA 1: HERO VISUAL CON CARDS FLOTANTES EN FRAMER MOTION (Paleta Institucional UOD) ── */}
          <div
            className="order-2 lg:order-1 lg:col-span-7 relative p-8 sm:p-10 md:p-12 flex flex-col justify-between overflow-hidden min-h-[460px] sm:min-h-[520px] transition-all duration-500 text-white"
            style={{
              background: isDark
                ? 'linear-gradient(145deg, #091322 0%, #102646 45%, #0B2C22 100%)'
                : 'linear-gradient(145deg, #102254 0%, #1C3177 50%, #1F6B4F 100%)'
            }}
          >
            {/* Resplandor decorativo interno */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#3DAA5C]/25 blur-3xl pointer-events-none" />

            {/* Cabecera del Hero con logotipo y badge */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-xs">
                <div className="h-6 w-6 rounded-xl bg-white text-[#1C3177] flex items-center justify-center font-black text-xs shadow-xs">
                  S
                </div>
                <span className="text-xs font-black tracking-wider text-white">
                  SIIA UOD
                </span>
              </div>

              {/* Pill flotante 1: Payout / Asignación */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-lg text-[11px] font-bold text-slate-800 dark:text-white cursor-pointer"
              >
                <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <span>341 Equipos Físicos</span>
                <span className="opacity-40">|</span>
                <span className="text-[#3DAA5C] dark:text-emerald-400 font-extrabold">100% TI</span>
              </motion.div>
            </div>

            {/* ÁREA CENTRAL: CARDS FLOTANTES SUPERPUESTAS */}
            <div className="relative my-6 sm:my-8 flex items-center justify-center min-h-[200px]">
              
              {/* Tarjeta Principal Flotante (StatsCard / Gráfica) */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="w-full max-w-[320px] sm:max-w-[340px] rounded-3xl p-5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/80 dark:border-white/15 shadow-2xl shadow-slate-950/25 relative z-20 cursor-pointer text-slate-800 dark:text-white"
              >
                <div className="flex items-center justify-between text-xs opacity-75 mb-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Package className="h-3.5 w-3.5 text-[#1C3177] dark:text-cyan-400" />
                    <span>Total Activos TI UOD</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-semibold">
                    Año 2026
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    341
                    <span className="text-sm font-semibold opacity-60 ml-1.5 font-normal">
                      equipos
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800/60 text-[#2D8246] dark:text-emerald-400">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>+100%</span>
                  </div>
                </div>

                {/* Gráfica suave con SVG y gradiente fluido en Verde UOD (#3DAA5C) */}
                <div className="h-14 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 280 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradientUod" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3DAA5C" stopOpacity="0.38" />
                        <stop offset="100%" stopColor="#3DAA5C" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,45 C40,48 70,30 110,32 C150,34 180,14 220,18 C250,22 265,8 280,10 L280,60 L0,60 Z"
                      fill="url(#chartGradientUod)"
                    />
                    <path
                      d="M0,45 C40,48 70,30 110,32 C150,34 180,14 220,18 C250,22 265,8 280,10"
                      fill="none"
                      stroke="#3DAA5C"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="280" cy="10" r="4" fill="#3DAA5C" className="animate-pulse" />
                  </svg>
                </div>
              </motion.div>

              {/* Pill flotante 2 (Izquierda Abajo): Tasa de éxito / Operativo */}
              <motion.div
                animate={{ y: [0, -7, 0], x: [0, -3, 0] }}
                transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                className="absolute -bottom-4 -left-2 sm:left-2 z-30 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/70 dark:border-white/15 shadow-xl flex items-center gap-2.5 cursor-pointer text-slate-800 dark:text-white"
              >
                <div className="relative h-6 w-6 flex items-center justify-center">
                  <svg className="h-6 w-6 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className={isDark ? 'text-slate-800' : 'text-slate-100'}
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#3DAA5C]"
                      strokeDasharray="98.8, 100"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-black text-[#2D8246] dark:text-emerald-400">✓</span>
                </div>
                <div>
                  <div className="text-xs font-black leading-tight">98.8%</div>
                  <div className="text-[9px] opacity-70">En Operación Activa</div>
                </div>
              </motion.div>

              {/* Pill flotante 3 (Derecha Abajo): IA Integrada (Turquesa UOD #06B6D4) */}
              <motion.div
                animate={{ y: [0, -6, 0], x: [0, 3, 0] }}
                transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                whileHover={{ scale: 1.05 }}
                className="absolute -bottom-2 -right-2 sm:right-2 z-30 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/70 dark:border-white/15 shadow-xl flex items-center gap-2 cursor-pointer text-slate-800 dark:text-white"
              >
                <div className="h-5 w-5 rounded-lg bg-[#06B6D4] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="h-3 w-3" />
                </div>
                <div className="text-[11px] font-bold">
                  Gemini Flash IA
                </div>
              </motion.div>

            </div>

            {/* Texto inferior del hero */}
            <div className="relative z-10 mt-auto pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-emerald-300">
                Universidad Odontológica Dominicana
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug text-white">
                Gestiona activos fijos y almacén en un solo lugar.
              </h2>
            </div>
          </div>


          {/* ── COLUMNA 2: FORMULARIO DE ACCESO OFICIAL CON GOOGLE OAUTH (100% Centrado y Armónico) ── */}
          <div className="order-1 lg:order-2 lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-8 md:p-10 my-auto">
            <div className="w-full max-w-sm flex flex-col items-center text-center">
              {/* Logo institucional UOD - 100% Centrado e Integrado como PNG transparente sin recuadro */}
              <div className="mb-4 flex items-center justify-center">
                <img
                  src={isDark ? "/uod-logo-dark.png" : "/uod-logo-clean.png"}
                  alt="Universidad Odontológica Dominicana"
                  className="h-16 sm:h-20 w-auto max-w-[220px] object-contain select-none transition-all duration-300"
                />
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2.5 border ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-cyan-300'
                  : 'bg-blue-50/80 border-blue-200/60 text-[#1C3177]'
              }`}>
                <Sparkles className="h-3.5 w-3.5 text-[#3DAA5C]" />
                <span>Portal Institucional</span>
              </div>

              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bienvenido de nuevo
              </h1>
              <p className={`mt-1.5 text-xs leading-relaxed max-w-xs mx-auto mb-6 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                Inicia sesión con tu correo autorizado de la UOD para acceder al control de inventario y almacén.
              </p>

              {/* Alerta de Error / Correo no invitado */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className={`w-full mb-5 p-4 rounded-2xl border text-xs flex items-start gap-3 relative shadow-xs text-left ${
                      isDark
                        ? 'border-rose-800/80 bg-rose-950/60 text-rose-200'
                        : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1 pr-3">
                      <span className="font-bold block">
                        Acceso no autorizado
                      </span>
                      <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">
                        {authError.toLowerCase().includes('invita') ||
                        authError.toLowerCase().includes('autoriz') ||
                        authError.toLowerCase().includes('403')
                          ? 'Tu cuenta de Google no tiene una invitación activa en SIIA. Contacta a Tecnología UOD para autorizar tu acceso.'
                          : authError}
                      </p>
                      <div className="mt-2.5">
                        <a
                          href="mailto:tecnologia@uod.edu.do?subject=Solicitud de acceso a SIIA UOD"
                          className="inline-flex items-center gap-1 text-[11px] font-bold hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          <span>Solicitar invitación a TI</span>
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={clearAuthError}
                      className="p-1 cursor-pointer opacity-70 hover:opacity-100"
                      title="Cerrar aviso"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón Principal: Google OAuth */}
              <motion.button
                id="google-signin-btn"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => signInWithGoogle()}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3.5 rounded-2xl px-5 py-4 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer ${
                  isDark
                    ? 'bg-white text-slate-900 hover:bg-slate-100 border border-white/20'
                    : 'bg-[#1C3177] text-white hover:bg-[#2B4BA0] border border-[#1C3177]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Conectando con Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar con Google Institucional</span>
                  </>
                )}
              </motion.button>

              {/* Sellos de Seguridad */}
              <div className="mt-5 space-y-1.5 text-center">
                <div className={`flex items-center justify-center gap-1.5 text-[11px] font-semibold ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  <ShieldCheck className="h-4 w-4 text-[#3DAA5C] shrink-0" />
                  <span>Acceso seguro protegido por Supabase Auth</span>
                </div>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Solo cuentas autorizadas por la Dirección de Tecnología UOD.
                </p>
              </div>

              {/* Pie de la tarjeta derecha con soporte */}
              <div className={`w-full mt-7 pt-4 border-t flex items-center justify-between text-[11px] ${
                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
              }`}>
                <span>SIIA v1.0 UOD</span>
                <a
                  href="mailto:tecnologia@uod.edu.do?subject=Consulta sobre acceso a SIIA UOD"
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    isDark ? 'hover:text-cyan-300' : 'hover:text-[#1C3177]'
                  }`}
                >
                  <span>Soporte TI</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Acceso a Modo Demostración si está disponible en la página */}
              {onBypassDemo && (
                <div className="w-full mt-3 text-center">
                  <button
                    onClick={onBypassDemo}
                    className="text-[11px] text-slate-400 hover:text-[#1C3177] dark:hover:text-cyan-300 transition-colors underline font-medium cursor-pointer"
                  >
                    Modo demostración (sin conexión)
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
