import zipfile
import xml.etree.ElementTree as ET
import json
import uuid
import re

excel_path = 'Datos/ACTIVOS 2026 TECNOLOGIA.xlsx'

with zipfile.ZipFile(excel_path) as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for si in tree.findall('ns:si', ns):
            text = ''.join(t.text for t in si.iter() if t.text)
            shared_strings.append(text)

    tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rows = tree.findall('.//ns:row', ns)
    
    raw_items = []
    for r in rows:
        row_idx = int(r.attrib.get('r', 0))
        if row_idx < 6:
            continue
        cell_dict = {}
        for c in r.findall('ns:c', ns):
            ref = c.attrib.get('r')
            col = ''.join([ch for ch in ref if ch.isalpha()])
            t = c.attrib.get('t')
            v = c.find('ns:v', ns)
            val = v.text if v is not None else ''
            if t == 's' and val.isdigit():
                val = shared_strings[int(val)]
            cell_dict[col] = val.strip() if isinstance(val, str) else str(val).strip()

        eq_id = cell_dict.get('A', '')
        if not eq_id or not eq_id.startswith('EQ-'):
            continue
        
        raw_items.append({
            'eq_id': eq_id,
            'ubicacion': cell_dict.get('B', '').strip().upper(),
            'tipo': cell_dict.get('D', '').strip().upper(),
            'marca_modelo': cell_dict.get('E', '').strip().upper(),
            'procesador': cell_dict.get('F', '').strip().upper(),
            'ram': cell_dict.get('G', '').strip().upper(),
            'almacenamiento': cell_dict.get('H', '').strip().upper(),
            'cantidad': float(cell_dict.get('I', '1') or '1'),
            'estado': cell_dict.get('J', 'EN USO').strip().upper(),
            'responsable': cell_dict.get('K', '').strip()
        })

print(f"Total equipos extraidos: {len(raw_items)}")

# 1. Definición de Categorías Tecnológicas
categories = [
    {
        'id': 'a1000000-0000-0000-0000-000000000001',
        'codigo': 'CAT-COMP',
        'nombre': 'Computación y Equipos',
        'descripcion': 'Computadoras de escritorio, servidores y laptops portátiles institucionales'
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000002',
        'codigo': 'CAT-MON',
        'nombre': 'Pantallas y Monitores',
        'descripcion': 'Monitores de trabajo clínico y administrativo de 22\", 24\" y 27\"'
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000003',
        'codigo': 'CAT-PER',
        'nombre': 'Periféricos y Accesorios',
        'descripcion': 'Teclados, mouse, cámaras web, micrófonos, bocinas y headsets'
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000004',
        'codigo': 'CAT-IMP',
        'nombre': 'Impresión y Digitalización',
        'descripcion': 'Impresoras multifuncionales y de red institucionales'
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000005',
        'codigo': 'CAT-UPS',
        'nombre': 'Energía y Respaldo (UPS)',
        'descripcion': 'Sistemas de energía ininterrumpida y protección eléctrica'
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000006',
        'codigo': 'CAT-RED',
        'nombre': 'Redes y Telecomunicaciones',
        'descripcion': 'Teléfonos IP, smartphones institucionales y switches de conectividad'
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000007',
        'codigo': 'CAT-AUD',
        'nombre': 'Audiovisual y Multimedia',
        'descripcion': 'Televisores y pizarras digitales interactivas para docencia y salones'
    }
]

def map_tipo_to_categoria(tipo):
    if tipo in ['CPU', 'LAPTOP']:
        return 'a1000000-0000-0000-0000-000000000001', 'CAT-COMP'
    elif tipo in ['MONITOR']:
        return 'a1000000-0000-0000-0000-000000000002', 'CAT-MON'
    elif tipo in ['TECLADO', 'MOUSE', 'BOCINAS', 'CAMARA', 'MICROFONO', 'HEADSET']:
        return 'a1000000-0000-0000-0000-000000000003', 'CAT-PER'
    elif tipo in ['IMPRESORA']:
        return 'a1000000-0000-0000-0000-000000000004', 'CAT-IMP'
    elif tipo in ['UPS']:
        return 'a1000000-0000-0000-0000-000000000005', 'CAT-UPS'
    elif tipo in ['TELEFONO', 'SWITCH']:
        return 'a1000000-0000-0000-0000-000000000006', 'CAT-RED'
    else:
        return 'a1000000-0000-0000-0000-000000000007', 'CAT-AUD'

# 2. Definición de Ubicaciones Institucionales UOD
unique_ubis = sorted(list(set(x['ubicacion'] for x in raw_items if x['ubicacion'])))
locations_map = {}
locations_list = []

for idx, ub_name in enumerate(unique_ubis, 1):
    ub_id = f"b1000000-0000-0000-0000-{idx:012d}"
    code = f"UB-{idx:02d}"
    
    # Determinar tipo según el nombre
    tipo_ub = 'edificio'
    if 'CLINICA' in ub_name:
        tipo_ub = 'clinica'
    elif 'LABORATORIO' in ub_name:
        tipo_ub = 'laboratorio'
    elif 'TECNOLOGIA' in ub_name or 'ALMACEN' in ub_name:
        tipo_ub = 'almacen'
    elif 'RECTORIA' in ub_name or 'VICERRECTOR' in ub_name:
        tipo_ub = 'sede'
    
    loc_obj = {
        'id': ub_id,
        'codigo': code,
        'nombre': ub_name,
        'tipo': tipo_ub
    }
    locations_list.append(loc_obj)
    locations_map[ub_name] = loc_obj

print(f"Total ubicaciones mapeadas: {len(locations_list)}")

# 3. Modelos de Recursos en Catálogo
resource_models_map = {}
resource_models_list = []
resource_counter = 1

for item in raw_items:
    t = item['tipo']
    m = item['marca_modelo'] or 'GENERICO'
    p = item['procesador']
    r = item['ram']
    a = item['almacenamiento']
    
    key = (t, m, p, r, a)
    if key not in resource_models_map:
        cat_id, cat_code = map_tipo_to_categoria(t)
        rec_id = f"c1000000-0000-0000-0000-{resource_counter:012d}"
        sku = f"SKU-{t[:3]}-{resource_counter:03d}"
        
        # Nombre y descripción completa
        nombre = f"{t.capitalize()} {m}"
        specs_parts = []
        if p: specs_parts.append(f"CPU: {p}")
        if r: specs_parts.append(f"RAM: {r}")
        if a: specs_parts.append(f"Almac: {a}")
        
        desc = f"Activo TI institucional - {nombre}."
        if specs_parts:
            desc += f" Especificaciones: {', '.join(specs_parts)}."

        # Costo referencial estimado en DOP
        costo = 2500.00
        if t == 'CPU': costo = 28000.00
        elif t == 'LAPTOP': costo = 38000.00
        elif t == 'MONITOR': costo = 9500.00
        elif t == 'IMPRESORA': costo = 16000.00
        elif t == 'UPS': costo = 4500.00
        elif t == 'TELEFONO': costo = 6000.00
        elif t == 'SWITCH': costo = 8500.00
        elif t == 'TV': costo = 32000.00
        elif t == 'PIZARRA': costo = 85000.00
        elif t in ['TECLADO', 'MOUSE']: costo = 1200.00
        elif t in ['BOCINAS', 'CAMARA', 'HEADSET', 'MICROFONO']: costo = 2800.00

        rec_obj = {
            'id': rec_id,
            'sku': sku,
            'nombre': nombre,
            'descripcion': desc,
            'categoria_id': cat_id,
            'tipo_equipo': t,
            'marca_modelo': m,
            'procesador': p,
            'ram': r,
            'almacenamiento': a,
            'costo_estimado': costo,
            'tipo': 'activo_fijo',
            'stock_total': 0
        }
        resource_models_map[key] = rec_obj
        resource_models_list.append(rec_obj)
        resource_counter += 1

    resource_models_map[key]['stock_total'] += 1

print(f"Total recursos unicos en catalogo: {len(resource_models_list)}")

# 4. Activos Fijos Físicos
activos_list = []
existencias_map = {} # (recurso_id, ubicacion_id) -> cantidad

for idx, item in enumerate(raw_items, 1):
    key = (item['tipo'], item['marca_modelo'] or 'GENERICO', item['procesador'], item['ram'], item['almacenamiento'])
    rec = resource_models_map[key]
    loc = locations_map.get(item['ubicacion'])
    
    # Mapeo de estado
    estado_raw = item['estado']
    if 'ALMACEN' in estado_raw:
        estado_sql = 'disponible'
    elif 'INACTIVO' in estado_raw or 'DAN' in estado_raw or 'DAÑ' in estado_raw:
        estado_sql = 'danado'
    else:
        estado_sql = 'en_uso'
        
    activo_id = f"d1000000-0000-0000-0000-{idx:012d}"
    
    notas = f"Responsable: {item['responsable']}" if item['responsable'] else None
    
    act_obj = {
        'id': activo_id,
        'recurso_id': rec['id'],
        'recurso_nombre': rec['nombre'],
        'numero_serie': item['eq_id'],
        'placa_institucional': item['eq_id'],
        'estado': estado_sql,
        'ubicacion_id': loc['id'] if loc else locations_list[0]['id'],
        'ubicacion_nombre': loc['nombre'] if loc else 'TECNOLOGIA',
        'responsable': item['responsable'],
        'notas': notas
    }
    activos_list.append(act_obj)
    
    # Sumar existencia
    ex_key = (rec['id'], act_obj['ubicacion_id'])
    existencias_map[ex_key] = existencias_map.get(ex_key, 0) + 1

print(f"Total activos físicos generados: {len(activos_list)}")
print(f"Total registros de existencias por ubicación: {len(existencias_map)}")

# 5. Generar Script SQL para Supabase
sql_lines = [
    "-- ==============================================================================",
    "-- SIIA - SEMBRADO OFICIAL DE DATOS REALES (LEVANTAMIENTO TI UOD 2026)",
    "-- Archivo generado automaticamente con los 341 activos y 49 ubicaciones reales",
    "-- ==============================================================================",
    "",
    "-- 1. LIMPIEZA DE TABLAS PREVIAS DUMMY",
    "TRUNCATE existencias, movimientos_lineas, movimientos, asignaciones_prestamos,",
    "         mantenimientos, activos_serie, lotes, recursos_codigos, recursos_fotos,",
    "         recursos, categorias, ubicaciones CASCADE;",
    "",
    "-- 2. INSERCIÓN DE CATEGORÍAS TECNOLÓGICAS"
]

for c in categories:
    sql_lines.append(f"INSERT INTO categorias (id, codigo, nombre, descripcion, activa) VALUES ('{c['id']}', '{c['codigo']}', '{c['nombre']}', '{c['descripcion']}', true);")

sql_lines.append("\n-- 3. INSERCIÓN DE UBICACIONES REALES UOD (49 UBICACIONES)")
for u in locations_list:
    nombre_escaped = u['nombre'].replace("'", "''")
    sql_lines.append(f"INSERT INTO ubicaciones (id, codigo, nombre, tipo, activa) VALUES ('{u['id']}', '{u['codigo']}', '{nombre_escaped}', '{u['tipo']}', true);")

sql_lines.append("\n-- 4. INSERCIÓN DE RECURSOS DEL CATÁLOGO TECNOLÓGICO")
for r in resource_models_list:
    nombre_esc = r['nombre'].replace("'", "''")
    desc_esc = r['descripcion'].replace("'", "''")
    sql_lines.append(f"INSERT INTO recursos (id, sku, nombre, descripcion, categoria_id, tipo, unidad_medida, stock_minimo, stock_maximo, punto_reorden, costo_estimado, activo) VALUES ('{r['id']}', '{r['sku']}', '{nombre_esc}', '{desc_esc}', '{r['categoria_id']}', 'activo_fijo', 'unidad', 1, 100, 2, {r['costo_estimado']}, true);")

sql_lines.append("\n-- 5. INSERCIÓN DE ACTIVOS FÍSICOS (341 EQUIPOS CON NÚMERO DE PLACA EQ-XX)")
for a in activos_list:
    if a['notas']:
        cleaned_notes = a['notas'].replace("'", "''")
        notas_esc = f"'{cleaned_notes}'"
    else:
        notas_esc = "NULL"
    sql_lines.append(f"INSERT INTO activos_serie (id, recurso_id, numero_serie, placa_institucional, estado, ubicacion_id, notas) VALUES ('{a['id']}', '{a['recurso_id']}', '{a['numero_serie']}', '{a['placa_institucional']}', '{a['estado']}', '{a['ubicacion_id']}', {notas_esc});")

sql_lines.append("\n-- 6. INSERCIÓN DE EXISTENCIAS POR UBICACIÓN Y RECURSO")
ex_idx = 1
for (rec_id, ub_id), cant in existencias_map.items():
    ex_uuid = f"e1000000-0000-0000-0000-{ex_idx:012d}"
    sql_lines.append(f"INSERT INTO existencias (id, recurso_id, ubicacion_id, cantidad) VALUES ('{ex_uuid}', '{rec_id}', '{ub_id}', {cant});")
    ex_idx += 1

sql_content = "\n".join(sql_lines)

with open('supabase/seed.sql', 'w', encoding='utf-8') as f:
    f.write(sql_content)

with open('supabase/seed_original_inventario.sql', 'w', encoding='utf-8') as f:
    f.write(sql_content)

print("Archivos SQL guardados en supabase/seed.sql y supabase/seed_original_inventario.sql")

# 6. Generar archivo TypeScript para Frontend
frontend_data = {
    'summary': {
        'totalEquipos': len(activos_list),
        'enUso': sum(1 for a in activos_list if a['estado'] == 'en_uso'),
        'enAlmacen': sum(1 for a in activos_list if a['estado'] == 'disponible'),
        'danadosOInactivos': sum(1 for a in activos_list if a['estado'] == 'danado'),
        'totalUbicaciones': len(locations_list),
        'totalModelos': len(resource_models_list)
    },
    'categories': categories,
    'locations': locations_list,
    'resources': resource_models_list,
    'assets': activos_list
}

ts_content = f"""// ==============================================================================
// SIIA - DATOS ORIGINALES DEL LEVANTAMIENTO DE ACTIVOS TI UOD 2026
// Total de equipos reales: {len(activos_list)}
// Total de ubicaciones reales: {len(locations_list)}
// ==============================================================================

export interface CategoriaTI {{
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
}}

export interface UbicacionTI {{
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
}}

export interface RecursoTI {{
  id: string;
  sku: string;
  nombre: string;
  descripcion: string;
  categoria_id: string;
  tipo_equipo: string;
  marca_modelo: string;
  procesador: string;
  ram: string;
  almacenamiento: string;
  costo_estimado: number;
  tipo: string;
  stock_total: number;
}}

export interface ActivoTI {{
  id: string;
  recurso_id: string;
  recurso_nombre: string;
  numero_serie: string;
  placa_institucional: string;
  estado: 'en_uso' | 'disponible' | 'danado';
  ubicacion_id: string;
  ubicacion_nombre: string;
  responsable: string;
  notas: string | null;
}}

export const RESUMEN_INVENTARIO = {json.dumps(frontend_data['summary'], ensure_ascii=False, indent=2)};

export const CATEGORIAS_ORIGINALES: CategoriaTI[] = {json.dumps(frontend_data['categories'], ensure_ascii=False, indent=2)};

export const UBICACIONES_ORIGINALES: UbicacionTI[] = {json.dumps(frontend_data['locations'], ensure_ascii=False, indent=2)};

export const RECURSOS_ORIGINALES: RecursoTI[] = {json.dumps(frontend_data['resources'], ensure_ascii=False, indent=2)};

export const ACTIVOS_ORIGINALES: ActivoTI[] = {json.dumps(frontend_data['assets'], ensure_ascii=False, indent=2)};
"""

with open('frontend/src/lib/inventoryData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Datos guardados en frontend/src/lib/inventoryData.ts")
