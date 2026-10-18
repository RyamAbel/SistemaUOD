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
  stockAlertCount = 0
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'catalogo', label: 'Catálogo de Artículos', icon: Package },
    { id: 'ubicaciones', label: 'Ubicaciones', icon: MapPin },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'activos', label: 'Activos Odontológicos', icon: Box },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
    { id: 'compras', label: 'Proveedores & Compras', icon: ShoppingBag },
    { id: 'inventario_fisico', label: 'Inventario Físico', icon: ClipboardCheck },
    { id: 'reportes', label: 'Reportes & Análisis', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between p-4 shadow-xs">
      <div className="space-y-6">
        {/* Module Group Title */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">
            Gestión Odontológica
          </span>
          <nav className="mt-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1C3177] text-white shadow-sm shadow-[#1C3177]/20 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'catalogo' && stockAlertCount > 0 && (
                    <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.5 text-[9px] font-bold">
                      {stockAlertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center space-y-1">
        <div className="text-[11px] font-black text-[#1C3177]">Universidad Odontológica</div>
        <div className="text-[10px] text-slate-500 font-medium">SIIA v1.0 • Producción</div>
      </div>
    </aside>
  );
};
