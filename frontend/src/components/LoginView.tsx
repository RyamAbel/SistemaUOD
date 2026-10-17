'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, Mail, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginViewProps {
  onBypassDemo: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBypassDemo }) => {
  const { signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('admin.uod@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBypassDemo();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#070C16] px-4 py-8 text-slate-100 relative overflow-hidden font-sans">
      {/* Background Subtle Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Login Container with Green Glow Frame matching Screenshot */}
      <div className="w-full max-w-md relative z-10 rounded-[32px] border-2 border-emerald-500/40 bg-[#0B1220]/90 p-8 shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)] backdrop-blur-2xl">
        
        {/* Brand Header: UOD Logo + SIIA */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3 flex items-center justify-center">
            <img
              src="/uod-logo.png?v=2"
              alt="Universidad Odontológica Dominicana"
              className="h-20 w-auto max-w-[240px] object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">SIIA</h1>
          <p className="mt-1 text-xs text-slate-300 font-medium">
            Sistema Inteligente de Inventario con IA Integrada
          </p>
        </div>

        {/* Google One-Click Login Button */}
        <div className="space-y-4">
          <button
            onClick={() => signInWithGoogle()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-600 bg-white px-5 py-3 text-xs font-bold text-slate-900 transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {/* Google G SVG */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Iniciar sesión con Google</span>
          </button>

          {/* Institutional Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-700/80 w-full" />
            <span className="bg-[#0B1220] px-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              o con credenciales
            </span>
            <div className="border-t border-slate-700/80 w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Remember Me & 2FA Info */}
            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>Recuérdame</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="hover:underline cursor-pointer text-slate-400">¿Olvidaste tu contraseña?</span>
                <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                  2FA
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-3 rounded-full bg-slate-200 hover:bg-white text-slate-950 font-bold py-2.5 text-xs transition-colors shadow-md"
            >
              Iniciar sesión
            </button>
          </form>
        </div>

        {/* Footer info matching screenshot */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center space-y-3">
          <p className="text-[11px] text-slate-400 font-medium">
            © Universidad Odontológica Dominicana - Sistema de Inventario con IA
          </p>
          
          {/* Security Badges: SSL, 2FA, Encriptado */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-400" />
              SSL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-cyan-400" />
              2FA
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-400" />
              Encriptado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
