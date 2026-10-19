import json

with open('Datos/inventario_extraido.json', encoding='utf-8') as f:
    items = json.load(f)

# Agrupar por modelo de recurso
from collections import defaultdict
recursos_map = defaultdict(lambda: {'count': 0, 'ubicaciones': set(), 'items': [], 'estados': defaultdict(int)})

for it in items:
    key = (it['tipo'], it['marca_modelo'] or 'GENERICO', it['procesador'], it['ram'], it['almacenamiento'])
    recursos_map[key]['count'] += 1
    recursos_map[key]['ubicaciones'].add(it['ubicacion'])
    recursos_map[key]['items'].append(it)
    recursos_map[key]['estados'][it['estado']] += 1

def map_cat(tipo):
    if tipo in ['CPU', 'LAPTOP']: return 'Computación y Equipos'
    if tipo in ['MONITOR']: return 'Pantallas y Monitores'
    if tipo in ['TECLADO', 'MOUSE', 'BOCINAS', 'CAMARA', 'MICROFONO', 'HEADSET']: return 'Periféricos y Accesorios'
    if tipo in ['IMPRESORA']: return 'Impresión y Digitalización'
    if tipo in ['UPS']: return 'Energía y Respaldo (UPS)'
    if tipo in ['TELEFONO', 'SWITCH']: return 'Redes y Telecomunicaciones'
    return 'Audiovisual y Multimedia'

def get_cost(tipo):
    costs = {
        'CPU': 28000.0, 'LAPTOP': 38000.0, 'MONITOR': 9500.0, 'IMPRESORA': 16000.0,
        'UPS': 4500.0, 'TELEFONO': 6000.0, 'SWITCH': 8500.0, 'TV': 32000.0,
        'PIZARRA': 85000.0, 'TECLADO': 1200.0, 'MOUSE': 950.0, 'BOCINAS': 1800.0,
        'CAMARA': 2800.0, 'HEADSET': 2200.0, 'MICROFONO': 2500.0
    }
    return costs.get(tipo, 3000.0)

articulos_list = []
for idx, (k, data) in enumerate(sorted(recursos_map.items(), key=lambda x: x[1]['count'], reverse=True), 1):
    tipo, marca, proc, ram, almac = k
    specs = ', '.join([s for s in [proc, ram, almac] if s])
    nombre = f"{tipo.capitalize()} {marca}"
    if specs:
        nombre += f" ({specs})"
    
    sku = f"UOD-{tipo[:3]}-{idx:03d}"
    cat = map_cat(tipo)
    top_ub = list(data['ubicaciones'])[0] if data['ubicaciones'] else 'Tecnología'
    costo = get_cost(tipo)
    count = data['count']
    first_eq = data['items'][0]['eq_id']

    articulos_list.append({
        'id': f"art-{idx:03d}",
        'sku': sku,
        'codigoBarras': first_eq,
        'nombre': nombre,
        'categoria': cat,
        'tipo': 'activo_fijo',
        'unidad': 'unidad',
        'stockActual': count,
        'stockMinimo': 2 if count > 5 else 1,
        'ubicacionPrincipal': top_ub,
        'costoEstimado': costo,
        'estado': 'saludable' if count > 2 else 'bajo'
    })

print(f"Total articulos generados para initialData: {len(articulos_list)}")

# Generar movimientos realistas basados en los responsables
movimientos_list = []
resp_items = [it for it in items if it.get('responsable_notas')]
for idx, it in enumerate(resp_items[:15], 1):
    art_nombre = f"{it['tipo'].capitalize()} {it['marca_modelo'] or 'Equipo'}"
    resp_name = it.get('responsable_notas', 'Personal UOD')
    movimientos_list.append({
        'id': f"mov-{idx:03d}",
        'numero': f"MOV-2026-{1000 + idx}",
        'tipo': 'traslado' if 'ALMACEN' in it['ubicacion'] else 'salida',
        'articuloNombre': art_nombre,
        'cantidad': 1,
        'origen': 'Almacén de Tecnología',
        'destino': it['ubicacion'],
        'fecha': f"Hace {idx * 2} horas" if idx < 5 else f"Hace {idx // 3 + 1} días",
        'usuario': resp_name,
        'origenIa': (idx % 4 == 0),
        'motivo': f"Asignación operativa de activo {it['eq_id']} a {resp_name}"
    })

content = f"""export interface ArticuloItem {{
  id: string;
  sku: string;
  codigoBarras: string;
  nombre: string;
  categoria: string;
  tipo: 'consumible' | 'activo_fijo';
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  ubicacionPrincipal: string;
  costoEstimado: number;
  estado: 'saludable' | 'bajo' | 'agotado';
}}

export interface MovimientoItem {{
  id: string;
  numero: string;
  tipo: 'entrada' | 'salida' | 'traslado' | 'ajuste';
  articuloNombre: string;
  cantidad: number;
  origen?: string;
  destino?: string;
  fecha: string;
  usuario: string;
  origenIa: boolean;
  motivo: string;
}}

export const initialArticulos: ArticuloItem[] = {json.dumps(articulos_list, ensure_ascii=False, indent=2)};

export const initialMovimientos: MovimientoItem[] = {json.dumps(movimientos_list, ensure_ascii=False, indent=2)};
"""

with open('frontend/src/lib/initialData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('frontend/src/lib/initialData.ts actualizado con éxito.')
