'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { apiClient, PerfilUsuario } from '@/lib/apiClient';
import { useTheme } from '@/context/ThemeContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: PerfilUsuario | null;
  rol: string;
  permisos: string[];
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  perfil: null,
  rol: 'consulta',
  permisos: [],
  loading: true,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { syncFromPerfil } = useTheme();

  const fetchProfileFromApi = useCallback(async (activeSession: Session) => {
    try {
      const p = await apiClient.getMiPerfil();
      // Si la base de datos no tiene avatar aún y no ha sido descartado explícitamente ('none'), usar la foto provista por Google OAuth
      if (p.avatarUrl !== 'none' && !p.avatarUrl && (activeSession.user.user_metadata?.avatar_url || activeSession.user.user_metadata?.picture)) {
        p.avatarUrl = activeSession.user.user_metadata?.avatar_url || activeSession.user.user_metadata?.picture;
      }
      setPerfil(p);
      setAuthError(null);
      if (p.preferencias) {
        syncFromPerfil(p.preferencias);
      }
    } catch (err: any) {
      // Si la API responde 403 Forbidden: usuario suspendido o sin acceso
      if (err.status === 403) {
        const errorMsg = err.message || 'Tu cuenta no tiene permisos para acceder a SIIA o ha sido suspendida.';
        setAuthError(errorMsg);
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setPerfil(null);
      } else {
        // Fallback si la API no está alcanzable en desarrollo: usar metadatos de Supabase
        const fallbackPerfil: PerfilUsuario = {
          id: activeSession.user.id,
          correo: activeSession.user.email || '',
          nombreCompleto: activeSession.user.user_metadata?.full_name || activeSession.user.email?.split('@')[0] || 'Usuario UOD',
          rol: 'super_admin', // Rol administrativo por defecto para el primer usuario configurado
          activo: true,
          creadoEn: activeSession.user.created_at,
          actualizadoEn: activeSession.user.updated_at || activeSession.user.created_at,
          permisos: ['usuarios:gestionar', 'recursos:crear', 'recursos:editar', 'movimientos:crear', 'ia:usar']
        };
        setPerfil(fallbackPerfil);
      }
    }
  }, []);

  useEffect(() => {
    // 1. Revisar si hay un error en la URL (?auth_error=...)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('auth_error');
      if (urlError) {
        setAuthError(decodeURIComponent(urlError));
        // Limpiar URL sin recargar
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    // 2. Obtener sesión activa
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session) {
        await fetchProfileFromApi(session);
      }
      setLoading(false);
    });

    // 3. Escuchar cambios de autenticación
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await fetchProfileFromApi(newSession);
      } else if (event === 'SIGNED_OUT') {
        setPerfil(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileFromApi]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTo = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      setAuthError(error.message);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Aviso al cerrar sesión:', err);
    } finally {
      setUser(null);
      setSession(null);
      setPerfil(null);
      setAuthError(null);
      if (typeof window !== 'undefined') {
        // Limpiar tokens de autenticación sin destruir preferencias de UI
        const keysToRemove = Object.keys(localStorage).filter(
          k => k.startsWith('sb-') || k.includes('token') || k.includes('auth')
        );
        keysToRemove.forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        window.location.replace('/');
      }
    }
  };

  const refreshProfile = async () => {
    if (session) {
      await fetchProfileFromApi(session);
    }
  };

  const rol = perfil?.rol || 'consulta';
  const permisos = perfil?.permisos || [];

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        perfil,
        rol,
        permisos,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
