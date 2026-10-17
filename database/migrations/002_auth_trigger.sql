-- ==============================================================================
-- SISTEMA INTELIGENTE DE INVENTARIO CON IA (SIIA / SistemaUOD)
-- Migración 002: Sincronización automática de Google OAuth con Perfiles
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_inst_id UUID;
    v_user_count INTEGER;
    v_assigned_role VARCHAR(50);
BEGIN
    -- Obtener la institución principal (UOD)
    SELECT id INTO v_inst_id FROM public.instituciones LIMIT 1;
    
    -- Si es el primer usuario en la plataforma, asignarle super_admin
    SELECT COUNT(*) INTO v_user_count FROM public.perfiles;
    IF v_user_count = 0 THEN
        v_assigned_role := 'super_admin';
    ELSE
        -- Verificar si tenía una invitación previa
        SELECT rol INTO v_assigned_role FROM public.invitaciones 
        WHERE email = NEW.email AND estado = 'pendiente' LIMIT 1;
        
        IF v_assigned_role IS NULL THEN
            v_assigned_role := 'consulta';
        ELSE
            UPDATE public.invitaciones SET estado = 'aceptada' WHERE email = NEW.email;
        END IF;
    END IF;

    -- Insertar o actualizar el perfil
    INSERT INTO public.perfiles (
        id,
        institucion_id,
        nombre_completo,
        email,
        avatar_url,
        rol,
        estado
    )
    VALUES (
        NEW.id,
        v_inst_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        v_assigned_role,
        'activo'
    )
    ON CONFLICT (id) DO UPDATE SET
        nombre_completo = EXCLUDED.nombre_completo,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();

    -- Registrar evento en la bitácora de auditoría
    IF v_inst_id IS NOT NULL THEN
        INSERT INTO public.bitacora_auditoria (
            institucion_id,
            usuario_id,
            origen,
            accion,
            entidad,
            entidad_id,
            detalles
        )
        VALUES (
            v_inst_id,
            NEW.id,
            'humano',
            'LOGIN_GOOGLE',
            'perfiles',
            NEW.id::TEXT,
            'Usuario inició sesión mediante Google OAuth 2.0'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador sobre auth.users al registrarse o entrar con Google
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
