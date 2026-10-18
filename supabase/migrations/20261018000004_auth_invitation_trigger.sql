-- ==============================================================================
-- PROYECTO: SIIA - Sistema Inteligente de Inventario y Activos UOD
-- MIGRACIÓN 4: Control de Acceso Estricto por Invitación y Primer Super Admin
-- ARCHIVO: 20261018000004_auth_invitation_trigger.sql
-- ==============================================================================

-- 1. FUNCIÓN DE VALIDACIÓN Y CREACIÓN DE PERFIL DESDE INVITACIÓN
CREATE OR REPLACE FUNCTION public.validar_y_crear_perfil_desde_invitacion()
RETURNS TRIGGER AS $$
DECLARE
    v_correo_normalizado TEXT;
    v_invitacion_id UUID;
    v_rol rol_usuario;
    v_nombre_completo TEXT;
BEGIN
    v_correo_normalizado := LOWER(TRIM(NEW.email));

    -- Verificar si existe una invitación institucional pendiente para este correo
    SELECT id, rol 
    INTO v_invitacion_id, v_rol
    FROM public.invitaciones
    WHERE LOWER(TRIM(correo)) = v_correo_normalizado
      AND estado = 'pendiente'
    LIMIT 1;

    -- Si no tiene invitación autorizada, rechazar inmediatamente la transacción
    IF v_invitacion_id IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado a SIIA UOD: La cuenta (%) no cuenta con una invitación institucional activa. Comuníquese con la administración para solicitar acceso.', NEW.email
            USING ERRCODE = 'P0001';
    END IF;

    -- Determinar el nombre completo a partir de la metadata de Google OAuth
    v_nombre_completo := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Crear el perfil de usuario institucional con el rol asignado en la invitación
    INSERT INTO public.perfiles (
        id,
        correo,
        nombre_completo,
        rol,
        activo,
        creado_en,
        actualizado_en
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_nombre_completo,
        v_rol,
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        correo = EXCLUDED.correo,
        nombre_completo = EXCLUDED.nombre_completo,
        actualizado_en = now();

    -- Marcar la invitación institucional como aceptada y registrar la fecha de uso
    UPDATE public.invitaciones
    SET 
        estado = 'aceptada',
        usado_en = now()
    WHERE id = v_invitacion_id;

    -- Registrar evento en la Bitácora de Auditoría Inmutable (Ley 172-13)
    INSERT INTO public.bitacora_auditoria (
        usuario_id,
        origen,
        accion,
        entidad,
        registro_id,
        valores_nuevos,
        direccion_ip
    )
    VALUES (
        NEW.id,
        'humano',
        'LOGIN_GOOGLE_REGISTRO_INICIAL',
        'perfiles',
        NEW.id::TEXT,
        jsonb_build_object(
            'correo', NEW.email,
            'rol', v_rol,
            'invitacion_id', v_invitacion_id
        ),
        NULL
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DISPARADOR ANTES DE LA INSERCIÓN EN AUTH.USERS
DROP TRIGGER IF EXISTS trg_validar_invitacion_antes_crear_usuario ON auth.users;

CREATE TRIGGER trg_validar_invitacion_antes_crear_usuario
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_y_crear_perfil_desde_invitacion();

-- ==============================================================================
-- 3. SCRIPT DE INVITACIÓN PARA EL PRIMER SUPER ADMINISTRADOR
-- ==============================================================================
-- Inserta la invitación para el correo institucional principal de administración.
-- Puedes ajustar el correo aquí según la cuenta de Google con la que iniciarás sesión.
INSERT INTO public.invitaciones (
    correo,
    rol,
    estado,
    creado_en
)
VALUES 
    ('admin@uod.edu.do', 'super_admin', 'pendiente', now()),
    ('ryam2000@gmail.com', 'super_admin', 'pendiente', now())
ON CONFLICT (LOWER(correo)) DO UPDATE SET
    rol = 'super_admin',
    estado = 'pendiente';
