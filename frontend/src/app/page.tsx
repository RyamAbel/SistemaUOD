'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginView } from '@/components/LoginView';
import { Navbar } from '@/components/Navbar';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { DashboardView } from '@/components/DashboardView';
import { CatalogView } from '@/components/CatalogView';
import { MovementsView } from '@/components/MovementsView';
import { SupabaseConfigView } from '@/components/SupabaseConfigView';
import { AiAssistantDrawer } from '@/components/AiAssistantDrawer';
import {
  initialArticulos,
  initialMovimientos,
  ArticuloItem,
  MovimientoItem
} from '@/lib/initialData';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [aiOpen, setAiOpen] = useState(false);
  const [articulos, setArticulos] = useState<ArticuloItem[]>(initialArticulos);
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>(initialMovimientos);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global shortcut handler (Ctrl+K or Cmd+K) to open AI Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setAiOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAddArticulo = (nuevo: ArticuloItem) => {
    setArticulos((prev) => [nuevo, ...prev]);
    triggerToast(`Artículo "${nuevo.nombre}" registrado exitosamente en el catálogo.`);
  };

  const handleExecuteAction = (
    mov: Omit<MovimientoItem, 'id' | 'numero' | 'fecha'>
  ) => {
    const nextNum = `MOV-2026-${String(movimientos.length + 105).padStart(5, '0')}`;
    const newMov: MovimientoItem = {
      ...mov,
      id: `mov-${Date.now()}`,
      numero: nextNum,
      fecha: 'Hace unos momentos'
    };

    setMovimientos((prev) => [newMov, ...prev]);

    setArticulos((prev) =>
      prev.map((item) => {
        if (item.nombre.toLowerCase().includes(mov.articuloNombre.toLowerCase())) {
          let updatedStock = item.stockActual;
          if (mov.tipo === 'salida') {
            updatedStock = Math.max(0, item.stockActual - mov.cantidad);
          } else if (mov.tipo === 'entrada') {
            updatedStock = item.stockActual + mov.cantidad;
          }
          return {
            ...item,
            stockActual: updatedStock,
            estado: updatedStock <= item.stockMinimo ? 'bajo' : 'saludable'
          };
        }
        return item;
      })
    );

    triggerToast(`Movimiento ${nextNum} registrado y auditado.`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1020] text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-cyan-400" />
          <p className="text-xs text-slate-400">Verificando sesión segura...</p>
        </div>
      </div>
    );
  }

  // Not authenticated and not in demo mode -> Show Google Login screen
  if (!user && !demoMode) {
    return <LoginView onBypassDemo={() => setDemoMode(true)} />;
  }

  const articulosBajos = articulos.filter((a) => a.stockActual <= a.stockMinimo);

  return (
    <div className="dark flex h-screen flex-col overflow-hidden bg-[#0B1020] text-slate-100">
      {/* Top Navigation */}
      <Navbar onOpenAi={() => setAiOpen(true)} aiOpen={aiOpen} />

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          stockAlertCount={articulosBajos.length}
        />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              articulos={articulos}
              movimientos={movimientos}
              onOpenAi={() => setAiOpen(true)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'catalogo' && (
            <CatalogView
              articulos={articulos}
              onAddArticulo={handleAddArticulo}
            />
          )}

          {activeTab === 'movimientos' && (
            <MovementsView
              movimientos={movimientos}
              articulos={articulos}
              onAddMovimiento={handleExecuteAction}
            />
          )}

          {activeTab === 'activos' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Módulo de Activos Fijos & Préstamos</h3>
              <p className="text-xs text-slate-400">
                Control individualizado por número de serie, custodio asignado, historial de mantenimiento y fechas límites de devolución.
              </p>
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-400">
                24 Activos fijos registrados. Los esquemas y modelos ya están preparados en la base de datos de Supabase.
              </div>
            </div>
          )}

          {activeTab === 'conteo' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Inventario Físico & Escaneo QR</h3>
              <p className="text-xs text-slate-400">
                Modo de conteo rápido con escaneo móvil de código de barras / QR y conciliación de discrepancias.
              </p>
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-400">
                Módulo preparado con compatibilidad PWA para cámaras móviles y lectores ópticos.
              </div>
            </div>
          )}

          {activeTab === 'proveedores' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Proveedores & Órdenes de Compra</h3>
              <p className="text-xs text-slate-400">
                Directorio de proveedores registrados con RNC dominicano y control de recepción de suministros.
              </p>
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-400">
                Tablas `proveedores` y `ordenes_compra` disponibles en `database/migrations/001_initial_schema.sql`.
              </div>
            </div>
          )}

          {activeTab === 'auditoria' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Bitácora de Auditoría Inmutable</h3>
              <p className="text-xs text-slate-400">
                Cumplimiento de la Ley 172-13. Registro de usuario, origen (humano vs IA), IP, fecha y cambios antes/después.
              </p>
              <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 space-y-2">
                <div className="text-emerald-400">[AUDIT] MOV-2026-00104 • Origen: IA • Usuario: Admin UOD • Acción: TRASLADO • Status: CONFIRMADO</div>
                <div className="text-slate-400">[AUDIT] MOV-2026-00103 • Origen: Humano • Usuario: Admin UOD • Acción: ENTRADA • Status: APROBADO</div>
              </div>
            </div>
          )}

          {activeTab === 'configuracion' && <SupabaseConfigView />}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-5 py-3 text-xs text-emerald-300 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AI Assistant Lateral Drawer */}
      <AiAssistantDrawer
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        articulos={articulos}
        onExecuteAction={handleExecuteAction}
      />
    </div>
  );
}
