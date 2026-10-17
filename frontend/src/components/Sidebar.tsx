'use client';

import React from 'react';
import {
  LayoutDashboard,
  Package,
  MapPin,
  ArrowLeftRight,
  Box,
  Wrench,
  ShoppingBag,
  ClipboardCheck,
  BarChart3,
  Settings
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'catalogo'
  | 'ubicaciones'
  | 'movimientos'
  | 'activos'
  | 'mantenimiento'
  | 'compras'
  | 'inventario_fisico'
  | 'reportes'
  | 'configuracion';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stockAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  stockAlertCount = 35
}) => {
  const menuItems: { id: NavTab; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalogo', label: 'Catálogo', icon: Package },
    { id: 'ubicaciones', label: 'Ubicaciones', icon: MapPin },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'activos', label: 'Activos', icon: Box },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench, badge: '5' },
    { id: 'compras', label: 'Compras', icon: ShoppingBag },
    { id: 'inventario_fisico', label: 'Inventario Físico', icon: ClipboardCheck },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-[#0B1120] p-3 flex flex-col justify-between">
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Institutional Clinic Status Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200 text-[11px]">Clínicas UOD Activas</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Clínica Principal, Almacén Central, Clínica Este y Laboratorio sincronizados.
        </p>
      </div>
    </aside>
  );
};
