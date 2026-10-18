-- ==============================================================================
-- PROYECTO: SIIA - Sistema Inteligente de Inventario y Activos UOD
-- DATOS SEMILLA: Categorías Odontológicas, Ubicaciones Clínicas y Recursos
-- ARCHIVO: seed.sql
-- ==============================================================================

DO $$
DECLARE
    -- Categorías
    v_cat_biomat UUID := gen_random_uuid();
    v_cat_implan UUID := gen_random_uuid();
    v_cat_farma UUID := gen_random_uuid();
    v_cat_prot UUID := gen_random_uuid();
    v_cat_equipos UUID := gen_random_uuid();

    -- Ubicaciones
    v_ubic_sede UUID := gen_random_uuid();
    v_ubic_central UUID := gen_random_uuid();
    v_ubic_clinica1 UUID := gen_random_uuid();
    v_ubic_clinica2 UUID := gen_random_uuid();
    v_ubic_lab UUID := gen_random_uuid();

    -- Proveedores
    v_prov_dental UUID := gen_random_uuid();
    v_prov_biomat UUID := gen_random_uuid();

    -- Recursos
    v_rec_resina UUID := gen_random_uuid();
    v_rec_implante UUID := gen_random_uuid();
    v_rec_anestesia UUID := gen_random_uuid();
    v_rec_guantes UUID := gen_random_uuid();
    v_rec_pasta UUID := gen_random_uuid();
    v_rec_sillon UUID := gen_random_uuid();
    v_rec_autoclave UUID := gen_random_uuid();
    v_rec_sensor UUID := gen_random_uuid();
    v_rec_fresas UUID := gen_random_uuid();
    v_rec_alginato UUID := gen_random_uuid();
BEGIN
    -- 1. Categorías Odontológicas
    INSERT INTO public.categorias (id, codigo, nombre, descripcion)
    VALUES
        (v_cat_biomat, 'CAT-BIO', 'Biomateriales Dentales', 'Resinas compuestas, adhesivos, ionómeros y cementos'),
        (v_cat_implan, 'CAT-IMP', 'Implantología y Cirugía', 'Implantes de titanio, pilares, tornillos y membranas'),
        (v_cat_farma, 'CAT-FAR', 'Farmacología Odontológica', 'Anestésicos locales, vasoconstrictores y antisépticos'),
        (v_cat_prot, 'CAT-PRO', 'Protección y Bioseguridad', 'Guantes quirúrgicos, mascarillas, batas y gafas protectoras'),
        (v_cat_equipos, 'CAT-EQP', 'Equipos Odontológicos Mayores', 'Sillones quirúrgicos, autoclaves, compresores y radiovisiógrafos')
    ON CONFLICT (codigo) DO NOTHING;

    -- 2. Ubicaciones Clínicas Institucionales UOD
    INSERT INTO public.ubicaciones (id, codigo, nombre, tipo)
    VALUES
        (v_ubic_sede, 'SEDE-UOD', 'Campus Principal UOD', 'sede')
    ON CONFLICT (codigo) DO NOTHING;

    INSERT INTO public.ubicaciones (id, codigo, nombre, tipo, ubicacion_padre_id)
    VALUES
        (v_ubic_central, 'ALM-CENTRAL', 'Almacén Central Institucional', 'almacen', v_ubic_sede),
        (v_ubic_clinica1, 'CLI-PRIN', 'Clínica Odontológica Principal (Sala 1)', 'clinica', v_ubic_sede),
        (v_ubic_clinica2, 'CLI-ESTE', 'Clínica Odontológica Este (Sala 2)', 'clinica', v_ubic_sede),
        (v_ubic_lab, 'LAB-PROT', 'Laboratorio de Prótesis y Biomateriales', 'laboratorio', v_ubic_sede)
    ON CONFLICT (codigo) DO NOTHING;

    -- 3. Proveedores con RNC Dominicano
    INSERT INTO public.proveedores (id, rnc, nombre_comercial, razon_social, contacto_nombre, telefono, correo, plazo_credito_dias)
    VALUES
        (v_prov_dental, '131884212', 'Dental Corp. Dominicana S.R.L.', 'Dental Corp Dominicana S.R.L.', 'Carlos Mendoza', '809-555-1234', 'ventas@dentalcorp.do', 30),
        (v_prov_biomat, '101992345', 'Biomateriales del Caribe S.A.', 'Biomateriales del Caribe Sociedad Anónima', 'Laura Silva', '809-555-5678', 'ordenes@biomatcaribe.com', 45)
    ON CONFLICT (rnc) DO NOTHING;

    -- 4. 10 Recursos Representativos del Catálogo
    INSERT INTO public.recursos (id, sku, nombre, descripcion, categoria_id, tipo, unidad_medida, stock_minimo, stock_maximo, punto_reorden, costo_estimado)
    VALUES
        (v_rec_resina, 'RC002', 'Resina Compuesta A2 (Filtek Z250)', 'Jeringa 4g de resina híbrida para restauraciones estéticas anteriores y posteriores', v_cat_biomat, 'consumible', 'jeringa', 20, 100, 30, 850.00),
        (v_rec_implante, 'IMP-TI-001', 'Implante Titanio Grado 5 (3.75 x 10mm)', 'Tornillo cónico autoperforante estéril de conexión interna', v_cat_implan, 'consumible', 'unidad', 10, 50, 15, 4200.00),
        (v_rec_anestesia, 'FAR-LID-001', 'Anestésico Lidocaína 2% con Epinefrina', 'Caja de 50 cartuchos de vidrio 1.8ml para odontología quirúrgica', v_cat_farma, 'consumible', 'caja', 15, 60, 25, 1250.00),
        (v_rec_guantes, 'BIO-GUA-002', 'Guantes Nitrilo Quirúrgico Talla M', 'Caja de 100 unidades color azul libres de látex y polvo', v_cat_prot, 'consumible', 'caja', 30, 150, 45, 480.00),
        (v_rec_pasta, 'RC006', 'Pasta Profilaxis con Flúor Sabor Menta', 'Pote 200g grano medio para limpieza y pulido coronal', v_cat_biomat, 'consumible', 'pote', 10, 40, 15, 320.00),
        (v_rec_alginato, 'RC007', 'Alginato Dental Cromático de Fraguado Rápido', 'Bolsa 453g para impresiones de diagnóstico y prótesis', v_cat_biomat, 'consumible', 'bolsa', 12, 50, 20, 390.00),
        (v_rec_fresas, 'RC008', 'Kit de Fresas Diamantadas de Alta Velocidad', 'Caja organizadora con 10 fresas de diferentes geometrías para turbina', v_cat_biomat, 'consumible', 'kit', 8, 30, 12, 1100.00),
        (v_rec_sillon, 'ACT-SIL-001', 'Sillón Odontológico Quirúrgico Serie A1', 'Unidad completa con lámpara LED, salivadera y módulo rodante', v_cat_equipos, 'activo_fijo', 'unidad', 1, 5, 2, 185000.00),
        (v_rec_autoclave, 'ACT-AUT-002', 'Autoclave Digital Tuttnauer 2540 (23 Litros)', 'Esterilizador a vapor con ciclos automáticos clase B', v_cat_equipos, 'activo_fijo', 'unidad', 1, 3, 1, 145000.00),
        (v_rec_sensor, 'ACT-RAD-003', 'Sensor Radiovisiógrafo Digital RVG 6200', 'Sensor intraoral CMOS de alta resolución USB', v_cat_equipos, 'activo_fijo', 'unidad', 1, 4, 1, 98000.00)
    ON CONFLICT (sku) DO NOTHING;

    -- 5. Códigos QR Propios y Barras Externas
    INSERT INTO public.recursos_codigos (recurso_id, tipo_codigo, codigo, es_principal)
    VALUES
        (v_rec_resina, 'qr_propio', 'UOD-RC002-2026', true),
        (v_rec_resina, 'barra_ean13', '7461234567890', false),
        (v_rec_implante, 'qr_propio', 'UOD-IMP001-2026', true),
        (v_rec_anestesia, 'qr_propio', 'UOD-FAR001-2026', true),
        (v_rec_sillon, 'qr_propio', 'UOD-ACT001-2026', true)
    ON CONFLICT (tipo_codigo, codigo) DO NOTHING;

    -- 6. Trazabilidad Serial para Activos Fijos
    INSERT INTO public.activos_serie (recurso_id, numero_serie, placa_institucional, estado, ubicacion_id, proveedor_id, fecha_adquisicion)
    VALUES
        (v_rec_sillon, 'SN-UOD-2026-001', 'UOD-PL-001', 'en_uso', v_ubic_clinica1, v_prov_dental, '2026-01-15'),
        (v_rec_autoclave, 'SN-UOD-2026-002', 'UOD-PL-002', 'disponible', v_ubic_central, v_prov_dental, '2026-02-10'),
        (v_rec_sensor, 'SN-UOD-2026-003', 'UOD-PL-003', 'en_uso', v_ubic_clinica2, v_prov_dental, '2026-03-05')
    ON CONFLICT (recurso_id, numero_serie) DO NOTHING;

    -- 7. Existencias Iniciales de Consumibles
    INSERT INTO public.existencias (recurso_id, ubicacion_id, cantidad)
    VALUES
        (v_rec_resina, v_ubic_central, 35),
        (v_rec_resina, v_ubic_clinica1, 15),
        (v_rec_implante, v_ubic_central, 35),
        (v_rec_anestesia, v_ubic_clinica2, 50),
        (v_rec_guantes, v_ubic_central, 120),
        (v_rec_pasta, v_ubic_central, 80)
    ON CONFLICT (recurso_id, ubicacion_id, lote_id) DO UPDATE SET
        cantidad = EXCLUDED.cantidad;

END $$;
