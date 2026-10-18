-- ==============================================================================
-- PROYECTO: SIIA - Sistema Inteligente de Inventario y Activos UOD
-- MIGRACIÓN 1: Estructura Base, Seguridad, Catálogo y Recursos
-- ARCHIVO: 20261018000001_base_schema.sql
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpieza preventiva de tablas previas desactualizadas en public (Reset Limpio)
DROP TABLE IF EXISTS recursos_codigos CASCADE;
DROP TABLE IF EXISTS recursos_fotos CASCADE;
DROP TABLE IF EXISTS recursos CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;
DROP TABLE IF EXISTS invitaciones CASCADE;

-- 2. TIPOS ENUMERADOS (ENUMS)
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM (
        'super_admin',
        'admin_inventario',
        'encargado_almacen',
        'solicitante',
        'auditor',
        'consulta'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_recurso AS ENUM (
        'consumible',
        'activo_fijo'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_recurso AS ENUM (
        'disponible',
        'en_uso',
        'prestado',
        'en_mantenimiento',
        'danado',
        'dado_de_baja'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_ubicacion AS ENUM (
        'sede',
        'edificio',
        'almacen',
        'clinica',
        'laboratorio',
        'area_quirurgica'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_codigo AS ENUM (
        'qr_propio',
        'barra_ean13',
        'upc',
        'referencia_fabricante'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_invitacion AS ENUM (
        'pendiente',
        'aceptada',
        'revocada'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. FUNCIÓN REUTILIZABLE PARA ACTUALIZAR TIMESTAMPS
CREATE OR REPLACE FUNCTION actualizar_timestamp_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLA: INVITACIONES INSTITUCIONALES (Control de Acceso Seguro)
CREATE TABLE invitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correo TEXT NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'consulta',
    invitado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    estado estado_invitacion NOT NULL DEFAULT 'pendiente',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    usado_en TIMESTAMPTZ,
    CONSTRAINT chk_correo_formato CHECK (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE UNIQUE INDEX idx_invitaciones_correo_lower 
    ON invitaciones (LOWER(correo));

-- 5. TABLA: PERFILES DE USUARIO (Vinculados a auth.users de Supabase)
CREATE TABLE perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    correo TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'consulta',
    departamento TEXT,
    telefono TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_perfil_correo_formato CHECK (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE UNIQUE INDEX idx_perfiles_correo_lower 
    ON perfiles (LOWER(correo));

CREATE TRIGGER trg_perfiles_actualizado_en
    BEFORE UPDATE ON perfiles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 6. TABLA: CATEGORÍAS JERÁRQUICAS
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_padre_id UUID REFERENCES categorias(id) ON DELETE RESTRICT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categorias_padre 
    ON categorias(categoria_padre_id);

CREATE TRIGGER trg_categorias_actualizado_en
    BEFORE UPDATE ON categorias
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 7. TABLA: UBICACIONES JERÁRQUICAS (Sedes, Clínicas, Almacenes)
CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ubicacion_padre_id UUID REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo tipo_ubicacion NOT NULL,
    responsable_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    activa BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ubicaciones_padre 
    ON ubicaciones(ubicacion_padre_id);

CREATE INDEX idx_ubicaciones_tipo 
    ON ubicaciones(tipo);

CREATE TRIGGER trg_ubicaciones_actualizado_en
    BEFORE UPDATE ON ubicaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 8. TABLA: RECURSOS (Consumibles Clínicos y Activos Duraderos)
CREATE TABLE recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    tipo tipo_recurso NOT NULL,
    unidad_medida TEXT NOT NULL DEFAULT 'unidad',
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    stock_maximo INTEGER,
    punto_reorden INTEGER,
    costo_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_stock_minimo_positivo CHECK (stock_minimo >= 0),
    CONSTRAINT chk_stock_maximo_valido CHECK (stock_maximo IS NULL OR stock_maximo >= stock_minimo),
    CONSTRAINT chk_punto_reorden_valido CHECK (punto_reorden IS NULL OR punto_reorden >= stock_minimo),
    CONSTRAINT chk_costo_estimado_positivo CHECK (costo_estimado >= 0)
);

CREATE INDEX idx_recursos_categoria 
    ON recursos(categoria_id);

CREATE INDEX idx_recursos_tipo 
    ON recursos(tipo);

CREATE INDEX idx_recursos_nombre 
    ON recursos(nombre);

CREATE TRIGGER trg_recursos_actualizado_en
    BEFORE UPDATE ON recursos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_modificacion();

-- 9. TABLA: FOTOS DE RECURSOS (Múltiples fotos con orden y destacada)
CREATE TABLE recursos_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
    url_archivo TEXT NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT false,
    orden INTEGER NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recursos_fotos_recurso 
    ON recursos_fotos(recurso_id);

-- 10. TABLA: CÓDIGOS DE IDENTIFICACIÓN (QR propio y códigos de barras externos)
CREATE TABLE recursos_codigos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
    tipo_codigo tipo_codigo NOT NULL,
    codigo TEXT NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_recurso_tipo_codigo UNIQUE (tipo_codigo, codigo)
);

CREATE INDEX idx_recursos_codigos_recurso 
    ON recursos_codigos(recurso_id);

CREATE INDEX idx_recursos_codigos_busqueda 
    ON recursos_codigos(codigo);
