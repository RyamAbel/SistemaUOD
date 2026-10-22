-- ==============================================================================
-- MIGRACIÓN: Casts implícitos de TEXT / VARCHAR a tipos ENUM personalizados
-- Descripción: Permite que ORMs y clientes (EF Core, Npgsql, REST) asignen y comparen
--              cadenas de texto directamente con columnas enum sin error 42804.
-- ==============================================================================

DO $$
BEGIN
    -- 1. estado_recurso
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'estado_recurso') THEN
        CREATE CAST (text AS estado_recurso) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'estado_recurso') THEN
        CREATE CAST (character varying AS estado_recurso) WITH INOUT AS IMPLICIT;
    END IF;

    -- 2. tipo_recurso
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'tipo_recurso') THEN
        CREATE CAST (text AS tipo_recurso) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'tipo_recurso') THEN
        CREATE CAST (character varying AS tipo_recurso) WITH INOUT AS IMPLICIT;
    END IF;

    -- 3. rol_usuario
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'rol_usuario') THEN
        CREATE CAST (text AS rol_usuario) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'rol_usuario') THEN
        CREATE CAST (character varying AS rol_usuario) WITH INOUT AS IMPLICIT;
    END IF;

    -- 4. tipo_ubicacion
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'tipo_ubicacion') THEN
        CREATE CAST (text AS tipo_ubicacion) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'tipo_ubicacion') THEN
        CREATE CAST (character varying AS tipo_ubicacion) WITH INOUT AS IMPLICIT;
    END IF;

    -- 5. tipo_codigo
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'tipo_codigo') THEN
        CREATE CAST (text AS tipo_codigo) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'tipo_codigo') THEN
        CREATE CAST (character varying AS tipo_codigo) WITH INOUT AS IMPLICIT;
    END IF;

    -- 6. estado_invitacion
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'estado_invitacion') THEN
        CREATE CAST (text AS estado_invitacion) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'estado_invitacion') THEN
        CREATE CAST (character varying AS estado_invitacion) WITH INOUT AS IMPLICIT;
    END IF;

    -- 7. tipo_movimiento
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'tipo_movimiento') THEN
        CREATE CAST (text AS tipo_movimiento) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'tipo_movimiento') THEN
        CREATE CAST (character varying AS tipo_movimiento) WITH INOUT AS IMPLICIT;
    END IF;

    -- 8. tipo_asignacion
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'tipo_asignacion') THEN
        CREATE CAST (text AS tipo_asignacion) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'tipo_asignacion') THEN
        CREATE CAST (character varying AS tipo_asignacion) WITH INOUT AS IMPLICIT;
    END IF;

    -- 9. estado_asignacion
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'estado_asignacion') THEN
        CREATE CAST (text AS estado_asignacion) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'estado_asignacion') THEN
        CREATE CAST (character varying AS estado_asignacion) WITH INOUT AS IMPLICIT;
    END IF;

    -- 10. tipo_mantenimiento
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'tipo_mantenimiento') THEN
        CREATE CAST (text AS tipo_mantenimiento) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'tipo_mantenimiento') THEN
        CREATE CAST (character varying AS tipo_mantenimiento) WITH INOUT AS IMPLICIT;
    END IF;

    -- 11. estado_mantenimiento
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'estado_mantenimiento') THEN
        CREATE CAST (text AS estado_mantenimiento) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'estado_mantenimiento') THEN
        CREATE CAST (character varying AS estado_mantenimiento) WITH INOUT AS IMPLICIT;
    END IF;

    -- 12. estado_orden_compra
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'estado_orden_compra') THEN
        CREATE CAST (text AS estado_orden_compra) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'estado_orden_compra') THEN
        CREATE CAST (character varying AS estado_orden_compra) WITH INOUT AS IMPLICIT;
    END IF;

    -- 13. estado_conteo_fisico
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'estado_conteo_fisico') THEN
        CREATE CAST (text AS estado_conteo_fisico) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'estado_conteo_fisico') THEN
        CREATE CAST (character varying AS estado_conteo_fisico) WITH INOUT AS IMPLICIT;
    END IF;

    -- 14. origen_auditoria
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'origen_auditoria') THEN
        CREATE CAST (text AS origen_auditoria) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'origen_auditoria') THEN
        CREATE CAST (character varying AS origen_auditoria) WITH INOUT AS IMPLICIT;
    END IF;

    -- 15. tipo_alerta
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'tipo_alerta') THEN
        CREATE CAST (text AS tipo_alerta) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'tipo_alerta') THEN
        CREATE CAST (character varying AS tipo_alerta) WITH INOUT AS IMPLICIT;
    END IF;

    -- 16. severidad_alerta
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'severidad_alerta') THEN
        CREATE CAST (text AS severidad_alerta) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'severidad_alerta') THEN
        CREATE CAST (character varying AS severidad_alerta) WITH INOUT AS IMPLICIT;
    END IF;

    -- 17. estado_correo
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'estado_correo') THEN
        CREATE CAST (text AS estado_correo) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'estado_correo') THEN
        CREATE CAST (character varying AS estado_correo) WITH INOUT AS IMPLICIT;
    END IF;

    -- 18. estado_propuesta_ia
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'text' AND t.typname = 'estado_propuesta_ia') THEN
        CREATE CAST (text AS estado_propuesta_ia) WITH INOUT AS IMPLICIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'estado_propuesta_ia') THEN
        CREATE CAST (character varying AS estado_propuesta_ia) WITH INOUT AS IMPLICIT;
    END IF;
END $$;
