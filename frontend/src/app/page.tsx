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

  // Real-time stock alert count based on actual articles
  const stockAlertCount = articulos.filter(a => a.stockActual <= a.stockMinimo).length;

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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#1C3177]/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#1C3177]" />
            <div className="absolute inset-2 rounded-full bg-blue-50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#1C3177]" />
            </div>
          </div>
          <p className="text-xs text-slate-600 font-semibold">Cargando SIIA UOD...</p>
        </div>
      </div>
    );
  }

  // Not authenticated and not in demo mode -> Show Official Google Login screen
  if (!user && !demoMode) {
    return <LoginView onBypassDemo={() => setDemoMode(true)} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F9FC] text-slate-900">
      {/* Top Header Navigation with UOD Logo */}
      <Navbar onOpenAi={() => setAiOpen(true)} aiOpen={aiOpen} alertCount={stockAlertCount} />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar matching the 10 modules */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          stockAlertCount={stockAlertCount}
        />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7 bg-[#F7F9FC]">
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
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Box className="h-5 w-5 text-[#1C3177]" />
                Módulo de Activos Odontológicos Individuales
              </h3>
              <p className="text-xs text-slate-500">
                Trazabilidad por número de serie, placa institucional y responsable asignado.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Sillón Quirúrgico Dental A1', sn: 'SN-UOD-2026-001', sala: 'Clínica Principal - Sala 1', resp: 'Dra. López' },
                  { name: 'Autoclave Digital Tuttnauer 2540', sn: 'SN-UOD-2026-002', sala: 'Esterilización Central', resp: 'Lic. Pérez' },
                  { name: 'Sensor Radiografía Digital RVG 6200', sn: 'SN-UOD-2026-003', sala: 'Radiología Oral', resp: 'Dr. Morales' }
                ].map((act, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">{act.name}</span>
                    <span className="text-[11px] text-[#1C3177] font-mono block font-semibold">Serial: {act.sn}</span>
                    <span className="text-[11px] text-slate-600 block">{act.sala}</span>
                    <span className="text-[11px] text-[#2D8246] font-bold block">Custodio: {act.resp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compras' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#3DAA5C]" />
                Proveedores y Órdenes de Compra
              </h3>
              <p className="text-xs text-slate-500">
                Gestión de suplidores registrados con RNC institucional y cotizaciones asistidas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <span className="font-bold text-sm text-slate-900">Dental Corp. Dominicana S.R.L.</span>
                  <div className="text-xs text-slate-500 mt-1">RNC: 1-31-88421-2 • Contacto: Carlos Mendoza</div>
                  <div className="text-[11px] text-[#2D8246] mt-2 font-bold">Crédito 30 días • Insumos de Implantes</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <span className="font-bold text-sm text-slate-900">Biomateriales del Caribe S.A.</span>
                  <div className="text-xs text-slate-500 mt-1">RNC: 1-01-99234-5 • Contacto: Laura Silva</div>
                  <div className="text-[11px] text-[#2D8246] mt-2 font-bold">Distribuidor oficial 3M Oral Care</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventario_fisico' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-[#1C3177]" />
                Inventario Físico y Escaneo QR
              </h3>
              <p className="text-xs text-slate-500">
                Modo conteo rápido con conciliación automática de discrepancias y lector de códigos.
              </p>
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 bg-slate-50/50">
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-xs text-emerald-800 shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-[#3DAA5C] shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
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
