-- ==============================================================================
-- PROYECTO: SIIA - Sistema Inteligente de Inventario y Activos UOD
-- MIGRACIÓN 2: Operación, Existencias, Movimientos, Asignaciones, Mantenimiento y Compras
-- ARCHIVO: 20261018000002_operation_schema.sql
-- ==============================================================================

-- 1. TIPOS ENUMERADOS DE OPERACIÓN
DO $$ BEGIN
    CREATE TYPE tipo_movimiento AS ENUM (
        'entrada',
        'salida',
        'traslado',
        'ajuste',
        'devolucion',
        'baja'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_asignacion AS ENUM (
        'asignacion_fija',
        'prestamo_temporal'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_asignacion AS ENUM (
        'activo',
        'devuelto',
        'vencido'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_mantenimiento AS ENUM (
        'preventivo',
        'correctivo',
        'calibracion'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_mantenimiento AS ENUM (
        'programado',
        'en_proceso',
        'completado',
        'cancelado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_orden_compra AS ENUM (
        'borrador',
        'aprobada',
        'enviada',
        'recibida_parcial',
        'recibida_total',
        'cancelada'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_conteo_fisico AS ENUM (
        'abierto',
        'conciliado',
        'anulado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Limpieza preventiva de tablas operativas previas desactualizadas en public
DROP TABLE IF EXISTS conteos_lineas CASCADE;
DROP TABLE IF EXISTS conteos_fisicos CASCADE;
DROP TABLE IF EXISTS ordenes_compra_lineas CASCADE;
DROP TABLE IF EXISTS ordenes_compra CASCADE;
DROP TABLE IF EXISTS mantenimientos CASCADE;
DROP TABLE IF EXISTS asignaciones_prestamos CASCADE;
DROP TABLE IF EXISTS movimientos_lineas CASCADE;
DROP TABLE IF EXISTS movimientos CASCADE;
DROP TABLE IF EXISTS existencias CASCADE;
DROP TABLE IF EXISTS lotes CASCADE;
DROP TABLE IF EXISTS activos_serie CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;

-- 2. TABLA: PROVEEDORES (RNC Dominicano y Gestión de Insumos - Cero Cobros/Pagos)
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rnc TEXT NOT NULL UNIQUE,
    nombre_comercial TEXT NOT NULL,
    razon_social TEXT,
    contacto_nombre TEXT,
    telefono TEXT,
    correo TEXT,
    direccion TEXT,
    plazo_credito_dias INTEGER NOT NULL DEFAULT 30,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_rnc_formato CHECK (rnc ~* '^[0-9]{9,11}$')
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre_comercial);

CREATE TRIGGER trg_proveedores_actualizado_en
    BEFORE UPDATE ON proveedores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 3. TABLA: ACTIVOS CON NÚMERO DE SERIE (Trazabilidad Individual de Bienes)
CREATE TABLE IF NOT EXISTS activos_serie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT,
    numero_serie TEXT NOT NULL,
    placa_institucional TEXT UNIQUE,
    estado estado_recurso NOT NULL DEFAULT 'disponible',
    ubicacion_id UUID NOT NULL REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    responsable_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    fecha_adquisicion DATE,
    garantia_vence DATE,
    notas TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_recurso_numero_serie UNIQUE (recurso_id, numero_serie)
);

CREATE INDEX IF NOT EXISTS idx_activos_serie_recurso ON activos_serie(recurso_id);
CREATE INDEX IF NOT EXISTS idx_activos_serie_ubicacion ON activos_serie(ubicacion_id);
CREATE INDEX IF NOT EXISTS idx_activos_serie_estado ON activos_serie(estado);
CREATE INDEX IF NOT EXISTS idx_activos_serie_responsable ON activos_serie(responsable_id);

CREATE TRIGGER trg_activos_serie_actualizado_en
    BEFORE UPDATE ON activos_serie
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 4. TABLA: LOTES (Control de Vencimiento Clínico para Fármacos y Biomateriales)
CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT,
    numero_lote TEXT NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_recurso_lote UNIQUE (recurso_id, numero_lote),
    CONSTRAINT chk_fechas_lote CHECK (fecha_vencimiento IS NULL OR fecha_fabricacion IS NULL OR fecha_vencimiento >= fecha_fabricacion)
);

CREATE INDEX IF NOT EXISTS idx_lotes_recurso ON lotes(recurso_id);
CREATE INDEX IF NOT EXISTS idx_lotes_vencimiento ON lotes(fecha_vencimiento);

-- 5. TABLA: EXISTENCIAS (Control de Stock por Ubicación y Lote - Sin Saldo Negativo)
CREATE TABLE IF NOT EXISTS existencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT,
    ubicacion_id UUID NOT NULL REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    lote_id UUID REFERENCES lotes(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_stock_no_negativo CHECK (cantidad >= 0),
    CONSTRAINT uq_recurso_ubicacion_lote UNIQUE NULLS NOT DISTINCT (recurso_id, ubicacion_id, lote_id)
);

CREATE INDEX IF NOT EXISTS idx_existencias_recurso ON existencias(recurso_id);
CREATE INDEX IF NOT EXISTS idx_existencias_ubicacion ON existencias(ubicacion_id);
CREATE INDEX IF NOT EXISTS idx_existencias_lote ON existencias(lote_id);

CREATE TRIGGER trg_existencias_actualizado_en
    BEFORE UPDATE ON existencias
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 6. TABLA: MOVIMIENTOS (Cabecera Transaccional con Auditoría y Gobernanza de IA)
CREATE TABLE IF NOT EXISTS movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_movimiento TEXT NOT NULL UNIQUE,
    tipo tipo_movimiento NOT NULL,
    origen_ubicacion_id UUID REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    destino_ubicacion_id UUID REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
    origen_ia BOOLEAN NOT NULL DEFAULT false,
    motivo TEXT NOT NULL,
    comprobante_url TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_movimiento_rutas CHECK (
        (tipo = 'entrada' AND destino_ubicacion_id IS NOT NULL) OR
        (tipo = 'salida' AND origen_ubicacion_id IS NOT NULL) OR
        (tipo = 'traslado' AND origen_ubicacion_id IS NOT NULL AND destino_ubicacion_id IS NOT NULL AND origen_ubicacion_id <> destino_ubicacion_id) OR
        (tipo IN ('ajuste', 'devolucion', 'baja') AND (origen_ubicacion_id IS NOT NULL OR destino_ubicacion_id IS NOT NULL))
    )
);

CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON movimientos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_origen ON movimientos(origen_ubicacion_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_destino ON movimientos(destino_ubicacion_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(creado_en DESC);

-- 7. TABLA: LÍNEAS DE MOVIMIENTO (Detalle de Insumos por Operación)
CREATE TABLE IF NOT EXISTS movimientos_lineas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimiento_id UUID NOT NULL REFERENCES movimientos(id) ON DELETE CASCADE,
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT,
    lote_id UUID REFERENCES lotes(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL,
    costo_unitario NUMERIC(12, 2) DEFAULT 0.00,
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0)
);

CREATE INDEX IF NOT EXISTS idx_movimientos_lineas_movimiento ON movimientos_lineas(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_lineas_recurso ON movimientos_lineas(recurso_id);

-- 8. TABLA: ASIGNACIONES Y PRÉSTAMOS (Trazabilidad de Custodios Clínicos)
CREATE TABLE IF NOT EXISTS asignaciones_prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activo_serie_id UUID NOT NULL REFERENCES activos_serie(id) ON DELETE RESTRICT,
    custodio_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
    tipo tipo_asignacion NOT NULL DEFAULT 'asignacion_fija',
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_devolucion_prevista TIMESTAMPTZ,
    fecha_devolucion_real TIMESTAMPTZ,
    estado estado_asignacion NOT NULL DEFAULT 'activo',
    observaciones TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_fechas_prestamo CHECK (
        tipo <> 'prestamo_temporal' OR 
        fecha_devolucion_prevista IS NULL OR 
        fecha_devolucion_prevista >= fecha_inicio
    )
);

CREATE INDEX IF NOT EXISTS idx_asignaciones_activo ON asignaciones_prestamos(activo_serie_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_custodio ON asignaciones_prestamos(custodio_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_estado ON asignaciones_prestamos(estado);

CREATE TRIGGER trg_asignaciones_actualizado_en
    BEFORE UPDATE ON asignaciones_prestamos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 9. TABLA: MANTENIMIENTOS (Preventivos y Correctivos de Equipos Odontológicos)
CREATE TABLE IF NOT EXISTS mantenimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activo_serie_id UUID NOT NULL REFERENCES activos_serie(id) ON DELETE RESTRICT,
    tipo tipo_mantenimiento NOT NULL DEFAULT 'preventivo',
    fecha_programada DATE NOT NULL,
    fecha_ejecutada DATE,
    estado estado_mantenimiento NOT NULL DEFAULT 'programado',
    costo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tecnico_responsable TEXT NOT NULL,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    checklist_completado JSONB DEFAULT '[]'::jsonb,
    observaciones TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_mantenimiento_costo CHECK (costo >= 0)
);

CREATE INDEX IF NOT EXISTS idx_mantenimientos_activo ON mantenimientos(activo_serie_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_estado ON mantenimientos(estado);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_fecha_prog ON mantenimientos(fecha_programada);

CREATE TRIGGER trg_mantenimientos_actualizado_en
    BEFORE UPDATE ON mantenimientos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 10. TABLA: ÓRDENES DE COMPRA (Adquisición de Insumos - Sin Cobros/Facturas de Venta)
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden TEXT NOT NULL UNIQUE,
    proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
    solicitante_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
    estado estado_orden_compra NOT NULL DEFAULT 'borrador',
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega_estimada DATE,
    observaciones TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado ON ordenes_compra(estado);

CREATE TRIGGER trg_ordenes_compra_actualizado_en
    BEFORE UPDATE ON ordenes_compra
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 11. TABLA: LÍNEAS DE ÓRDENES DE COMPRA (Recepción Parcial o Total)
CREATE TABLE IF NOT EXISTS ordenes_compra_lineas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT,
    cantidad_solicitada INTEGER NOT NULL,
    cantidad_recibida INTEGER NOT NULL DEFAULT 0,
    precio_unitario_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_compra_cantidades CHECK (cantidad_solicitada > 0 AND cantidad_recibida >= 0),
    CONSTRAINT chk_compra_precio CHECK (precio_unitario_estimado >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ordenes_compra_lineas_orden ON ordenes_compra_lineas(orden_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_lineas_recurso ON ordenes_compra_lineas(recurso_id);

-- 12. TABLA: CONTEOS FÍSICOS (Inventarios Periódicos de Auditoría)
CREATE TABLE IF NOT EXISTS conteos_fisicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ubicacion_id UUID NOT NULL REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    responsable_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_cierre TIMESTAMPTZ,
    estado estado_conteo_fisico NOT NULL DEFAULT 'abierto',
    observaciones TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conteos_ubicacion ON conteos_fisicos(ubicacion_id);
CREATE INDEX IF NOT EXISTS idx_conteos_estado ON conteos_fisicos(estado);

-- 13. TABLA: LÍNEAS DE CONTEO Y DISCREPANCIAS
CREATE TABLE IF NOT EXISTS conteos_lineas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conteo_id UUID NOT NULL REFERENCES conteos_fisicos(id) ON DELETE CASCADE,
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT,
    lote_id UUID REFERENCES lotes(id) ON DELETE RESTRICT,
    cantidad_sistema INTEGER NOT NULL DEFAULT 0,
    cantidad_fisica INTEGER NOT NULL DEFAULT 0,
    diferencia INTEGER GENERATED ALWAYS AS (cantidad_fisica - cantidad_sistema) STORED,
    ajuste_movimiento_id UUID REFERENCES movimientos(id) ON DELETE SET NULL,
    notas TEXT,
    CONSTRAINT chk_conteos_positivos CHECK (cantidad_sistema >= 0 AND cantidad_fisica >= 0)
);

CREATE INDEX IF NOT EXISTS idx_conteos_lineas_conteo ON conteos_lineas(conteo_id);
CREATE INDEX IF NOT EXISTS idx_conteos_lineas_recurso ON conteos_lineas(recurso_id);
