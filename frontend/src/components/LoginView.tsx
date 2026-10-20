'use client';

import React from 'react';
import { Shield, AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginViewProps {
  onBypassDemo: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBypassDemo }) => {
  const { signInWithGoogle, loading, authError, clearAuthError } = useAuth();

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1C3177 60%, #0D2A1A 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(61,170,92,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }}
      />

      {/* Card */}
      <div className="w-full max-w-sm relative z-10 rounded-2xl bg-white shadow-2xl p-8 border border-slate-100">
        {/* Logo UOD */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs w-full flex items-center justify-center">
            <img
              src="/uod-logo.png"
              alt="Universidad Odontológica Dominicana"
              className="h-20 w-auto max-w-[240px] object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-[#1C3177] tracking-tight">SIIA</h1>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Sistema Inteligente de Inventario con IA
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Universidad Odontológica Dominicana
          </p>
        </div>

        {/* Error Alert Box */}
        {authError && (
          <div className="mb-5 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-start gap-2.5 relative">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 pr-4">
              <span className="font-bold block text-rose-900">Acceso no autorizado</span>
              <span className="text-[11px] leading-relaxed block mt-0.5 text-rose-700">
                {authError.includes('invitado') || authError.includes('autorizado')
                  ? 'Este correo de Google no cuenta con una invitación activa en SIIA. Comunícate con Tecnología UOD para recibir una invitación.'
                  : authError}
              </span>
            </div>
            <button
              onClick={clearAuthError}
              className="absolute top-2.5 right-2 text-rose-400 hover:text-rose-700 p-1"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          id="google-signin-btn"
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white border-2 border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
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
          <span>{loading ? 'Conectando...' : 'Acceder con Google Institucional'}</span>
        </button>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Shield className="h-3.5 w-3.5 text-[#3DAA5C]" />
          <span>Acceso exclusivo para personal autorizado</span>
        </div>

        {/* Bypass Demo Mode */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={onBypassDemo}
            className="text-[11px] text-slate-400 hover:text-[#1C3177] transition-colors underline font-medium"
          >
            Modo demostración (sin conexión)
          </button>
        </div>
      </div>
    </div>
  );
};
