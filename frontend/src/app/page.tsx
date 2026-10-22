'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
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
import { SuppliersView } from '@/components/SuppliersView';
import { AiAssistantDrawer } from '@/components/AiAssistantDrawer';
import { CameraScannerModal } from '@/components/CameraScannerModal';
import { ResourceDetailModal } from '@/components/ResourceDetailModal';
import { AssetsView } from '@/components/AssetsView';
import { PhysicalAuditView } from '@/components/PhysicalAuditView';
import { AlertsView } from '@/components/AlertsView';
import { EditProfileModal } from '@/components/EditProfileModal';
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
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [articulos, setArticulos] = useState<ArticuloItem[]>(initialArticulos);
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>(initialMovimientos);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Escáner Móvil PWA
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedResourceId, setScannedResourceId] = useState<string | null>(null);
  const [scannedDetailOpen, setScannedDetailOpen] = useState(false);

  // Conteo de alertas reales sincronizadas con el sistema backend
  const [systemAlertCount, setSystemAlertCount] = useState<number>(0);

  const refrescarConteoAlertas = useCallback(async () => {
    try {
      const count = await apiClient.obtenerConteoAlertasNoLeidas();
      setSystemAlertCount(count);
    } catch {
      // Fallback si la API no está disponible
      setSystemAlertCount(0);
    }
  }, []);

  useEffect(() => {
    refrescarConteoAlertas();
    const timer = setInterval(refrescarConteoAlertas, 30000);
    return () => clearInterval(timer);
  }, [refrescarConteoAlertas]);

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
      <Navbar
        onOpenAi={() => setAiOpen(true)}
        aiOpen={aiOpen}
        alertCount={systemAlertCount}
        onOpenScanner={() => setScannerOpen(true)}
        onNavigateToAlerts={() => setActiveTab('alertas')}
        onOpenProfile={() => setEditProfileOpen(true)}
        onNavigateToSettings={() => setActiveTab('configuracion')}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar matching the 10 modules */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          stockAlertCount={systemAlertCount}
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

          {activeTab === 'alertas' && <AlertsView />}

          {activeTab === 'activos' && <AssetsView />}

          {activeTab === 'compras' && <SuppliersView />}

          {activeTab === 'inventario_fisico' && (
            <PhysicalAuditView onOpenScanner={() => setScannerOpen(true)} />
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

      {/* Escáner Móvil PWA con Cámara (Prompt 6.8) */}
      <CameraScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onOpenResourceDetail={(id) => {
          setScannedResourceId(id);
          setScannedDetailOpen(true);
        }}
        onCreateResourceWithCode={(codigo) => {
          setActiveTab('catalogo');
          triggerToast(`Código ${codigo} capturado. Abre «Nuevo Recurso» en catálogo.`);
        }}
      />

      {/* Ficha de Recurso desde Escáner */}
      <ResourceDetailModal
        isOpen={scannedDetailOpen}
        recursoId={scannedResourceId}
        onClose={() => {
          setScannedDetailOpen(false);
          setScannedResourceId(null);
        }}
      />

      {/* Modal Editar Perfil (Idea 8) */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onProfileUpdated={(msg) => triggerToast(msg)}
      />
    </div>
  );
}
