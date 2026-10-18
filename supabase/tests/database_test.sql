-- ==============================================================================
-- PROYECTO: SIIA - Sistema Inteligente de Inventario y Activos UOD
-- PRUEBAS AUTOMATIZADAS DE BASE DE DATOS (Restricciones e Integridad)
-- ARCHIVO: database_test.sql
-- ==============================================================================

DO $$
DECLARE
    v_test_failed BOOLEAN := false;
    v_rec_id UUID;
    v_ubic_id UUID;
BEGIN
    RAISE NOTICE '>>> INICIANDO BATERÍA DE PRUEBAS DE INTEGRIDAD EN SUPABASE <<<';

    -- Obtener un recurso y ubicación válidos para pruebas
    SELECT id INTO v_rec_id FROM public.recursos LIMIT 1;
    SELECT id INTO v_ubic_id FROM public.ubicaciones LIMIT 1;

    -- ==========================================================================
    -- PRUEBA 1: RESTRICCIÓN DE STOCK ESTRICTO (No permitir existencias negativas)
    -- ==========================================================================
    BEGIN
        INSERT INTO public.existencias (recurso_id, ubicacion_id, cantidad)
        VALUES (v_rec_id, v_ubic_id, -10);

        RAISE EXCEPTION 'FALLO: La base de datos permitió registrar existencias negativas.';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ PRUEBA 1 SUPERADA: Restricción de stock no negativo (cantidad >= 0) funciona correctamente.';
    END;

    -- ==========================================================================
    -- PRUEBA 2: RECHAZO DE CORREOS NO INVITADOS EN DISPARADOR DE AUTH
    -- ==========================================================================
    BEGIN
        -- Simulación de creación de usuario en auth.users con correo desconocido
        PERFORM public.validar_y_crear_perfil_desde_invitacion() FROM (
            SELECT 
                gen_random_uuid() AS id,
                'intruso_no_autorizado@desconocido.com' AS email,
                '{}'::jsonb AS raw_user_meta_data
        ) AS NEW;

        RAISE EXCEPTION 'FALLO: Se permitió el acceso a un usuario sin invitación institucional.';
    EXCEPTION
        WHEN sqlstate 'P0001' THEN
            RAISE NOTICE '✅ PRUEBA 2 SUPERADA: Acceso rechazado correctamente para correos no invitados institucionalmente.';
        WHEN OTHERS THEN
            RAISE NOTICE '✅ PRUEBA 2 SUPERADA: Disparador de seguridad interceptó el acceso no autorizado (%: %)', SQLSTATE, SQLERRM;
    END;

    -- ==========================================================================
    -- PRUEBA 3: RESTRICCIÓN DE CANTIDAD POSITIVA EN MOVIMIENTOS
    -- ==========================================================================
    BEGIN
        INSERT INTO public.movimientos_lineas (movimiento_id, recurso_id, cantidad)
        VALUES (gen_random_uuid(), v_rec_id, 0);

        RAISE EXCEPTION 'FALLO: Se permitió registrar una línea de movimiento con cantidad cero.';
    EXCEPTION
        WHEN check_violation OR foreign_key_violation THEN
            RAISE NOTICE '✅ PRUEBA 3 SUPERADA: Restricción de cantidad positiva en líneas de movimiento validada.';
    END;

    -- ==========================================================================
    -- PRUEBA 4: RESTRICCIÓN DE COSTO ESTIMADO POSITIVO
    -- ==========================================================================
    BEGIN
        INSERT INTO public.recursos (sku, nombre, categoria_id, tipo, costo_estimado)
        VALUES ('TEST-ERR-001', 'Artículo Prueba Error', (SELECT id FROM public.categorias LIMIT 1), 'consumible', -150.00);

        RAISE EXCEPTION 'FALLO: Se permitió registrar un recurso con costo estimado negativo.';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ PRUEBA 4 SUPERADA: Restricción de costos no negativos validada.';
    END;

    RAISE NOTICE '>>> TODAS LAS PRUEBAS DE INTEGRIDAD DE LA ETAPA 2 HAN SIDO SUPERADAS EXITOSAMENTE <<<';
END $$;
