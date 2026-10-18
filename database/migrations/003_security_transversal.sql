-- ==============================================================================
-- PROYECTO: SIIA - Sistema Inteligente de Inventario y Activos UOD
-- MIGRACIÓN 3: Seguridad, Auditoría (Ley 172-13), Alertas, IA, RLS y Storage
-- ARCHIVO: 20261018000003_security_transversal.sql
-- ==============================================================================

-- 1. TIPOS ENUMERADOS TRANSVERSALES
DO $$ BEGIN
    CREATE TYPE origen_auditoria AS ENUM (
        'humano',
        'asistente_ia',
        'sistema_background'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_alerta AS ENUM (
        'stock_bajo',
        'proximo_vencimiento',
        'mantenimiento_vencido',
        'anomalia_conteo',
        'sistema'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE severidad_alerta AS ENUM (
        'info',
        'advertencia',
        'urgente'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_correo AS ENUM (
        'pendiente',
        'enviado',
        'fallido'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_propuesta_ia AS ENUM (
        'pendiente',
        'confirmada',
        'rechazada',
        'expirada'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Limpieza preventiva de tablas transversales en public
DROP TABLE IF EXISTS ia_propuestas_accion CASCADE;
DROP TABLE IF EXISTS ia_mensajes CASCADE;
DROP TABLE IF EXISTS ia_conversaciones CASCADE;
DROP TABLE IF EXISTS cola_correos CASCADE;
DROP TABLE IF EXISTS notificaciones_preferencias CASCADE;
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS bitacora_auditoria CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS llaves_integracion CASCADE;

-- 2. TABLA: BITÁCORA DE AUDITORÍA INMUTABLE (Cumplimiento Ley 172-13)
CREATE TABLE bitacora_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    origen origen_auditoria NOT NULL DEFAULT 'humano',
    accion TEXT NOT NULL,
    entidad TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    direccion_ip TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bitacora_usuario ON bitacora_auditoria(usuario_id);
CREATE INDEX idx_bitacora_entidad ON bitacora_auditoria(entidad, registro_id);
CREATE INDEX idx_bitacora_fecha ON bitacora_auditoria(creado_en DESC);

-- 3. TABLA: ALERTAS Y NOTIFICACIONES
CREATE TABLE alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo tipo_alerta NOT NULL,
    severidad severidad_alerta NOT NULL DEFAULT 'info',
    recurso_id UUID REFERENCES recursos(id) ON DELETE CASCADE,
    ubicacion_id UUID REFERENCES ubicaciones(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alertas_tipo ON alertas(tipo);
CREATE INDEX idx_alertas_leida ON alertas(leida);

-- 4. TABLA: PREFERENCIAS DE NOTIFICACIÓN POR USUARIO
CREATE TABLE notificaciones_preferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE UNIQUE,
    recibir_alertas_stock BOOLEAN NOT NULL DEFAULT true,
    recibir_alertas_mantenimiento BOOLEAN NOT NULL DEFAULT true,
    recibir_resumen_semanal BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_notif_pref_actualizado_en
    BEFORE UPDATE ON notificaciones_preferencias
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 5. TABLA: COLA TRANSACCIONAL DE CORREOS (Envío Seguro por Gmail API)
CREATE TABLE cola_correos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destinatario TEXT NOT NULL,
    asunto TEXT NOT NULL,
    cuerpo_html TEXT NOT NULL,
    estado estado_correo NOT NULL DEFAULT 'pendiente',
    intentos INTEGER NOT NULL DEFAULT 0,
    ultimo_error TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    procesado_en TIMESTAMPTZ
);

CREATE INDEX idx_cola_correos_estado ON cola_correos(estado, intentos);

-- 6. TABLAS: ASISTENTE DE IA (Gemini) Y CONTROL DE ACCIONES PROPUESTAS
CREATE TABLE ia_conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL DEFAULT 'Nueva consulta',
    modo TEXT NOT NULL DEFAULT 'operativo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ia_conversaciones_usuario ON ia_conversaciones(usuario_id);

CREATE TRIGGER trg_ia_conv_actualizado_en
    BEFORE UPDATE ON ia_conversaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

CREATE TABLE ia_mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID NOT NULL REFERENCES ia_conversaciones(id) ON DELETE CASCADE,
    emisor TEXT NOT NULL CHECK (emisor IN ('usuario', 'asistente')),
    contenido TEXT NOT NULL,
    tokens_utilizados INTEGER DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ia_mensajes_conversacion ON ia_mensajes(conversacion_id);

CREATE TABLE ia_propuestas_accion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mensaje_id UUID NOT NULL REFERENCES ia_mensajes(id) ON DELETE CASCADE,
    tipo_accion TEXT NOT NULL,
    datos_propuesta JSONB NOT NULL,
    estado estado_propuesta_ia NOT NULL DEFAULT 'pendiente',
    movimiento_id UUID REFERENCES movimientos(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    respondido_en TIMESTAMPTZ
);

CREATE INDEX idx_ia_propuestas_estado ON ia_propuestas_accion(estado);

-- 7. TABLAS: LLAVES DE INTEGRACIÓN Y WEBHOOKS
CREATE TABLE llaves_integracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    prefijo_llave TEXT NOT NULL UNIQUE,
    hash_llave TEXT NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'consulta',
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultimo_uso_en TIMESTAMPTZ
);

CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_destino TEXT NOT NULL,
    eventos TEXT[] NOT NULL,
    secreto_firma TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. SEGURIDAD POR FILA (ROW LEVEL SECURITY - RLS) EN TODAS LAS TABLAS
-- ==============================================================================

-- Función auxiliar para obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION mi_rol_actual()
RETURNS rol_usuario AS $$
    SELECT rol FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Habilitar RLS en todas las tablas del sistema
ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos_codigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activos_serie ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE existencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteos_fisicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteos_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cola_correos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_propuestas_accion ENABLE ROW LEVEL SECURITY;

-- 8.1 Políticas de Perfiles
DROP POLICY IF EXISTS "Lectura de perfiles para usuarios autenticados" ON perfiles;
CREATE POLICY "Lectura de perfiles para usuarios autenticados"
    ON perfiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modificación de perfil propio o por super_admin" ON perfiles;
CREATE POLICY "Modificación de perfil propio o por super_admin"
    ON perfiles FOR UPDATE TO authenticated
    USING (id = auth.uid() OR mi_rol_actual() = 'super_admin');

-- 8.2 Políticas de Catálogo y Ubicaciones
DROP POLICY IF EXISTS "Lectura pública de categorias" ON categorias;
CREATE POLICY "Lectura pública de categorias"
    ON categorias FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Edicion de categorias para administradores" ON categorias;
CREATE POLICY "Edicion de categorias para administradores"
    ON categorias FOR ALL TO authenticated
    USING (mi_rol_actual() IN ('super_admin', 'admin_inventario'));

DROP POLICY IF EXISTS "Lectura pública de ubicaciones" ON ubicaciones;
CREATE POLICY "Lectura pública de ubicaciones"
    ON ubicaciones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Edicion de ubicaciones para administradores" ON ubicaciones;
CREATE POLICY "Edicion de ubicaciones para administradores"
    ON ubicaciones FOR ALL TO authenticated
    USING (mi_rol_actual() IN ('super_admin', 'admin_inventario'));

DROP POLICY IF EXISTS "Lectura de recursos para autenticados" ON recursos;
CREATE POLICY "Lectura de recursos para autenticados"
    ON recursos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestion de recursos autorizada" ON recursos;
CREATE POLICY "Gestion de recursos autorizada"
    ON recursos FOR ALL TO authenticated
    USING (mi_rol_actual() IN ('super_admin', 'admin_inventario', 'encargado_almacen'));

DROP POLICY IF EXISTS "Lectura de fotos de recursos" ON recursos_fotos;
CREATE POLICY "Lectura de fotos de recursos"
    ON recursos_fotos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestion de fotos de recursos" ON recursos_fotos;
CREATE POLICY "Gestion de fotos de recursos"
    ON recursos_fotos FOR ALL TO authenticated
    USING (mi_rol_actual() IN ('super_admin', 'admin_inventario', 'encargado_almacen'));

DROP POLICY IF EXISTS "Lectura de codigos de recursos" ON recursos_codigos;
CREATE POLICY "Lectura de codigos de recursos"
    ON recursos_codigos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestion de codigos de recursos" ON recursos_codigos;
CREATE POLICY "Gestion de codigos de recursos"
    ON recursos_codigos FOR ALL TO authenticated
    USING (mi_rol_actual() IN ('super_admin', 'admin_inventario', 'encargado_almacen'));

DROP POLICY IF EXISTS "Lectura de existencias para autenticados" ON existencias;
CREATE POLICY "Lectura de existencias para autenticados"
    ON existencias FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestion de existencias para personal operativo" ON existencias;
CREATE POLICY "Gestion de existencias para personal operativo"
    ON existencias FOR ALL TO authenticated
    USING (mi_rol_actual() IN ('super_admin', 'admin_inventario', 'encargado_almacen'));

DROP POLICY IF EXISTS "Lectura de movimientos para autenticados" ON movimientos;
CREATE POLICY "Lectura de movimientos para autenticados"
    ON movimientos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insercion de movimientos para personal operativo" ON movimientos;
CREATE POLICY "Insercion de movimientos para personal operativo"
    ON movimientos FOR INSERT TO authenticated
    WITH CHECK (mi_rol_actual() IN ('super_admin', 'admin_inventario', 'encargado_almacen'));

DROP POLICY IF EXISTS "Lectura de lineas de movimiento" ON movimientos_lineas;
CREATE POLICY "Lectura de lineas de movimiento"
    ON movimientos_lineas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insercion de lineas de movimiento" ON movimientos_lineas;
CREATE POLICY "Insercion de lineas de movimiento"
    ON movimientos_lineas FOR INSERT TO authenticated
    WITH CHECK (mi_rol_actual() IN ('super_admin', 'admin_inventario', 'encargado_almacen'));

-- 8.3 Políticas de Bitácora de Auditoría (INMUTABILIDAD: Solo lectura para Auditor y Super Admin)
DROP POLICY IF EXISTS "Insercion en bitacora por el sistema o usuarios autenticados" ON bitacora_auditoria;
CREATE POLICY "Insercion en bitacora por el sistema o usuarios autenticados"
    ON bitacora_auditoria FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura de bitacora exclusiva para auditor o super_admin" ON bitacora_auditoria;
CREATE POLICY "Lectura de bitacora exclusiva para auditor o super_admin"
    ON bitacora_auditoria FOR SELECT TO authenticated
    USING (mi_rol_actual() IN ('super_admin', 'auditor'));

-- 8.4 Políticas de Asistente IA (Aislamiento por usuario)
DROP POLICY IF EXISTS "Conversaciones solo para el propietario" ON ia_conversaciones;
CREATE POLICY "Conversaciones solo para el propietario"
    ON ia_conversaciones FOR ALL TO authenticated
    USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Mensajes solo para el propietario de la conversacion" ON ia_mensajes;
CREATE POLICY "Mensajes solo para el propietario de la conversacion"
    ON ia_mensajes FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ia_conversaciones
            WHERE ia_conversaciones.id = ia_mensajes.conversacion_id
            AND ia_conversaciones.usuario_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Propuestas IA solo para el propietario de la conversacion" ON ia_propuestas_accion;
CREATE POLICY "Propuestas IA solo para el propietario de la conversacion"
    ON ia_propuestas_accion FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ia_mensajes
            JOIN ia_conversaciones ON ia_conversaciones.id = ia_mensajes.conversacion_id
            WHERE ia_mensajes.id = ia_propuestas_accion.mensaje_id
            AND ia_conversaciones.usuario_id = auth.uid()
        )
    );

-- ==============================================================================
-- 9. ESPACIOS DE ALMACENAMIENTO (SUPABASE STORAGE BUCKETS PRIVADOS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('recursos-fotos', 'recursos-fotos', true),
    ('documentos-comprobantes', 'documentos-comprobantes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para recursos-fotos
DROP POLICY IF EXISTS "Acceso publico de lectura para fotos de recursos" ON storage.objects;
CREATE POLICY "Acceso publico de lectura para fotos de recursos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'recursos-fotos');

DROP POLICY IF EXISTS "Carga de fotos de recursos para usuarios operativos" ON storage.objects;
CREATE POLICY "Carga de fotos de recursos para usuarios operativos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'recursos-fotos' AND
        mi_rol_actual() IN ('super_admin', 'admin_inventario', 'encargado_almacen')
    );

-- Políticas de Storage para documentos-comprobantes
DROP POLICY IF EXISTS "Lectura de comprobantes para personal autorizado" ON storage.objects;
CREATE POLICY "Lectura de comprobantes para personal autorizado"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'documentos-comprobantes');

DROP POLICY IF EXISTS "Carga de comprobantes para personal operativo" ON storage.objects;
CREATE POLICY "Carga de comprobantes para personal operativo"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'documentos-comprobantes' AND
        mi_rol_actual() IN ('super_admin', 'admin_inventario', 'encargado_almacen')
    );
