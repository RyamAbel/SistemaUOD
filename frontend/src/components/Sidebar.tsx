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
  Settings,
  Bell
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'catalogo'
  | 'ubicaciones'
  | 'movimientos'
  | 'activos'
  | 'mantenimiento'
  | 'alertas'
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
  const { perfil, rol } = useAuth();
  const currentRol = perfil?.rol || rol || 'consulta';

  const menuItems: { id: NavTab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'catalogo', label: 'Catálogo de Activos', icon: Package },
    { id: 'ubicaciones', label: 'Ubicaciones UOD', icon: MapPin },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'activos', label: 'Activos Fijos TI', icon: Box },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
    { id: 'alertas', label: 'Centro de Alertas', icon: Bell, badge: stockAlertCount },
    { id: 'compras', label: 'Proveedores & Compras', icon: ShoppingBag },
    { id: 'inventario_fisico', label: 'Inventario Físico', icon: ClipboardCheck },
    { id: 'reportes', label: 'Reportes & Análisis', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const allowedTabsByRol: Record<string, NavTab[]> = {
    super_admin: ['dashboard', 'catalogo', 'ubicaciones', 'movimientos', 'activos', 'mantenimiento', 'alertas', 'compras', 'inventario_fisico', 'reportes', 'configuracion'],
    admin_inventario: ['dashboard', 'catalogo', 'ubicaciones', 'movimientos', 'activos', 'mantenimiento', 'alertas', 'compras', 'inventario_fisico', 'reportes', 'configuracion'],
    gestor_inventario: ['dashboard', 'catalogo', 'ubicaciones', 'movimientos', 'activos', 'mantenimiento', 'alertas', 'compras', 'inventario_fisico', 'reportes'],
    encargado_almacen: ['dashboard', 'catalogo', 'ubicaciones', 'movimientos', 'activos', 'alertas', 'compras', 'inventario_fisico'],
    operador_almacen: ['dashboard', 'catalogo', 'ubicaciones', 'movimientos', 'activos', 'alertas', 'compras', 'inventario_fisico'],
    auditor: ['dashboard', 'catalogo', 'ubicaciones', 'movimientos', 'activos', 'alertas', 'reportes'],
    consulta: ['dashboard', 'catalogo', 'ubicaciones', 'movimientos', 'activos', 'alertas', 'reportes']
  };

  const allowed = allowedTabsByRol[currentRol] || allowedTabsByRol['super_admin'];
  const visibleMenuItems = menuItems.filter(item => allowed.includes(item.id));

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between p-4 shadow-xs">
      <div className="space-y-6">
        {/* Module Group Title */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">
            Inventario Institucional UOD
          </span>
          <nav className="mt-2 space-y-1">
            {visibleMenuItems.map((item) => {
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
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.5 text-[9px] font-bold">
                      {item.badge > 99 ? '99+' : item.badge}
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
