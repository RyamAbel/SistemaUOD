-- ==============================================================================
-- PROYECTO: SIIA - Sistema Inteligente de Inventario y Activos UOD
-- MIGRACIÓN 5: Permitir inicio de sesión con cualquier cuenta de Google
-- ARCHIVO: 005_allow_any_google_account.sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validar_y_crear_perfil_desde_invitacion()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_correo_normalizado TEXT;
    v_invitacion_id UUID;
    v_rol public.rol_usuario;
    v_nombre_completo TEXT;
    v_perfil_id_existente UUID;
BEGIN
    v_correo_normalizado := LOWER(TRIM(NEW.email));

    -- Verificar si existe una invitación para este correo
    SELECT id, rol 
    INTO v_invitacion_id, v_rol
    FROM public.invitaciones
    WHERE LOWER(TRIM(correo)) = v_correo_normalizado
      AND estado = 'pendiente'
    LIMIT 1;

    -- Si no tiene invitación explícita, asignar rol por defecto (acceso unificado para cualquier cuenta de Google)
    IF v_rol IS NULL THEN
        v_rol := 'admin_inventario'::public.rol_usuario;
    END IF;

    -- Determinar el nombre completo a partir de la metadata de Google OAuth
    v_nombre_completo := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Comprobar si ya existe un perfil con este correo o con este ID
    SELECT id INTO v_perfil_id_existente 
    FROM public.perfiles 
    WHERE id = NEW.id OR LOWER(correo) = v_correo_normalizado 
    LIMIT 1;

    IF v_perfil_id_existente IS NOT NULL THEN
        -- Si existía con un ID distinto (ej: seed inicial), actualizar el ID al nuevo ID de auth.users
        IF v_perfil_id_existente <> NEW.id THEN
            DELETE FROM public.perfiles WHERE id = v_perfil_id_existente;
            
            INSERT INTO public.perfiles (
                id, correo, nombre_completo, rol, activo, creado_en, actualizado_en
            ) VALUES (
                NEW.id, NEW.email, v_nombre_completo, v_rol, true, now(), now()
            );
        ELSE
            UPDATE public.perfiles 
            SET 
                correo = NEW.email,
                nombre_completo = COALESCE(v_nombre_completo, perfiles.nombre_completo),
                activo = true,
                actualizado_en = now()
            WHERE id = NEW.id;
        END IF;
    ELSE
        INSERT INTO public.perfiles (
            id, correo, nombre_completo, rol, activo, creado_en, actualizado_en
        ) VALUES (
            NEW.id, NEW.email, v_nombre_completo, v_rol, true, now(), now()
        );
    END IF;

    -- Si tenía una invitación pendiente, marcarla como aceptada
    IF v_invitacion_id IS NOT NULL THEN
        UPDATE public.invitaciones
        SET 
            estado = 'aceptada',
            usado_en = now()
        WHERE id = v_invitacion_id;
    END IF;

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
        'LOGIN_GOOGLE_ACCESO',
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
EXCEPTION WHEN OTHERS THEN
    -- Nunca bloquear la creación del usuario en auth.users
    RAISE WARNING 'Aviso en crear perfil para %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;
