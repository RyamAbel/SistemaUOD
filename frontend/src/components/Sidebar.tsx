'use client';

import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Laptop,
  Users,
  ClipboardList,
  QrCode,
  FileCheck2,
  Database
} from 'lucide-react';

export type NavTab = 'dashboard' | 'catalogo' | 'movimientos' | 'activos' | 'proveedores' | 'auditoria' | 'conteo' | 'configuracion';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stockAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, stockAlertCount = 2 }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'catalogo', label: 'Catálogo & Stock', icon: Package, badge: stockAlertCount > 0 ? `${stockAlertCount} alertas` : undefined },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'activos', label: 'Activos & Préstamos', icon: Laptop },
    { id: 'conteo', label: 'Inventario Físico & QR', icon: QrCode },
    { id: 'proveedores', label: 'Proveedores & O.C.', icon: Users },
    { id: 'auditoria', label: 'Bitácora de Auditoría', icon: ClipboardList },
    { id: 'configuracion', label: 'Conexión Supabase', icon: Database },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#0B1020] p-4 flex flex-col justify-between">
      <div>
        <div className="mb-6 px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Módulos del Sistema
          </p>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footnote */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
          <span className="font-medium text-slate-300">Base de Datos Conectada</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          PostgreSQL en Supabase con RLS activo y reglas de auditoría inmutable.
        </p>
      </div>
    </aside>
  );
};
