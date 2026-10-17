'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginView } from '@/components/LoginView';
import { Navbar } from '@/components/Navbar';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { DashboardView } from '@/components/DashboardView';
import { CatalogView } from '@/components/CatalogView';
import { LocationsView } from '@/components/LocationsView';
import { MovementsView } from '@/components/MovementsView';
import { MaintenanceView } from '@/components/MaintenanceView';
import { ReportsView } from '@/components/ReportsView';
import { SettingsView } from '@/components/SettingsView';
import { SupabaseConfigView } from '@/components/SupabaseConfigView';
import { AiAssistantDrawer } from '@/components/AiAssistantDrawer';
import {
  initialArticulos,
  initialMovimientos,
  ArticuloItem,
  MovimientoItem
} from '@/lib/initialData';
import { Sparkles, CheckCircle2, Box, ShoppingBag, ClipboardCheck } from 'lucide-react';

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
    triggerToast(`Artículo "${nuevo.nombre}" incorporado al catálogo.`);
  };

  const handleExecuteAction = (
    mov: Omit<MovimientoItem, 'id' | 'numero' | 'fecha'>
  ) => {
    const nextNum = `MOV-2026-${String(movimientos.length + 105).padStart(5, '0')}`;
    const newMov: MovimientoItem = {
      ...mov,
      id: `mov-${Date.now()}`,
      numero: nextNum,
      fecha: 'Hace un momento'
    };

    setMovimientos((prev) => [newMov, ...prev]);

    // Atomic update of stock
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
      <div className="flex min-h-screen items-center justify-center bg-[#070C16] text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-400" />
          <p className="text-xs text-slate-400">Accediendo a SistemaUOD (SIIA)...</p>
        </div>
      </div>
    );
  }

  // Not authenticated and not in demo mode -> Show Official Google Login screen matching Page 2 Bottom
  if (!user && !demoMode) {
    return <LoginView onBypassDemo={() => setDemoMode(true)} />;
  }

  return (
    <div className="dark flex h-screen flex-col overflow-hidden bg-[#070C16] text-slate-100 font-sans">
      {/* Top Header Navigation with UOD Logo */}
      <Navbar onOpenAi={() => setAiOpen(true)} aiOpen={aiOpen} />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar matching the 10 modules */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          stockAlertCount={35}
        />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#090F1C]">
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

          {activeTab === 'ubicaciones' && (
            <LocationsView
              onApplyRecommendation={() => {
                handleExecuteAction({
                  tipo: 'traslado',
                  articuloNombre: 'Pasta Profilaxis con Flúor',
                  cantidad: 20,
                  origen: 'Almacén Central',
                  destino: 'Clínica Este',
                  usuario: 'Admin UOD (Vía Recomendación IA)',
                  origenIa: true,
                  motivo: 'Traslado sugerido por IA para evitar quiebre de stock'
                });
              }}
            />
          )}

          {activeTab === 'movimientos' && (
            <MovementsView
              movimientos={movimientos}
              articulos={articulos}
              onAddMovimiento={handleExecuteAction}
            />
          )}

          {activeTab === 'mantenimiento' && <MaintenanceView />}

          {activeTab === 'activos' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="h-5 w-5 text-cyan-400" />
                Módulo de Activos Odontológicos Individuales
              </h3>
              <p className="text-xs text-slate-400">
                Trazabilidad por número de serie, placa institucional y responsable asignado.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Sillón Quirúrgico Dental A1', sn: 'SN-UOD-2026-001', sala: 'Clínica Principal - Sala 1', resp: 'Dra. López' },
                  { name: 'Autoclave Digital Tuttnauer 2540', sn: 'SN-UOD-2026-002', sala: 'Esterilización Central', resp: 'Lic. Pérez' },
                  { name: 'Sensor Radiografía Digital RVG 6200', sn: 'SN-UOD-2026-003', sala: 'Radiología Oral', resp: 'Dr. Morales' }
                ].map((act, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                    <span className="text-xs font-bold text-white block">{act.name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono block">Serial: {act.sn}</span>
                    <span className="text-[11px] text-slate-400 block">{act.sala}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">Custodio: {act.resp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compras' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-400" />
                Proveedores y Órdenes de Compra
              </h3>
              <p className="text-xs text-slate-400">
                Gestión de suplidores registrados con RNC institucional y cotizaciones asistidas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <span className="font-bold text-sm text-white">Dental Corp. Dominicana S.R.L.</span>
                  <div className="text-xs text-slate-400 mt-1">RNC: 1-31-88421-2 • Contacto: Carlos Mendoza</div>
                  <div className="text-[11px] text-emerald-400 mt-2 font-semibold">Crédito 30 días • Insumos de Implantes</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <span className="font-bold text-sm text-white">Biomateriales del Caribe S.A.</span>
                  <div className="text-xs text-slate-400 mt-1">RNC: 1-01-99234-5 • Contacto: Laura Silva</div>
                  <div className="text-[11px] text-emerald-400 mt-2 font-semibold">Distribuidor oficial 3M Oral Care</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventario_fisico' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-cyan-400" />
                Inventario Físico y Escaneo QR
              </h3>
              <p className="text-xs text-slate-400">
                Modo conteo rápido con conciliación automática de discrepancias y lector de códigos.
              </p>
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-400">
                Escaneo óptico habilitado para dispositivos móviles y lectores de código de barras USB/Bluetooth.
              </div>
            </div>
          )}

          {activeTab === 'reportes' && (
            <ReportsView onOpenAi={() => setAiOpen(true)} />
          )}

          {activeTab === 'configuracion' && <SettingsView />}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-5 py-3 text-xs text-emerald-300 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AI Assistant Lateral Drawer (Powered by Gemini 3.8 Flash) */}
      <AiAssistantDrawer
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        articulos={articulos}
        onExecuteAction={handleExecuteAction}
      />
    </div>
  );
}
