-- ==============================================================================
-- SISTEMA INTELIGENTE DE INVENTARIO CON IA (SIIA / SistemaUOD)
-- Datos de Prueba Iniciales (Seed Data)
-- ==============================================================================

DO $$
DECLARE
    v_inst_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    v_cat_oficina UUID := gen_random_uuid();
    v_cat_computo UUID := gen_random_uuid();
    v_cat_mobiliario UUID := gen_random_uuid();
    v_cat_limpieza UUID := gen_random_uuid();
    v_ubic_central UUID := gen_random_uuid();
    v_ubic_secr UUID := gen_random_uuid();
    v_ubic_lab1 UUID := gen_random_uuid();
    v_art_papel UUID := gen_random_uuid();
    v_art_marcadores UUID := gen_random_uuid();
    v_art_laptop UUID := gen_random_uuid();
    v_art_silla UUID := gen_random_uuid();
    v_prov_distribuidora UUID := gen_random_uuid();
BEGIN
    -- 1. Institución Inicial
    INSERT INTO public.instituciones (id, nombre, rnc, direccion, telefono, email, activo)
    VALUES (
        v_inst_id,
        'Institución Educativa / Organizacional UOD',
        '1-30-12345-6',
        'Av. Independencia #402, Santo Domingo, R.D.',
        '809-555-0100',
        'contacto@sistemauod.edu.do',
        true
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Categorías
    INSERT INTO public.categorias (id, institucion_id, nombre, descripcion, codigo, icono)
    VALUES
        (v_cat_oficina, v_inst_id, 'Papelería y Oficina', 'Suministros y materiales de oficina consumibles', 'CAT-OFI', 'FileText'),
        (v_cat_computo, v_inst_id, 'Tecnología y Cómputo', 'Laptops, monitores, periféricos y accesorios', 'CAT-TEC', 'Laptop'),
        (v_cat_mobiliario, v_inst_id, 'Mobiliario y Equipamiento', 'Escritorios, sillas ejecutivas, estantes', 'CAT-MOB', 'Armchair'),
        (v_cat_limpieza, v_inst_id, 'Limpieza y Cafetería', 'Insumos de aseo e higiene institucional', 'CAT-LIM', 'Sparkles')
    ON CONFLICT DO NOTHING;

    -- 3. Ubicaciones
    INSERT INTO public.ubicaciones (id, institucion_id, sede, nombre, tipo, descripcion)
    VALUES
        (v_ubic_central, v_inst_id, 'Campus Central', 'Almacén Central', 'almacen', 'Depósito principal de recepción y custodia de suministros'),
        (v_ubic_secr, v_inst_id, 'Campus Central', 'Secretaría General', 'oficina', 'Oficinas del personal administrativo y secretaría'),
        (v_ubic_lab1, v_inst_id, 'Edificio A', 'Laboratorio de Cómputo 1', 'laboratorio', 'Laboratorio de prácticas con equipos informáticos')
    ON CONFLICT DO NOTHING;

    -- 4. Proveedores
    INSERT INTO public.proveedores (id, institucion_id, nombre, rnc, contacto_nombre, telefono, email, direccion, condiciones_pago)
    VALUES
        (v_prov_distribuidora, v_inst_id, 'Suplidores Quisqueya S.R.L.', '131-98765-4', 'Carlos Morales', '809-555-3344', 'ventas@suplidoresquisqueya.do', 'Calle Las Damas #12, Santo Domingo', 'Crédito 30 días')
    ON CONFLICT DO NOTHING;

    -- 5. Artículos Catálogo
    INSERT INTO public.articulos (id, institucion_id, categoria_id, sku, codigo_barras, nombre, descripcion, tipo, unidad_medida, stock_minimo, stock_maximo, costo_estimado)
    VALUES
        (v_art_papel, v_inst_id, v_cat_oficina, 'OFI-PAP-001', '7461234567890', 'Resmas de Papel Bond 8.5 x 11 (Caja 500 hjs)', 'Papel multiuso para impresoras y fotocopiadoras', 'consumible', 'resma', 15, 100, 320.00),
        (v_art_marcadores, v_inst_id, v_cat_oficina, 'OFI-MAR-002', '7461234567891', 'Set Marcadores para Pizarra Blanca (4 Colores)', 'Marcadores borrables punta redonda (Negro, Azul, Rojo, Verde)', 'consumible', 'paquete', 10, 50, 240.00),
        (v_art_laptop, v_inst_id, v_cat_computo, 'TEC-LAP-001', '7461234567892', 'Laptop Dell Inspiron 15 (Core i5, 16GB, 512GB SSD)', 'Equipo portátil institucional asignado a personal docente y directivo', 'activo_fijo', 'unidad', 2, 20, 48500.00),
        (v_art_silla, v_inst_id, v_cat_mobiliario, 'MOB-SIL-001', '7461234567893', 'Silla Ergonómica de Malla con Apoyabrazos', 'Silla de oficina con soporte lumbar ajustable', 'activo_fijo', 'unidad', 5, 40, 6800.00)
    ON CONFLICT DO NOTHING;

    -- 6. Stock Inicial en Existencias
    INSERT INTO public.existencias (institucion_id, articulo_id, ubicacion_id, cantidad, lote)
    VALUES
        (v_inst_id, v_art_papel, v_ubic_central, 85.00, 'LOTE-2026-01'),
        (v_inst_id, v_art_marcadores, v_ubic_central, 24.00, 'LOTE-2026-02'),
        (v_inst_id, v_art_laptop, v_ubic_central, 6.00, NULL),
        (v_inst_id, v_art_silla, v_ubic_central, 18.00, NULL)
    ON CONFLICT DO NOTHING;

    -- 7. Activos Fijos Individuales (Laptops con serial)
    INSERT INTO public.activos_fijos (institucion_id, articulo_id, numero_serie, codigo_activo, fecha_adquisicion, costo_compra, estado, ubicacion_id, notas)
    VALUES
        (v_inst_id, v_art_laptop, 'DELL-SN-998821', 'ACT-2026-001', '2026-02-15', 48500.00, 'disponible', v_ubic_central, 'Equipo nuevo en inventario central listo para asignación'),
        (v_inst_id, v_art_laptop, 'DELL-SN-998822', 'ACT-2026-002', '2026-02-15', 48500.00, 'disponible', v_ubic_central, 'Equipo nuevo en inventario central')
    ON CONFLICT DO NOTHING;

END $$;
