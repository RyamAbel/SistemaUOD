'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Briefcase,
  Building2,
  Phone,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (mensaje: string) => void;
}

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

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const { user, perfil, refreshProfile } = useAuth();

  // Estados del formulario
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Estados de control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos actuales del perfil al abrir
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setAvatarFile(null);

      const fullName = perfil?.nombreCompleto || user?.user_metadata?.full_name || '';
      const parts = fullName.trim().split(' ');
      if (parts.length > 1) {
        setNombres(parts.slice(0, parts.length - 1).join(' '));
        setApellidos(parts[parts.length - 1]);
      } else {
        setNombres(fullName);
        setApellidos('');
      }

      setCargo(perfil?.cargo || '');
      setDepartamento(perfil?.departamento || 'Tecnología e Información');
      setTelefono(perfil?.telefono || '');
      setAvatarPreview(perfil?.avatarUrl || user?.user_metadata?.avatar_url || null);
    }
  }, [isOpen, perfil, user]);

  if (!isOpen) return null;

  // Manejar selección de foto de avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño máximo: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La imagen seleccionada supera el tamaño máximo de 5 MB.');
      return;
    }

    // Validar tipo permitido (JPG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Formato no permitido. Solo se admiten archivos JPG, PNG o WebP.');
      return;
    }

    setErrorMessage(null);
    setAvatarFile(file);

    // Generar vista previa local
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Restablecer foto de avatar a iniciales
  const handleRemoveAvatar = async () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrorMessage(null);

    // Si ya existía en backend, eliminarlo de inmediato
    if (perfil?.avatarUrl) {
      try {
        setIsUploadingAvatar(true);
        await apiClient.eliminarAvatarPerfil();
        await refreshProfile();
        setSuccessMessage('Foto de perfil eliminada. Se mostrarán tus iniciales.');
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al eliminar la foto de perfil');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  // Guardar cambios del perfil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`.trim();
    if (nombreCompleto.length < 2) {
      setErrorMessage('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Si hay un archivo de avatar nuevo seleccionado, subirlo primero
      let nuevaAvatarUrl = avatarPreview;
      if (avatarFile) {
        setIsUploadingAvatar(true);
        try {
          const resAvatar = await apiClient.subirAvatarPerfil(avatarFile);
          nuevaAvatarUrl = resAvatar.avatarUrl || avatarPreview;
        } catch (uploadErr: any) {
          console.warn('Aviso al subir avatar a storage:', uploadErr);
          // Si falla storage en dev, mantenemos la vista previa como data-url
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      // 2. Actualizar datos en la API
      await apiClient.actualizarMiPerfil({
        nombreCompleto,
        cargo: cargo.trim() || null,
        departamento: departamento.trim() || null,
        telefono: telefono.trim() || null,
        avatarUrl: nuevaAvatarUrl
      });

      // 3. Refrescar estado global del usuario
      await refreshProfile();

      const msg = 'Perfil institucional actualizado exitosamente.';
      setSuccessMessage(msg);
      onProfileUpdated?.(msg);

      // Cerrar modal automáticamente tras 1.2 segundos
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error actualizando perfil:', err);
      setErrorMessage(err.message || 'Ocurrió un error al guardar los cambios del perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = `${nombres} ${apellidos}`.trim() || perfil?.nombreCompleto || 'Usuario';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-editar-perfil-title"
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-scale-up">
        {/* Encabezado con Paleta Institucional UOD */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1C3177] text-white shadow-md shadow-[#1C3177]/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 id="modal-editar-perfil-title" className="text-base font-bold text-slate-900">
                Editar perfil institucional
              </h2>
              <p className="text-xs text-slate-500">
                Actualiza tus datos de contacto y fotografía en SIIA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Mensajes de Alerta */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-center gap-2.5 text-xs text-rose-700 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 flex items-center gap-2.5 text-xs text-[#2D8246] animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3DAA5C]" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Sección de Fotografía de Perfil */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            {/* Círculo de Avatar */}
            <div className="relative group shrink-0">
              <div className="h-22 w-22 rounded-full overflow-hidden border-3 border-[#1C3177]/20 bg-[#1C3177]/10 flex items-center justify-center shadow-inner">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-[#1C3177]">
                    {initials}
                  </span>
                )}
              </div>

              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-slate-900/60 flex items-center justify-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            {/* Controles de Foto */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Fotografía del operador
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Formatos permitidos: JPG, PNG o WebP. Tamaño máximo: 5 MB. Se reflejará en el menú, bitácora y movimientos.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {/* Botón Subir Archivo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
                >
                  <Upload className="h-3.5 w-3.5 text-[#1C3177]" />
                  Subir archivo
                </button>

                {/* Botón Tomar Foto */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
                >
                  <Camera className="h-3.5 w-3.5 text-[#3DAA5C]" />
                  Tomar foto
                </button>

                {/* Botón Quitar Foto */}
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-xs"
                    title="Quitar foto y usar iniciales"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    Quitar
                  </button>
                )}

                {/* Inputs invisibles */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* Campo Correo Institucional (Solo Lectura) */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Correo institucional
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="h-3 w-3 text-[#3DAA5C]" />
                Google Workspace
              </span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={user?.email || perfil?.correo || ''}
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-100/70 px-4 py-2.5 text-xs text-slate-500 font-mono cursor-not-allowed select-none"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" title="El correo institucional no puede modificarse">
                <Lock className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Cuenta vinculada mediante Google OAuth 2.0. No se puede editar manualmente.
            </p>
          </div>

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Nombres <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Ej. Juan Carlos"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Apellidos
              </label>
              <input
                type="text"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Ej. Pérez Gómez"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
              />
            </div>
          </div>

          {/* Cargo y Departamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                Cargo institucional
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ej. Encargado de Soporte TI"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                Departamento
              </label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
              >
                {DEPARTAMENTOS_UOD.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teléfono de contacto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Teléfono / Flota institucional
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. (809) 555-0100 ext. 204"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177] transition-all"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-[#1C3177]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando cambios...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
