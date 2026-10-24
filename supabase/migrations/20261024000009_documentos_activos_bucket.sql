-- ==============================================================================
-- PROYECTO: SIIA - Sistema Inteligente de Inventario y Activos UOD
-- MIGRACIÓN 9: Creación del bucket de facturas y documentos de activos
-- ARCHIVO: 20261024000009_documentos_activos_bucket.sql
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documentos-activos', 'documentos-activos', true),
    ('documentos-comprobantes', 'documentos-comprobantes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acceso publico lectura facturas activos" ON storage.objects;
CREATE POLICY "Acceso publico lectura facturas activos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documentos-activos');

DROP POLICY IF EXISTS "Carga facturas activos autenticado" ON storage.objects;
CREATE POLICY "Carga facturas activos autenticado"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documentos-activos');

DROP POLICY IF EXISTS "Actualizar facturas activos autenticado" ON storage.objects;
CREATE POLICY "Actualizar facturas activos autenticado"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'documentos-activos');

DROP POLICY IF EXISTS "Eliminar facturas activos autenticado" ON storage.objects;
CREATE POLICY "Eliminar facturas activos autenticado"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'documentos-activos');
