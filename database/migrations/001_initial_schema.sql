-- ==============================================================================
-- SISTEMA INTELIGENTE DE INVENTARIO CON IA (SIIA / SistemaUOD)
-- Migración Inicial: 001_initial_schema.sql
-- Compatible con Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función utilitaria para actualizar columnas 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. INSTITUCIONES / MULTI-TENANCY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.instituciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    rnc VARCHAR(50),
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(150),
    dominio_permitido VARCHAR(100), -- Ej: institucion.edu.do para restringir Google OAuth
    logo_url TEXT,
    configuracion JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_instituciones_updated_at
BEFORE UPDATE ON public.instituciones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 3. PERFILES DE USUARIOS (Vinculados a auth.users de Supabase)
-- ==============================================================================
-- Roles del sistema:
-- 'super_admin'           : Control total y configuración institucional
-- 'admin_inventario'      : Gestión completa de catálogo, movimientos, compras
-- 'encargado_almacen'     : Entradas, salidas, traslados y conteos
-- 'solicitante'           : Solicitar consumibles y ver activos asignados
-- 'auditor'               : Solo lectura y revisión de bitácora
-- 'consulta'              : Acceso básico de consulta
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institucion_id UUID REFERENCES public.instituciones(id) ON DELETE RESTRICT,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    avatar_url TEXT,
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    rol VARCHAR(50) NOT NULL DEFAULT 'consulta' CHECK (
        rol IN ('super_admin', 'admin_inventario', 'encargado_almacen', 'solicitante', 'auditor', 'consulta')
    ),
    estado VARCHAR(30) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'pendiente')),
    preferencias JSONB DEFAULT '{"tema": "oscuro", "notificaciones_email": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_perfiles_updated_at
BEFORE UPDATE ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. INVITACIONES PREVIAS (Registro solo por invitación autorizada)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'solicitante' CHECK (
        rol IN ('super_admin', 'admin_inventario', 'encargado_almacen', 'solicitante', 'auditor', 'consulta')
    ),
    departamento VARCHAR(100),
    cargo VARCHAR(100),
    token VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'cancelada', 'expirada')),
    invitado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expira_en TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- ==============================================================================
-- 5. CATEGORÍAS DE ARTÍCULOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(50),
    icono VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cat_inst_nombre UNIQUE (institucion_id, nombre)
);

CREATE TRIGGER trg_categorias_updated_at
BEFORE UPDATE ON public.categorias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. UBICACIONES (Sedes, Almacenes, Oficinas, Aulas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    sede VARCHAR(100) NOT NULL DEFAULT 'Principal',
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'almacen' CHECK (
        tipo IN ('almacen', 'oficina', 'aula', 'laboratorio', 'taller', 'archivo', 'otro')
    ),
    responsable_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ubicacion_inst_nombre UNIQUE (institucion_id, sede, nombre)
);

CREATE TRIGGER trg_ubicaciones_updated_at
BEFORE UPDATE ON public.ubicaciones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. CATÁLOGO DE ARTÍCULOS Y SUMINISTROS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    codigo_barras VARCHAR(100),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL DEFAULT 'consumible' CHECK (tipo IN ('consumible', 'activo_fijo')),
    unidad_medida VARCHAR(50) NOT NULL DEFAULT 'unidad', -- unidad, caja, resma, paquete, litro, metro
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    stock_maximo INTEGER,
    costo_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_articulo_inst_sku UNIQUE (institucion_id, sku)
);

CREATE INDEX idx_articulos_inst_sku ON public.articulos(institucion_id, sku);
CREATE INDEX idx_articulos_codigo_barras ON public.articulos(institucion_id, codigo_barras);

CREATE TRIGGER trg_articulos_updated_at
BEFORE UPDATE ON public.articulos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 8. EXISTENCIAS POR UBICACIÓN (Stock cuantitativo)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.existencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    articulo_id UUID NOT NULL REFERENCES public.articulos(id) ON DELETE CASCADE,
    ubicacion_id UUID NOT NULL REFERENCES public.ubicaciones(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cantidad >= 0),
    lote VARCHAR(100),
    fecha_vencimiento DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_existencia_art_ubic_lote UNIQUE (institucion_id, articulo_id, ubicacion_id, lote)
);

CREATE INDEX idx_existencias_articulo ON public.existencias(articulo_id);
CREATE INDEX idx_existencias_ubicacion ON public.existencias(ubicacion_id);

CREATE TRIGGER trg_existencias_updated_at
BEFORE UPDATE ON public.existencias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 9. ACTIVOS FIJOS (Unidades individuales con serial y trazabilidad de custodia)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activos_fijos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    articulo_id UUID NOT NULL REFERENCES public.articulos(id) ON DELETE RESTRICT,
    numero_serie VARCHAR(150),
    codigo_activo VARCHAR(100) NOT NULL, -- Código de barra o placa física institucional
    fecha_adquisicion DATE,
    costo_compra NUMERIC(12, 2) DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'disponible' CHECK (
        estado IN ('disponible', 'asignado', 'en_prestamo', 'en_mantenimiento', 'dado_de_baja')
    ),
    responsable_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    ubicacion_id UUID REFERENCES public.ubicaciones(id) ON DELETE SET NULL,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_activo_inst_codigo UNIQUE (institucion_id, codigo_activo)
);

CREATE INDEX idx_activos_fijos_responsable ON public.activos_fijos(responsable_id);
CREATE INDEX idx_activos_fijos_codigo ON public.activos_fijos(institucion_id, codigo_activo);

CREATE TRIGGER trg_activos_fijos_updated_at
BEFORE UPDATE ON public.activos_fijos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 10. PROVEEDORES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    rnc VARCHAR(50),
    contacto_nombre VARCHAR(150),
    telefono VARCHAR(50),
    email VARCHAR(150),
    direccion TEXT,
    condiciones_pago VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_proveedores_updated_at
BEFORE UPDATE ON public.proveedores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 11. ÓRDENES DE COMPRA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    numero_orden VARCHAR(100) NOT NULL,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE RESTRICT,
    estado VARCHAR(50) NOT NULL DEFAULT 'borrador' CHECK (
        estado IN ('borrador', 'solicitada', 'aprobada', 'recibida_parcial', 'recibida_total', 'cancelada')
    ),
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega_esperada DATE,
    total_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notas TEXT,
    creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_orden_inst_numero UNIQUE (institucion_id, numero_orden)
);

CREATE TRIGGER trg_ordenes_compra_updated_at
BEFORE UPDATE ON public.ordenes_compra
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ordenes_compra_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_compra_id UUID NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
    articulo_id UUID NOT NULL REFERENCES public.articulos(id) ON DELETE RESTRICT,
    cantidad_solicitada NUMERIC(12, 2) NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_recibida NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cantidad_recibida >= 0),
    costo_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. MOVIMIENTOS DE INVENTARIO (Trazabilidad total)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    numero_movimiento VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (
        tipo IN ('entrada', 'salida', 'traslado', 'ajuste_positivo', 'ajuste_negativo', 'baja', 'devolucion')
    ),
    articulo_id UUID NOT NULL REFERENCES public.articulos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0),
    ubicacion_origen_id UUID REFERENCES public.ubicaciones(id) ON DELETE RESTRICT,
    ubicacion_destino_id UUID REFERENCES public.ubicaciones(id) ON DELETE RESTRICT,
    lote VARCHAR(100),
    motivo TEXT NOT NULL,
    documento_referencia VARCHAR(150), -- Factura, orden de compra, conduce, memo
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    origen_ia BOOLEAN NOT NULL DEFAULT false,
    idempotency_key VARCHAR(100), -- Para evitar movimientos duplicados por reintentos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_movimiento_idempotency UNIQUE (institucion_id, idempotency_key)
);

CREATE INDEX idx_movimientos_articulo ON public.movimientos(articulo_id);
CREATE INDEX idx_movimientos_usuario ON public.movimientos(usuario_id);
CREATE INDEX idx_movimientos_fecha ON public.movimientos(created_at DESC);

-- ==============================================================================
-- 13. PRÉSTAMOS DE ACTIVOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    activo_fijo_id UUID NOT NULL REFERENCES public.activos_fijos(id) ON DELETE RESTRICT,
    usuario_solicitante_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    solicitante_externo VARCHAR(200), -- Si es un estudiante o tercero no registrado
    departamento VARCHAR(100),
    fecha_prestamo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_limite_devolucion TIMESTAMPTZ NOT NULL,
    fecha_devolucion_real TIMESTAMPTZ,
    estado VARCHAR(50) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'devuelto', 'vencido', 'con_incidencia')),
    observaciones_entrega TEXT,
    observaciones_devolucion TEXT,
    entregado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    recibido_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_prestamos_updated_at
BEFORE UPDATE ON public.prestamos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 14. MANTENIMIENTOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mantenimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    activo_fijo_id UUID NOT NULL REFERENCES public.activos_fijos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL DEFAULT 'preventivo' CHECK (tipo IN ('preventivo', 'correctivo')),
    descripcion TEXT NOT NULL,
    fecha_programada DATE NOT NULL,
    fecha_realizacion DATE,
    costo NUMERIC(12, 2) DEFAULT 0.00,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    tecnico_responsable VARCHAR(150),
    estado VARCHAR(50) NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado', 'en_proceso', 'completado', 'cancelado')),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_mantenimientos_updated_at
BEFORE UPDATE ON public.mantenimientos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 15. INVENTARIO FÍSICO Y CONCILIACIONES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventarios_fisicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    ubicacion_id UUID NOT NULL REFERENCES public.ubicaciones(id) ON DELETE RESTRICT,
    titulo VARCHAR(200) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'conciliado', 'anulado')),
    responsable_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventarios_fisicos_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id UUID NOT NULL REFERENCES public.inventarios_fisicos(id) ON DELETE CASCADE,
    articulo_id UUID NOT NULL REFERENCES public.articulos(id) ON DELETE RESTRICT,
    cantidad_sistema NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cantidad_contada NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    diferencia NUMERIC(12, 2) GENERATED ALWAYS AS (cantidad_contada - cantidad_sistema) STORED,
    justificacion TEXT,
    contado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 16. NOTIFICACIONES Y COLA DE CORREOS (Google Gmail API)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (
        tipo IN ('stock_minimo', 'por_vencer', 'mantenimiento_proximo', 'prestamo_vencido', 'accion_ia', 'orden_compra', 'sistema')
    ),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT false,
    url_destino VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON public.notificaciones(usuario_id, leido);

CREATE TABLE IF NOT EXISTS public.cola_notificaciones_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    destinatario_email VARCHAR(150) NOT NULL,
    destinatario_nombre VARCHAR(150),
    asunto VARCHAR(255) NOT NULL,
    cuerpo_html TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviando', 'enviado', 'fallido')),
    intentos INTEGER NOT NULL DEFAULT 0,
    ultimo_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    enviado_at TIMESTAMPTZ
);

CREATE INDEX idx_cola_email_estado ON public.cola_notificaciones_email(estado, intentos);

-- ==============================================================================
-- 17. BITÁCORA DE AUDITORÍA INMUTABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bitacora_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    origen VARCHAR(20) NOT NULL DEFAULT 'humano' CHECK (origen IN ('humano', 'ia')),
    accion VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, EXECUTE_ACTION
    entidad VARCHAR(100) NOT NULL, -- articulos, existencias, movimientos, etc.
    entidad_id VARCHAR(100),
    datos_antes JSONB,
    datos_despues JSONB,
    detalles TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bitacora_inst_fecha ON public.bitacora_auditoria(institucion_id, created_at DESC);
CREATE INDEX idx_bitacora_entidad ON public.bitacora_auditoria(entidad, entidad_id);

-- ==============================================================================
-- 18. CONVERSACIONES Y ACCIONES DE LA IA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.conversaciones_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL DEFAULT 'Nueva conversación',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mensajes_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID NOT NULL REFERENCES public.conversaciones_ia(id) ON DELETE CASCADE,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('user', 'assistant', 'system', 'tool')),
    contenido TEXT NOT NULL,
    herramientas_llamadas JSONB, -- Argumentos de function calling
    propuesta_accion JSONB,      -- Estructura de acción previa a confirmación
    accion_confirmada BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 19. TRIGGER PARA APLICAR MOVIMIENTO DIRECTO EN EXISTENCIAS ATÓMICAMENTE
-- ==============================================================================
CREATE OR REPLACE FUNCTION procesar_movimiento_existencias()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual NUMERIC(12, 2);
BEGIN
    -- 1. Si es ENTRADA o AJUSTE_POSITIVO: Incrementa en ubicación destino
    IF NEW.tipo IN ('entrada', 'ajuste_positivo', 'devolucion') THEN
        IF NEW.ubicacion_destino_id IS NULL THEN
            RAISE EXCEPTION 'Ubicación de destino requerida para entradas o ajustes positivos';
        END IF;

        INSERT INTO public.existencias (institucion_id, articulo_id, ubicacion_id, cantidad, lote)
        VALUES (NEW.institucion_id, NEW.articulo_id, NEW.ubicacion_destino_id, NEW.cantidad, NEW.lote)
        ON CONFLICT (institucion_id, articulo_id, ubicacion_id, lote)
        DO UPDATE SET
            cantidad = public.existencias.cantidad + EXCLUDED.cantidad,
            updated_at = NOW();

    -- 2. Si es SALIDA, AJUSTE_NEGATIVO o BAJA: Descuenta de ubicación origen
    ELSIF NEW.tipo IN ('salida', 'ajuste_negativo', 'baja') THEN
        IF NEW.ubicacion_origen_id IS NULL THEN
            RAISE EXCEPTION 'Ubicación de origen requerida para salidas o bajas';
        END IF;

        SELECT cantidad INTO v_stock_actual
        FROM public.existencias
        WHERE institucion_id = NEW.institucion_id
          AND articulo_id = NEW.articulo_id
          AND ubicacion_id = NEW.ubicacion_origen_id
          AND (lote = NEW.lote OR (lote IS NULL AND NEW.lote IS NULL));

        IF v_stock_actual IS NULL OR v_stock_actual < NEW.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente en la ubicación origen (Disponible: %, Solicitado: %)',
                COALESCE(v_stock_actual, 0), NEW.cantidad;
        END IF;

        UPDATE public.existencias
        SET cantidad = cantidad - NEW.cantidad,
            updated_at = NOW()
        WHERE institucion_id = NEW.institucion_id
          AND articulo_id = NEW.articulo_id
          AND ubicacion_id = NEW.ubicacion_origen_id
          AND (lote = NEW.lote OR (lote IS NULL AND NEW.lote IS NULL));

    -- 3. Si es TRASLADO: Descuenta de origen e incrementa en destino
    ELSIF NEW.tipo = 'traslado' THEN
        IF NEW.ubicacion_origen_id IS NULL OR NEW.ubicacion_destino_id IS NULL THEN
            RAISE EXCEPTION 'Traslado requiere tanto ubicación de origen como de destino';
        END IF;

        IF NEW.ubicacion_origen_id = NEW.ubicacion_destino_id THEN
            RAISE EXCEPTION 'La ubicación de origen y destino no pueden ser iguales en un traslado';
        END IF;

        -- Descontar de origen
        SELECT cantidad INTO v_stock_actual
        FROM public.existencias
        WHERE institucion_id = NEW.institucion_id
          AND articulo_id = NEW.articulo_id
          AND ubicacion_id = NEW.ubicacion_origen_id
          AND (lote = NEW.lote OR (lote IS NULL AND NEW.lote IS NULL));

        IF v_stock_actual IS NULL OR v_stock_actual < NEW.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para traslado en origen (Disponible: %, Solicitado: %)',
                COALESCE(v_stock_actual, 0), NEW.cantidad;
        END IF;

        UPDATE public.existencias
        SET cantidad = cantidad - NEW.cantidad,
            updated_at = NOW()
        WHERE institucion_id = NEW.institucion_id
          AND articulo_id = NEW.articulo_id
          AND ubicacion_id = NEW.ubicacion_origen_id
          AND (lote = NEW.lote OR (lote IS NULL AND NEW.lote IS NULL));

        -- Incrementar en destino
        INSERT INTO public.existencias (institucion_id, articulo_id, ubicacion_id, cantidad, lote)
        VALUES (NEW.institucion_id, NEW.articulo_id, NEW.ubicacion_destino_id, NEW.cantidad, NEW.lote)
        ON CONFLICT (institucion_id, articulo_id, ubicacion_id, lote)
        DO UPDATE SET
            cantidad = public.existencias.cantidad + EXCLUDED.cantidad,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_procesar_movimiento_existencias
AFTER INSERT ON public.movimientos
FOR EACH ROW EXECUTE FUNCTION procesar_movimiento_existencias();

-- ==============================================================================
-- 20. SEGURIDAD A NIVEL DE FILA (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.existencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_fijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventarios_fisicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventarios_fisicos_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cola_notificaciones_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversaciones_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_ia ENABLE ROW LEVEL SECURITY;

-- Helper function: Obtener institucion_id del usuario autenticado
CREATE OR REPLACE FUNCTION get_auth_user_institucion_id()
RETURNS UUID AS $$
    SELECT institucion_id FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Políticas básicas de RLS para usuarios autenticados
CREATE POLICY "Acceso a perfiles de la misma institucion"
ON public.perfiles FOR ALL
USING (institucion_id = get_auth_user_institucion_id() OR id = auth.uid());

CREATE POLICY "Acceso a categorias de su institucion"
ON public.categorias FOR ALL
USING (institucion_id = get_auth_user_institucion_id());

CREATE POLICY "Acceso a ubicaciones de su institucion"
ON public.ubicaciones FOR ALL
USING (institucion_id = get_auth_user_institucion_id());

CREATE POLICY "Acceso a articulos de su institucion"
ON public.articulos FOR ALL
USING (institucion_id = get_auth_user_institucion_id());

CREATE POLICY "Acceso a existencias de su institucion"
ON public.existencias FOR ALL
USING (institucion_id = get_auth_user_institucion_id());

CREATE POLICY "Acceso a activos fijos de su institucion"
ON public.activos_fijos FOR ALL
USING (institucion_id = get_auth_user_institucion_id());

CREATE POLICY "Acceso a proveedores de su institucion"
ON public.proveedores FOR ALL
USING (institucion_id = get_auth_user_institucion_id());

CREATE POLICY "Acceso a movimientos de su institucion"
ON public.movimientos FOR ALL
USING (institucion_id = get_auth_user_institucion_id());

CREATE POLICY "Acceso a notificaciones propias"
ON public.notificaciones FOR ALL
USING (usuario_id = auth.uid());

CREATE POLICY "Acceso a bitacora de auditoria de su institucion"
ON public.bitacora_auditoria FOR SELECT
USING (institucion_id = get_auth_user_institucion_id());
