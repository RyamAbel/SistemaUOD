-- ==============================================================================
-- SCRIPT DE REVERSIÓN: revert_script_20261023.sql
-- Permite restaurar los registros de prueba eliminados durante el cuadre a cero
-- ==============================================================================

INSERT INTO public.activos_serie (id, recurso_id, numero_serie, placa_institucional, estado, ubicacion_id, notas, costo_adquisicion, creado_en) VALUES ('a43e80d9-7bfd-400d-ba40-799f83e44e2c', 'c1000000-0000-0000-0000-000000000005', 'SN-LNV-9901', 'EQ-343', 'disponible', 'b1000000-0000-0000-0000-000000000001', 'Ingresado mediante movimiento MOV-2026-000002. RecepciRecepcion de prueba de activos TI 2026', 38000.0, '2026-10-23T01:04:58.6785+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.recursos (id, sku, nombre, categoria_id, tipo, activo) VALUES ('db4586ad-74e3-4de1-bb37-dbca16605784', 'SKU-EQ-7059', 'klklklk', 'a1000000-0000-0000-0000-000000000001', 'activo_fijo', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.recursos (id, sku, nombre, categoria_id, tipo, activo) VALUES ('26d057d5-0826-4e25-a61a-70ab0e20040c', 'SKU-EQ-1225', 'klklklk', 'a1000000-0000-0000-0000-000000000001', 'activo_fijo', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.mantenimientos (id, activo_serie_id, tipo, fecha_programada, estado, observaciones) VALUES ('69ab686e-ff21-4563-8427-700ded0dcdf1', 'd1000000-0000-0000-0000-000000000001', 'preventivo', '2026-10-22', 'cancelado', 'Mantenimiento preventivo general y limpieza de filtros | Cancelado: no') ON CONFLICT (id) DO NOTHING;
