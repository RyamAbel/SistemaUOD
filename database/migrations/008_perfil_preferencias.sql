-- ==============================================================================
-- MIGRACIÓN: 008_perfil_preferencias.sql
-- Agregar columna preferencias a la tabla perfiles
-- ==============================================================================

ALTER TABLE public.perfiles 
    ADD COLUMN IF NOT EXISTS preferencias TEXT;

COMMENT ON COLUMN public.perfiles.preferencias IS 'Preferencias personalizadas de usuario (tema, densidad de tablas, filtros de alertas) en formato JSON';
