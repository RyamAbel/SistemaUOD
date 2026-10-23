'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Table,
  AlignJustify,
  Bell,
  Mail,
  ShieldAlert,
  Boxes,
  Wrench,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  Check,
  Camera,
  Upload,
  Trash2,
  Globe,
  Loader2,
  Building2,
  Briefcase,
  Phone
} from 'lucide-react';
import { useTheme, ThemeMode, TableDensity } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';

const DEPARTAMENTOS_UOD = [
  'Tecnología e Información',
  'Almacén Central',
  'Rectoría',
  'Contabilidad y Finanzas',
  'Admisiones',
  'Registro y Control Académico',
  'Biblioteca y Recursos Educativos',
  'Recursos Humanos',
  'Aseguramiento de la Calidad',
  'Vinculación con el Medio',
  'Servicios Generales y Mantenimiento'
];

export const SettingsView: React.FC = () => {
  const { theme, setTheme, tableDensity, setTableDensity, notifPreferences, updateNotifPreferences } = useTheme();
  const { user, perfil, refreshProfile } = useAuth();

  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveSuccessPill, setSaveSuccessPill] = useState<string | null>(null);

  // Estados del formulario de perfil institucional
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar campos de perfil cuando cargue el perfil del usuario
  useEffect(() => {
    if (perfil) {
      setNombreCompleto(perfil.nombreCompleto || user?.user_metadata?.full_name || '');
      setCargo(perfil.cargo || '');
      setDepartamento(perfil.departamento || '');
      setTelefono(perfil.telefono || '');
      setAvatarPreview(perfil.avatarUrl || user?.user_metadata?.avatar_url || null);
    } else if (user) {
      setNombreCompleto(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setAvatarPreview(user.user_metadata?.avatar_url || null);
    }
  }, [perfil, user]);

  const showPill = (msg: string) => {
    setSaveSuccessPill(msg);
    setTimeout(() => setSaveSuccessPill(null), 3500);
  };

  // Manejo de selección de archivo de imagen
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/i)) {
      setProfileError('Formato de imagen inválido. Solo se admiten JPG, PNG o WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('La imagen excede el tamaño máximo permitido de 5 MB.');
      return;
    }

    setProfileError(null);
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Restablecer foto de avatar
  const handleRemoveAvatar = async () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setProfileError(null);

    if (perfil?.avatarUrl) {
      try {
        setIsUploadingAvatar(true);
        await apiClient.eliminarAvatarPerfil();
        await refreshProfile();
        showPill('Foto de perfil eliminada. Se mostrarán tus iniciales.');
      } catch (err: any) {
        setProfileError(err.message || 'Error al eliminar la foto de perfil');
      } finally {
        setIsUploadingAvatar(false);
      }
    } else {
      showPill('Foto descartada.');
    }
  };

  // Guardar datos del perfil institucional
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const nombreLimpio = nombreCompleto.trim();
    if (nombreLimpio.length < 2) {
      setProfileError('El nombre completo es obligatorio y debe tener al menos 2 caracteres.');
      return;
    }

    setIsSavingProfile(true);

    try {
      let finalAvatarUrl = avatarPreview;

      // 1. Si hay archivo local seleccionado, subirlo
      if (avatarFile) {
        setIsUploadingAvatar(true);
        try {
          const resAvatar = await apiClient.subirAvatarPerfil(avatarFile);
          finalAvatarUrl = resAvatar.avatarUrl || avatarPreview;
          setAvatarFile(null);
        } catch (uploadErr: any) {
          console.warn('Aviso al subir avatar:', uploadErr);
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      // 2. Actualizar datos en la API
      await apiClient.actualizarMiPerfil({
        nombreCompleto: nombreLimpio,
        cargo: cargo.trim() || null,
        departamento: departamento.trim() || null,
        telefono: telefono.trim() || null,
        avatarUrl: finalAvatarUrl
      });

      // 3. Refrescar estado global del perfil
      await refreshProfile();
      showPill('Perfil institucional guardado exitosamente.');
    } catch (err: any) {
      setProfileError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Cierre de sesión seguro y selectivo
  const handleCerrarSesion = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Aviso en signOut:', err);
    } finally {
      if (typeof window !== 'undefined') {
        // Remover únicamente credenciales y tokens sin destruir preferencias visuales
        const keysToRemove = Object.keys(localStorage).filter(
          k => k.startsWith('sb-') || k.includes('token') || k.includes('auth')
        );
        keysToRemove.forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        window.location.replace('/');
      }
    }
  };

  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'UOD';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#1C3177]" />
            Configuración del Sistema SIIA
          </h2>
          <p className="text-xs text-slate-500">
            Personaliza el tema, la densidad de visualización, tus alertas, tu perfil institucional y gestiona tu sesión activa.
          </p>
        </div>

        {saveSuccessPill && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 flex items-center gap-2 text-xs text-[#2D8246] animate-fade-in shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-[#3DAA5C] shrink-0" />
            <span className="font-semibold">{saveSuccessPill}</span>
          </div>
        )}
      </div>

      {/* 1. SECCIÓN: TEMA Y APARIENCIA */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Tema de Interfaz
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Se guarda en la base de datos por usuario y se aplica de inmediato a todo el sistema.
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#1C3177] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Activo: {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Automático'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Opción Claro */}
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              showPill('Tema claro guardado y aplicado.');
            }}
            className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-[#1C3177] bg-blue-50/40 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sun className="h-4 w-4" />
              </div>
              {theme === 'light' && (
                <div className="h-5 w-5 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-900">Modo Claro</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Blanco clínico institucional UOD (#F7F9FC).
            </span>
          </button>

          {/* Opción Oscuro */}
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              showPill('Tema oscuro guardado y aplicado.');
            }}
            className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-[#1C3177] bg-slate-900/10 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="h-8 w-8 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center">
                <Moon className="h-4 w-4" />
              </div>
              {theme === 'dark' && (
                <div className="h-5 w-5 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-900">Modo Oscuro</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Azul naval profundo (#0D1B2A) de alto descanso visual.
            </span>
          </button>

          {/* Opción Automático */}
          <button
            type="button"
            onClick={() => {
              setTheme('auto');
              showPill('Tema automático sincronizado con tu sistema operativo.');
            }}
            className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              theme === 'auto'
                ? 'border-[#1C3177] bg-blue-50/40 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="h-8 w-8 rounded-xl bg-blue-100 text-[#1C3177] flex items-center justify-center">
                <Laptop className="h-4 w-4" />
              </div>
              {theme === 'auto' && (
                <div className="h-5 w-5 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-900">Automático</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Sigue la preferencia del sistema operativo del usuario.
            </span>
          </button>
        </div>
      </div>

      {/* 2. SECCIÓN: DENSIDAD DE TABLAS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Table className="h-4 w-4 text-[#1C3177]" />
              Densidad de Tablas y Listados
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ajusta la altura de filas y espaciado de celdas en catálogo, movimientos, existencias y auditorías.
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#1C3177] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {tableDensity === 'comoda' ? 'Modo Cómodo' : 'Modo Compacto'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cómoda */}
          <button
            type="button"
            onClick={() => {
              setTableDensity('comoda');
              showPill('Densidad cómoda guardada y aplicada a tablas.');
            }}
            className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              tableDensity === 'comoda'
                ? 'border-[#1C3177] bg-blue-50/40 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#1C3177] flex items-center justify-center shrink-0">
              <AlignJustify className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Cómoda (Espaciada)</span>
                {tableDensity === 'comoda' && (
                  <div className="h-4 w-4 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Filas con mayor respiro visual (padding generoso). Recomendada para monitores de alta resolución.
              </p>
            </div>
          </button>

          {/* Compacta */}
          <button
            type="button"
            onClick={() => {
              setTableDensity('compacta');
              showPill('Densidad compacta guardada y aplicada a tablas.');
            }}
            className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              tableDensity === 'compacta'
                ? 'border-[#1C3177] bg-blue-50/40 ring-1 ring-[#1C3177]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#1C3177] flex items-center justify-center shrink-0">
              <Table className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Compacta (Densa)</span>
                {tableDensity === 'compacta' && (
                  <div className="h-4 w-4 rounded-full bg-[#1C3177] text-white flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Filas de menor altura (padding reducido) para ver un mayor volumen de activos sin tanto desplazamiento.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. SECCIÓN: PREFERENCIAS DE NOTIFICACIÓN Y CANALES */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#3DAA5C]" />
            Preferencias de Notificaciones y Alertas
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Selecciona qué eventos institucionales deseas monitorear y por cuáles canales recibirlos. Se guardan en tu perfil.
          </p>
        </div>

        {/* Tipos de Alertas */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-800">Eventos de Inventario</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Alerta Stock Bajo */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.stockBajo}
                onChange={(e) => {
                  updateNotifPreferences({ stockBajo: e.target.checked });
                  showPill('Preferencia de stock bajo actualizada en base de datos.');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  Stock bajo (Punto de reorden)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Aviso cuando un recurso alcance su cantidad mínima requerida.
                </span>
              </div>
            </label>

            {/* Alerta Stock Agotado */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.stockAgotado}
                onChange={(e) => {
                  updateNotifPreferences({ stockAgotado: e.target.checked });
                  showPill('Preferencia de stock agotado actualizada en base de datos.');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                  Stock crítico (0 unidades)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Aviso urgente ante quiebre de stock en almacén.
                </span>
              </div>
            </label>

            {/* Alerta Movimientos */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.movimientos}
                onChange={(e) => {
                  updateNotifPreferences({ movimientos: e.target.checked });
                  showPill('Preferencia de movimientos actualizada en base de datos.');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-blue-500" />
                  Movimientos y Traslados
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Entradas, salidas o reubicaciones entre clínicas y departamentos.
                </span>
              </div>
            </label>

            {/* Alerta Mantenimiento */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.mantenimientos}
                onChange={(e) => {
                  updateNotifPreferences({ mantenimientos: e.target.checked });
                  showPill('Preferencia de mantenimientos actualizada en base de datos.');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-[#3DAA5C]" />
                  Mantenimientos Programados
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Recordatorios de servicio preventivo para laptops, servidores y UPS.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Canales de Notificación */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <p className="text-xs font-bold text-slate-800">Canales de Entrega</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.canalPantalla}
                onChange={(e) => {
                  updateNotifPreferences({ canalPantalla: e.target.checked });
                  showPill('Canal en pantalla actualizado.');
                }}
                className="h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-800">
                  En pantalla (Campana en Navbar y badges)
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifPreferences.canalCorreo}
                onChange={(e) => {
                  updateNotifPreferences({ canalCorreo: e.target.checked });
                  showPill('Canal por correo actualizado en base de datos.');
                }}
                className="h-4 w-4 rounded text-[#1C3177] focus:ring-[#1C3177]"
              />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-800">
                  Correo institucional ({user?.email || 'Google Workspace'})
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 4. SECCIÓN: PERFIL INSTITUCIONAL DEL OPERADOR (100% FUNCIONAL Y EDITABLE) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-[#1C3177]" />
              Perfil Institucional del Operador
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Actualiza tu información personal, cargo y fotografía de perfil en SIIA. Auditoría inmutable (Ley 172-13).
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#2D8246] border border-emerald-200 text-[10px] font-bold">
            <ShieldCheck className="h-3 w-3 text-[#3DAA5C]" />
            Activo
          </span>
        </div>

        {profileError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-center gap-2 text-xs text-rose-700 animate-fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar / Foto de Perfil */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="relative group shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={nombreCompleto || 'Usuario'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1C3177] to-[#2B4BA0] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  {getInitials(nombreCompleto)}
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <p className="text-xs font-bold text-slate-900">Fotografía de Perfil</p>
              <p className="text-[11px] text-slate-500">
                Se admiten archivos JPG, PNG o WebP de hasta 5 MB. Se sincroniza con el encabezado y bitácoras.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-[#1C3177]" />
                  Subir foto
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Campos del Perfil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Institucional (Google)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={user?.email || perfil?.correo || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cargo Institucional
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej. Encargado de Almacén TI"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Departamento UOD
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
                >
                  <option value="">-- Seleccionar Departamento --</option>
                  {DEPARTAMENTOS_UOD.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono Institucional / Móvil
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. (809) 555-0123"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando en base de datos...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Guardar Cambios del Perfil
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 5. SECCIÓN: IDIOMA Y CONFIGURACIÓN REGIONAL */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#1C3177]" />
              Idioma y Región Institucional
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Normativa legal y formato de localización activo para la Universidad Odontológica Dominicana.
            </p>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            es-DO (Oficial)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-slate-800">Español (República Dominicana)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Formato de moneda en DOP (RD$), zona horaria estándar de Santo Domingo (UTC-4) y cumplimiento de Ley 172-13.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold shrink-0">
            <Check className="h-3.5 w-3.5 text-[#3DAA5C]" />
            Predeterminado
          </span>
        </div>
      </div>

      {/* 6. SECCIÓN: SEGURIDAD Y CIERRE DE SESIÓN */}
      <div className="rounded-2xl border border-rose-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <LogOut className="h-4 w-4 text-rose-600" />
              Sesión y Seguridad de Acceso
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Control de sesión institucional protegida por Google OAuth 2.0 y Supabase Auth.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#2D8246] border border-emerald-200 text-[10px] font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-[#3DAA5C]" />
            Sesión Autenticada
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-900">
                {perfil?.nombreCompleto || user?.user_metadata?.full_name || 'Operador UOD'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">({user?.email || 'N/A'})</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Al cerrar sesión se invalidarán los tokens de acceso temporales manteniendo tus preferencias de interfaz.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmLogoutOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Modal de Confirmación de Cierre de Sesión */}
      {confirmLogoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-scale-up text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ¿Confirmas cerrar tu sesión?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Se cerrará tu sesión activa en SIIA y volverás a la pantalla de acceso. Tus preferencias de configuración seguirán guardadas para cuando vuelvas a ingresar.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setConfirmLogoutOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleCerrarSesion}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isLoggingOut ? 'Cerrando...' : 'Sí, cerrar sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
