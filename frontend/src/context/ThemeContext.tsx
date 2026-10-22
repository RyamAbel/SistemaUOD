'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type TableDensity = 'comoda' | 'compacta';

export interface NotificationPreferences {
  stockBajo: boolean;
  stockAgotado: boolean;
  movimientos: boolean;
  mantenimientos: boolean;
  canalPantalla: boolean;
  canalCorreo: boolean;
}

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  tableDensity: TableDensity;
  setTableDensity: (density: TableDensity) => void;
  notifPreferences: NotificationPreferences;
  updateNotifPreferences: (prefs: Partial<NotificationPreferences>) => void;
}

const defaultNotifPreferences: NotificationPreferences = {
  stockBajo: true,
  stockAgotado: true,
  movimientos: true,
  mantenimientos: true,
  canalPantalla: true,
  canalCorreo: true
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
  tableDensity: 'comoda',
  setTableDensity: () => {},
  notifPreferences: defaultNotifPreferences,
  updateNotifPreferences: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [tableDensity, setTableDensityState] = useState<TableDensity>('comoda');
  const [notifPreferences, setNotifPreferences] = useState<NotificationPreferences>(defaultNotifPreferences);

  // 1. Cargar preferencias guardadas en localStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Tema
    const savedTheme = (localStorage.getItem('siia_theme') as ThemeMode) || 'light';
    setThemeState(savedTheme);

    // Densidad de tablas
    const savedDensity = (localStorage.getItem('siia_table_density') as TableDensity) || 'comoda';
    setTableDensityState(savedDensity);

    // Preferencias de notificación
    const savedNotifs = localStorage.getItem('siia_notif_prefs');
    if (savedNotifs) {
      try {
        setNotifPreferences(JSON.parse(savedNotifs));
      } catch {
        setNotifPreferences(defaultNotifPreferences);
      }
    }
  }, []);

  // 2. Resolver y aplicar el tema al documento DOM
  const applyTheme = useCallback((mode: ThemeMode) => {
    if (typeof window === 'undefined') return;

    let target: 'light' | 'dark' = 'light';
    if (mode === 'auto') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      target = isSystemDark ? 'dark' : 'light';
    } else {
      target = mode;
    }

    setResolvedTheme(target);
    document.documentElement.setAttribute('data-theme', target);
    document.documentElement.classList.toggle('dark', target === 'dark');
  }, []);

  // 3. Reaccionar a cambios en `theme`
  useEffect(() => {
    applyTheme(theme);

    if (theme === 'auto' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyTheme]);

  // 4. Reaccionar a cambios en `tableDensity`
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-density', tableDensity);
  }, [tableDensity]);

  // Manejador para cambiar tema
  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('siia_theme', mode);
    }
    applyTheme(mode);
  };

  // Manejador para cambiar densidad de tablas
  const setTableDensity = (density: TableDensity) => {
    setTableDensityState(density);
    if (typeof window !== 'undefined') {
      localStorage.setItem('siia_table_density', density);
    }
  };

  // Manejador para actualizar preferencias de notificación
  const updateNotifPreferences = (prefs: Partial<NotificationPreferences>) => {
    setNotifPreferences((prev) => {
      const updated = { ...prev, ...prefs };
      if (typeof window !== 'undefined') {
        localStorage.setItem('siia_notif_prefs', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        tableDensity,
        setTableDensity,
        notifPreferences,
        updateNotifPreferences
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
