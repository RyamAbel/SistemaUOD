-- ==============================================================================
-- MIGRACIÓN: 20261022000006_perfil_avatar_cargo.sql
-- Ampliación de la tabla perfiles para foto de perfil y cargo institucional
-- ==============================================================================

ALTER TABLE public.perfiles 
    ADD COLUMN IF NOT EXISTS cargo TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.perfiles.cargo IS 'Cargo o posición institucional del usuario en la UOD';
COMMENT ON COLUMN public.perfiles.avatar_url IS 'URL o URI de la fotografía de perfil del usuario';
