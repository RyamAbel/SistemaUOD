-- ==============================================================================
-- MIGRACIÓN: 20261022000007_activos_factura_costo.sql
-- Agregar costo_adquisicion, factura_url y factura_nombre a activos_serie
-- ==============================================================================

ALTER TABLE public.activos_serie
    ADD COLUMN IF NOT EXISTS costo_adquisicion NUMERIC(14,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS factura_url TEXT,
    ADD COLUMN IF NOT EXISTS factura_nombre TEXT;

COMMENT ON COLUMN public.activos_serie.costo_adquisicion IS 'Costo de adquisición real del activo físico individual en DOP';
COMMENT ON COLUMN public.activos_serie.factura_url IS 'URL o ruta en Supabase Storage de la factura digital del activo (PDF o imagen)';
COMMENT ON COLUMN public.activos_serie.factura_nombre IS 'Nombre original del archivo de la factura adjunta';
