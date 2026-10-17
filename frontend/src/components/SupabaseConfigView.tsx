'use client';

import React, { useState, useEffect } from 'react';
import { Database, Key, CheckCircle, Shield, ExternalLink, RefreshCw, Copy, Check } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export const SupabaseConfigView: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText('database/migrations/001_initial_schema.sql');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-400" />
          Conexión con Supabase (PostgreSQL)
        </h2>
        <p className="text-xs text-slate-400">
          Gestiona las credenciales de tu proyecto Supabase y verifica el estado de las políticas RLS.
        </p>
      </div>

      {/* Status Card */}
      <div className={`rounded-2xl border p-5 ${
        isConfigured
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : 'border-slate-800 bg-slate-900/60 text-slate-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              isConfigured
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
            }`}>
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {isConfigured ? 'Supabase Vinculado en Vivo' : 'Modo Demostración / Preparado para Credenciales'}
              </h4>
              <p className="text-xs text-slate-400">
                {isConfigured
                  ? 'Las consultas y mutaciones se están sincronizando con tu base de datos remota.'
                  : 'El frontend está operando con datos de prueba realistas mientras configuras tus claves.'}
              </p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
            isConfigured
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {isConfigured ? 'Conectado' : 'Pendiente de Claves'}
          </span>
        </div>
      </div>

      {/* Step by Step Execution Instructions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-cyan-400" />
          Instrucciones para tu Proyecto de Supabase
        </h3>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <div className="font-semibold text-white mb-1">Paso 1: Ejecutar la migración SQL</div>
            <p className="text-slate-400 mb-2">
              Abre el SQL Editor en Supabase y ejecuta el script con todas las tablas, triggers y RLS:
            </p>
            <div className="flex items-center justify-between rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 font-mono text-[11px] text-cyan-300">
              <span>database/migrations/001_initial_schema.sql</span>
              <button
                onClick={handleCopySchemaPath}
                className="flex items-center gap-1 text-slate-400 hover:text-white"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopied ? 'Copiado' : 'Copiar ruta'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <div className="font-semibold text-white mb-1">Paso 2: Cargar datos de prueba (Seed Data)</div>
            <p className="text-slate-400 mb-2">
              Ejecuta el archivo de datos iniciales en Supabase para tener la institución UOD y artículos listos:
            </p>
            <div className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 font-mono text-[11px] text-cyan-300">
              database/seed/001_seed_data.sql
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <div className="font-semibold text-white mb-1">Paso 3: Pegar credenciales en el archivo .env.local</div>
            <p className="text-slate-400 mb-2">
              En tu proyecto de Supabase ve a **Project Settings → API** y copia tu URL y Anon Key dentro de <code className="text-indigo-300">frontend/.env.local</code>:
            </p>
            <pre className="rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
